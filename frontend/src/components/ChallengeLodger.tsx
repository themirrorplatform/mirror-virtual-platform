import React, { useState } from 'react';
import {
  AlertTriangle,
  Upload,
  FileText,
  Send,
  CheckCircle,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

/**
 * ChallengeLodger - Challenge Claims
 * 
 * Features:
 * - Lodge challenges against instance registrations
 * - 4 challenge types: false_identity, constitution_violation, malicious_behavior, impersonation
 * - Evidence upload (text, links, files)
 * - Challenge status tracking
 * - Response from challenged party
 * - Community review indicator
 * - Constitutional safeguards
 * 
 * Constitutional Note: Challenges are serious and require evidence.
 * False challenges harm trust in the network. Use responsibly.
 */

type ChallengeType = 'false_identity' | 'constitution_violation' | 'malicious_behavior' | 'impersonation';
type ChallengeStatus = 'pending' | 'under_review' | 'upheld' | 'dismissed' | 'resolved';

interface ChallengeData {
  id?: string;
  targetInstanceId: string;
  targetInstanceName?: string;
  challengeType: ChallengeType;
  description: string;
  evidence: Evidence[];
  status?: ChallengeStatus;
  lodgedAt?: string;
  reviewers?: number;
  response?: string;
}

interface Evidence {
  id: string;
  type: 'text' | 'link' | 'file';
  content: string;
  filename?: string;
}

interface ChallengeLodgerProps {
  targetInstanceId: string;
  targetInstanceName?: string;
  existingChallenge?: ChallengeData;
  onSubmit: (challenge: ChallengeData) => Promise<void>;
  onCancel?: () => void;
}

const challengeTypeConfig: Record<ChallengeType, { color: string; label: string; desc: string; examples: string[] }> = {
  false_identity: {
    color: 'bg-red-100 text-red-700 border-red-300',
    label: 'False Identity',
    desc: 'This instance is misrepresenting who they are',
    examples: [
      'Claiming to be someone else',
      'Using stolen identity information',
      'Impersonating a real person without disclosure'
    ]
  },
  constitution_violation: {
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    label: 'Constitution Violation',
    desc: 'This instance is violating Mirror\'s constitutional principles',
    examples: [
      'Hiding asymmetry in doors/cards',
      'Coercing other instances',
      'Surveillance without disclosure',
      'Hierarchical power structures'
    ]
  },
  malicious_behavior: {
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    label: 'Malicious Behavior',
    desc: 'This instance is causing harm to others or the network',
    examples: [
      'Spam or flooding',
      'Harassment of other instances',
      'Attempting to compromise security',
      'Coordinated manipulation'
    ]
  },
  impersonation: {
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    label: 'Impersonation',
    desc: 'This instance is pretending to be another known instance',
    examples: [
      'Using similar instance name to confuse',
      'Claiming association with another instance',
      'Copying another instance\'s identity markers'
    ]
  }
};

const statusConfig: Record<ChallengeStatus, { color: string; label: string }> = {
  pending: { color: 'bg-gray-600 text-white', label: 'Pending Review' },
  under_review: { color: 'bg-blue-600 text-white', label: 'Under Review' },
  upheld: { color: 'bg-red-600 text-white', label: 'Challenge Upheld' },
  dismissed: { color: 'bg-green-600 text-white', label: 'Challenge Dismissed' },
  resolved: { color: 'bg-purple-600 text-white', label: 'Resolved' }
};

export function ChallengeLodger({
  targetInstanceId,
  targetInstanceName,
  existingChallenge,
  onSubmit,
  onCancel
}: ChallengeLodgerProps) {
  const [selectedType, setSelectedType] = useState<ChallengeType | null>(
    existingChallenge?.challengeType || null
  );
  const [description, setDescription] = useState(existingChallenge?.description || '');
  const [evidence, setEvidence] = useState<Evidence[]>(existingChallenge?.evidence || []);
  const [newEvidenceText, setNewEvidenceText] = useState('');
  const [newEvidenceLink, setNewEvidenceLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false);

  const addTextEvidence = () => {
    if (newEvidenceText.trim()) {
      setEvidence([...evidence, {
        id: `ev_${Date.now()}`,
        type: 'text',
        content: newEvidenceText.trim()
      }]);
      setNewEvidenceText('');
    }
  };

  const addLinkEvidence = () => {
    if (newEvidenceLink.trim()) {
      setEvidence([...evidence, {
        id: `ev_${Date.now()}`,
        type: 'link',
        content: newEvidenceLink.trim()
      }]);
      setNewEvidenceLink('');
    }
  };

  const removeEvidence = (id: string) => {
    setEvidence(evidence.filter(e => e.id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedType || !description.trim() || evidence.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        targetInstanceId,
        targetInstanceName,
        challengeType: selectedType,
        description: description.trim(),
        evidence
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onCancel?.();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit challenge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = selectedType && description.trim() && evidence.length > 0 && acknowledgedWarning && !isSubmitting;

  // View existing challenge
  if (existingChallenge && existingChallenge.status) {
    const statusConf = statusConfig[existingChallenge.status];
    const typeConf = challengeTypeConfig[existingChallenge.challengeType];

    return (
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Challenge Lodged
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Against {targetInstanceName || targetInstanceId}
              </p>
            </div>
            <Badge className={`${statusConf.color} border-0`}>
              {statusConf.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Challenge Type */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Challenge Type</p>
            <Badge className={`${typeConf.color} border`}>
              {typeConf.label}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
            <p className="text-sm text-gray-600">{existingChallenge.description}</p>
          </div>

          {/* Evidence */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Evidence ({existingChallenge.evidence.length})</p>
            <div className="space-y-2">
              {existingChallenge.evidence.map(ev => (
                <div key={ev.id} className="p-2 bg-gray-50 rounded border border-gray-200">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 capitalize mb-1">{ev.type}</p>
                      <p className="text-sm text-gray-900 break-words">{ev.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Info */}
          {existingChallenge.lodgedAt && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Lodged on</p>
              <p className="text-sm text-blue-900">{new Date(existingChallenge.lodgedAt).toLocaleString()}</p>
              {existingChallenge.reviewers !== undefined && (
                <p className="text-xs text-blue-600 mt-2">
                  {existingChallenge.reviewers} community reviewer{existingChallenge.reviewers !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Response */}
          {existingChallenge.response && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Response from Instance</p>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-900">{existingChallenge.response}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Lodge new challenge
  return (
    <Card className="border-2 border-orange-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Lodge Challenge
        </CardTitle>
        <p className="text-sm text-gray-500">
          Against {targetInstanceName || targetInstanceId}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning */}
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-900">Important: Challenge Responsibility</p>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>Challenges are public and part of your instance's reputation</li>
                <li>False or malicious challenges harm network trust</li>
                <li>You must provide evidence to support your claim</li>
                <li>The challenged instance has the right to respond</li>
              </ul>
              <label className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={acknowledgedWarning}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAcknowledgedWarning(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <span className="text-sm text-red-900">I understand and will use this responsibly</span>
              </label>
            </div>
          </div>
        </div>

        {/* Challenge Type Selection */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Challenge Type</p>
          <div className="grid md:grid-cols-2 gap-3">
            {(Object.keys(challengeTypeConfig) as ChallengeType[]).map(type => {
              const config = challengeTypeConfig[type];
              const isSelected = selectedType === type;

              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  disabled={!acknowledgedWarning}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? config.color + ' shadow-md'
                      : 'border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <p className="font-medium text-sm mb-1">{config.label}</p>
                  <p className="text-xs opacity-75">{config.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Examples */}
          {selectedType && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-700 mb-2">Examples of this challenge type:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {challengeTypeConfig[selectedType].examples.map((example, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Detailed Description <span className="text-red-600">*</span>
          </label>
          <Textarea
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Provide a detailed explanation of why you are lodging this challenge..."
            rows={4}
            disabled={!selectedType || !acknowledgedWarning}
            className="resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length} characters • Be specific and factual
          </p>
        </div>

        {/* Evidence */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Evidence <span className="text-red-600">* (at least 1 required)</span>
          </p>

          {/* Existing Evidence */}
          {evidence.length > 0 && (
            <div className="space-y-2 mb-3">
              {evidence.map(ev => (
                <div key={ev.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 capitalize mb-1">{ev.type}</p>
                      <p className="text-sm text-gray-900 break-words">{ev.content}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeEvidence(ev.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Text Evidence */}
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Text Evidence</label>
              <div className="flex gap-2">
                <Textarea
                  value={newEvidenceText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewEvidenceText(e.target.value)}
                  placeholder="Paste relevant text, quotes, or observations..."
                  rows={2}
                  disabled={!selectedType || !acknowledgedWarning}
                  className="resize-none flex-1"
                />
                <Button
                  onClick={addTextEvidence}
                  disabled={!newEvidenceText.trim() || !selectedType || !acknowledgedWarning}
                  variant="outline"
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Add Link Evidence */}
            <div>
              <label className="text-xs text-gray-600 block mb-1">Link Evidence</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newEvidenceLink}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewEvidenceLink(e.target.value)}
                  placeholder="https://example.com/evidence"
                  disabled={!selectedType || !acknowledgedWarning}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                />
                <Button
                  onClick={addLinkEvidence}
                  disabled={!newEvidenceLink.trim() || !selectedType || !acknowledgedWarning}
                  variant="outline"
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 flex gap-3">
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : showSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Challenge Lodged
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Lodge Challenge
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Usage Example:
 * 
 * // Lodge new challenge
 * <ChallengeLodger
 *   targetInstanceId="inst_malicious_123"
 *   targetInstanceName="suspicious.mirror"
 *   onSubmit={async (challenge) => {
 *     console.log('Submitting challenge:', challenge);
 *     await api.lodgeChallenge(challenge);
 *   }}
 *   onCancel={() => console.log('Cancelled')}
 * />
 * 
 * // View existing challenge
 * <ChallengeLodger
 *   targetInstanceId="inst_123"
 *   targetInstanceName="example.mirror"
 *   existingChallenge={{
 *     id: 'chal_456',
 *     targetInstanceId: 'inst_123',
 *     targetInstanceName: 'example.mirror',
 *     challengeType: 'constitution_violation',
 *     description: 'This instance is hiding asymmetry in their doors',
 *     evidence: [
 *       { id: 'ev_1', type: 'text', content: 'Door showed no exit friction but users reported being locked in' },
 *       { id: 'ev_2', type: 'link', content: 'https://example.com/complaint' }
 *     ],
 *     status: 'under_review',
 *     lodgedAt: '2024-01-15T10:00:00Z',
 *     reviewers: 5,
 *     response: 'We have updated our door transparency metrics'
 *   }}
 *   onSubmit={async () => {}}
 * />
 */


