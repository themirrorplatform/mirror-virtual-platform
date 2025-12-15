/**
 * Device Registry Service
 * 
 * Constitutional Principles:
 * - User knows where data lives
 * - Sync status per device
 * - Transparent multi-device state
 * - User controls device list
 */

export interface RegisteredDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  firstSeen: Date;
  lastSeen: Date;
  lastSync?: Date;
  dataCount: {
    reflections: number;
    threads: number;
    axes: number;
  };
  isCurrentDevice: boolean;
}

class DeviceRegistryService {
  private readonly STORAGE_KEY = 'mirror_device_registry';
  private readonly CURRENT_DEVICE_ID_KEY = 'mirror_current_device_id';
  private devices: RegisteredDevice[] = [];
  private currentDeviceId: string;

  constructor() {
    this.currentDeviceId = this.getOrCreateDeviceId();
    this.loadDevices();
    this.updateCurrentDevice();
  }

  /**
   * Get or create device ID
   */
  private getOrCreateDeviceId(): string {
    let id = localStorage.getItem(this.CURRENT_DEVICE_ID_KEY);
    
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(this.CURRENT_DEVICE_ID_KEY, id);
    }

    return id;
  }

  /**
   * Load devices from localStorage
   */
  private loadDevices(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.devices = parsed.map((d: any) => ({
          ...d,
          firstSeen: new Date(d.firstSeen),
          lastSeen: new Date(d.lastSeen),
          lastSync: d.lastSync ? new Date(d.lastSync) : undefined,
        }));
      } catch {
        this.devices = [];
      }
    }
  }

  /**
   * Save devices
   */
  private saveDevices(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.devices));
  }

  /**
   * Update current device information
   */
  private updateCurrentDevice(): void {
    const existing = this.devices.find(d => d.id === this.currentDeviceId);
    
    const deviceInfo = this.getDeviceInfo();

    if (existing) {
      existing.lastSeen = new Date();
      existing.browser = deviceInfo.browser;
      existing.os = deviceInfo.os;
      existing.isCurrentDevice = true;
    } else {
      this.devices.push({
        id: this.currentDeviceId,
        name: this.generateDeviceName(),
        type: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        firstSeen: new Date(),
        lastSeen: new Date(),
        dataCount: {
          reflections: 0,
          threads: 0,
          axes: 0,
        },
        isCurrentDevice: true,
      });
    }

    // Mark other devices as not current
    this.devices.forEach(d => {
      if (d.id !== this.currentDeviceId) {
        d.isCurrentDevice = false;
      }
    });

    this.saveDevices();
  }

  /**
   * Get device info from user agent
   */
  private getDeviceInfo(): {
    type: RegisteredDevice['type'];
    browser: string;
    os: string;
  } {
    const ua = navigator.userAgent;

    // Detect device type
    let type: RegisteredDevice['type'] = 'unknown';
    if (/mobile/i.test(ua)) {
      type = 'mobile';
    } else if (/tablet|ipad/i.test(ua)) {
      type = 'tablet';
    } else {
      type = 'desktop';
    }

    // Detect browser
    let browser = 'Unknown';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    // Detect OS
    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return { type, browser, os };
  }

  /**
   * Generate device name
   */
  private generateDeviceName(): string {
    const info = this.getDeviceInfo();
    const typeStr = info.type.charAt(0).toUpperCase() + info.type.slice(1);
    return `${typeStr} - ${info.browser}`;
  }

  /**
   * Get all devices
   */
  getDevices(): RegisteredDevice[] {
    return [...this.devices];
  }

  /**
   * Get current device
   */
  getCurrentDevice(): RegisteredDevice | null {
    return this.devices.find(d => d.id === this.currentDeviceId) || null;
  }

  /**
   * Update device data counts
   */
  updateDataCounts(counts: {
    reflections: number;
    threads: number;
    axes: number;
  }): void {
    const current = this.devices.find(d => d.id === this.currentDeviceId);
    if (current) {
      current.dataCount = counts;
      this.saveDevices();
    }
  }

  /**
   * Update last sync time
   */
  updateLastSync(): void {
    const current = this.devices.find(d => d.id === this.currentDeviceId);
    if (current) {
      current.lastSync = new Date();
      this.saveDevices();
    }
  }

  /**
   * Rename device
   */
  renameDevice(deviceId: string, newName: string): void {
    const device = this.devices.find(d => d.id === deviceId);
    if (device) {
      device.name = newName;
      this.saveDevices();
    }
  }

  /**
   * Remove device from registry
   */
  removeDevice(deviceId: string): void {
    if (deviceId === this.currentDeviceId) {
      throw new Error('Cannot remove current device');
    }

    this.devices = this.devices.filter(d => d.id !== deviceId);
    this.saveDevices();
  }

  /**
   * Get sync status summary
   */
  getSyncStatus(): {
    totalDevices: number;
    lastSync: Date | null;
    inSync: boolean;
    deviceNames: string[];
  } {
    const lastSync = this.devices.reduce((latest, device) => {
      if (!device.lastSync) return latest;
      if (!latest) return device.lastSync;
      return device.lastSync > latest ? device.lastSync : latest;
    }, null as Date | null);

    // Consider in-sync if all devices synced within last hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const inSync = this.devices.every(
      d => !d.lastSync || d.lastSync > hourAgo
    );

    return {
      totalDevices: this.devices.length,
      lastSync,
      inSync,
      deviceNames: this.devices.map(d => d.name),
    };
  }

  /**
   * Get device where reflection exists
   * (Mock implementation - would need actual sync data)
   */
  getReflectionDevices(reflectionId: string): string[] {
    // In a real implementation, this would query sync metadata
    // For now, return current device
    return [this.currentDeviceId];
  }

  /**
   * Clear all devices except current
   */
  clearOtherDevices(): void {
    this.devices = this.devices.filter(d => d.id === this.currentDeviceId);
    this.saveDevices();
  }

  /**
   * Export device registry
   */
  export(): string {
    return JSON.stringify(this.devices, null, 2);
  }
}

// Singleton instance
export const deviceRegistry = new DeviceRegistryService();
