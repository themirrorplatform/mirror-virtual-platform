import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Key,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';

/**
 * EncryptionManager - Encryption Key Management
 * 
 * Features:
 * - Initialize encryption on first use
 * - Unlock with passphrase
 * - Encryption status indicator
 * - Key rotation
 * - Backup/export keys
 * - Recovery phrase display
 * - Auto-lock timer
 * - Encryption strength indicator
 * - Data encrypted count
 * 
 * Constitutional Note: Your data is encrypted locally with keys
 * only you control. Mirror cannot access your encrypted data.
 */

type EncryptionStatus = 'uninitialized' | 'locked' | 'unlocked' | 'initializing' | 'error';

interface EncryptionState {
  status: EncryptionStatus;
  isInitialized: boolean;
  lastUnlockedAt?: string;
  keyRotatedAt?: string;
  encryptedItemsCount: number;
  autoLockMinutes: number;
  encryptionStrength: 'standard' | 'high' | 'maximum';
}

interface EncryptionManagerProps {
  state: EncryptionState;
  onInitialize?: (passphrase: string) => Promise<{ recoveryPhrase: string }>;
  onUnlock?: (passphrase: string) => Promise<void>;
  onLock?: () => Promise<void>;
  onRotateKey?: () => Promise<void>;
  onExportKeys?: () => Promise<Blob>;
  onUpdateAutoLock?: (minutes: number) => Promise<void>;
}

const statusConfig: Record<EncryptionStatus, { color: string; label: string; icon: typeof Lock }> = {
  uninitialized: { color: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Not Initialized', icon: AlertTriangle },
  locked: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Locked', icon: Lock },
  unlocked: { color: 'bg-green-100 text-green-700 border-green-300', label: 'Unlocked', icon: Unlock },
  initializing: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Initializing...', icon: RefreshCw },
  error: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Error', icon: XCircle }
};

const strengthConfig = {
  standard: { label: 'Standard (AES-256)', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High (AES-256 + PBKDF2)', color: 'bg-purple-100 text-purple-700' },
  maximum: { label: 'Maximum (AES-256 + Argon2)', color: 'bg-green-100 text-green-700' }
};

export function EncryptionManager({
  state,
  onInitialize,
  onUnlock,
  onLock,
  onRotateKey,
  onExportKeys,
  onUpdateAutoLock
}: EncryptionManagerProps) {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const statusConf = statusConfig[state.status];
  const StatusIcon = statusConf.icon;
  const strengthConf = strengthConfig[state.encryptionStrength];

  const handleInitialize = async () => {
    if (!onInitialize || passphrase.length < 12) {
      setError('Passphrase must be at least 12 characters');
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setError('Passphrases do not match');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const result = await onInitialize(passphrase);
      setRecoveryPhrase(result.recoveryPhrase);
      setPassphrase('');
      setConfirmPassphrase('');
    } catch (err) {
      setError('Failed to initialize encryption');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlock = async () => {
    if (!onUnlock || !passphrase) {
      setError('Please enter your passphrase');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      await onUnlock(passphrase);
      setPassphrase('');
    } catch (err) {
      setError('Incorrect passphrase');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLock = async () => {
    if (!onLock) return;
    setIsProcessing(true);
    try {
      await onLock();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotateKey = async () => {
    if (!onRotateKey) return;
    if (!confirm('Rotating keys will re-encrypt all data. This may take a few minutes. Continue?')) return;
    
    setIsProcessing(true);
    try {
      await onRotateKey();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportKeys = async () => {
    if (!onExportKeys) return;
    if (!confirm('Export your encryption keys? Keep this file secure - anyone with it can decrypt your data.')) return;
    
    try {
      const blob = await onExportKeys();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mirror-encryption-keys-${Date.now()}.key`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export keys');
    }
  };

  const copyRecoveryPhrase = () => {
    if (!recoveryPhrase) return;
    navigator.clipboard.writeText(recoveryPhrase);
    setCopiedRecovery(true);
    setTimeout(() => setCopiedRecovery(false), 2000);
  };

  const passphraseStrength = (pass: string): { strength: string; color: string } => {
    if (pass.length < 8) return { strength: 'Weak', color: 'text-red-600' };
    if (pass.length < 12) return { strength: 'Fair', color: 'text-yellow-600' };
    if (pass.length < 16) return { strength: 'Good', color: 'text-blue-600' };
    return { strength: 'Strong', color: 'text-green-600' };
  };

  const strength = passphraseStrength(passphrase);

  // Uninitialized State
  if (!state.isInitialized && state.status === 'uninitialized') {
    return (
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Lock className="h-6 w-6 text-blue-600" />
            Initialize Encryption
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning */}
          <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-yellow-900">Important Security Information</p>
                <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Your passphrase encrypts all your private data locally</li>
                  <li>Mirror cannot recover your passphrase - keep it safe</li>
                  <li>You'll receive a recovery phrase - save it securely</li>
                  <li>Losing both passphrase and recovery phrase = permanent data loss</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Passphrase Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Create Passphrase <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPassphrase(e.target.value)}
                placeholder="At least 12 characters"
                className="pr-10"
              />
              <button
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassphrase ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">Use a strong, unique passphrase</p>
              {passphrase && (
                <p className={`text-xs font-medium ${strength.color}`}>{strength.strength}</p>
              )}
            </div>
          </div>

          {/* Confirm Passphrase */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Confirm Passphrase <span className="text-red-600">*</span>
            </label>
            <Input
              type={showPassphrase ? 'text' : 'password'}
              value={confirmPassphrase}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setConfirmPassphrase(e.target.value)}
              placeholder="Re-enter passphrase"
            />
            {confirmPassphrase && passphrase !== confirmPassphrase && (
              <p className="text-xs text-red-600 mt-1">Passphrases do not match</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Initialize Button */}
          <Button
            onClick={handleInitialize}
            disabled={
              !passphrase ||
              passphrase.length < 12 ||
              passphrase !== confirmPassphrase ||
              isProcessing
            }
            className="w-full"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Initialize Encryption
              </>
            )}
          </Button>

          {/* Constitutional Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-900">
              <strong>Local Encryption:</strong> Your data is encrypted on your device with keys only you control.
              Mirror cannot access your encrypted data - this is by design.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Recovery Phrase Display
  if (recoveryPhrase) {
    return (
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Encryption Initialized
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Message */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-2">✓ Encryption successfully initialized</p>
            <p className="text-xs text-green-800">
              Your data is now protected with end-to-end encryption
            </p>
          </div>

          {/* Recovery Phrase */}
          <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-900 mb-1">Save Your Recovery Phrase</p>
                <p className="text-xs text-yellow-800">
                  This phrase can recover your data if you forget your passphrase. Write it down and store it securely.
                  You'll only see this once.
                </p>
              </div>
            </div>
            
            <div className="p-3 bg-white border border-yellow-300 rounded font-mono text-sm break-all mb-3">
              {recoveryPhrase}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copyRecoveryPhrase}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {copiedRecovery ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <Button
            onClick={() => setRecoveryPhrase(null)}
            className="w-full"
          >
            I've Saved My Recovery Phrase
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Main Encryption Manager
  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={`border-2 ${state.status === 'unlocked' ? 'border-green-200' : 'border-red-200'}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                Encryption Manager
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                End-to-end encryption status
              </p>
            </div>
            <Badge className={`${statusConf.color} border flex items-center gap-1`}>
              <StatusIcon className={`h-4 w-4 ${state.status === 'initializing' ? 'animate-spin' : ''}`} />
              {statusConf.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-blue-600 font-medium">Encrypted Items</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{state.encryptedItemsCount}</p>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Key className="h-4 w-4 text-purple-600" />
                <p className="text-xs text-purple-600 font-medium">Strength</p>
              </div>
              <p className="text-sm font-semibold text-purple-700">{strengthConf.label.split(' ')[0]}</p>
            </div>
          </div>

          {/* Locked State - Unlock Interface */}
          {state.status === 'locked' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Enter Passphrase to Unlock
                </label>
                <div className="relative">
                  <Input
                    type={showPassphrase ? 'text' : 'password'}
                    value={passphrase}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPassphrase(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                    placeholder="Your encryption passphrase"
                    className="pr-10"
                  />
                  <button
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassphrase ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {error}
                </div>
              )}

              <Button
                onClick={handleUnlock}
                disabled={!passphrase || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock Encryption
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Unlocked State - Management Interface */}
          {state.status === 'unlocked' && (
            <div className="space-y-4">
              {/* Last Unlocked */}
              {state.lastUnlockedAt && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-600">Last unlocked</p>
                  <p className="text-sm text-green-900 font-medium">
                    {new Date(state.lastUnlockedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Auto-Lock Setting */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Auto-Lock Timer
                </label>
                <select
                  value={state.autoLockMinutes}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onUpdateAutoLock?.(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={0}>Never</option>
                </select>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={handleLock}
                  variant="outline"
                  className="w-full"
                  disabled={isProcessing}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Lock Now
                </Button>

                {/* Advanced Actions */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 py-2"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </button>

                {showAdvanced && (
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    {onRotateKey && (
                      <Button
                        onClick={handleRotateKey}
                        variant="outline"
                        className="w-full"
                        disabled={isProcessing}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Rotate Encryption Keys
                      </Button>
                    )}
                    {onExportKeys && (
                      <Button
                        onClick={handleExportKeys}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Keys (Backup)
                      </Button>
                    )}
                    {state.keyRotatedAt && (
                      <p className="text-xs text-gray-500 text-center">
                        Last rotated: {new Date(state.keyRotatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Constitutional Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-900">
              <strong>Zero-Knowledge Encryption:</strong> All encryption happens locally on your device.
              Mirror has no access to your passphrase or encryption keys.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * // Uninitialized state
 * <EncryptionManager
 *   state={{
 *     status: 'uninitialized',
 *     isInitialized: false,
 *     encryptedItemsCount: 0,
 *     autoLockMinutes: 15,
 *     encryptionStrength: 'high'
 *   }}
 *   onInitialize={async (passphrase) => {
 *     console.log('Initializing encryption...');
 *     const result = await api.initializeEncryption(passphrase);
 *     return { recoveryPhrase: result.recoveryPhrase };
 *   }}
 * />
 * 
 * // Locked state
 * <EncryptionManager
 *   state={{
 *     status: 'locked',
 *     isInitialized: true,
 *     encryptedItemsCount: 1234,
 *     autoLockMinutes: 15,
 *     encryptionStrength: 'high'
 *   }}
 *   onUnlock={async (passphrase) => {
 *     await api.unlockEncryption(passphrase);
 *   }}
 * />
 * 
 * // Unlocked state
 * <EncryptionManager
 *   state={{
 *     status: 'unlocked',
 *     isInitialized: true,
 *     lastUnlockedAt: '2024-01-15T14:30:00Z',
 *     keyRotatedAt: '2024-01-01T00:00:00Z',
 *     encryptedItemsCount: 1234,
 *     autoLockMinutes: 15,
 *     encryptionStrength: 'high'
 *   }}
 *   onLock={async () => {
 *     await api.lockEncryption();
 *   }}
 *   onRotateKey={async () => {
 *     await api.rotateEncryptionKey();
 *   }}
 *   onExportKeys={async () => {
 *     return await api.exportEncryptionKeys();
 *   }}
 *   onUpdateAutoLock={async (minutes) => {
 *     await api.updateAutoLockTimer(minutes);
 *   }}
 * />
 */


