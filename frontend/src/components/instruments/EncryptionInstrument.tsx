/**
 * Encryption Instrument
 * Manage encryption keys and settings
 * Constitutional: sovereignty over data security
 */

import { motion } from 'framer-motion';
import { Lock, Key, Shield, AlertTriangle, Check, Copy, Download, Upload, X } from 'lucide-react';
import { useState } from 'react';

interface EncryptionStatus {
  enabled: boolean;
  algorithm: string;
  keyStrength: number;
  lastRotated?: Date;
  backupExists: boolean;
}

interface EncryptionInstrumentProps {
  status: EncryptionStatus;
  onEnable: (passphrase: string) => void;
  onDisable: () => void;
  onRotateKey: (passphrase: string) => void;
  onExportKey: () => void;
  onImportKey: (keyData: string) => void;
  onClose: () => void;
}

export function EncryptionInstrument({
  status,
  onEnable,
  onDisable,
  onRotateKey,
  onExportKey,
  onImportKey,
  onClose,
}: EncryptionInstrumentProps) {
  const [mode, setMode] = useState<'overview' | 'enable' | 'rotate' | 'import'>('overview');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [importData, setImportData] = useState('');

  const handleEnable = () => {
    if (passphrase && passphrase === confirmPassphrase && passphrase.length >= 12) {
      onEnable(passphrase);
      setPassphrase('');
      setConfirmPassphrase('');
      setMode('overview');
    }
  };

  const handleRotate = () => {
    if (passphrase) {
      onRotateKey(passphrase);
      setPassphrase('');
      setMode('overview');
    }
  };

  const handleImport = () => {
    if (importData) {
      onImportKey(importData);
      setImportData('');
      setMode('overview');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.enabled ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <Lock size={24} className={status.enabled ? 'text-green-400' : 'text-red-400'} />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Encryption</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {status.enabled ? 'Your data is encrypted' : 'Encryption disabled'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
              <X size={20} className="text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {mode === 'overview' && (
            <>
              <div className={`p-4 rounded-xl border ${status.enabled ? 'border-green-400/30 bg-green-500/5' : 'border-red-400/30 bg-red-500/5'}`}>
                <div className="flex items-start gap-2">
                  {status.enabled ? (
                    <>
                      <Shield size={18} className="text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-400 mb-1">End-to-end encryption active</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          All reflection data is encrypted locally before sync. Only you can decrypt it.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={18} className="text-red-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-400 mb-1">Encryption disabled</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Your data is not encrypted. Enable encryption for maximum privacy.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {status.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">Algorithm</div>
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{status.algorithm}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">Key Strength</div>
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{status.keyStrength}-bit</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">Last Key Rotation</div>
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">
                      {status.lastRotated ? status.lastRotated.toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">Key Backup</div>
                    <div className="flex items-center gap-2">
                      {status.backupExists ? (
                        <>
                          <Check size={16} className="text-green-400" />
                          <span className="text-sm font-medium text-green-400">Exists</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} className="text-red-400" />
                          <span className="text-sm font-medium text-red-400">None</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {!status.enabled ? (
                  <button
                    onClick={() => setMode('enable')}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] font-medium flex items-center justify-center gap-2"
                  >
                    <Lock size={18} />
                    Enable Encryption
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setMode('rotate')}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:bg-white/5 flex items-center justify-center gap-2"
                    >
                      <Key size={18} />
                      Rotate Encryption Key
                    </button>
                    <button
                      onClick={onExportKey}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:bg-white/5 flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Export Key Backup
                    </button>
                    <button
                      onClick={() => setMode('import')}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:bg-white/5 flex items-center justify-center gap-2"
                    >
                      <Upload size={18} />
                      Import Key Backup
                    </button>
                    <button
                      onClick={onDisable}
                      className="w-full px-4 py-3 rounded-xl border border-red-400/30 text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-2"
                    >
                      <AlertTriangle size={18} />
                      Disable Encryption
                    </button>
                  </>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
                <h4 className="text-sm font-semibold mb-2 text-[var(--color-text-primary)]">Constitutional Guarantee</h4>
                <ul className="text-xs text-[var(--color-text-secondary)] space-y-1">
                  <li>• Keys are generated and stored only on your devices</li>
                  <li>• Server cannot decrypt your data—only you can</li>
                  <li>• Backup your keys or you'll lose access forever</li>
                  <li>• No key recovery service (by design)</li>
                </ul>
              </div>
            </>
          )}

          {mode === 'enable' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Choose a strong passphrase (12+ characters). <strong>This cannot be recovered if lost.</strong>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Passphrase</label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPassphrase(e.target.value)}
                  placeholder="Enter strong passphrase"
                  className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
                />
                {passphrase && passphrase.length < 12 && (
                  <p className="text-xs text-red-400 mt-1">Passphrase must be at least 12 characters</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Confirm Passphrase</label>
                <input
                  type="password"
                  value={confirmPassphrase}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setConfirmPassphrase(e.target.value)}
                  placeholder="Confirm passphrase"
                  className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
                />
                {confirmPassphrase && passphrase !== confirmPassphrase && (
                  <p className="text-xs text-red-400 mt-1">Passphrases don't match</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setMode('overview');
                    setPassphrase('');
                    setConfirmPassphrase('');
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnable}
                  disabled={!passphrase || passphrase !== confirmPassphrase || passphrase.length < 12}
                  className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-50"
                >
                  Enable Encryption
                </button>
              </div>
            </div>
          )}

          {mode === 'rotate' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Enter your current passphrase to rotate to a new encryption key.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Current Passphrase</label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPassphrase(e.target.value)}
                  placeholder="Enter current passphrase"
                  className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setMode('overview');
                    setPassphrase('');
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRotate}
                  disabled={!passphrase}
                  className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-50"
                >
                  Rotate Key
                </button>
              </div>
            </div>
          )}

          {mode === 'import' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Paste your exported key backup data below. This will restore your encryption key.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Key Backup Data</label>
                <textarea
                  value={importData}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setImportData(e.target.value)}
                  placeholder="Paste key backup data here"
                  rows={6}
                  className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-mono text-xs resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setMode('overview');
                    setImportData('');
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importData}
                  className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-50"
                >
                  Import Key
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[var(--color-border-subtle)]">
          <button onClick={onClose} className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5">
            {mode === 'overview' ? 'Close' : 'Back'}
          </button>
        </div>
      </div>
    </div>
  );
}


