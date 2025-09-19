'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle as CheckCircleIcon, AlertCircle as ExclamationCircleIcon, Copy as DocumentDuplicateIcon } from 'lucide-react';
import Image from 'next/image';

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const router = useRouter();
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/two-factor/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set up 2FA');
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/two-factor/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          token: verificationCode,
          action: 'enable',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid verification code');
      }

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.push('/admin/settings');
    }
  };

  if (step === 'setup') {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Set Up Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by enabling two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">How it works:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>We'll generate a QR code for you to scan with your authenticator app</li>
              <li>Your app will generate a new 6-digit code every 30 seconds</li>
              <li>You'll enter this code along with your password when signing in</li>
              <li>We'll also provide backup codes in case you lose access to your device</li>
            </ol>
          </div>

          <Alert>
            <ExclamationCircleIcon className="h-4 w-4" />
            <AlertDescription>
              You'll need an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button onClick={handleSetup} disabled={loading}>
              {loading ? 'Setting up...' : 'Continue'}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <ExclamationCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Scan this QR code with your authenticator app, then enter the 6-digit code it generates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {qrCode && (
              <div className="relative">
                <Image
                  src={qrCode}
                  alt="2FA QR Code"
                  width={256}
                  height={256}
                  className="border"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl font-mono"
              maxLength={6}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <ExclamationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-blue-900 dark:text-blue-100">Save your backup codes</p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Store these codes somewhere safe. You can use them to access your account if you lose your device.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-3">
              {backupCodes.map((code, index) => (
                <code key={index} className="bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono">
                  {code}
                </code>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyBackupCodes}
              className="w-full mt-3"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              {copiedCodes ? 'Copied!' : 'Copy All Codes'}
            </Button>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleVerify} disabled={loading || verificationCode.length !== 6}>
              {loading ? 'Verifying...' : 'Enable 2FA'}
            </Button>
            <Button variant="outline" onClick={() => setStep('setup')}>
              Back
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <ExclamationCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircleIcon className="h-6 w-6 text-blue-600" />
          Two-Factor Authentication Enabled
        </CardTitle>
        <CardDescription>
          Your account is now protected with two-factor authentication.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <CheckCircleIcon className="h-4 w-4" />
          <AlertDescription>
            You'll need to enter a verification code from your authenticator app the next time you sign in.
          </AlertDescription>
        </Alert>

        <div className="bg-gray-50 dark:bg-gray-900 p-4">
          <h4 className="font-medium mb-2">Important:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>Keep your authenticator app installed and synced</li>
            <li>Store your backup codes in a secure location</li>
            <li>Never share your backup codes with anyone</li>
            <li>Each backup code can only be used once</li>
          </ul>
        </div>

        <Button onClick={handleComplete}>
          {onComplete ? 'Done' : 'Go to Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}