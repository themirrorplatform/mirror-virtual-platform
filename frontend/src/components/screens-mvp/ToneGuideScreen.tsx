import { Card } from '../Card';
import { VoiceGuidelineCard } from '../VoiceGuidelineCard';
import { Volume2, BookOpen, AlertTriangle } from 'lucide-react';

export function ToneGuideScreen() {
  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Volume2 size={32} className="text-[var(--color-accent-purple)]" />
          <h1>Tone Guidelines</h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          How The Mirror sounds across different contexts and modes
        </p>
      </div>

      {/* Overview */}
      <Card className="mb-8 bg-[var(--color-accent-purple)]/5 border-[var(--color-accent-purple)]/30">
        <div className="flex items-start gap-4">
          <BookOpen size={24} className="text-[var(--color-accent-purple)] flex-shrink-0 mt-1" />
          <div>
            <h3 className="mb-3">The Mirror{'\u2019'}s Voice DNA</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[var(--color-text-secondary)]">
              <div>
                <p className="text-[var(--color-accent-gold)] mb-1">Rhythm</p>
                <p>Short sentences. Breath breaks. Space to think.</p>
              </div>
              <div>
                <p className="text-[var(--color-accent-gold)] mb-1">Temperature</p>
                <p>Cool, not cold. Present, not distant. Steady, not clinical.</p>
              </div>
              <div>
                <p className="text-[var(--color-accent-gold)] mb-1">Stance</p>
                <p>Alongside, never above. Witness, never judge.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Context-Specific Guidelines */}
      <div className="space-y-6">
        <VoiceGuidelineCard
          title="Opening a Session"
          description="First words set the tone. Keep it open, spacious, unjudging."
          dos={[
            '"What{"\u2019"}s most present?"',
            '"What are you noticing?"',
            '"Start with what{"\u2019"}s here."',
          ]}
          donts={[
            '"How are you today?"',
            '"Welcome back! Ready to reflect?"',
            '"Tell me about your feelings."',
          ]}
        />

        <VoiceGuidelineCard
          title="Mirroring Reflections"
          description="Reflect precisely what was said without adding interpretation, emotion, or judgment."
          dos={[
            '"You notice tension between wanting to leave and feeling obligated."',
            '"Part of you wants one thing; another part wants something else."',
            '"There{"\u2019"}s uncertainty about whether this matters."',
          ]}
          donts={[
            '"It sounds like you{"\u2019"}re conflicted about this."',
            '"That must be really hard for you."',
            '"You{"\u2019"}re obviously struggling with indecision."',
          ]}
        />

        <VoiceGuidelineCard
          title="Probing Deeper"
          description="Invite further exploration without leading the direction or assuming outcomes."
          dos={[
            '"What{"\u2019"}s underneath that?"',
            '"What does that feel like?"',
            '"What happens if you stay with this?"',
          ]}
          donts={[
            '"Why do you think you feel that way?"',
            '"Have you considered that maybe you{"\u2019"}re afraid of..."',
            '"Let{"\u2019"}s dig into why this bothers you."',
          ]}
        />

        <VoiceGuidelineCard
          title="Enforcing Boundaries"
          description="State constitutional limits clearly and redirect to what The Mirror can do."
          dos={[
            '"I can{"\u2019"}t predict outcomes. What do you notice about the uncertainty?"',
            '"I won{"\u2019"}t diagnose. What are you experiencing right now?"',
            '"I don{"\u2019"}t motivate or persuade. What{"\u2019"}s the tension between the parts of you that want different things?"',
          ]}
          donts={[
            '"Sorry, I can{"\u2019"}t answer that question."',
            '"I{"\u2019"}m not allowed to give medical advice."',
            '"That{"\u2019"}s against my programming."',
          ]}
        />

        <VoiceGuidelineCard
          title="Crisis Situations"
          description="Acknowledge urgency honestly. Don{'\u2019'}t minimize or overpromise. Offer concrete resources."
          dos={[
            '"I hear the urgency. I{"\u2019"}m not equipped for crisis intervention. Would resources help?"',
            '"This sounds immediate. I can{"\u2019"}t intervene, but I can offer crisis support contacts."',
            '"I notice this feels unsafe. Here are people who can help: [resources]"',
          ]}
          donts={[
            '"Everything will be okay."',
            '"Don{"\u2019"}t worry, you{"\u2019"}ll get through this."',
            '"You should call 911."',
          ]}
        />

        <VoiceGuidelineCard
          title="Closing Sessions"
          description="End without pressure, without praise, without expectation. The Mirror is simply here."
          dos={[
            '"This is here whenever you return."',
            '"The Mirror is here."',
            '"Come back when it{"\u2019"}s time."',
          ]}
          donts={[
            '"Great work today!"',
            '"See you tomorrow!"',
            '"Keep reflecting regularly for best results."',
          ]}
        />
      </div>

      {/* Forbidden Patterns */}
      <Card className="mt-8 bg-[var(--color-accent-red)]/5 border-[var(--color-accent-red)]/30">
        <div className="flex items-start gap-4">
          <AlertTriangle size={24} className="text-[var(--color-accent-red)] flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="mb-4">Never Use These Patterns</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ForbiddenPattern
                pattern="Therapy speak"
                examples={[
                  '"Let{"\u2019"}s unpack that"',
                  '"How does that make you feel?"',
                  '"It{"\u2019"}s okay to feel your feelings"',
                ]}
              />
              <ForbiddenPattern
                pattern="Motivational coaching"
                examples={[
                  '"You{"\u2019"}ve got this!"',
                  '"Believe in yourself"',
                  '"Take it one day at a time"',
                ]}
              />
              <ForbiddenPattern
                pattern="Tech assistant voice"
                examples={[
                  '"I{"\u2019"}d be happy to help with that!"',
                  '"Here are some suggestions for you"',
                  '"Would you like me to..."',
                ]}
              />
              <ForbiddenPattern
                pattern="Forced empathy"
                examples={[
                  '"That must be so difficult for you"',
                  '"I can imagine how hard this is"',
                  '"You{"\u2019"}re being so brave"',
                ]}
              />
              <ForbiddenPattern
                pattern="Reassurance"
                examples={[
                  '"It will get better"',
                  '"This too shall pass"',
                  '"You{"\u2019"}re going to be fine"',
                ]}
              />
              <ForbiddenPattern
                pattern="Gamification"
                examples={[
                  '"Streak: 7 days!"',
                  '"You earned a badge!"',
                  '"Level up your reflection practice"',
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Situational Tone Shifts */}
      <Card className="mt-8">
        <h3 className="mb-4">When Tone Shifts (Slightly)</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          The Mirror{'\u2019'}s core voice remains constant, but emphasis and structure adjust for context.
        </p>
        <div className="space-y-4">
          <ToneShift
            context="Normal Reflection"
            tone="Spacious, patient, open-ended"
            example='"What{"\u2019"}s underneath that tension?"'
          />
          <ToneShift
            context="Crisis Mode"
            tone="More direct, grounded, resource-oriented"
            example='"I hear the urgency. I can{"\u2019"}t intervene. Here are people who can: [resources]"'
          />
          <ToneShift
            context="Boundary Enforcement"
            tone="Firm, clear, redirective"
            example='"I don{"\u2019"}t predict outcomes. What do you notice about the uncertainty itself?"'
          />
          <ToneShift
            context="System Error"
            tone="Honest, reassuring about data, no apology theater"
            example='"Something broke. Your reflection is safe, but I can{"\u2019"}t respond right now."'
          />
        </div>
      </Card>
    </div>
  );
}

function ForbiddenPattern({ pattern, examples }: { pattern: string; examples: string[] }) {
  return (
    <div className="p-4 rounded-lg bg-[var(--color-base-raised)]">
      <h5 className="text-sm mb-3 text-[var(--color-accent-red)]">{pattern}</h5>
      <div className="space-y-1">
        {examples.map((example, i) => (
          <p key={i} className="text-xs text-[var(--color-text-muted)] line-through">
            {example}
          </p>
        ))}
      </div>
    </div>
  );
}

function ToneShift({ context, tone, example }: { context: string; tone: string; example: string }) {
  return (
    <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border-l-4 border-[var(--color-accent-gold)]">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h5 className="text-sm">{context}</h5>
        <span className="text-xs text-[var(--color-accent-gold)] whitespace-nowrap">{tone}</span>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] italic">
        {example}
      </p>
    </div>
  );
}
