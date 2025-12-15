import React, { useState } from 'react';
import { CheckCircle, Users, Shield, Info, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * AttestationButton - Quality Attestation Component
 * 
 * Features:
 * - Attest to card/reflection quality
 * - Display attestation count
 * - Show who has attested (if public)
 * - "Your attestation helps others" messaging
 * - Undo attestation capability
 * 
 * Constitutional Note: Attestations are gifts of trust in the commons.
 * They help others find valuable content without creating hierarchies.
 */

interface Attestor {
  id: string;
  displayName: string;
  instanceUrl?: string;
}

interface AttestationData {
  count: number;
  userHasAttested: boolean;
  recentAttestors?: Attestor[]; // First few attestors to show
}

interface AttestationButtonProps {
  itemId: string;
  itemType: 'reflection' | 'door' | 'card' | 'proposal';
  attestations: AttestationData;
  onAttest: (itemId: string) => void;
  onUnattest: (itemId: string) => void;
  onViewAttestors?: (itemId: string) => void;
  variant?: 'button' | 'card' | 'inline';
  showCount?: boolean;
  disabled?: boolean;
}

export function AttestationButton({
  itemId,
  itemType,
  attestations,
  onAttest,
  onUnattest,
  onViewAttestors,
  variant = 'button',
  showCount = true,
  disabled = false
}: AttestationButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (disabled) return;

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    if (attestations.userHasAttested) {
      onUnattest(itemId);
    } else {
      onAttest(itemId);
    }
  };

  // Button variant (compact inline)
  if (variant === 'button') {
    return (
      <Button
        onClick={handleToggle}
        disabled={disabled}
        variant={attestations.userHasAttested ? 'default' : 'outline'}
        size="sm"
        className={`flex items-center gap-2 ${isAnimating ? 'animate-pulse' : ''}`}
      >
        <CheckCircle
          className={`h-4 w-4 ${
            attestations.userHasAttested ? 'fill-current' : ''
          }`}
        />
        {attestations.userHasAttested ? 'Attested' : 'Attest'}
        {showCount && attestations.count > 0 && (
          <Badge className="ml-1 bg-white text-gray-700 border-0">
            {attestations.count}
          </Badge>
        )}
      </Button>
    );
  }

  // Inline variant (minimal display)
  if (variant === 'inline') {
    return (
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`flex items-center gap-2 text-sm transition-colors ${
          attestations.userHasAttested
            ? 'text-blue-600 font-medium'
            : 'text-gray-600 hover:text-blue-600'
        } ${isAnimating ? 'animate-pulse' : ''}`}
      >
        <CheckCircle
          className={`h-5 w-5 ${
            attestations.userHasAttested ? 'fill-current' : ''
          }`}
        />
        {showCount && (
          <span>
            {attestations.count} {attestations.count === 1 ? 'attestation' : 'attestations'}
          </span>
        )}
      </button>
    );
  }

  // Card variant (full featured)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          Quality Attestation
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Attestation Count */}
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div>
            <p className="text-sm text-blue-700 mb-1">
              {attestations.count === 0 && 'No attestations yet'}
              {attestations.count === 1 && '1 person attests to this'}
              {attestations.count > 1 && `${attestations.count} people attest to this`}
            </p>
            <p className="text-xs text-blue-600">
              Attestations help others discover valuable {itemType}s
            </p>
          </div>
          <Users className="h-8 w-8 text-blue-600" />
        </div>

        {/* Recent Attestors */}
        {attestations.recentAttestors && attestations.recentAttestors.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Recent Attestors</h4>
            <div className="space-y-2">
              {attestations.recentAttestors.map((attestor) => (
                <div
                  key={attestor.id}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{attestor.displayName}</span>
                  {attestor.instanceUrl && (
                    <span className="text-gray-500 text-xs">
                      @ {new URL(attestor.instanceUrl).hostname}
                    </span>
                  )}
                </div>
              ))}
              {attestations.count > attestations.recentAttestors.length && onViewAttestors && (
                <button
                  onClick={() => onViewAttestors(itemId)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-2"
                >
                  View all {attestations.count} attestors
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Attest Button */}
        <Button
          onClick={handleToggle}
          disabled={disabled}
          className={`w-full flex items-center justify-center gap-2 ${
            isAnimating ? 'animate-pulse' : ''
          }`}
          variant={attestations.userHasAttested ? 'outline' : 'default'}
        >
          <CheckCircle
            className={`h-5 w-5 ${
              attestations.userHasAttested ? 'fill-current' : ''
            }`}
          />
          {attestations.userHasAttested
            ? 'Remove Your Attestation'
            : 'Attest to This Quality'}
        </Button>

        {/* Explanation */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">What does attestation mean?</p>
              <p>
                By attesting, you're signaling that this {itemType} is thoughtful, helpful, or
                resonant. It's not a "like"—it's a gift of trust in the commons that helps
                others find valuable content.
              </p>
            </div>
          </div>
        </div>

        {/* Constitutional Note */}
        <div className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-3 py-2">
          <strong>No hierarchies:</strong> Attestations don't create social status or ranking.
          They're simply signals in a gift economy where everyone's voice matters equally.
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Usage Examples:
 * 
 * // Button variant (compact)
 * <AttestationButton
 *   itemId="refl_123"
 *   itemType="reflection"
 *   attestations={{
 *     count: 12,
 *     userHasAttested: false
 *   }}
 *   onAttest={(id) => console.log('Attest:', id)}
 *   onUnattest={(id) => console.log('Unattest:', id)}
 *   variant="button"
 * />
 * 
 * // Inline variant (minimal)
 * <AttestationButton
 *   itemId="door_456"
 *   itemType="door"
 *   attestations={{
 *     count: 5,
 *     userHasAttested: true
 *   }}
 *   onAttest={(id) => console.log('Attest:', id)}
 *   onUnattest={(id) => console.log('Unattest:', id)}
 *   variant="inline"
 * />
 * 
 * // Card variant (full featured)
 * <AttestationButton
 *   itemId="card_789"
 *   itemType="card"
 *   attestations={{
 *     count: 23,
 *     userHasAttested: false,
 *     recentAttestors: [
 *       { id: 'user_1', displayName: 'Alice', instanceUrl: 'https://mirror1.example.com' },
 *       { id: 'user_2', displayName: 'Bob', instanceUrl: 'https://mirror2.example.com' }
 *     ]
 *   }}
 *   onAttest={(id) => console.log('Attest:', id)}
 *   onUnattest={(id) => console.log('Unattest:', id)}
 *   onViewAttestors={(id) => console.log('View all attestors:', id)}
 *   variant="card"
 * />
 */
