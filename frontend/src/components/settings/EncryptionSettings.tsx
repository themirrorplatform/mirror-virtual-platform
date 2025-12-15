/**
 * Encryption Settings Panel
 * 
 * Constitutional Principles:
 * - Encryption is opt-in, never forced
 * - User controls passphrase
 * - Clear explanation of what encryption means
 * - Lock/unlock functionality
 */

import { useState, useEffect } from 'react';
import { Lock, Unlock, Key, Download, AlertTriangle } from 'lucide-react';
import { encryptionService } from '../../services/encryption';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';

export function EncryptionSettings() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showExportKey, setShowExportKey] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [unlockPassphrase, setUnlockPassphrase] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setIsConfigured(encryptionService.isConfigured());
    setIsEnabled(encryptionService.isEnabled());
  }, []);

  const handleEnable = async () => {
    setError('');

    if (passphrase.length < 8) {
      setError('Passphrase must be at least 8 characters');
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setError('Passphrases do not match');
      return;
    }

    try {
      await encryptionService.initialize(passphrase);
      setIsConfigured(true);
      setIsEnabled(true);
      setShowSetup(false);
      setPassphrase('');
      setConfirmPassphrase('');
    } catch (err) {
      setError('Failed to enable encryption');
    }
  };

  const handleUnlock = async () => {
    setError('');

    try {
      const success = await encryptionService.unlock(unlockPassphrase);
      if (success) {
        setIsEnabled(true);
        setShowUnlock(false);
        setUnlockPassphrase('');
      } else {
        setError('Incorrect passphrase');
      }
    } catch (err) {
      setError('Failed to unlock');
    }
  };

  const handleLock = () => {
    encryptionService.lock();
    setIsEnabled(false);
  };

  const handleExportKey = async () => {
    try {
      const exportedKey = await encryptionService.exportKey(unlockPassphrase);
      const blob = new Blob([exportedKey], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `mirror-encryption-key-${Date.now()}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      setShowExportKey(false);
      setUnlockPassphrase('');
    } catch (err) {
      setError('Failed to export key');
    }
  };

  const handleDisable = async () => {
    await encryptionService.disable();
    setIsConfigured(false);
    setIsEnabled(false);
    setShowDisable(false);
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${
            isEnabled 
              ? 'bg-[var(--color-accent-green)]/10' 
              : 'bg-[var(--color-text-muted)]/10'
          }`}>
            {isEnabled ? (
              <Lock size={24} className="text-[var(--color-accent-green)]" />
            ) : (
              <Unlock size={24} className="text-[var(--color-text-muted)]" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="mb-1">
              {isEnabled ? 'Encryption Enabled' : 'Encryption Disabled'}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {isEnabled 
                ? 'Your reflections are encrypted with your passphrase' 
                : isConfigured
                  ? 'Encryption is configured but locked. Unlock to access encrypted reflections.'
                  : 'Your reflections are stored unencrypted'
              }
            </p>
          </div>
        </div>
      </Card>

      {/* Explanation */}
      <Card>
        <h4 className="mb-2">What encryption means</h4>
        <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <li>• Your reflections are encrypted with a passphrase you create</li>
          <li>• No one can read them without your passphrase (not even with device access)</li>
          <li>• The passphrase is never stored anywhere</li>
          <li>• If you forget your passphrase, your encrypted data cannot be recovered</li>
          <li>• You can export your encryption key as a backup</li>
        </ul>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        {!isConfigured && (
          <Button
            variant="default"
            onClick={() => setShowSetup(true)}
          >
            <Lock size={16} />
            Enable Encryption
          </Button>
        )}

        {isConfigured && !isEnabled && (
          <Button
            variant="default"
            onClick={() => setShowUnlock(true)}
          >
            <Unlock size={16} />
            Unlock Vault
          </Button>
        )}

        {isConfigured && isEnabled && (
          <>
            <Button
              variant="ghost"
              onClick={handleLock}
            >
              <Lock size={16} />
              Lock Vault
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowExportKey(true)}
            >
              <Download size={16} />
              Export Encryption Key
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowDisable(true)}
            >
              <AlertTriangle size={16} />
              Disable Encryption
            </Button>
          </>
        )}
      </div>

      {/* Setup Dialog */}
      <Dialog
        isOpen={showSetup}
        onClose={() => {
          setShowSetup(false);
          setPassphrase('');
          setConfirmPassphrase('');
          setError('');
        }}
        title="Enable Encryption"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Create a passphrase to encrypt your reflections. This passphrase will never be stored.
          </p>

          <Input
            type="password"
            label="Passphrase"
            value={passphrase}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPassphrase(e.target.value)}
            placeholder="At least 8 characters"
          />

          <Input
            type="password"
            label="Confirm Passphrase"
            value={confirmPassphrase}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setConfirmPassphrase(e.target.value)}
            placeholder="Re-enter passphrase"
          />

          {error && (
            <p className="text-sm text-[var(--color-accent-red)]">{error}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={handleEnable}
              disabled={!passphrase || !confirmPassphrase}
            >
              Enable
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowSetup(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Unlock Dialog */}
      <Dialog
        isOpen={showUnlock}
        onClose={() => {
          setShowUnlock(false);
          setUnlockPassphrase('');
          setError('');
        }}
        title="Unlock Vault"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Enter your passphrase to access encrypted reflections.
          </p>

          <Input
            type="password"
            label="Passphrase"
            value={unlockPassphrase}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUnlockPassphrase(e.target.value)}
            placeholder="Enter passphrase"
          />

          {error && (
            <p className="text-sm text-[var(--color-accent-red)]">{error}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={handleUnlock}
              disabled={!unlockPassphrase}
            >
              Unlock
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowUnlock(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Export Key Dialog */}
      <Dialog
        isOpen={showExportKey}
        onClose={() => {
          setShowExportKey(false);
          setUnlockPassphrase('');
          setError('');
        }}
        title="Export Encryption Key"
      >
        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-accent-amber)]/10 rounded-lg">
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>Warning:</strong> Your encryption key is extremely sensitive. 
              Store it securely. Anyone with this key and your passphrase can decrypt your reflections.
            </p>
          </div>

          <Input
            type="password"
            label="Confirm Passphrase"
            value={unlockPassphrase}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUnlockPassphrase(e.target.value)}
            placeholder="Enter passphrase to export key"
          />

          {error && (
            <p className="text-sm text-[var(--color-accent-red)]">{error}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={handleExportKey}
              disabled={!unlockPassphrase}
            >
              <Download size={16} />
              Export Key
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowExportKey(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog
        isOpen={showDisable}
        onClose={() => setShowDisable(false)}
        title="Disable Encryption"
      >
        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-accent-red)]/10 rounded-lg">
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>Warning:</strong> Disabling encryption will remove your encryption key. 
              Previously encrypted reflections will remain encrypted and inaccessible.
            </p>
          </div>

          <p className="text-sm text-[var(--color-text-secondary)]">
            Consider exporting your encryption key before disabling.
          </p>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleDisable}
            >
              Disable Encryption
            </Button>
            <Button
              variant="default"
              onClick={() => setShowDisable(false)}
            >
              Keep Encryption
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}





