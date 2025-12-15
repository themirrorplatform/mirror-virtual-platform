import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Lock,
  Eye,
  Download,
  Trash2,
  Shield,
  Globe,
  Users,
  Moon,
  Sun,
  Laptop,
  Mail,
  MessageSquare,
  AlertCircle,
  Check,
  X,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * UserSettings - Comprehensive Settings Interface
 * 
 * Features:
 * - Account settings (email, password, 2FA)
 * - Privacy controls (profile visibility, data collection)
 * - Notification preferences (email, push, in-app)
 * - Appearance settings (theme, font size)
 * - Data management (export, delete account)
 * - Federation settings (instance connections)
 * - Security settings (sessions, devices)
 * - Constitutional transparency
 * 
 * Constitutional Note: All settings are user-controlled.
 * Data export and deletion are always available.
 */

type Theme = 'light' | 'dark' | 'system';
type NotificationFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'never';

interface UserSettingsData {
  // Account
  email: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;

  // Privacy
  profileVisibility: 'public' | 'circle' | 'private';
  showEmail: boolean;
  showActivity: boolean;
  allowDiscovery: boolean;
  dataCollection: boolean;

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationFrequency: NotificationFrequency;
  notifyOnReply: boolean;
  notifyOnMention: boolean;
  notifyOnMirrorback: boolean;

  // Appearance
  theme: Theme;
  fontSize: 'small' | 'medium' | 'large';
  reduceMotion: boolean;

  // Federation
  federationEnabled: boolean;
  autoAcceptConnections: boolean;
}

interface UserSettingsProps {
  settings: UserSettingsData;
  onUpdate?: (updates: Partial<UserSettingsData>) => Promise<void>;
  onExportData?: () => Promise<void>;
  onDeleteAccount?: () => Promise<void>;
  onEnable2FA?: () => Promise<void>;
  onDisable2FA?: () => Promise<void>;
}

export function UserSettings({
  settings: initialSettings,
  onUpdate,
  onExportData,
  onDeleteAccount,
  onEnable2FA,
  onDisable2FA
}: UserSettingsProps) {
  const [settings, setSettings] = useState<UserSettingsData>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdate = async (updates: Partial<UserSettingsData>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setSaving(true);
    setSaved(false);

    try {
      if (onUpdate) {
        await onUpdate(updates);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      if (onExportData) {
        await onExportData();
      }
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (onDeleteAccount) {
        await onDeleteAccount();
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  const handle2FA = async () => {
    try {
      if (settings.twoFactorEnabled) {
        if (onDisable2FA) await onDisable2FA();
        handleUpdate({ twoFactorEnabled: false });
      } else {
        if (onEnable2FA) await onEnable2FA();
        handleUpdate({ twoFactorEnabled: true });
      }
    } catch (err) {
      console.error('Failed to toggle 2FA:', err);
    }
  };

  const sections = [
    {
      id: 'account',
      title: 'Account',
      icon: Settings,
      description: 'Email, password, and authentication'
    },
    {
      id: 'privacy',
      title: 'Privacy',
      icon: Shield,
      description: 'Control what others can see'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Manage how you stay updated'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: Eye,
      description: 'Theme and display preferences'
    },
    {
      id: 'data',
      title: 'Data & Privacy',
      icon: Download,
      description: 'Export or delete your data'
    },
    {
      id: 'federation',
      title: 'Federation',
      icon: Globe,
      description: 'Manage instance connections'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your account and preferences</p>
        </div>
        {saved && (
          <Badge className="bg-green-100 text-green-700 border-0">
            <Check className="h-3 w-3 mr-1" />
            Saved
          </Badge>
        )}
      </div>

      {/* Navigation */}
      <div className="grid md:grid-cols-3 gap-4">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                activeSection === section.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className={`h-5 w-5 ${activeSection === section.id ? 'text-purple-600' : 'text-gray-600'}`} />
                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${
                  activeSection === section.id ? 'rotate-90' : ''
                }`} />
              </div>
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{section.description}</p>
            </button>
          );
        })}
      </div>

      {/* Account Settings */}
      {activeSection === 'account' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Account Settings</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">{settings.email}</p>
                  <p className="text-xs text-gray-500">
                    {settings.emailVerified ? (
                      <span className="text-green-600">✓ Verified</span>
                    ) : (
                      <span className="text-yellow-600">⚠ Not verified</span>
                    )}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">Change</Button>
            </div>

            {/* 2FA */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500">Add an extra layer of security</p>
                </div>
              </div>
              <Button
                onClick={handle2FA}
                variant={settings.twoFactorEnabled ? 'default' : 'outline'}
                size="sm"
                className={settings.twoFactorEnabled ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {settings.twoFactorEnabled ? 'Enabled' : 'Enable'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Settings */}
      {activeSection === 'privacy' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Privacy Settings</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Visibility */}
            <div>
              <label className="block font-medium mb-2">Profile Visibility</label>
              <div className="grid grid-cols-3 gap-2">
                {(['public', 'circle', 'private'] as const).map(visibility => (
                  <button
                    key={visibility}
                    onClick={() => handleUpdate({ profileVisibility: visibility })}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.profileVisibility === visibility
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Show email on profile</p>
                  <p className="text-xs text-gray-500">Let others see your email</p>
                </div>
                <Button
                  onClick={() => handleUpdate({ showEmail: !settings.showEmail })}
                  variant={settings.showEmail ? 'default' : 'outline'}
                  size="sm"
                >
                  {settings.showEmail ? 'Visible' : 'Hidden'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Show activity status</p>
                  <p className="text-xs text-gray-500">Let others see when you're online</p>
                </div>
                <Button
                  onClick={() => handleUpdate({ showActivity: !settings.showActivity })}
                  variant={settings.showActivity ? 'default' : 'outline'}
                  size="sm"
                >
                  {settings.showActivity ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Allow discovery</p>
                  <p className="text-xs text-gray-500">Let others find you in search</p>
                </div>
                <Button
                  onClick={() => handleUpdate({ allowDiscovery: !settings.allowDiscovery })}
                  variant={settings.allowDiscovery ? 'default' : 'outline'}
                  size="sm"
                >
                  {settings.allowDiscovery ? 'Yes' : 'No'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Usage analytics</p>
                  <p className="text-xs text-gray-500">Help improve Mirror (anonymous)</p>
                </div>
                <Button
                  onClick={() => handleUpdate({ dataCollection: !settings.dataCollection })}
                  variant={settings.dataCollection ? 'default' : 'outline'}
                  size="sm"
                >
                  {settings.dataCollection ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      {activeSection === 'notifications' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Notification Settings</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Notification channels */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium">Email notifications</p>
                    <p className="text-xs text-gray-500">Receive updates via email</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleUpdate({ emailNotifications: !settings.emailNotifications })}
                  variant={settings.emailNotifications ? 'default' : 'outline'}
                  size="sm"
                >
                  {settings.emailNotifications ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium">Push notifications</p>
                    <p className="text-xs text-gray-500">Receive browser notifications</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleUpdate({ pushNotifications: !settings.pushNotifications })}
                  variant={settings.pushNotifications ? 'default' : 'outline'}
                  size="sm"
                >
                  {settings.pushNotifications ? 'On' : 'Off'}
                </Button>
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block font-medium mb-2">Notification Frequency</label>
              <select
                value={settings.notificationFrequency}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdate({ notificationFrequency: e.target.value as NotificationFrequency })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="realtime">Real-time</option>
                <option value="hourly">Hourly digest</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
                <option value="never">Never</option>
              </select>
            </div>

            {/* Notification types */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">Notify on replies</p>
                <Button
                  onClick={() => handleUpdate({ notifyOnReply: !settings.notifyOnReply })}
                  variant={settings.notifyOnReply ? 'default' : 'outline'}
                  size="sm"
                >
                  {settings.notifyOnReply ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">Notify on mentions</p>
                <Button
                  onClick={() => handleUpdate({ notifyOnMention: !settings.notifyOnMention })}
                  variant={settings.notifyOnMention ? 'default' : 'outline'}
                  size="sm"
                >
                  {settings.notifyOnMention ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">Notify on mirrorbacks</p>
                <Button
                  onClick={() => handleUpdate({ notifyOnMirrorback: !settings.notifyOnMirrorback })}
                  variant={settings.notifyOnMirrorback ? 'default' : 'outline'}
                  size="sm"
                >
                  {settings.notifyOnMirrorback ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appearance Settings */}
      {activeSection === 'appearance' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Appearance Settings</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Theme */}
            <div>
              <label className="block font-medium mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light' as const, icon: Sun, label: 'Light' },
                  { value: 'dark' as const, icon: Moon, label: 'Dark' },
                  { value: 'system' as const, icon: Laptop, label: 'System' }
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => handleUpdate({ theme: value })}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      settings.theme === value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium text-center">{label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block font-medium mb-2">Font Size</label>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => handleUpdate({ fontSize: size })}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.fontSize === size
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Reduce Motion */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium">Reduce motion</p>
                <p className="text-xs text-gray-500">Minimize animations</p>
              </div>
              <Button
                onClick={() => handleUpdate({ reduceMotion: !settings.reduceMotion })}
                variant={settings.reduceMotion ? 'default' : 'outline'}
                size="sm"
              >
                {settings.reduceMotion ? 'On' : 'Off'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      {activeSection === 'data' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Data & Privacy</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Data */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Export your data</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Download all your reflections, profile data, and settings as JSON
                    </p>
                  </div>
                </div>
                <Button onClick={handleExportData} variant="outline">
                  Export
                </Button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Delete account</p>
                    <p className="text-sm text-red-700 mt-1">
                      Permanently delete your account and all associated data. This cannot be undone.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>

              {/* Delete confirmation */}
              {showDeleteConfirm && (
                <div className="mt-4 p-3 bg-white border border-red-300 rounded-lg">
                  <p className="text-sm text-red-900 font-medium mb-3">
                    Are you absolutely sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      Yes, delete my account
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Federation Settings */}
      {activeSection === 'federation' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Federation Settings</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium">Enable federation</p>
                <p className="text-xs text-gray-500">Connect with other Mirror instances</p>
              </div>
              <Button
                onClick={() => handleUpdate({ federationEnabled: !settings.federationEnabled })}
                variant={settings.federationEnabled ? 'default' : 'outline'}
                size="sm"
              >
                {settings.federationEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium">Auto-accept connections</p>
                <p className="text-xs text-gray-500">Automatically accept connection requests</p>
              </div>
              <Button
                onClick={() => handleUpdate({ autoAcceptConnections: !settings.autoAcceptConnections })}
                variant={settings.autoAcceptConnections ? 'default' : 'outline'}
                size="sm"
                disabled={!settings.federationEnabled}
              >
                {settings.autoAcceptConnections ? 'On' : 'Off'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Constitutional Note */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <strong>Your Rights:</strong> You have full control over your data and settings.
          Export your data anytime, delete your account whenever you choose. No dark patterns,
          no manipulation. Your settings, your choice.
        </div>
      </div>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <UserSettings
 *   settings={{
 *     email: 'alice@example.com',
 *     emailVerified: true,
 *     twoFactorEnabled: false,
 *     profileVisibility: 'public',
 *     showEmail: false,
 *     showActivity: true,
 *     allowDiscovery: true,
 *     dataCollection: false,
 *     emailNotifications: true,
 *     pushNotifications: true,
 *     notificationFrequency: 'realtime',
 *     notifyOnReply: true,
 *     notifyOnMention: true,
 *     notifyOnMirrorback: true,
 *     theme: 'system',
 *     fontSize: 'medium',
 *     reduceMotion: false,
 *     federationEnabled: true,
 *     autoAcceptConnections: false
 *   }}
 *   onUpdate={async (updates) => {
 *     await api.updateSettings(updates);
 *   }}
 *   onExportData={async () => {
 *     const data = await api.exportData();
 *     const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
 *     const url = URL.createObjectURL(blob);
 *     const a = document.createElement('a');
 *     a.href = url;
 *     a.download = 'mirror-data.json';
 *     a.click();
 *   }}
 *   onDeleteAccount={async () => {
 *     await api.deleteAccount();
 *     router.push('/goodbye');
 *   }}
 *   onEnable2FA={async () => {
 *     await api.enable2FA();
 *   }}
 *   onDisable2FA={async () => {
 *     await api.disable2FA();
 *   }}
 * />
 */


