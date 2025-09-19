/**
 * Web Audio API for Healthcare Notification Sounds
 * Compliant with HIPAA requirements for alert notifications
 */

export class NotificationAudio {
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 0.3;
  private enabled: boolean = true;

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext(): void {
    try {
      // Create audio context on user interaction
      if (typeof window !== 'undefined' && window.AudioContext) {
        this.audioContext = new AudioContext();
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  }

  private async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  private createTone(frequency: number, duration: number, volume: number = 0.3): void {
    if (!this.audioContext || !this.enabled) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      // Envelope for smooth sound
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }

  private createComplexTone(notes: Array<{ frequency: number; duration: number; delay: number }>, volume: number = 0.3): void {
    if (!this.audioContext || !this.enabled) return;

    notes.forEach(note => {
      setTimeout(() => {
        this.createTone(note.frequency, note.duration, volume);
      }, note.delay);
    });
  }

  async playSound(type: string, volume: number = 0.3): Promise<void> {
    await this.resumeAudioContext();

    switch (type) {
      case 'success':
        // Pleasant ascending chime
        this.createComplexTone([
          { frequency: 523.25, duration: 0.2, delay: 0 }, // C5
          { frequency: 659.25, duration: 0.2, delay: 100 }, // E5
          { frequency: 783.99, duration: 0.3, delay: 200 }, // G5
        ], volume);
        break;

      case 'info':
        // Single soft beep
        this.createTone(800, 0.15, volume * 0.7);
        break;

      case 'warning':
        // Double beep
        this.createTone(600, 0.15, volume);
        setTimeout(() => this.createTone(600, 0.15, volume), 200);
        break;

      case 'error':
        // Descending tone
        this.createComplexTone([
          { frequency: 800, duration: 0.2, delay: 0 },
          { frequency: 600, duration: 0.2, delay: 100 },
          { frequency: 400, duration: 0.3, delay: 200 },
        ], volume);
        break;

      case 'critical':
        // Urgent triple beep pattern
        const criticalPattern = [
          { frequency: 1000, duration: 0.1, delay: 0 },
          { frequency: 800, duration: 0.1, delay: 150 },
          { frequency: 1000, duration: 0.1, delay: 300 },
          { frequency: 800, duration: 0.1, delay: 450 },
          { frequency: 1000, duration: 0.2, delay: 600 },
        ];
        this.createComplexTone(criticalPattern, Math.min(volume * 1.2, 1));
        break;

      case 'chime':
        // Gentle notification chime
        this.createComplexTone([
          { frequency: 698.46, duration: 0.3, delay: 0 }, // F5
          { frequency: 880.00, duration: 0.4, delay: 100 }, // A5
        ], volume * 0.8);
        break;

      default:
        // Default beep
        this.createTone(800, 0.2, volume);
    }
  }

  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && !!window.AudioContext && this.audioContext !== null;
  }

  async testSound(): Promise<void> {
    await this.playSound('chime', 0.5);
  }

  // Healthcare-specific alert sounds
  async playHIPAAAlert(): Promise<void> {
    // Special pattern for HIPAA compliance alerts
    const hipaaPattern = [
      { frequency: 1200, duration: 0.1, delay: 0 },
      { frequency: 900, duration: 0.1, delay: 120 },
      { frequency: 1200, duration: 0.1, delay: 240 },
      { frequency: 900, duration: 0.1, delay: 360 },
      { frequency: 1400, duration: 0.2, delay: 500 },
    ];
    this.createComplexTone(hipaaPattern, 0.8);
  }

  async playDataBreachAlert(): Promise<void> {
    // Urgent pattern for data breach notifications
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.createTone(1500, 0.2, 0.9);
        setTimeout(() => this.createTone(1200, 0.2, 0.9), 250);
      }, i * 800);
    }
  }

  async playAuditAlert(): Promise<void> {
    // Professional tone for audit notifications
    this.createComplexTone([
      { frequency: 440, duration: 0.3, delay: 0 }, // A4
      { frequency: 554.37, duration: 0.3, delay: 200 }, // C#5
      { frequency: 659.25, duration: 0.4, delay: 400 }, // E5
    ], 0.6);
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
export const notificationAudio = new NotificationAudio();