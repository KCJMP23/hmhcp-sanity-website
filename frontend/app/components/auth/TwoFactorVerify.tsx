'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle as ExclamationCircleIcon } from 'lucide-react';

interface TwoFactorVerifyProps {
  onVerify: (token: string) => Promise<void>;
  onCancel?: () => void;
  email?: string;
}

export function TwoFactorVerify({ onVerify, onCancel, email }: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length < 6) {
      setError('Please enter a valid code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onVerify(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    
    if (useBackupCode) {
      // Backup codes have format XXXX-XXXX
      const formatted = cleaned.slice(0, 8).replace(/(.{4})/, '$1-');
      setCode(formatted);
    } else {
      // TOTP codes are 6 digits
      setCode(cleaned.slice(0, 6));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          {email && <span className="block mb-2">Signing in as {email}</span>}
          {useBackupCode 
            ? 'Enter one of your backup codes'
            : 'Enter the 6-digit code from your authenticator app'
          }
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              {useBackupCode ? 'Backup Code' : 'Verification Code'}
            </Label>
            <Input
              id="code"
              type="text"
              placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="text-center text-2xl font-mono"
              maxLength={useBackupCode ? 9 : 6}
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <ExclamationCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm">
            {useBackupCode ? (
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(false);
                  setCode('');
                  setError('');
                }}
                className="text-primary hover:underline"
              >
                Use authenticator app instead
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(true);
                  setCode('');
                  setError('');
                }}
                className="text-primary hover:underline"
              >
                Use a backup code instead
              </button>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button
            type="submit"
            disabled={loading || (useBackupCode ? code.length !== 9 : code.length !== 6)}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}