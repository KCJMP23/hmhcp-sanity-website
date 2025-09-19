import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { createServerClient as createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  isValid: boolean;
  backupCodeUsed?: boolean;
}

export class TwoFactorAuth {
  // Generate a new 2FA secret for a user
  static generateSecret(email: string): string {
    // Configure authenticator settings
    authenticator.options = {
      window: 2, // Allow 2 time windows for clock skew
      step: 30, // 30 second time steps
    };

    // Generate secret
    const secret = authenticator.generateSecret();
    
    return secret;
  }

  // Generate QR code for 2FA setup
  static async generateQRCode(email: string, secret: string): Promise<string> {
    const issuer = 'HM Healthcare Partners';
    const label = `${issuer}:${email}`;
    
    // Generate OTP auth URL
    const otpauth = authenticator.keyuri(email, issuer, secret);
    
    // Generate QR code as data URL
    try {
      const qrCode = await QRCode.toDataURL(otpauth, {
        width: 256,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCode;
    } catch (error) {
      logger.error('Error generating QR code:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
      throw new Error('Failed to generate QR code');
    }
  }

  // Generate backup codes
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8 character alphanumeric codes
      const code = randomBytes(4)
        .toString('hex')
        .toUpperCase()
        .match(/.{4}/g)
        ?.join('-') || '';
      
      codes.push(code);
    }
    
    return codes;
  }

  // Set up 2FA for a user
  static async setupTwoFactor(userId: string, email: string): Promise<TwoFactorSetup> {
    const secret = this.generateSecret(email);
    const qrCode = await this.generateQRCode(email, secret);
    const backupCodes = this.generateBackupCodes();
    
    // Hash backup codes before storing
    const hashedBackupCodes = await this.hashBackupCodes(backupCodes);
    
    // Store encrypted secret and hashed backup codes in database
    const { error } = await supabaseAdmin
      .from('user_two_factor')
      .upsert({
        user_id: userId,
        secret: await this.encryptSecret(secret),
        backup_codes: hashedBackupCodes,
        enabled: false, // Not enabled until verified
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      logger.error('Error storing 2FA setup:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
      throw new Error('Failed to set up two-factor authentication');
    }
    
    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  // Verify TOTP token
  static verifyToken(token: string, secret: string): boolean {
    return authenticator.verify({
      token,
      secret,
    });
  }

  // Verify backup code
  static async verifyBackupCode(
    userId: string,
    code: string
  ): Promise<{ isValid: boolean; remainingCodes?: number }> {
    // Get user's backup codes
    const { data: userTwoFactor, error } = await supabaseAdmin
      .from('user_two_factor')
      .select('backup_codes')
      .eq('user_id', userId)
      .single();
    
    if (error || !userTwoFactor) {
      return { isValid: false };
    }
    
    // Check if code matches any stored codes
    const hashedCode = await this.hashBackupCode(code);
    const backupCodes = userTwoFactor.backup_codes as string[];
    const codeIndex = backupCodes.findIndex(bc => bc === hashedCode);
    
    if (codeIndex === -1) {
      return { isValid: false };
    }
    
    // Remove used backup code
    const updatedCodes = backupCodes.filter((_, index) => index !== codeIndex);
    
    // Update database
    await supabaseAdmin
      .from('user_two_factor')
      .update({
        backup_codes: updatedCodes,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    return {
      isValid: true,
      remainingCodes: updatedCodes.length,
    };
  }

  // Verify 2FA (TOTP or backup code)
  static async verify2FA(
    userId: string,
    token: string
  ): Promise<TwoFactorVerification> {
    // Get user's 2FA setup
    const { data: userTwoFactor, error } = await supabaseAdmin
      .from('user_two_factor')
      .select('secret, enabled')
      .eq('user_id', userId)
      .single();
    
    if (error || !userTwoFactor || !userTwoFactor.enabled) {
      return { isValid: false };
    }
    
    // Decrypt secret
    const secret = await this.decryptSecret(userTwoFactor.secret);
    
    // Try TOTP token first
    if (this.verifyToken(token, secret)) {
      return { isValid: true, backupCodeUsed: false };
    }
    
    // Try backup code
    const backupResult = await this.verifyBackupCode(userId, token);
    if (backupResult.isValid) {
      return { isValid: true, backupCodeUsed: true };
    }
    
    return { isValid: false };
  }

  // Enable 2FA after successful verification
  static async enable2FA(userId: string, token: string): Promise<boolean> {
    // Get secret
    const { data: userTwoFactor, error } = await supabaseAdmin
      .from('user_two_factor')
      .select('secret')
      .eq('user_id', userId)
      .single();
    
    if (error || !userTwoFactor) {
      return false;
    }
    
    // Decrypt and verify token
    const secret = await this.decryptSecret(userTwoFactor.secret);
    if (!this.verifyToken(token, secret)) {
      return false;
    }
    
    // Enable 2FA
    const { error: updateError } = await supabaseAdmin
      .from('user_two_factor')
      .update({
        enabled: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    return !updateError;
  }

  // Disable 2FA
  static async disable2FA(userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('user_two_factor')
      .delete()
      .eq('user_id', userId);
    
    return !error;
  }

  // Check if user has 2FA enabled
  static async is2FAEnabled(userId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('user_two_factor')
      .select('enabled')
      .eq('user_id', userId)
      .single();
    
    return !error && data?.enabled === true;
  }

  // Regenerate backup codes
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    const newCodes = this.generateBackupCodes();
    const hashedCodes = await this.hashBackupCodes(newCodes);
    
    const { error } = await supabaseAdmin
      .from('user_two_factor')
      .update({
        backup_codes: hashedCodes,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    if (error) {
      throw new Error('Failed to regenerate backup codes');
    }
    
    return newCodes;
  }

  // Helper: Encrypt secret (in production, use proper encryption)
  private static async encryptSecret(secret: string): Promise<string> {
    // In production, use proper encryption with KMS
    // For now, use base64 encoding as placeholder
    return Buffer.from(secret).toString('base64');
  }

  // Helper: Decrypt secret
  private static async decryptSecret(encryptedSecret: string): Promise<string> {
    // In production, use proper decryption with KMS
    // For now, use base64 decoding as placeholder
    return Buffer.from(encryptedSecret, 'base64').toString('utf-8');
  }

  // Helper: Hash backup code
  private static async hashBackupCode(code: string): Promise<string> {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(code.toUpperCase())
      .digest('hex');
  }

  // Helper: Hash multiple backup codes
  private static async hashBackupCodes(codes: string[]): Promise<string[]> {
    return Promise.all(codes.map(code => this.hashBackupCode(code)));
  }
}

// Middleware helper for 2FA verification
export async function require2FA(
  userId: string,
  token?: string
): Promise<{ isRequired: boolean; isValid: boolean }> {
  const is2FAEnabled = await TwoFactorAuth.is2FAEnabled(userId);
  
  if (!is2FAEnabled) {
    return { isRequired: false, isValid: true };
  }
  
  if (!token) {
    return { isRequired: true, isValid: false };
  }
  
  const verification = await TwoFactorAuth.verify2FA(userId, token);
  
  return { isRequired: true, isValid: verification.isValid };
}

// Types for API responses
export interface TwoFactorStatusResponse {
  enabled: boolean;
  backupCodesRemaining?: number;
}

export interface TwoFactorSetupResponse {
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyResponse {
  success: boolean;
  message?: string;
  backupCodeUsed?: boolean;
  remainingBackupCodes?: number;
}