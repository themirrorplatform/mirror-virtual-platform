/**
 * VotingInterface Component
 * 
 * Full voting interface with reasoning input and integrity display
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MinusCircle, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  Shield
} from 'lucide-react';
import { governance, type EvolutionProposal } from '@/lib/api';

interface VotingInterfaceProps {
  proposal: EvolutionProposal;
  onVoted?: () => void;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({
  proposal,
  onVoted,
}) => {
  const [vote, setVote] = useState<'for' | 'against' | 'abstain'>('for');
  const [reasoning, setReasoning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reasoning.trim()) {
      setError('Please provide reasoning for your vote');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await governance.voteOnProposal(proposal.id, {
        vote,
        reasoning: reasoning.trim(),
      });

      if (response.data.success) {
        setSuccess(true);
        setReasoning('');
        
        // Call callback
        if (onVoted) {
          onVoted();
        }

        // Reset success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(response.data.error || 'Vote failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (proposal.status !== 'active') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Voting is closed for this proposal. Current status: {proposal.status}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Cast Your Vote
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vote Selection */}
          <div className="space-y-3">
            <Label>Your Vote</Label>
            <RadioGroup value={vote} onValueChange={(value) => setVote(value as any)}>
              <div className="space-y-3">
                <VoteOption
                  value="for"
                  icon={<ThumbsUp className="h-5 w-5" />}
                  label="Vote For"
                  description="Support this proposal"
                  color="green"
                />
                <VoteOption
                  value="against"
                  icon={<ThumbsDown className="h-5 w-5" />}
                  label="Vote Against"
                  description="Oppose this proposal"
                  color="red"
                />
                <VoteOption
                  value="abstain"
                  icon={<MinusCircle className="h-5 w-5" />}
                  label="Abstain"
                  description="No strong opinion either way"
                  color="gray"
                />
              </div>
            </RadioGroup>
          </div>

          {/* Reasoning */}
          <div className="space-y-2">
            <Label htmlFor="reasoning">Reasoning (Required)</Label>
            <Textarea
              id="reasoning"
              placeholder="Explain why you're voting this way. Your reasoning helps build collective understanding."
              value={reasoning}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setReasoning(e.target.value)}
              required
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reasoning.length}/500 characters
            </p>
          </div>

          {/* Integrity Notice */}
          <Alert className="bg-blue-50 border-blue-200">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              Your vote will undergo integrity checks to ensure fair participation. Sybil attacks,
              bot activity, and coordinated voting are automatically detected.
            </AlertDescription>
          </Alert>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Vote recorded successfully! Integrity checks passed.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={submitting || !reasoning.trim()} 
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Submitting Vote...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Submit Vote
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

interface VoteOptionProps {
  value: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: 'green' | 'red' | 'gray';
}

const VoteOption: React.FC<VoteOptionProps> = ({
  value,
  icon,
  label,
  description,
  color,
}) => {
  const colorClasses = {
    green: 'border-green-200 bg-green-50 hover:bg-green-100',
    red: 'border-red-200 bg-red-50 hover:bg-red-100',
    gray: 'border-gray-200 bg-gray-50 hover:bg-gray-100',
  };

  const iconColorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
  };

  return (
    <div className="flex items-center space-x-3">
      <RadioGroupItem value={value} id={value} />
      <Label
        htmlFor={value}
        className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${colorClasses[color]}`}
      >
        <div className={iconColorClasses[color]}>{icon}</div>
        <div className="flex-1">
          <div className="font-semibold">{label}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </Label>
    </div>
  );
};

export default VotingInterface;

