import React, { useState } from 'react';
import { FileText, Eye, Send, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

/**
 * ProposalComposer - Multi-step Proposal Creation Form
 * 
 * Features:
 * - Multi-step form (title, description, full text, rationale)
 * - Markdown editor for full text
 * - Preview mode to see final proposal
 * - Guardian review notification
 * - Submit for voting workflow
 * - Save as draft option
 * 
 * Constitutional Note: Any user can propose amendments.
 * Guardians review for constitutional compliance, not merit.
 */

interface ProposalDraft {
  title: string;
  description: string;
  fullText: string;
  rationale: string;
}

interface ProposalComposerProps {
  onSubmit: (proposal: ProposalDraft) => Promise<void>;
  onSaveDraft?: (proposal: ProposalDraft) => Promise<void>;
  onCancel?: () => void;
  existingDraft?: Partial<ProposalDraft>;
}

type Step = 'title' | 'description' | 'fullText' | 'rationale' | 'preview';

export function ProposalComposer({
  onSubmit,
  onSaveDraft,
  onCancel,
  existingDraft
}: ProposalComposerProps) {
  const [currentStep, setCurrentStep] = useState<Step>('title');
  const [title, setTitle] = useState(existingDraft?.title || '');
  const [description, setDescription] = useState(existingDraft?.description || '');
  const [fullText, setFullText] = useState(existingDraft?.fullText || '');
  const [rationale, setRationale] = useState(existingDraft?.rationale || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const MAX_TITLE_LENGTH = 200;
  const MAX_DESCRIPTION_LENGTH = 500;
  const MAX_FULL_TEXT_LENGTH = 10000;
  const MAX_RATIONALE_LENGTH = 2000;

  // Step configuration
  const steps: { key: Step; label: string; icon: typeof FileText }[] = [
    { key: 'title', label: 'Title', icon: FileText },
    { key: 'description', label: 'Description', icon: FileText },
    { key: 'fullText', label: 'Full Text', icon: FileText },
    { key: 'rationale', label: 'Rationale', icon: FileText },
    { key: 'preview', label: 'Preview', icon: Eye }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  // Validation
  const isStepValid = (step: Step): boolean => {
    switch (step) {
      case 'title':
        return title.trim().length >= 10 && title.trim().length <= MAX_TITLE_LENGTH;
      case 'description':
        return description.trim().length >= 20 && description.trim().length <= MAX_DESCRIPTION_LENGTH;
      case 'fullText':
        return fullText.trim().length >= 100 && fullText.trim().length <= MAX_FULL_TEXT_LENGTH;
      case 'rationale':
        return rationale.trim().length >= 50 && rationale.trim().length <= MAX_RATIONALE_LENGTH;
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  const canProceed = isStepValid(currentStep);
  const canSubmit = ['title', 'description', 'fullText', 'rationale'].every(s => isStepValid(s as Step));

  // Navigation
  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        fullText,
        rationale
      });
    } catch (error) {
      console.error('Failed to submit proposal:', error);
      alert('Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save draft
  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;

    setIsSavingDraft(true);
    try {
      await onSaveDraft({
        title,
        description,
        fullText,
        rationale
      });
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Failed to save draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-purple-600" />
          Create Proposal
        </h1>
        <p className="text-gray-600 mt-1">
          Propose amendments to the Mirror Constitution
        </p>
      </div>

      {/* Progress Stepper */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.key === currentStep;
              const isCompleted = isStepValid(step.key) && index < currentStepIndex;
              
              return (
                <div key={step.key} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(step.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : isCompleted
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{step.label}</span>
                    {isCompleted && <Badge className="text-xs bg-green-600">✓</Badge>}
                  </button>
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps.find(s => s.key === currentStep)?.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title Step */}
          {currentStep === 'title' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Proposal Title
                </label>
                <Input
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                  placeholder="e.g., Add Dark Mode to Platform"
                  className="text-lg"
                  maxLength={MAX_TITLE_LENGTH}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {title.length < 10 ? `Need at least ${10 - title.length} more characters` : 'Title looks good'}
                  </p>
                  <span className="text-xs text-gray-400">
                    {title.length}/{MAX_TITLE_LENGTH}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Tips:</strong> Be clear and specific. Good titles help voters understand 
                the proposal at a glance.
              </div>
            </>
          )}

          {/* Description Step */}
          {currentStep === 'description' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Short Description
                </label>
                <textarea
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                  placeholder="Briefly explain what this proposal does and why it matters..."
                  rows={4}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {description.length < 20 ? `Need at least ${20 - description.length} more characters` : 'Description looks good'}
                  </p>
                  <span className="text-xs text-gray-400">
                    {description.length}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Tips:</strong> This appears on the proposals list. Make it compelling 
                but concise—voters should grasp the core idea quickly.
              </div>
            </>
          )}

          {/* Full Text Step */}
          {currentStep === 'fullText' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Full Proposal Text
                </label>
                <textarea
                  value={fullText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFullText(e.target.value.slice(0, MAX_FULL_TEXT_LENGTH))}
                  placeholder="Write the complete proposal text. Include implementation details, scope, expected impact, and any technical specifications..."
                  rows={12}
                  maxLength={MAX_FULL_TEXT_LENGTH}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {fullText.length < 100 ? `Need at least ${100 - fullText.length} more characters` : 'Full text looks comprehensive'}
                  </p>
                  <span className="text-xs text-gray-400">
                    {fullText.length}/{MAX_FULL_TEXT_LENGTH}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Tips:</strong> Be thorough. Include what changes, how it changes, who's 
                affected, and what implementation requires. Voters need details to make informed decisions.
              </div>
            </>
          )}

          {/* Rationale Step */}
          {currentStep === 'rationale' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Rationale
                </label>
                <textarea
                  value={rationale}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRationale(e.target.value.slice(0, MAX_RATIONALE_LENGTH))}
                  placeholder="Explain WHY this proposal matters. What problem does it solve? What benefits does it bring? Why should voters support it?"
                  rows={8}
                  maxLength={MAX_RATIONALE_LENGTH}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {rationale.length < 50 ? `Need at least ${50 - rationale.length} more characters` : 'Rationale is well-developed'}
                  </p>
                  <span className="text-xs text-gray-400">
                    {rationale.length}/{MAX_RATIONALE_LENGTH}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Tips:</strong> Make your case! This is your opportunity to persuade. 
                Explain values, benefits, and why this aligns with Mirror's constitutional principles.
              </div>
            </>
          )}

          {/* Preview Step */}
          {currentStep === 'preview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{title}</h2>
                <p className="text-gray-600">{description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Full Text</h3>
                <div className="p-4 bg-gray-50 rounded-lg border whitespace-pre-wrap text-sm">
                  {fullText}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Rationale</h3>
                <div className="p-4 bg-gray-50 rounded-lg border whitespace-pre-wrap text-sm">
                  {rationale}
                </div>
              </div>

              {/* Guardian Review Notice */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">Next: Guardian Review</h4>
                <p className="text-sm text-purple-800">
                  After submission, Guardians will review your proposal for constitutional 
                  compliance (not merit). If approved, it enters a 7-day voting period. 
                  A 2/3 supermajority is required to pass.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation & Actions */}
      {currentStep !== 'preview' && (
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                onClick={goToPreviousStep}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {onSaveDraft && (
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingDraft ? 'Saving...' : 'Save Draft'}
              </Button>
            )}
            <Button
              onClick={goToNextStep}
              disabled={!canProceed}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 'preview' && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Edit
          </Button>
        </div>
      )}

      {/* Constitutional Note */}
      <div className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-3 py-2">
        <strong>Democratic governance:</strong> Any user can propose amendments. Guardians 
        ensure proposals don't violate core principles (transparency, autonomy, accountability), 
        but they don't judge merit—that's for voters. If supermajority fails, you can fork.
      </div>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <ProposalComposer
 *   onSubmit={async (proposal) => {
 *     await createProposal(proposal);
 *     console.log('Proposal submitted!');
 *   }}
 *   onSaveDraft={async (proposal) => {
 *     await saveDraft(proposal);
 *     console.log('Draft saved!');
 *   }}
 *   onCancel={() => console.log('Cancelled')}
 *   existingDraft={{
 *     title: 'Add Dark Mode',
 *     description: 'Implement dark mode theme...'
 *   }}
 * />
 */

