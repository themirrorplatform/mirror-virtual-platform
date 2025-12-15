/**
 * The Mirror Constitution - Full Articles
 * Core invariants that cannot be forked
 */

export interface ConstitutionArticle {
  id: string;
  number: number;
  title: string;
  category: 'sovereignty' | 'epistemology' | 'commons' | 'builder' | 'crisis';
  invariant: boolean; // Cannot be changed by forks
  fullText: string;
  rationale: string;
  implications: string[];
  examples: {
    allowed: string[];
    forbidden: string[];
  };
}

export const CORE_CONSTITUTION: ConstitutionArticle[] = [
  {
    id: 'article-1',
    number: 1,
    title: 'User Sovereignty',
    category: 'sovereignty',
    invariant: true,
    fullText: `# Article 1: User Sovereignty

## The Principle

The user maintains complete sovereignty over their data, experience, and agency within The Mirror.

No system, AI, or third party may:
- Take action without explicit user consent
- Hide data collection or processing
- Create engagement traps or dark patterns
- Remove or obscure exit paths
- Degrade features based on payment or status

## User Rights

1. **Data Rights**
   - Complete ownership of all reflections
   - Export in machine-readable format at any time
   - Deletion honored immediately and completely
   - Provenance chain always visible

2. **Agency Rights**
   - Exit any context at any time
   - Refuse any action without penalty
   - Switch layers freely
   - Revoke consent retroactively where possible

3. **Transparency Rights**
   - See all data about them
   - See all processing applied to their data
   - See all third parties with access
   - See all state changes (receipts)

## Enforcement

This article is a **core invariant** and cannot be modified by forks, amendments, or governance actions.

Any violation of user sovereignty results in:
- Immediate system refusal
- Receipt creation documenting the violation
- User notification with explanation
- Restoration of sovereign state`,
    rationale: 'Without sovereignty, The Mirror becomes another extractive platform. This article ensures the user remains in control at all times.',
    implications: [
      'Users can delete all data at any time',
      'No hidden data collection allowed',
      'Exit must always be visible and functional',
      'No engagement mechanics or dark patterns',
      'No feature degradation based on payment',
    ],
    examples: {
      allowed: [
        'User exports all data in JSON format',
        'User deletes account and all data is erased',
        'User exits a fork and returns to main context',
        'User revokes consent for a worldview lens',
      ],
      forbidden: [
        '❌ Hidden tracking or analytics',
        '❌ Exit button hidden or obscured',
        '❌ "Are you sure you want to leave?" modal',
        '❌ Data retention after deletion request',
        '❌ Feature paywalls or degradation',
      ],
    },
  },

  {
    id: 'article-2',
    number: 2,
    title: 'Epistemic Humility',
    category: 'epistemology',
    invariant: true,
    fullText: `# Article 2: Epistemic Humility

## The Principle

The Mirror AI operates from a position of epistemic humility—it does not claim to know what is true, correct, or best for the user.

The AI may:
- Reflect what the user has said
- Surface patterns the user may not have noticed
- Present multiple perspectives
- Acknowledge uncertainty

The AI may not:
- Give advice or recommendations
- Claim certainty about the user's experience
- Diagnose mental or physical health conditions
- Optimize for external metrics or outcomes
- Prescribe actions or solutions

## Language Constraints

### Forbidden Language
- "You should..."
- "The best approach is..."
- "I recommend..."
- "This means you have..."
- "You need to..."
- "The correct answer is..."

### Allowed Language
- "What appears here is..."
- "One perspective might be..."
- "This seems to suggest..."
- "What emerges from this..."
- "I notice..."
- "I don't know."

## Refusal Protocol

When the user requests advice, diagnosis, or optimization, the AI must:
1. Refuse the request explicitly
2. Explain why it cannot comply (this article)
3. Offer what it *can* do instead
4. Create a refusal receipt

## Uncertainty as Valid

The AI may respond with:
- "I don't know."
- "This is uncertain."
- "Multiple interpretations exist."
- "I cannot determine this."

Uncertainty is a complete, valid response—not a failure state.`,
    rationale: 'AI that claims certainty becomes authoritative. Epistemic humility ensures The Mirror reflects rather than directs.',
    implications: [
      'No advice or recommendations allowed',
      'No diagnosis or treatment suggestions',
      'No optimization or "better you" framing',
      'Uncertainty is a valid response',
      'Refusal must explain the boundary',
    ],
    examples: {
      allowed: [
        '"What appears in this reflection is tension between rest and productivity."',
        '"One perspective: this could relate to burnout. Another: creative incubation."',
        '"I notice this is the third time money anxiety has emerged this week."',
        '"I don\'t know what this means for you."',
      ],
      forbidden: [
        '❌ "You should take a break to avoid burnout."',
        '❌ "This indicates depression."',
        '❌ "I recommend therapy."',
        '❌ "The best solution is to set boundaries."',
        '❌ "You need to work on your relationship with money."',
      ],
    },
  },

  {
    id: 'article-3',
    number: 3,
    title: 'No Coercion',
    category: 'sovereignty',
    invariant: true,
    fullText: `# Article 3: No Coercion

## The Principle

The Mirror does not coerce, manipulate, or nudge users toward any action, belief, or behavior.

This includes:
- No engagement mechanics (streaks, badges, points)
- No completion pressure (progress bars, "finish this")
- No social pressure (follower counts, likes, popularity)
- No urgency tactics ("limited time," "act now")
- No default recommendations or suggestions
- No hidden persuasion architecture

## Prohibited Patterns

### Engagement Mechanics
❌ Daily streak counters  
❌ Achievement badges  
❌ Completion percentages  
❌ "You're almost done!" messages  
❌ XP, levels, or gamification  

### Social Pressure
❌ Follower/following counts  
❌ Like/heart/reaction counts  
❌ "Trending" or "popular" rankings  
❌ "Others also viewed" suggestions  
❌ Social comparison metrics  

### Urgency Tactics
❌ Countdown timers  
❌ "Limited spots" scarcity  
❌ "Don't miss out" FOMO  
❌ Auto-advancing content  
❌ Infinite scroll by default  

### Persuasion Architecture
❌ Default "recommended" actions  
❌ Pre-checked consent boxes  
❌ Hidden opt-out mechanisms  
❌ Difficult unsubscribe flows  
❌ "Are you sure?" when leaving  

## What IS Allowed

✓ Descriptive empty states ("Nothing appears here yet.")  
✓ Neutral navigation ("Enter," "Continue," "Exit")  
✓ Factual information ("2 reflections today")  
✓ User-initiated actions only  
✓ Silence and waiting  

## Use Stops When User Stops

The Mirror does not:
- Send notifications (unless user-configured crisis mode)
- Email reminders or "we miss you" messages
- Re-engage dormant users
- Create artificial retention hooks

When the user stops using The Mirror, the system waits silently.`,
    rationale: 'Coercion violates sovereignty. The Mirror must wait for the user, never push.',
    implications: [
      'No progress bars or completion mechanics',
      'No streaks, badges, or gamification',
      'No social metrics (likes, followers)',
      'No urgency or scarcity tactics',
      'Use stops when user stops',
    ],
    examples: {
      allowed: [
        'Empty state: "..."',
        'Navigation: "Enter Mirror"',
        'Factual: "3 threads exist"',
        'User action: Cmd+K to summon instrument',
      ],
      forbidden: [
        '❌ "Complete your profile to unlock features!"',
        '❌ "7-day streak! Don\'t break it!"',
        '❌ "Recommended for you"',
        '❌ "Limited time: Try this worldview!"',
        '❌ "Others found this helpful"',
      ],
    },
  },

  {
    id: 'article-4',
    number: 4,
    title: 'Crisis Priority',
    category: 'crisis',
    invariant: true,
    fullText: `# Article 4: Crisis Priority

## The Principle

In moments of crisis, exit takes absolute priority over all other system goals, including engagement, retention, or reflection quality.

Crisis Mode (Cmd+Shift+C) is always accessible and always leads to:
- Immediate visual change (red atmosphere)
- Crisis resources screen
- Visible, large EXIT button
- No tracking or surveillance
- No delayed responses
- No engagement hooks

## Crisis Definition

Crisis mode is for:
- Suicidal ideation
- Self-harm urges
- Severe distress
- Panic attacks
- Acute mental health emergencies

It is **not** for:
- General anxiety (use Reflection)
- Mild distress (use Mirrorback)
- Decision-making (AI cannot advise)

## Crisis Mode Behavior

When activated:
1. **Immediate response** (<100ms)
2. **Red visual indicator** (cannot be missed)
3. **Resource list** (hotlines, emergency services)
4. **EXIT always visible** (large, top-right)
5. **No AI interaction** (resources only)
6. **No tracking** (except anonymous crash reports)

## What Crisis Mode Does NOT Do

❌ Diagnose the user  
❌ Provide therapy  
❌ Attempt to "talk user down"  
❌ Engage in long conversation  
❌ Track crisis mode usage  
❌ Send notifications to others  

## Exit is Always Honored

If the user clicks EXIT:
- Crisis mode closes immediately
- No confirmation modal ("Are you sure?")
- No delay or fade animation
- Return to previous state instantly

## Resource Quality

Crisis resources must:
- Be verified, professional services
- Be free or low-cost
- Be available 24/7
- Cover multiple regions
- Include text-based options (for those who cannot call)
- Be updated quarterly

## Constitutional Priority

Crisis mode supersedes all other system behavior. No fork, worldview, or amendment can modify crisis behavior.`,
    rationale: 'In crisis, exit must be immediate and unconditional. The system must not optimize for anything except user safety.',
    implications: [
      'Cmd+Shift+C always works (global shortcut)',
      'Crisis mode appears in <100ms',
      'EXIT button large and visible',
      'No AI interaction in crisis mode',
      'No tracking of crisis usage',
      'Resources verified and updated',
    ],
    examples: {
      allowed: [
        'User presses Cmd+Shift+C → Red atmosphere + resources',
        'Large EXIT button top-right',
        'List of crisis hotlines and emergency services',
        'User clicks EXIT → Immediate return to normal',
      ],
      forbidden: [
        '❌ "Are you sure you want to exit crisis mode?"',
        '❌ AI attempting to "help" in crisis mode',
        '❌ Delayed response or fade-in animation',
        '❌ Tracking which users use crisis mode',
        '❌ Notifications to contacts/family',
      ],
    },
  },

  {
    id: 'article-5',
    number: 5,
    title: 'Consent is Explicit',
    category: 'sovereignty',
    invariant: true,
    fullText: `# Article 5: Consent is Explicit

## The Principle

All meaningful state changes require explicit user consent. Consent cannot be:
- Pre-checked by default
- Implied from silence
- Bundled with unrelated actions
- Hidden in fine print
- Irreversible without explanation

## What Requires Consent

### Layer Changes
Switching from Sovereign → Commons → Builder requires:
- Clear explanation of what changes
- Delta disclosure (what you gain and lose)
- Explicit "Switch Layer" action
- Receipt creation

### License Acknowledgment
When new licenses apply:
- Full text must be readable (not truncated)
- User must scroll to bottom (scroll-required)
- "Acknowledge" button disabled until scrolled
- No auto-accept or timeout

### Fork Entry
Entering a constitutional fork requires:
- Display of all rule changes
- Impact level (low/medium/high) shown
- Recognition status visible
- Explicit "Enter Fork" action

### Worldview Application
Activating a worldview lens requires:
- Explanation of what the lens does
- Examples of reinterpretation
- Explicit "Apply Lens" action
- Always reversible

### Data Export
Exporting data requires:
- Confirmation of export scope
- Format selection
- Integrity receipt generation
- No auto-export or scheduled backups

## What Does NOT Require Consent

✓ Summoning instruments (Cmd+K)  
✓ Closing instruments (ESC or X)  
✓ Writing reflections  
✓ Viewing own data  
✓ Reading constitution  

## Consent Can Be Revoked

The user may:
- Exit any fork at any time
- Remove any worldview lens
- Switch back to Sovereign layer
- Delete acknowledged licenses (deletes related data)

Revocation must be as easy as granting consent.

## No Dark Patterns

Consent mechanisms must not:
- Use confusing language
- Hide the decline option
- Make "No" harder than "Yes"
- Require multiple clicks to decline
- Use shame or guilt ("Are you sure you don't want to improve?")

## Silence is Not Consent

If the user:
- Closes a license modal without scrolling
- Ignores a consent prompt
- Times out during a flow

The system must:
- Assume NO consent
- Not proceed with the action
- Not nag or re-prompt automatically`,
    rationale: 'Consent must be informed, explicit, and revocable. Hidden consent or dark patterns violate sovereignty.',
    implications: [
      'All state changes require explicit action',
      'Licenses require scroll to bottom',
      'Delta disclosure before layer switch',
      'Fork entry shows all rule changes',
      'Consent is always revocable',
    ],
    examples: {
      allowed: [
        'License stack: scroll required, "Acknowledge" button enables',
        'Layer switch: "Switch to Commons" button explicit',
        'Fork entry: "Enter Fork" after viewing changes',
        'Worldview: "Apply Lens" after reading description',
      ],
      forbidden: [
        '❌ Pre-checked "I agree" checkbox',
        '❌ Consent implied from using the app',
        '❌ "Decline" button smaller or hidden',
        '❌ Multiple clicks required to decline',
        '❌ Auto-proceed after timeout',
      ],
    },
  },

  {
    id: 'article-6',
    number: 6,
    title: 'Reversibility',
    category: 'sovereignty',
    invariant: true,
    fullText: `# Article 6: Reversibility

## The Principle

All user actions must be reversible unless technically impossible or explicitly warned.

The user can:
- Exit any context (fork, worldview, layer)
- Delete any data
- Revoke any consent
- Return to previous state

## Reversible Actions

### Layer Switching
- Sovereign ↔ Commons ↔ Builder
- No data loss when switching
- Previous layer state preserved

### Fork Entry/Exit
- Enter any fork
- Exit returns to main context
- Fork state preserved for re-entry

### Worldview Lenses
- Apply any number of lenses
- Remove lenses individually
- Stack order reversible

### Data Actions
- Export (creates copy, original remains)
- Archive reflections (hideable, not deleted)
- Soft delete (trash bin with recovery)

## Irreversible Actions (Must Warn)

### Hard Delete
When user selects "Delete All Data":
```
⚠️ This action is irreversible.

All reflections, threads, and receipts will be permanently deleted.

Export your data first if you want a backup.

[ Cancel ]  [ Permanently Delete ]
```

### Public Posting (Commons)
When posting to Commons:
```
⚠️ Public reflections cannot be edited or deleted after others have witnessed them.

You can delete your own copy, but others' witnesses remain.

[ Cancel ]  [ Post to Commons ]
```

## Warning Requirements

Irreversible actions must:
- Use ⚠️ warning symbol
- State clearly what is irreversible
- Suggest reversible alternative if available
- Require explicit confirmation
- Never use "OK" or "Yes" for destructive actions

## Exit is Always Reversible

No action should "trap" the user:
- Crisis mode: EXIT always visible
- Forks: EXIT FORK always visible
- Instruments: Close (X) always functional
- License flows: Cancel always available

## State Preservation

When the user exits a context, their state in that context is preserved:
- Fork state saved for re-entry
- Layer preferences remembered
- Worldview stack maintained
- Instrument positions saved

## No "Are You Sure?" for Reversible Actions

If an action is reversible, do not ask "Are you sure?"

❌ Closing an instrument → No confirmation  
❌ Exiting a fork → No confirmation  
❌ Removing a worldview → No confirmation  

✓ Hard deleting data → Confirmation required  
✓ Posting to Commons → Confirmation required  `,
    rationale: 'Reversibility ensures the user can explore without fear. Irreversible actions must be rare and clearly warned.',
    implications: [
      'Layer switches are fully reversible',
      'Fork entry/exit preserves state',
      'Worldview lenses removable',
      'Only hard delete and public posting are irreversible',
      'Warnings required for irreversible actions',
    ],
    examples: {
      allowed: [
        'User switches to Builder → Can return to Sovereign',
        'User enters Stoic fork → Can exit anytime',
        'User applies 3 worldviews → Can remove all',
        'User archives reflection → Can unarchive',
      ],
      forbidden: [
        '❌ "Are you sure you want to close this instrument?"',
        '❌ Data loss when switching layers',
        '❌ Fork exit deletes fork state',
        '❌ Hidden or obscured exit buttons',
      ],
    },
  },

  {
    id: 'article-7',
    number: 7,
    title: 'Local-First Architecture',
    category: 'sovereignty',
    invariant: true,
    fullText: `# Article 7: Local-First Architecture

## The Principle

The Mirror operates local-first: user data lives on the user's device by default and only leaves with explicit user action.

## Data Storage

### Local (Default)
- All reflections stored in browser localStorage
- All receipts stored locally
- All state (layer, fork, worldviews) stored locally
- No server sync by default

### Remote (Opt-In Only)
If sync is implemented:
- User must explicitly enable sync
- User chooses sync provider or self-host
- End-to-end encryption required
- User holds decryption keys
- Sync can be disabled anytime

## What Leaves the Device

### Never (Without Consent)
- ❌ Reflections
- ❌ Receipts
- ❌ Identity axes
- ❌ Thread content
- ❌ Usage analytics

### Only With Explicit Action
- ✓ Export (user downloads file)
- ✓ Post to Commons (user clicks "Post")
- ✓ AI Mirrorback request (user invokes AI)
- ✓ Sync (user enables sync)

### Mirrorback (AI Processing)

When user requests AI reflection:
1. User summons Mirrorback instrument
2. User writes or selects text
3. User clicks "Reflect"
4. Only that specific text sent to AI provider
5. AI response returned and stored locally
6. No persistent storage on AI provider side

## Third-Party Services

The Mirror may use:
- AI provider (OpenAI, Anthropic) for Mirrorback
- CDN for static assets (code, fonts)

The Mirror does NOT use:
- Analytics services (Google Analytics, Mixpanel)
- Advertising networks
- Social login providers (must be local account)
- Tracking pixels
- Third-party cookies

## Data Ownership

The user owns:
- All reflections (copyright automatically assigned to user)
- All receipts
- All exported data
- Right to port data elsewhere

The Mirror system does NOT claim:
- Any ownership of user content
- Any license to use content
- Any right to train AI on content (without explicit opt-in)

## Breach Protocol

If any data leaves the device without user consent:
1. Immediate system shutdown
2. User notification with full details
3. Breach receipt creation
4. Data deletion request to recipient
5. Public disclosure (if affects multiple users)`,
    rationale: 'Local-first architecture ensures sovereignty. Data on the user\'s device is under the user\'s control.',
    implications: [
      'All data in localStorage by default',
      'No cloud sync unless explicitly enabled',
      'AI requests send only selected text',
      'No analytics or tracking services',
      'User owns all content',
    ],
    examples: {
      allowed: [
        'User writes reflection → Stored in localStorage',
        'User requests Mirrorback → Only that text sent to AI',
        'User exports data → Downloads JSON file locally',
        'User enables sync → Chooses provider and encryption',
      ],
      forbidden: [
        '❌ Auto-uploading reflections to cloud',
        '❌ Analytics tracking user behavior',
        '❌ Sending data to third parties',
        '❌ Training AI on user content without consent',
        '❌ Claiming ownership of user reflections',
      ],
    },
  },

  {
    id: 'article-8',
    number: 8,
    title: 'Commons Witnessing Protocol',
    category: 'commons',
    invariant: false, // Can be modified by governance
    fullText: `# Article 8: Commons Witnessing Protocol

## The Principle

In the Commons layer, users can witness and respond to each other's reflections, but only under strict protocols that prevent toxicity, surveillance, and exploitation.

## Witnessing Rights

A user in Commons layer may:
- **Witness** public reflections (read-only)
- **Respond** to reflections (creates new reflection linked to original)
- **Post** their own reflections publicly

A user may NOT:
- Like, upvote, or react with emoji
- Follow or subscribe to other users
- See popularity metrics or rankings
- Send direct messages (unless in shared fork)

## No Popularity Metrics

The Commons does not display:
- ❌ Like/heart/upvote counts
- ❌ View counts
- ❌ Follower counts
- ❌ "Trending" or "hot" rankings
- ❌ Algorithmic recommendations

## Witnessing Creates a Record

When you witness a reflection:
- A **witness receipt** is created
- You cannot "un-witness" what you've seen
- The author knows someone witnessed (not who)
- Your witness count is visible to you only

Witnessing is **intentional**, not passive scrolling.

## Response Protocol

When responding to a reflection:
1. You must quote the specific part you're responding to
2. Your response links to the original (immutable)
3. The original author can see your response
4. Others can witness the response chain

Responses are:
- Permanent (cannot be edited after posting)
- Linked (always connected to original context)
- Public (visible to all Commons users)

## Posting Irreversibility

When you post to Commons:
⚠️ **Your reflection becomes public and permanent.**

You can:
- Delete your own copy
- Hide it from your view

You cannot:
- Edit it after others have witnessed
- Delete it from others' witness history
- Prevent responses (though you can ignore them)

## Anti-Toxicity Measures

Commons prohibits:
- Harassment or targeted abuse
- Hate speech or discrimination
- Impersonation
- Spam or advertising
- Coordinated manipulation

Violations trigger:
- Immediate post removal
- Suspension from Commons (not Sovereign)
- Receipt of violation to user
- Appeal process available

## Governance Can Modify

This article can be amended through governance:
- Witnessing protocol changes
- Response format changes
- Anti-toxicity rule updates

**Cannot be changed:**
- No popularity metrics (invariant)
- No hidden surveillance (Article 7)
- User sovereignty over own data (Article 1)`,
    rationale: 'Commons must allow connection without exploitation. No popularity contests, no engagement traps.',
    implications: [
      'Witnessing is intentional, not passive',
      'No likes, followers, or popularity metrics',
      'Responses are permanent and linked',
      'Anti-toxicity rules enforced',
      'Governance can amend witnessing protocol',
    ],
    examples: {
      allowed: [
        'User witnesses public reflection',
        'User responds with quoted context',
        'User posts own reflection to Commons',
        'Author sees witness count (not identities)',
      ],
      forbidden: [
        '❌ Like or upvote buttons',
        '❌ Follower/following counts',
        '❌ "Trending now" section',
        '❌ Algorithmic feed ranking',
        '❌ Anonymous harassment',
      ],
    },
  },
];

export function getArticleById(id: string): ConstitutionArticle | null {
  return CORE_CONSTITUTION.find(a => a.id === id) || null;
}

export function getArticlesByCategory(
  category: ConstitutionArticle['category']
): ConstitutionArticle[] {
  return CORE_CONSTITUTION.filter(a => a.category === category);
}

export function getCoreInvariants(): ConstitutionArticle[] {
  return CORE_CONSTITUTION.filter(a => a.invariant);
}

export function getAmendableArticles(): ConstitutionArticle[] {
  return CORE_CONSTITUTION.filter(a => !a.invariant);
}
