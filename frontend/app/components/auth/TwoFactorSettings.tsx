'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  ShieldCheck as ShieldCheckIcon, 
  AlertTriangle as ExclamationTriangleIcon,
  Copy as DocumentDuplicateIcon,
  RotateCcw as ArrowPathIcon 
} from 'lucide-react';
import { TwoFactorSetup } from './TwoFactorSetup';
import { logger } from '@/lib/logger';

export function TwoFactorSettings() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showRegenerateBackup, setShowRegenerateBackup] = useState(false);
  const [password, setPassword] = useState('');
  const [backupCodesCount, setBackupCodesCount] = useState(0);
  const [error, setError] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);

  const checkStatus = useCallback(async () => {
    try {
      const [statusRes, backupRes] = await Promise.all([
        fetch('/api/auth/two-factor/setup', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }),
        fetch('/api/auth/two-factor/backup-codes', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setEnabled(statusData.enabled);
      }

      if (backupRes.ok && enabled) {
        const backupData = await backupRes.json();
        setBackupCodesCount(backupData.remainingCodes || 0);
      }
    } catch (err) {
      logger.error('Failed to check 2FA status:', { error: err instanceof Error ? err : new Error(String(err)), action: 'error_logged', metadata: { err } });
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleDisable = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/two-factor/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      setEnabled(false);
      setShowDisable(false);
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/two-factor/backup-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate backup codes');
      }

      const data = await response.json();
      setNewBackupCodes(data.backupCodes);
      setBackupCodesCount(data.backupCodes.length);
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = newBackupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (showSetup) {
    return (
      <TwoFactorSetup
        onComplete={() => {
          setEnabled(true);
          setShowSetup(false);
          checkStatus();
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="2fa-toggle" className="text-base">
              {enabled ? 'Enabled' : 'Disabled'}
            </Label>
            <p className="text-sm text-muted-foreground">
              {enabled 
                ? 'Your account is protected with 2FA' 
                : 'Enable 2FA for enhanced security'
              }
            </p>
          </div>
          <Switch
            id="2fa-toggle"
            checked={enabled}
            onCheckedChange={(checked) => {
              if (checked) {
                setShowSetup(true);
              } else {
                setShowDisable(true);
              }
            }}
          />
        </div>

        {enabled && (
          <>
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Backup Codes</h4>
              <div className="space-y-4">
                <Alert className={backupCodesCount <= 3 ? 'border-blue-500' : ''}>
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    You have <strong>{backupCodesCount}</strong> backup codes remaining.
                    {backupCodesCount <= 3 && ' Consider regenerating your backup codes.'}
                  </AlertDescription>
                </Alert>

                <Button
                  variant="outline"
                  onClick={() => setShowRegenerateBackup(true)}
                  className="w-full sm:w-auto"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Regenerate Backup Codes
                </Button>
              </div>
            </div>

            {showRegenerateBackup && (
              <div className="border-t pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regen-password">Confirm Password</Label>
                  <Input
                    id="regen-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>

                {newBackupCodes.length > 0 ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        <strong>Save these backup codes!</strong> Each code can only be used once.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {newBackupCodes.map((code, index) => (
                        <code key={index} className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm font-mono">
                          {code}
                        </code>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCopyBackupCodes}
                        className="flex-1"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                        Copy All
                      </Button>
                      <Button
                        onClick={() => {
                          setShowRegenerateBackup(false);
                          setNewBackupCodes([]);
                        }}
                        className="flex-1"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRegenerateBackupCodes}
                      disabled={loading || !password}
                    >
                      {loading ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRegenerateBackup(false);
                        setPassword('');
                        setError('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {showDisable && (
          <div className="border-t pt-6 space-y-4">
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                Disabling 2FA will make your account less secure. You'll need to set it up again if you want to re-enable it.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="disable-password">Confirm Password</Label>
              <Input
                id="disable-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to disable 2FA"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={loading || !password}
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisable(false);
                  setPassword('');
                  setError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}