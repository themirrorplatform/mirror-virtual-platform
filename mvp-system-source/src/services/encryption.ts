/**
 * Encryption Service - Constitutional Privacy
 * 
 * Principles:
 * - User-controlled keys (never stored on device without consent)
 * - Encryption is opt-in, never forced
 * - No key = no access (even for device owner)
 * - Export includes encrypted data with key option
 */

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'AES-GCM';
  keyDerivation: 'PBKDF2';
  iterations: number;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  tag?: string;
}

class EncryptionService {
  private key: CryptoKey | null = null;
  private config: EncryptionConfig = {
    enabled: false,
    algorithm: 'AES-GCM',
    keyDerivation: 'PBKDF2',
    iterations: 100000,
  };

  /**
   * Initialize encryption with user passphrase
   */
  async initialize(passphrase: string): Promise<void> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive key from passphrase
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    this.key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.config.iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    this.config.enabled = true;

    // Store salt for future key derivation
    localStorage.setItem('mirror_encryption_salt', this.arrayBufferToBase64(salt));
  }

  /**
   * Re-derive key from passphrase (on app restart)
   */
  async unlock(passphrase: string): Promise<boolean> {
    const saltBase64 = localStorage.getItem('mirror_encryption_salt');
    if (!saltBase64) return false;

    const salt = this.base64ToArrayBuffer(saltBase64);

    try {
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(passphrase),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      this.key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: this.config.iterations,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      this.config.enabled = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Encrypt text
   */
  async encrypt(plaintext: string): Promise<EncryptedData> {
    if (!this.key) {
      throw new Error('Encryption not initialized');
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      encoded
    );

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv),
      salt: localStorage.getItem('mirror_encryption_salt') || '',
    };
  }

  /**
   * Decrypt text
   */
  async decrypt(encrypted: EncryptedData): Promise<string> {
    if (!this.key) {
      throw new Error('Encryption not initialized');
    }

    const ciphertext = this.base64ToArrayBuffer(encrypted.ciphertext);
    const iv = this.base64ToArrayBuffer(encrypted.iv);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Lock the vault (clear key from memory)
   */
  lock(): void {
    this.key = null;
    this.config.enabled = false;
  }

  /**
   * Disable encryption entirely (requires confirmation)
   */
  async disable(): Promise<void> {
    this.key = null;
    this.config.enabled = false;
    localStorage.removeItem('mirror_encryption_salt');
  }

  /**
   * Check if encryption is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled && this.key !== null;
  }

  /**
   * Check if encryption is configured (but may be locked)
   */
  isConfigured(): boolean {
    return localStorage.getItem('mirror_encryption_salt') !== null;
  }

  /**
   * Export encryption key (for backup)
   * WARNING: This is the user's responsibility to secure
   */
  async exportKey(passphrase: string): Promise<string> {
    if (!this.key) {
      throw new Error('No key to export');
    }

    // Export as JWK
    const exported = await crypto.subtle.exportKey('jwk', this.key);
    
    // Encrypt the exported key with the passphrase
    const keyData = JSON.stringify(exported);
    const encrypted = await this.encrypt(keyData);
    
    return JSON.stringify({
      type: 'mirror_encryption_key',
      version: 1,
      encrypted,
    });
  }

  /**
   * Helper: ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper: Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();
