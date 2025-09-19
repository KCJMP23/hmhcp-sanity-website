import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  qrCodeDataURL: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface TwoFactorVerification {
  isValid: boolean;
  isBackupCode?: boolean;
  usedBackupCodeIndex?: number;
}

export class TwoFactorAuth {
  private static readonly SERVICE_NAME = 'HM Healthcare Partners';
  private static readonly BACKUP_CODES_COUNT = 10;
  private static readonly CODE_LENGTH = 8;

  /**
   * Generate a new 2FA secret and setup data for a user
   */
  static async generateSecret(email: string): Promise<TwoFactorSetup> {
    // Generate secret
    const secret = authenticator.generateSecret();
    
    // Create service name for the authenticator app
    const serviceName = this.SERVICE_NAME;
    const accountName = email;
    
    // Generate OTP Auth URL
    const qrCodeUrl = authenticator.keyuri(accountName, serviceName, secret);
    
    // Generate QR code data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      }
    });
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    return {
      secret,
      qrCodeUrl,
      qrCodeDataURL,
      backupCodes,
      manualEntryKey: this.formatSecretForManualEntry(secret),
    };
  }

  /**
   * Verify a TOTP token or backup code
   */
  static async verifyToken(
    token: string, 
    secret: string, 
    backupCodes: string[] = []
  ): Promise<TwoFactorVerification> {
    // Clean the token
    const cleanToken = token.replace(/\s/g, '').toUpperCase();
    
    // First try TOTP verification
    const isValidTOTP = authenticator.verify({
      token: cleanToken,
      secret
    });
    
    if (isValidTOTP) {
      return { isValid: true };
    }
    
    // Try backup codes if TOTP fails
    const backupCodeIndex = backupCodes.findIndex(code => code === cleanToken);
    if (backupCodeIndex !== -1) {
      return {
        isValid: true,
        isBackupCode: true,
        usedBackupCodeIndex: backupCodeIndex,
      };
    }
    
    return { isValid: false };
  }

  /**
   * Enable 2FA for a user
   */
  static async enableTwoFactor(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
    );
    
    const { error } = await supabase
      .from('users')
      .update({
        two_factor_enabled: true,
        two_factor_secret: secret,
        backup_codes: backupCodes,
        two_factor_enabled_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    if (error) {
      throw new Error(`Failed to enable 2FA: ${error.message}`);
    }
  }

  /**
   * Disable 2FA for a user
   */
  static async disableTwoFactor(userId: string): Promise<void> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
    );
    
    const { error } = await supabase
      .from('users')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        backup_codes: null,
        two_factor_enabled_at: null,
      })
      .eq('id', userId);
    
    if (error) {
      throw new Error(`Failed to disable 2FA: ${error.message}`);
    }
  }

  /**
   * Remove a used backup code
   */
  static async removeUsedBackupCode(userId: string, usedIndex: number): Promise<void> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
    );
    
    // Get current backup codes
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('backup_codes')
      .eq('id', userId)
      .single();
    
    if (fetchError || !user) {
      throw new Error('Failed to fetch user backup codes');
    }
    
    const backupCodes = user.backup_codes || [];
    
    // Remove the used code
    backupCodes.splice(usedIndex, 1);
    
    // Update in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ backup_codes: backupCodes })
      .eq('id', userId);
    
    if (updateError) {
      throw new Error(`Failed to update backup codes: ${updateError.message}`);
    }
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    const newBackupCodes = this.generateBackupCodes();
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
    );
    const { error } = await supabase
      .from('users')
      .update({ backup_codes: newBackupCodes })
      .eq('id', userId);
    
    if (error) {
      throw new Error(`Failed to regenerate backup codes: ${error.message}`);
    }
    
    return newBackupCodes;
  }

  /**
   * Check if user has 2FA enabled
   */
  static async isEnabled(userId: string): Promise<boolean> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
    );
    
    const { data: user, error } = await supabase
      .from('users')
      .select('two_factor_enabled')
      .eq('id', userId)
      .single();
    
    if (error) {
      return false;
    }
    
    return user?.two_factor_enabled || false;
  }

  /**
   * Get user's 2FA data
   */
  static async getUserTwoFactorData(userId: string): Promise<{
    enabled: boolean;
    secret?: string;
    backupCodes?: string[];
    enabledAt?: string;
  }> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
    );
    
    const { data: user, error } = await supabase
      .from('users')
      .select('two_factor_enabled, two_factor_secret, backup_codes, two_factor_enabled_at')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return { enabled: false };
    }
    
    return {
      enabled: user.two_factor_enabled || false,
      secret: user.two_factor_secret,
      backupCodes: user.backup_codes,
      enabledAt: user.two_factor_enabled_at,
    };
  }

  /**
   * Generate backup codes
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      const code = randomBytes(this.CODE_LENGTH / 2).toString('hex').toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Format secret for manual entry (groups of 4 characters)
   */
  private static formatSecretForManualEntry(secret: string): string {
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  }

  /**
   * Validate a token format
   */
  static validateTokenFormat(token: string): boolean {
    const cleanToken = token.replace(/\s/g, '');
    
    // TOTP tokens are 6 digits
    if (/^\d{6}$/.test(cleanToken)) {
      return true;
    }
    
    // Backup codes are 8 hex characters
    if (/^[A-F0-9]{8}$/i.test(cleanToken)) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate QR code for setup
   */
  static async generateQRCodeForSecret(email: string, secret: string): Promise<string> {
    const qrCodeUrl = authenticator.keyuri(email, this.SERVICE_NAME, secret);
    
    return await QRCode.toDataURL(qrCodeUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      }
    });
  }
}

// Middleware function to require 2FA
export async function require2FA(userId: string, token?: string): Promise<{
  required: boolean;
  verified?: boolean;
  error?: string;
}> {
  try {
    // Check if user has 2FA enabled
    const isEnabled = await TwoFactorAuth.isEnabled(userId);
    
    if (!isEnabled) {
      return { required: false };
    }
    
    // If no token provided, 2FA is required but not verified
    if (!token) {
      return { required: true, verified: false };
    }
    
    // Validate token format
    if (!TwoFactorAuth.validateTokenFormat(token)) {
      return {
        required: true,
        verified: false,
        error: 'Invalid token format'
      };
    }
    
    // Get user's 2FA data
    const twoFactorData = await TwoFactorAuth.getUserTwoFactorData(userId);
    
    if (!twoFactorData.secret) {
      return {
        required: true,
        verified: false,
        error: '2FA not properly configured'
      };
    }
    
    // Verify the token
    const verification = await TwoFactorAuth.verifyToken(
      token,
      twoFactorData.secret,
      twoFactorData.backupCodes
    );
    
    // If backup code was used, remove it
    if (verification.isValid && verification.isBackupCode && verification.usedBackupCodeIndex !== undefined) {
      await TwoFactorAuth.removeUsedBackupCode(userId, verification.usedBackupCodeIndex);
    }
    
    return {
      required: true,
      verified: verification.isValid,
      error: verification.isValid ? undefined : 'Invalid 2FA token'
    };
  } catch (error) {
    return {
      required: true,
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
