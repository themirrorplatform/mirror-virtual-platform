import React, { useState, useRef } from 'react';
import {
  User,
  Mail,
  Lock,
  Image,
  X,
  Upload,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Save,
  Camera,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';

/**
 * ProfileEditor - User Profile Settings
 * 
 * Features:
 * - Edit display name, username, bio
 * - Upload/crop avatar and banner images
 * - Email and password management
 * - Role badge display (Witness/Guide)
 * - Privacy settings
 * - Profile visibility controls
 * - Image preview and cropping
 * - Validation and error handling
 * - Save confirmation
 * 
 * Constitutional Note: Users have full control over their identity presentation.
 * All changes are user-initiated and transparent.
 */

type UserRole = 'user' | 'witness' | 'guide' | 'guardian';

interface ProfileData {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  role: UserRole;
  profileVisibility: 'public' | 'circle' | 'private';
  emailVisible: boolean;
}

interface ProfileEditorProps {
  profile: ProfileData;
  onSave?: (updates: Partial<ProfileData>) => Promise<void>;
  onChangePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
  onUploadImage?: (file: File, type: 'avatar' | 'banner') => Promise<string>;
  onDeleteImage?: (type: 'avatar' | 'banner') => Promise<void>;
}

const roleConfig: Record<UserRole, { label: string; color: string; description: string }> = {
  user: { label: 'User', color: 'bg-gray-100 text-gray-700', description: 'Regular member' },
  witness: { label: 'Witness', color: 'bg-blue-100 text-blue-700', description: 'Constitutional witness' },
  guide: { label: 'Guide', color: 'bg-purple-100 text-purple-700', description: 'Human guide providing mirrorbacks' },
  guardian: { label: 'Guardian', color: 'bg-green-100 text-green-700', description: 'Constitutional guardian' }
};

export function ProfileEditor({
  profile,
  onSave,
  onChangePassword,
  onUploadImage,
  onDeleteImage
}: ProfileEditorProps) {
  const [formData, setFormData] = useState<ProfileData>(profile);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(profile.banner || null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Validation
  const validateUsername = (username: string): string | null => {
    if (!username || username.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Username can only contain letters, numbers, _ and -';
    return null;
  };

  const validateDisplayName = (name: string): string | null => {
    if (!name || name.length < 2) return 'Display name must be at least 2 characters';
    if (name.length > 50) return 'Display name must be less than 50 characters';
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
    return null;
  };

  const validateBio = (bio: string): string | null => {
    if (bio && bio.length > 500) return 'Bio must be less than 500 characters';
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain a number';
    return null;
  };

  // Handle field changes
  const handleChange = (field: keyof ProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors(prev => ({ ...prev, [field]: '' }));
    setSaved(false);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        if (type === 'avatar') {
          setAvatarPreview(preview);
        } else {
          setBannerPreview(preview);
        }
      };
      reader.readAsDataURL(file);

      // Upload
      if (onUploadImage) {
        const url = await onUploadImage(file, type);
        handleChange(type, url);
      }
    } catch (err) {
      setError(`Failed to upload ${type}: ${err}`);
    }
  };

  // Handle image delete
  const handleImageDelete = async (type: 'avatar' | 'banner') => {
    try {
      if (onDeleteImage) {
        await onDeleteImage(type);
      }
      if (type === 'avatar') {
        setAvatarPreview(null);
        handleChange('avatar', undefined);
      } else {
        setBannerPreview(null);
        handleChange('banner', undefined);
      }
    } catch (err) {
      setError(`Failed to delete ${type}: ${err}`);
    }
  };

  // Handle save
  const handleSave = async () => {
    // Validate all fields
    const errors: Record<string, string> = {};
    
    const usernameError = validateUsername(formData.username);
    if (usernameError) errors.username = usernameError;

    const displayNameError = validateDisplayName(formData.displayName);
    if (displayNameError) errors.displayName = displayNameError;

    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    const bioError = validateBio(formData.bio || '');
    if (bioError) errors.bio = bioError;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (onSave) {
        // Get changed fields
        const changes: Partial<ProfileData> = {};
        Object.keys(formData).forEach(key => {
          if (formData[key as keyof ProfileData] !== profile[key as keyof ProfileData]) {
            changes[key as keyof ProfileData] = formData[key as keyof ProfileData];
          }
        });

        await onSave(changes);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError(`Failed to save profile: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (onChangePassword) {
        await onChangePassword(currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError(`Failed to change password: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(profile);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Banner */}
      <Card>
        <div className="relative h-48 bg-gradient-to-br from-purple-400 to-blue-500 rounded-t-lg overflow-hidden">
          {bannerPreview && (
            <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
            <Button
              onClick={() => bannerInputRef.current?.click()}
              className="bg-white text-gray-900 hover:bg-gray-100"
              size="sm"
            >
              <Camera className="h-4 w-4 mr-2" />
              Upload Banner
            </Button>
            {bannerPreview && (
              <Button
                onClick={() => handleImageDelete('banner')}
                className="bg-red-600 text-white hover:bg-red-700"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'banner')}
            className="hidden"
          />
        </div>

        {/* Avatar */}
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="relative -mt-20">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  onClick={() => avatarInputRef.current?.click()}
                  className="bg-white text-gray-900 hover:bg-gray-100"
                  size="sm"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'avatar')}
                className="hidden"
              />
            </div>

            <div className="flex-1 pt-12">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-semibold">{formData.displayName}</h2>
                <Badge className={roleConfig[formData.role].color}>
                  {roleConfig[formData.role].label}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">@{formData.username}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Basic Information</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <Input
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="your_username"
            />
            {validationErrors.username && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.username}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Your unique identifier. Letters, numbers, _ and - only.
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <Input
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              placeholder="Your Name"
            />
            {validationErrors.displayName && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.displayName}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Tell others about yourself..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex items-center justify-between mt-1">
              {validationErrors.bio ? (
                <p className="text-xs text-red-600">{validationErrors.bio}</p>
              ) : (
                <p className="text-xs text-gray-500">
                  Share a bit about yourself (optional)
                </p>
              )}
              <p className="text-xs text-gray-500">
                {formData.bio?.length || 0}/500
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Account Settings</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="you@example.com"
            />
            {validationErrors.email && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Email Visibility */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Show email on profile</p>
              <p className="text-xs text-gray-500">Let others see your email address</p>
            </div>
            <Button
              onClick={() => handleChange('emailVisible', !formData.emailVisible)}
              variant={formData.emailVisible ? 'default' : 'outline'}
              size="sm"
            >
              {formData.emailVisible ? 'Visible' : 'Hidden'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Privacy Settings</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Visibility */}
          <div>
            <label className="block text-sm font-medium mb-2">Profile Visibility</label>
            <div className="grid grid-cols-3 gap-2">
              {(['public', 'circle', 'private'] as const).map(visibility => (
                <button
                  key={visibility}
                  onClick={() => handleChange('profileVisibility', visibility)}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.profileVisibility === visibility
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.profileVisibility === 'public' && 'Anyone can see your profile'}
              {formData.profileVisibility === 'circle' && 'Only your circle can see your profile'}
              {formData.profileVisibility === 'private' && 'Only you can see your profile'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      {onChangePassword && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Change Password</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be 8+ characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              {saving ? 'Changing...' : 'Change Password'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg sticky bottom-0">
        <p className="text-sm text-gray-600">
          {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
        </p>
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {saving ? (
            'Saving...'
          ) : saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Constitutional Note */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-900">
          <strong>Your Identity, Your Control:</strong> All profile changes are user-initiated and transparent.
          Your data belongs to you. You can export or delete your account at any time.
        </p>
      </div>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <ProfileEditor
 *   profile={{
 *     userId: 'user_123',
 *     username: 'alice_mirror',
 *     displayName: 'Alice',
 *     email: 'alice@example.com',
 *     bio: 'Exploring tensions, finding clarity.',
 *     avatar: '/avatars/alice.jpg',
 *     banner: '/banners/alice.jpg',
 *     role: 'user',
 *     profileVisibility: 'public',
 *     emailVisible: false
 *   }}
 *   onSave={async (updates) => {
 *     console.log('Saving:', updates);
 *     await api.updateProfile(updates);
 *   }}
 *   onChangePassword={async (current, newPass) => {
 *     await api.changePassword(current, newPass);
 *   }}
 *   onUploadImage={async (file, type) => {
 *     const url = await api.uploadImage(file, type);
 *     return url;
 *   }}
 *   onDeleteImage={async (type) => {
 *     await api.deleteImage(type);
 *   }}
 * />
 */
