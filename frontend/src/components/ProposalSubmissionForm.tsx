/**
 * ProposalSubmissionForm Component
 * 
 * Form for submitting new evolution proposals
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { governance } from '@/lib/api';

interface ProposalSubmissionFormProps {
  onSuccess?: (proposalId: string) => void;
  onCancel?: () => void;
}

export const ProposalSubmissionForm: React.FC<ProposalSubmissionFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    proposal_type: 'pattern_add',
    title: '',
    description: '',
    changes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const proposalTypes = [
    { value: 'pattern_add', label: 'Add Pattern' },
    { value: 'pattern_modify', label: 'Modify Pattern' },
    { value: 'pattern_remove', label: 'Remove Pattern' },
    { value: 'tension_add', label: 'Add Tension Axis' },
    { value: 'tension_modify', label: 'Modify Tension' },
    { value: 'constitutional_add', label: 'Add Constitutional Rule' },
    { value: 'constitutional_modify', label: 'Modify Constitutional Rule' },
    { value: 'engine_update', label: 'Engine Update' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      // Parse changes JSON
      let changesObj: Record<string, any>;
      try {
        changesObj = JSON.parse(formData.changes || '{}');
      } catch {
        throw new Error('Changes must be valid JSON');
      }

      // Submit proposal
      const response = await governance.submitProposal({
        proposal_type: formData.proposal_type,
        title: formData.title,
        description: formData.description,
        changes: changesObj,
      });

      if (response.data.success) {
        setSuccess(`Proposal submitted successfully! ID: ${response.data.proposal_id}`);
        
        // Reset form
        setFormData({
          proposal_type: 'pattern_add',
          title: '',
          description: '',
          changes: '',
        });

        // Call success callback
        if (onSuccess) {
          onSuccess(response.data.proposal_id);
        }
      } else {
        throw new Error('Proposal submission failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Evolution Proposal</CardTitle>
        <CardDescription>
          Propose changes to patterns, tensions, or constitutional rules. All proposals go through
          constitutional checks and community voting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Proposal Type */}
          <div className="space-y-2">
            <Label htmlFor="proposal_type">Proposal Type</Label>
            <Select
              value={formData.proposal_type}
              onValueChange={(value) => setFormData({ ...formData, proposal_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select proposal type" />
              </SelectTrigger>
              <SelectContent>
                {proposalTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Brief, descriptive title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Explain the rationale and expected impact of this proposal"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              maxLength={1000}
            />
          </div>

          {/* Changes (JSON) */}
          <div className="space-y-2">
            <Label htmlFor="changes">Changes (JSON)</Label>
            <Textarea
              id="changes"
              placeholder='{"key": "value", "description": "what changes"}'
              value={formData.changes}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, changes: e.target.value })}
              required
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Provide the specific changes as a JSON object. Example: {'{'}
              "pattern_name": "new_pattern", "description": "A new pattern for reflection"
              {'}'}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Proposal
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProposalSubmissionForm;

