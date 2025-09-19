/**
 * Voice Interface for AI Assistant
 * Handles speech-to-text and text-to-speech with healthcare optimization
 */

import { AIAssistantConfig } from './AIAssistantCore';

export interface VoiceConfig {
  language: string;
  voice: string;
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
  enabled: boolean;
}

export interface VoiceMessage {
  id: string;
  text: string;
  audioData?: ArrayBuffer;
  duration?: number;
  confidence?: number;
  language: string;
  timestamp: Date;
}

export interface VoiceCommand {
  id: string;
  phrase: string;
  action: string;
  parameters: Record<string, any>;
  healthcareRelevant: boolean;
  requiresConfirmation: boolean;
}

export interface VoiceRecognitionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  alternatives: Array<{
    text: string;
    confidence: number;
  }>;
  healthcareTerms: string[];
  medicalAbbreviations: string[];
}

export class VoiceInterface {
  private config: AIAssistantConfig;
  private voiceConfig: VoiceConfig;
  private isInitialized = false;
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private currentVoice: SpeechSynthesisVoice | null = null;
  private isListening = false;
  private isSpeaking = false;
  private voiceCommands: VoiceCommand[] = [];
  private medicalTerminology: Map<string, string> = new Map();

  constructor(config: AIAssistantConfig) {
    this.config = config;
    this.voiceConfig = this.createDefaultVoiceConfig();
  }

  /**
   * Initialize the voice interface
   */
  async initialize(): Promise<void> {
    try {
      // Check browser support
      if (!this.isVoiceSupported()) {
        throw new Error('Voice interface not supported in this browser');
      }

      // Initialize speech recognition
      await this.initializeSpeechRecognition();
      
      // Initialize speech synthesis
      await this.initializeSpeechSynthesis();
      
      // Load medical terminology
      await this.loadMedicalTerminology();
      
      // Initialize voice commands
      await this.initializeVoiceCommands();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize VoiceInterface:', error);
      throw error;
    }
  }

  /**
   * Start listening for voice input
   */
  async startListening(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('VoiceInterface not initialized');
    }

    if (this.isListening) {
      return;
    }

    try {
      this.recognition!.start();
      this.isListening = true;
    } catch (error) {
      console.error('Failed to start listening:', error);
      throw error;
    }
  }

  /**
   * Stop listening for voice input
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Generate voice response from text
   */
  async generateVoiceResponse(text: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('VoiceInterface not initialized');
    }

    try {
      // Process text for medical terminology
      const processedText = await this.processMedicalTerminology(text);
      
      // Create speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(processedText);
      
      // Configure voice settings
      utterance.voice = this.currentVoice;
      utterance.rate = this.voiceConfig.rate;
      utterance.pitch = this.voiceConfig.pitch;
      utterance.volume = this.voiceConfig.volume;
      utterance.lang = this.voiceConfig.language;
      
      // Speak the text
      return new Promise((resolve, reject) => {
        utterance.onend = () => {
          this.isSpeaking = false;
          resolve(processedText);
        };
        
        utterance.onerror = (error) => {
          this.isSpeaking = false;
          reject(error);
        };
        
        this.synthesis!.speak(utterance);
        this.isSpeaking = true;
      });
      
    } catch (error) {
      console.error('Failed to generate voice response:', error);
      throw error;
    }
  }

  /**
   * Process voice command
   */
  async processVoiceCommand(command: string): Promise<{
    recognized: boolean;
    action?: string;
    parameters?: Record<string, any>;
    response?: string;
  }> {
    if (!this.isInitialized) {
      throw new Error('VoiceInterface not initialized');
    }

    try {
      const commandLower = command.toLowerCase();
      
      // Find matching voice command
      const matchedCommand = this.voiceCommands.find(cmd => 
        commandLower.includes(cmd.phrase.toLowerCase())
      );
      
      if (!matchedCommand) {
        return {
          recognized: false,
          response: "I didn't understand that command. Please try again."
        };
      }
      
      // Check if command requires confirmation
      if (matchedCommand.requiresConfirmation) {
        return {
          recognized: true,
          action: matchedCommand.action,
          parameters: matchedCommand.parameters,
          response: `Did you want me to ${matchedCommand.action}? Please confirm.`
        };
      }
      
      return {
        recognized: true,
        action: matchedCommand.action,
        parameters: matchedCommand.parameters,
        response: `I'll ${matchedCommand.action} for you.`
      };
      
    } catch (error) {
      console.error('Failed to process voice command:', error);
      return {
        recognized: false,
        response: "I'm having trouble processing that command. Please try again."
      };
    }
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) {
      return [];
    }
    
    return this.synthesis.getVoices().filter(voice => 
      voice.lang.startsWith(this.voiceConfig.language.split('-')[0])
    );
  }

  /**
   * Update voice configuration
   */
  updateVoiceConfig(newConfig: Partial<VoiceConfig>): void {
    this.voiceConfig = { ...this.voiceConfig, ...newConfig };
    
    // Update current voice if language changed
    if (newConfig.language) {
      this.selectVoiceForLanguage(newConfig.language);
    }
  }

  /**
   * Check if voice is currently speaking
   */
  isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Check if voice is currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Create default voice configuration
   */
  private createDefaultVoiceConfig(): VoiceConfig {
    return {
      language: this.config.language || 'en-US',
      voice: 'default',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      enabled: this.config.accessibilityPreferences.voiceEnabled
    };
  }

  /**
   * Check if voice interface is supported
   */
  private isVoiceSupported(): boolean {
    return 'speechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  /**
   * Initialize speech recognition
   */
  private async initializeSpeechRecognition(): Promise<void> {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition settings
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.voiceConfig.language;
    
    // Add event listeners
    this.recognition.onstart = () => {
      this.isListening = true;
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
    };
  }

  /**
   * Initialize speech synthesis
   */
  private async initializeSpeechSynthesis(): Promise<void> {
    this.synthesis = window.speechSynthesis;
    
    // Wait for voices to load
    if (this.synthesis.getVoices().length === 0) {
      await new Promise(resolve => {
        this.synthesis!.onvoiceschanged = resolve;
      });
    }
    
    // Select appropriate voice
    this.selectVoiceForLanguage(this.voiceConfig.language);
  }

  /**
   * Select voice for language
   */
  private selectVoiceForLanguage(language: string): void {
    const voices = this.getAvailableVoices();
    
    // Prefer healthcare-appropriate voices
    const healthcareVoices = voices.filter(voice => 
      voice.name.toLowerCase().includes('medical') ||
      voice.name.toLowerCase().includes('professional') ||
      voice.name.toLowerCase().includes('clarity')
    );
    
    if (healthcareVoices.length > 0) {
      this.currentVoice = healthcareVoices[0];
    } else if (voices.length > 0) {
      this.currentVoice = voices[0];
    }
  }

  /**
   * Load medical terminology for pronunciation
   */
  private async loadMedicalTerminology(): Promise<void> {
    // Common medical terms and their phonetic pronunciations
    const medicalTerms = {
      'diagnosis': 'dye-ag-NO-sis',
      'prognosis': 'prog-NO-sis',
      'symptom': 'SIMP-tom',
      'syndrome': 'SIN-drome',
      'therapy': 'THER-a-pee',
      'surgery': 'SUR-jer-ee',
      'medication': 'med-i-KAY-shun',
      'prescription': 'pre-SKRIP-shun',
      'allergy': 'AL-er-jee',
      'infection': 'in-FEK-shun',
      'inflammation': 'in-fla-MAY-shun',
      'hypertension': 'hy-per-TEN-shun',
      'diabetes': 'dye-a-BEE-tees',
      'cancer': 'KAN-ser',
      'tumor': 'TOO-mer',
      'biopsy': 'BY-op-see',
      'radiology': 'ray-dee-OL-o-jee',
      'pathology': 'pa-THOL-o-jee',
      'pharmacy': 'FAR-ma-see',
      'nursing': 'NUR-sing'
    };
    
    Object.entries(medicalTerms).forEach(([term, pronunciation]) => {
      this.medicalTerminology.set(term, pronunciation);
    });
  }

  /**
   * Initialize voice commands
   */
  private async initializeVoiceCommands(): Promise<void> {
    this.voiceCommands = [
      {
        id: 'cmd-help',
        phrase: 'help me',
        action: 'show_help',
        parameters: {},
        healthcareRelevant: false,
        requiresConfirmation: false
      },
      {
        id: 'cmd-create-content',
        phrase: 'create content',
        action: 'create_content',
        parameters: { type: 'healthcare' },
        healthcareRelevant: true,
        requiresConfirmation: true
      },
      {
        id: 'cmd-check-compliance',
        phrase: 'check compliance',
        action: 'check_compliance',
        parameters: { level: this.config.complianceLevel },
        healthcareRelevant: true,
        requiresConfirmation: false
      },
      {
        id: 'cmd-analyze-data',
        phrase: 'analyze data',
        action: 'analyze_data',
        parameters: { specialty: this.config.medicalSpecialty },
        healthcareRelevant: true,
        requiresConfirmation: true
      },
      {
        id: 'cmd-navigate',
        phrase: 'go to',
        action: 'navigate',
        parameters: {},
        healthcareRelevant: false,
        requiresConfirmation: false
      },
      {
        id: 'cmd-search',
        phrase: 'search for',
        action: 'search',
        parameters: {},
        healthcareRelevant: false,
        requiresConfirmation: false
      }
    ];
  }

  /**
   * Process medical terminology in text
   */
  private async processMedicalTerminology(text: string): Promise<string> {
    let processedText = text;
    
    // Replace medical terms with phonetic pronunciations
    this.medicalTerminology.forEach((pronunciation, term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      processedText = processedText.replace(regex, pronunciation);
    });
    
    // Expand common medical abbreviations
    const abbreviations = {
      'BP': 'blood pressure',
      'HR': 'heart rate',
      'RR': 'respiratory rate',
      'Temp': 'temperature',
      'O2': 'oxygen',
      'CO2': 'carbon dioxide',
      'EKG': 'electrocardiogram',
      'MRI': 'magnetic resonance imaging',
      'CT': 'computed tomography',
      'X-ray': 'X-ray'
    };
    
    Object.entries(abbreviations).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      processedText = processedText.replace(regex, full);
    });
    
    return processedText;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    
    if (this.synthesis) {
      this.synthesis.cancel();
      this.synthesis = null;
    }
    
    this.isListening = false;
    this.isSpeaking = false;
    this.isInitialized = false;
  }
}
