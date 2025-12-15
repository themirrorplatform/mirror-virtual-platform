import React, { useState } from 'react';
import {
  Globe,
  Lock,
  Users,
  Info,
  Tag,
  FileText,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';

/**
 * CommonsPublisher - Publish Reflections to Public Commons
 * 
 * Features:
 * - Multi-step publishing wizard
 * - Visibility controls (public/unlisted/instance-only)
 * - License selection (CC BY, CC BY-SA, CC0, All Rights Reserved)
 * - Attestation opt-in
 * - Preview before publish
 * - Content warnings system
 * 
 * Constitutional Note: You control what you share and how it's shared.
 * The commons is opt-in, and you can always unpublish.
 */

export type Visibility = 'public' | 'unlisted' | 'instance_only';
export type LicenseType = 'cc_by' | 'cc_by_sa' | 'cc0' | 'all_rights_reserved';

interface Reflection {
  id: string;
  content: string;
  createdAt: string;
  lensTags: string[];
}

interface ContentWarning {
  type: string;
  checked: boolean;
}

interface CommonsPublishData {
  visibility: Visibility;
  license: LicenseType;
  allowAttestation: boolean;
  contentWarnings: string[];
  customTags: string[];
}

interface CommonsPublisherProps {
  reflection: Reflection;
  onPublish: (data: CommonsPublishData) => void;
  onCancel: () => void;
}

// License metadata
const LICENSES: Record<LicenseType, { label: string; description: string; icon: typeof FileText }> = {
  cc_by: {
    label: 'CC BY 4.0',
    description: 'Others can share/adapt with attribution',
    icon: Users
  },
  cc_by_sa: {
    label: 'CC BY-SA 4.0',
    description: 'Others can share/adapt with attribution, derivatives must use same license',
    icon: Users
  },
  cc0: {
    label: 'CC0 (Public Domain)',
    description: 'No copyright reserved, anyone can use freely',
    icon: Globe
  },
  all_rights_reserved: {
    label: 'All Rights Reserved',
    description: 'Traditional copyright, permission required for reuse',
    icon: Lock
  }
};

// Visibility metadata
const VISIBILITY_OPTIONS: Record<Visibility, { label: string; description: string; icon: typeof Globe }> = {
  public: {
    label: 'Public',
    description: 'Visible in commons search, discoverable by all instances',
    icon: Globe
  },
  unlisted: {
    label: 'Unlisted',
    description: 'Only accessible via direct link, not in search',
    icon: EyeOff
  },
  instance_only: {
    label: 'Instance Only',
    description: 'Only visible to users on your Mirror instance',
    icon: Lock
  }
};

// Common content warnings
const CONTENT_WARNING_OPTIONS = [
  'Mental health topics',
  'Trauma/PTSD',
  'Self-harm discussion',
  'Substance use',
  'Political content',
  'Religious content',
  'Grief/loss',
  'None needed'
];

export function CommonsPublisher({
  reflection,
  onPublish,
  onCancel
}: CommonsPublisherProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [license, setLicense] = useState<LicenseType>('cc_by');
  const [allowAttestation, setAllowAttestation] = useState(true);
  const [contentWarnings, setContentWarnings] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string>('');
  const [customWarning, setCustomWarning] = useState('');

  const toggleContentWarning = (warning: string) => {
    if (warning === 'None needed') {
      setContentWarnings([]);
    } else {
      setContentWarnings((prev) =>
        prev.includes(warning) ? prev.filter((w) => w !== warning) : [...prev, warning]
      );
    }
  };

  const handlePublish = () => {
    const tags = customTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onPublish({
      visibility,
      license,
      allowAttestation,
      contentWarnings,
      customTags: tags
    });
  };

  const canProceedToStep2 = true; // Visibility and license are always selected
  const canProceedToStep3 = true; // Content warnings are optional
  const canPublish = true; // All fields are optional or have defaults

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="h-7 w-7 text-blue-600" />
          Publish to Commons
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Share this reflection with the Mirror network
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`flex-1 h-2 rounded-full ${
                s <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between text-sm">
        <span className={step === 1 ? 'font-medium text-blue-600' : 'text-gray-500'}>
          Visibility & License
        </span>
        <span className={step === 2 ? 'font-medium text-blue-600' : 'text-gray-500'}>
          Content & Tags
        </span>
        <span className={step === 3 ? 'font-medium text-blue-600' : 'text-gray-500'}>
          Review & Publish
        </span>
      </div>

      {/* Step 1: Visibility & License */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Visibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={visibility} onValueChange={(v: string) => setVisibility(v as Visibility)}>
                <div className="space-y-3">
                  {Object.entries(VISIBILITY_OPTIONS).map(([key, option]) => {
                    const Icon = option.icon;
                    return (
                      <div key={key} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value={key} id={`visibility-${key}`} />
                        <Label htmlFor={`visibility-${key}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4 text-gray-600" />
                            <span className="font-medium">{option.label}</span>
                          </div>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* License */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                License
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={license} onValueChange={(l: string) => setLicense(l as LicenseType)}>
                <div className="space-y-3">
                  {Object.entries(LICENSES).map(([key, licenseData]) => {
                    const Icon = licenseData.icon;
                    return (
                      <div key={key} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value={key} id={`license-${key}`} />
                        <Label htmlFor={`license-${key}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4 text-gray-600" />
                            <span className="font-medium">{licenseData.label}</span>
                          </div>
                          <p className="text-sm text-gray-600">{licenseData.description}</p>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => setStep(2)} disabled={!canProceedToStep2}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Content & Tags */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Content Warnings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Content Warnings (Optional)
              </CardTitle>
              <p className="text-sm text-gray-500">
                Help others decide if they're ready to engage with this content
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {CONTENT_WARNING_OPTIONS.map((warning) => (
                <div key={warning} className="flex items-center space-x-2">
                  <Checkbox
                    id={`warning-${warning}`}
                    checked={warning === 'None needed' ? contentWarnings.length === 0 : contentWarnings.includes(warning)}
                    onCheckedChange={() => toggleContentWarning(warning)}
                  />
                  <Label
                    htmlFor={`warning-${warning}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {warning}
                  </Label>
                </div>
              ))}
              
              {/* Custom Warning */}
              <div className="pt-2">
                <Label htmlFor="custom-warning" className="text-sm">Custom Warning</Label>
                <input
                  id="custom-warning"
                  type="text"
                  value={customWarning}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCustomWarning(e.target.value)}
                  placeholder="e.g., Discussion of workplace stress"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customWarning.trim()) {
                      setContentWarnings([...contentWarnings, customWarning.trim()]);
                      setCustomWarning('');
                    }
                  }}
                />
              </div>

              {contentWarnings.length > 0 && contentWarnings.length < CONTENT_WARNING_OPTIONS.length && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {contentWarnings.map((warning) => (
                    <Badge key={warning} variant="outline" className="flex items-center gap-1">
                      {warning}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-600" />
                Additional Tags (Optional)
              </CardTitle>
              <p className="text-sm text-gray-500">
                Already tagged: {reflection.lensTags.join(', ')}
              </p>
            </CardHeader>
            <CardContent>
              <Label htmlFor="custom-tags" className="text-sm">Add custom tags (comma-separated)</Label>
              <input
                id="custom-tags"
                type="text"
                value={customTags}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCustomTags(e.target.value)}
                placeholder="e.g., personal-growth, relationships, work"
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </CardContent>
          </Card>

          {/* Attestation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Quality Attestation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="allow-attestation"
                  checked={allowAttestation}
                  onCheckedChange={(checked: boolean) => setAllowAttestation(checked as boolean)}
                />
                <Label htmlFor="allow-attestation" className="cursor-pointer">
                  <span className="font-medium">Allow others to attest to this reflection</span>
                  <p className="text-sm text-gray-600 mt-1">
                    Other users can signal that this reflection is thoughtful, helpful, or resonant
                  </p>
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedToStep3}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Publish */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {reflection.content.substring(0, 300)}
                  {reflection.content.length > 300 && '...'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Visibility</p>
                  <Badge>{VISIBILITY_OPTIONS[visibility].label}</Badge>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">License</p>
                  <Badge>{LICENSES[license].label}</Badge>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Attestation</p>
                  <Badge>{allowAttestation ? 'Enabled' : 'Disabled'}</Badge>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Content Warnings</p>
                  <Badge>{contentWarnings.length || 'None'}</Badge>
                </div>
              </div>

              {contentWarnings.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Content Warnings:</p>
                  <div className="flex flex-wrap gap-2">
                    {contentWarnings.map((warning) => (
                      <Badge key={warning} variant="outline" className="bg-amber-50">
                        {warning}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {reflection.lensTags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  {customTags.split(',').map((tag) => {
                    const trimmed = tag.trim();
                    return trimmed ? (
                      <Badge key={trimmed} variant="outline" className="bg-blue-50">
                        {trimmed}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Constitutional Note */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-purple-900">
                  <strong>You're in control:</strong> You can unpublish this reflection at any time. 
                  Copies made by others under permissive licenses will remain, but your original will 
                  be removed from the commons. Publishing is opt-in, always.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={!canPublish}>
                <Globe className="h-4 w-4 mr-2" />
                Publish to Commons
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <CommonsPublisher
 *   reflection={{
 *     id: 'refl_123',
 *     content: 'Today I realized...',
 *     createdAt: '2024-01-15T10:00:00Z',
 *     lensTags: ['personal-growth', 'relationships']
 *   }}
 *   onPublish={(data) => console.log('Publishing:', data)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 */



