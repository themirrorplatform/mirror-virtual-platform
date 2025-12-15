import React, { useState } from 'react';
import {
  Shield,
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

/**
 * VerificationCard - Signature Display
 * 
 * Features:
 * - Display verification from another instance
 * - Verifier instance information
 * - Cryptographic signature display
 * - Trust chain degrees (separation from you)
 * - Verification timestamp
 * - Copy signature to clipboard
 * - View verifier instance profile
 * - Verification method indicator
 * 
 * Constitutional Note: Verification is peer-based trust, not authority.
 * Each instance verifies independently based on their own criteria.
 */

interface VerificationData {
  id: string;
  verifierInstanceId: string;
  verifierName: string;
  verifierUrl?: string;
  signature: string;
  verificationMethod: 'genesis_hash' | 'constitution_match' | 'peer_attestation' | 'fork_lineage';
  timestamp: string;
  trustChainDegrees: number; // degrees of separation from you
  notes?: string;
  constitutionVersion?: string;
}

interface VerificationCardProps {
  verification: VerificationData;
  variant?: 'default' | 'compact' | 'detailed';
  onViewVerifier?: (instanceId: string) => void;
  onCopySignature?: (signature: string) => void;
}

const methodConfig = {
  genesis_hash: { color: 'bg-blue-100 text-blue-700', label: 'Genesis Hash', desc: 'Verified genesis block match' },
  constitution_match: { color: 'bg-purple-100 text-purple-700', label: 'Constitution', desc: 'Constitution version verified' },
  peer_attestation: { color: 'bg-emerald-100 text-emerald-700', label: 'Peer Attestation', desc: 'Attested by trusted peers' },
  fork_lineage: { color: 'bg-amber-100 text-amber-700', label: 'Fork Lineage', desc: 'Valid fork from known parent' }
};

const getTrustChainColor = (degrees: number): string => {
  if (degrees === 0) return 'text-emerald-600 bg-emerald-50';
  if (degrees === 1) return 'text-blue-600 bg-blue-50';
  if (degrees === 2) return 'text-purple-600 bg-purple-50';
  return 'text-gray-600 bg-gray-50';
};

const getTrustChainLabel = (degrees: number): string => {
  if (degrees === 0) return 'Direct Connection';
  if (degrees === 1) return '1 Degree Removed';
  if (degrees === 2) return '2 Degrees Removed';
  return `${degrees} Degrees Removed`;
};

export function VerificationCard({
  verification,
  variant = 'default',
  onViewVerifier,
  onCopySignature
}: VerificationCardProps) {
  const [copiedSignature, setCopiedSignature] = useState(false);

  const methodConf = methodConfig[verification.verificationMethod];
  const truncatedSignature = `${verification.signature.slice(0, 16)}...${verification.signature.slice(-16)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(verification.signature);
    setCopiedSignature(true);
    onCopySignature?.(verification.signature);
    setTimeout(() => setCopiedSignature(false), 2000);
  };

  const extractHostname = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-900">
            Verified by {verification.verifierName}
          </span>
          <Badge className={`${getTrustChainColor(verification.trustChainDegrees)} border-0 text-xs`}>
            {getTrustChainLabel(verification.trustChainDegrees)}
          </Badge>
        </div>
        {onViewVerifier && (
          <button
            onClick={() => onViewVerifier(verification.verifierInstanceId)}
            className="text-sm text-green-700 hover:text-green-900 transition-colors"
          >
            View
          </button>
        )}
      </div>
    );
  }

  // Default variant
  if (variant === 'default') {
    return (
      <Card className="border-2 border-green-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{verification.verifierName}</p>
                  {verification.verifierUrl && (
                    <p className="text-xs text-gray-500">{extractHostname(verification.verifierUrl)}</p>
                  )}
                </div>
              </div>
              <Badge className={`${methodConf.color} border-0`}>
                {methodConf.label}
              </Badge>
            </div>

            {/* Trust Chain */}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <Badge className={`${getTrustChainColor(verification.trustChainDegrees)} border-0`}>
                {getTrustChainLabel(verification.trustChainDegrees)}
              </Badge>
            </div>

            {/* Signature */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Signature</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-gray-900 truncate">{truncatedSignature}</code>
                <button
                  onClick={copyToClipboard}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copy full signature"
                >
                  {copiedSignature ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Verified {new Date(verification.timestamp).toLocaleString()}</span>
            </div>

            {/* View Verifier */}
            {onViewVerifier && (
              <button
                onClick={() => onViewVerifier(verification.verifierInstanceId)}
                className="w-full py-2 text-sm text-green-700 hover:text-green-900 font-medium transition-colors flex items-center justify-center gap-2"
              >
                View Verifier Instance
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed variant
  return (
    <Card className="border-2 border-green-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Verification from {verification.verifierName}</CardTitle>
              {verification.verifierUrl && (
                <p className="text-sm text-gray-500 mt-1">{verification.verifierUrl}</p>
              )}
            </div>
          </div>
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Verification Method */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Verification Method</p>
          <div className="p-3 bg-gray-50 rounded-lg">
            <Badge className={`${methodConf.color} border-0 mb-2`}>
              {methodConf.label}
            </Badge>
            <p className="text-sm text-gray-600">{methodConf.desc}</p>
          </div>
        </div>

        {/* Trust Chain */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Trust Chain</p>
          <div className={`p-3 rounded-lg ${getTrustChainColor(verification.trustChainDegrees)} border`}>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4" />
              <p className="text-sm font-medium">{getTrustChainLabel(verification.trustChainDegrees)}</p>
            </div>
            <p className="text-xs opacity-75">
              {verification.trustChainDegrees === 0 && "You have directly connected to this instance"}
              {verification.trustChainDegrees === 1 && "This instance is verified by someone you trust"}
              {verification.trustChainDegrees === 2 && "This instance is 2 steps removed from your trust network"}
              {verification.trustChainDegrees > 2 && "This instance is outside your immediate trust network"}
            </p>
          </div>
        </div>

        {/* Constitution Version */}
        {verification.constitutionVersion && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Constitution Version</p>
            <p className="text-sm text-gray-900">{verification.constitutionVersion}</p>
          </div>
        )}

        {/* Signature */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Cryptographic Signature</p>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between gap-2 mb-2">
              <code className="text-xs font-mono text-gray-900 break-all">
                {verification.signature}
              </code>
              <button
                onClick={copyToClipboard}
                className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                title="Copy signature"
              >
                {copiedSignature ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>
            {copiedSignature && (
              <p className="text-xs text-green-600">Signature copied to clipboard</p>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Verification Date</p>
          <div className="flex items-center gap-2 text-sm text-gray-900">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{new Date(verification.timestamp).toLocaleString()}</span>
          </div>
        </div>

        {/* Notes */}
        {verification.notes && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
            <p className="text-sm text-gray-600 italic">{verification.notes}</p>
          </div>
        )}

        {/* Verifier Instance ID */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Verifier Instance ID</p>
          <code className="text-xs font-mono text-gray-900 block p-2 bg-gray-50 rounded">
            {verification.verifierInstanceId}
          </code>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 flex gap-2">
          {onViewVerifier && (
            <button
              onClick={() => onViewVerifier(verification.verifierInstanceId)}
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              View Verifier Instance
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Usage Example:
 * 
 * // Compact variant
 * <VerificationCard
 *   variant="compact"
 *   verification={{
 *     id: 'ver_123',
 *     verifierInstanceId: 'inst_abc456',
 *     verifierName: 'alice.mirror',
 *     signature: 'a1b2c3d4e5f6...',
 *     verificationMethod: 'genesis_hash',
 *     timestamp: '2024-01-15T10:00:00Z',
 *     trustChainDegrees: 1
 *   }}
 *   onViewVerifier={(id) => console.log('View:', id)}
 * />
 * 
 * // Default variant
 * <VerificationCard
 *   verification={{
 *     id: 'ver_123',
 *     verifierInstanceId: 'inst_abc456',
 *     verifierName: 'alice.mirror',
 *     verifierUrl: 'https://alice.mirror.network',
 *     signature: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
 *     verificationMethod: 'peer_attestation',
 *     timestamp: '2024-01-15T10:00:00Z',
 *     trustChainDegrees: 1,
 *     constitutionVersion: '1.2.0',
 *     notes: 'Verified through mutual friend charlie.mirror'
 *   }}
 *   onViewVerifier={(id) => console.log('View verifier:', id)}
 *   onCopySignature={(sig) => console.log('Copied:', sig)}
 * />
 * 
 * // Detailed variant
 * <VerificationCard
 *   variant="detailed"
 *   verification={{
 *     id: 'ver_123',
 *     verifierInstanceId: 'inst_abc456',
 *     verifierName: 'alice.mirror',
 *     verifierUrl: 'https://alice.mirror.network',
 *     signature: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
 *     verificationMethod: 'constitution_match',
 *     timestamp: '2024-01-15T10:00:00Z',
 *     trustChainDegrees: 0,
 *     constitutionVersion: '1.2.0',
 *     notes: 'Direct verification via constitution hash match'
 *   }}
 *   onViewVerifier={(id) => console.log('View verifier:', id)}
 * />
 */
