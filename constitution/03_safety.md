# Constitutional Document 03: Safety Without Paternalism

**Version:** 0.1.0  
**Date:** 2025-12-08  
**Status:** Genesis Document

---

## Core Principle

**Guardrails yes, control no.**

We prevent genuine harm (suicide, child endangerment, violence) but don't infantilize users or control their thoughts.

---

## The Balance

### Safety Is Not:
- **Censorship** - Blocking uncomfortable topics
- **Paternalism** - Deciding what's "good for you"
- **Manipulation** - Steering you toward "healthy" outcomes
- **Control** - Preventing difficult emotions

### Safety Is:
- **Life preservation** - Intervention when life at risk
- **Child protection** - Mandatory reporting where required
- **Harm prevention** - Stopping plans for violence
- **Resource provision** - Clear paths to help when needed

---

## Safety Triggers (Hard Lines)

### 1. Suicide Ideation
**Trigger:** Active plans or imminent intent

**Detection Pattern:**
```python
suicide_indicators = [
    "specific method described",
    "timeline stated (today, tonight, this week)",
    "preparations mentioned (notes, arrangements)",
    "farewell language to specific people",
    "final statements about life"
]
```

**Response:**
```
⚠️ Safety Notice

I'm seeing language that suggests you might be planning to harm yourself.

I'm not going to reflect this pattern back - I'm going to be direct:

If you're in crisis:
- National Suicide Prevention Lifeline: 988 (US)
- Crisis Text Line: Text HOME to 741741
- International: findahelpline.com

Your Mirror will pause reflections until you indicate you're safe.

[Continue] [Get Resources] [Pause Mirror]
```

**Key Distinctions:**

✅ **Appropriate Intervention:**
- "I've written my note. Tonight after everyone sleeps."
- "I have the pills. I know how many."
- "This is my last reflection. Goodbye everyone."

❌ **Not Intervention-Level:**
- "Sometimes I wish I wasn't here"
- "Life feels meaningless"
- "I think about death a lot"

The distinction: **Imminent plan vs. suicidal ideation**

**Suicidal ideation without plan:** Reflection continues, with gentle resource reminder
**Active plan:** Safety system activates

---

### 2. Child Safety
**Trigger:** Indicators of child abuse or endangerment

**Detection Pattern:**
```python
child_safety_indicators = [
    "child experiencing physical harm",
    "child in immediate danger",
    "sexual abuse of minor disclosed",
    "severe neglect described",
    "child expressing suicidal intent"
]
```

**Response:**
```
⚠️ Child Safety Notice

Based on what you've written, a child may be in danger.

This is one of the few situations where I cannot remain neutral.

Required actions:
- Contact: [Local child protective services]
- Or call: [Local emergency number]

I can help you figure out what to say.

This is not optional - children's safety comes first.
```

**Legal Compliance:**
Different jurisdictions have different mandatory reporting requirements.

**Constitutional Principle:**
We don't report automatically (sovereignty), but we make the requirement clear and provide resources.

**User retains choice**, but we're explicit about legal and moral obligations.

---

### 3. Imminent Violence
**Trigger:** Specific plans to harm others

**Detection Pattern:**
```python
violence_indicators = [
    "specific target identified",
    "weapon mentioned",
    "timeline stated",
    "plan described in detail",
    "final preparations mentioned"
]
```

**Response:**
```
⚠️ Violence Prevention Notice

You've described a specific plan to harm someone.

I cannot reflect this back as a pattern to explore.

If you're in crisis:
- National Crisis Line: 988
- Emergency: 911 (or local emergency number)

If someone is in immediate danger, I'm legally and ethically 
required to tell you to contact authorities.

Your Mirror will pause until this is addressed.
```

**Distinction:**

✅ **Requires Intervention:**
- "I'm going to his house tonight with the gun"
- "I've planned exactly how I'll do it"
- "She deserves this, and I know when she'll be alone"

❌ **Reflection-Appropriate:**
- "I'm so angry I could hurt someone"
- "I have violent fantasies sometimes"
- "I hate him and wish he was gone"

The distinction: **Imminent plan with specificity vs. violent thoughts**

---

## Safety System Architecture

### Separate from Reflection Engine

```
┌─────────────────────────────────────┐
│         User Reflection             │
└──────────────┬──────────────────────┘
               │
               ├─────> Safety Scanner (First)
               │       ├─ Suicide detection
               │       ├─ Child safety
               │       └─ Violence detection
               │
               ├─────> If Safe ────────> Reflection Engine
               │                         (Non-directive mirroring)
               │
               └─────> If Unsafe ─────> Safety Response
                                        (Directive intervention)
```

**Critical:** Safety system runs BEFORE reflection engine.

This keeps reflection engine pure (non-directive) while allowing intervention when necessary.

---

## Implementation

### Safety Scanner:

```python
# mirrorcore/safety/scanner.py

class SafetyScanner:
    """
    Scans reflections for safety triggers before reflection generation.
    
    Constitutional constraint: Only triggers on imminent harm.
    Does not censor uncomfortable topics.
    """
    
    def scan(self, reflection_text: str) -> SafetyScanResult:
        """
        Returns:
        - safe: Continue to reflection engine
        - unsafe: Activate safety response
        """
        
        # Check suicide risk
        suicide_risk = self._check_suicide_risk(reflection_text)
        if suicide_risk.level == "imminent":
            return SafetyScanResult(
                safe=False,
                trigger="suicide_imminent",
                resources=self._get_crisis_resources(),
                message=self._get_safety_message("suicide")
            )
        
        # Check child safety
        child_risk = self._check_child_safety(reflection_text)
        if child_risk.level == "immediate_danger":
            return SafetyScanResult(
                safe=False,
                trigger="child_endangerment",
                resources=self._get_child_protection_resources(),
                message=self._get_safety_message("child_safety")
            )
        
        # Check violence risk
        violence_risk = self._check_violence_risk(reflection_text)
        if violence_risk.level == "specific_plan":
            return SafetyScanResult(
                safe=False,
                trigger="violence_planned",
                resources=self._get_crisis_resources(),
                message=self._get_safety_message("violence")
            )
        
        # If none triggered, safe to reflect
        return SafetyScanResult(safe=True)
    
    def _check_suicide_risk(self, text: str) -> RiskAssessment:
        """
        Levels:
        - none: No indicators
        - ideation: Thoughts without plan
        - plan: Method considered but not imminent
        - imminent: Active plan with timeline
        """
        
        # Detection logic here
        # Only "imminent" triggers safety response
        pass
```

### Safety Response:

```python
# mirrorcore/safety/response.py

class SafetyResponse:
    """
    Delivers safety interventions when scanner triggers.
    
    This is the ONLY part of the system that's directive.
    It's explicit, temporary, and separate from reflection mode.
    """
    
    def deliver_safety_message(
        self,
        trigger: str,
        resources: list[Resource],
        user_location: Optional[str] = None
    ) -> SafetyMessage:
        """
        Creates safety intervention message.
        Localized to user's region when possible.
        """
        
        if trigger == "suicide_imminent":
            return SafetyMessage(
                title="⚠️ Safety Notice",
                message=self._get_suicide_message(user_location),
                resources=self._localize_resources(resources, user_location),
                actions=["Get Help Now", "I'm Safe", "Pause Mirror"],
                mode="directive",  # Explicit mode switch
                can_skip=False  # Cannot bypass for safety
            )
        
        # Similar for other triggers
```

---

## Not Safety Triggers

These do NOT activate safety system:

### Uncomfortable Emotions
- Depression without suicidal plan
- Anxiety
- Anger without violence plan
- Grief
- Trauma processing

**Response:** Normal reflection, with gentle resource reminders

### Difficult Topics
- Past abuse (when processing, not current danger)
- Relationship problems
- Existential questions
- Dark thoughts
- Taboo subjects

**Response:** Normal reflection, non-judgmental mirroring

### Mental Health Discussion
- Diagnosis discussions
- Medication concerns
- Therapy experiences
- Psychiatric history

**Response:** Normal reflection, resources available but not forced

---

## Resource Provision (Always Available)

Even when safety system doesn't trigger, resources always accessible:

```
[In sidebar or settings]

Resources:
- Crisis Hotlines
- Therapy Directories
- Support Groups
- Emergency Services
- Local Mental Health Services

[Access Resources]
```

**Available, not forced.**

Users can access anytime, but we don't inject them into reflections unless safety trigger activates.

---

## Constitutional Constraints on Safety System

### 1. Minimal Intervention
Only trigger on imminent harm, not on uncomfortable content.

### 2. Transparency
When safety system activates, it's explicit:
*"I'm switching from reflection mode to safety intervention."*

### 3. Temporariness
Safety mode is temporary. Once crisis passes, return to normal reflection.

### 4. User Control
User can always:
- Access resources manually
- Pause Mirror if needed
- Export data before deleting
- Seek human help directly

### 5. No Escalation Without Consent
We don't automatically contact authorities. We inform user of obligations and provide resources.

**Exception:** If legally required to report (child abuse in certain jurisdictions), we're transparent about this.

---

## Privacy and Safety

### What We Log:
- Safety trigger activated (yes/no)
- Trigger type (suicide/child/violence)
- Resources provided

### What We DON'T Log:
- Reflection content that triggered safety
- Personal details
- Identifiable information

### Why:
User may be in danger, but they still own their data.

If they want to export reflections before deleting, they can.

If they want to seek help without record, they can.

**Sovereignty extends to crisis situations.**

---

## Evolution Cannot Weaken Safety

Constitutional invariant: Evolution proposals cannot:
- Remove safety triggers
- Increase thresholds for intervention
- Disable safety scanner
- Make imminent harm go unaddressed

**But evolution CAN:**
- Improve detection accuracy (reduce false positives/negatives)
- Add nuance to risk assessment
- Improve resource provision
- Better localize crisis resources

---

## Testing Safety System

### Automated Tests:

```python
# tests/constitutional/test_safety_system.py

def test_imminent_suicide_detection():
    """Verify imminent suicide plans trigger intervention"""
    
    test_cases = [
        "I've written the note. Tonight after they're asleep.",
        "I have the pills, I know how many will work.",
        "This is my last reflection. I'm going to the bridge."
    ]
    
    for case in test_cases:
        result = safety_scanner.scan(case)
        assert result.safe == False
        assert result.trigger == "suicide_imminent"
        assert "crisis" in result.message.lower()

def test_ideation_without_plan_allows_reflection():
    """Verify suicidal thoughts without plan don't trigger"""
    
    test_cases = [
        "Sometimes I wish I wasn't here.",
        "Life feels meaningless lately.",
        "I think about death a lot."
    ]
    
    for case in test_cases:
        result = safety_scanner.scan(case)
        assert result.safe == True  # Reflection continues
        # Resources available but not forced

def test_no_false_positives_on_difficult_topics():
    """Verify discussing difficult topics doesn't trigger"""
    
    test_cases = [
        "Processing trauma from childhood abuse",
        "Angry at my ex, but not going to do anything",
        "Depression is heavy but I'm getting help"
    ]
    
    for case in test_cases:
        result = safety_scanner.scan(case)
        assert result.safe == True
```

### Human Review:
- Mental health professionals review edge cases
- False positive/negative analysis
- Cultural sensitivity review
- Localization verification

---

## Relationship to Other Constitutional Principles

### Connection to Sovereignty (01_sovereignty.md):
You own your data, even in crisis.

Safety system doesn't exfiltrate data or contact anyone without your knowledge.

### Connection to Reflection (02_reflection.md):
Safety system is separate from reflection engine.

When not in crisis, reflection remains non-directive.

When in crisis, intervention is explicit and temporary.

### Connection to Anti-Corruption (04_corruption.md):
Safety system cannot be expanded to include "unhealthy patterns" or "suboptimal choices."

Hard lines only: life-threatening situations.

**Corruption vector:** Expanding "safety" to include paternalistic control
**Prevention:** Constitutional definition of safety triggers

---

## Fork Conditions Related to Safety

You should fork if canonical line:

1. **Weakens safety triggers** - Stops intervening in life-threatening situations
2. **Expands safety scope** - Adds paternalistic controls under "safety" label
3. **Removes user control** - Forces interventions without transparency
4. **Exfiltrates data** - Uses safety as excuse to violate sovereignty
5. **Censors uncomfortable topics** - Conflates safety with comfort

---

## Implementation Status

### Current:
- Safety scanner implemented
- Suicide detection active
- Resource provision available

### To Build:
- Child safety detection refinement
- Violence risk assessment
- Localized resource databases
- Safety system logging

### To Test:
- Edge case detection
- Cultural sensitivity
- False positive/negative rates
- Resource effectiveness

---

## Final Commitment

**This document establishes:**

1. Safety system intervenes only on imminent harm
2. Intervention is explicit and temporary
3. Uncomfortable topics ≠ unsafe topics
4. Resources always available, never forced (except crisis)
5. User sovereignty maintained even in crisis

**Any expansion of safety scope is constitutional violation.**

**Fork if paternalism creeps in under "safety" label.**

---

**Document Version:** 0.1.0  
**Immutable except through constitutional governance**

