# 🚨 Crisis & Safety System - Complete Architecture

## Vision & Philosophy

The Crisis/Safety system is **not** an emergency service—it's a compassionate, intelligent layer that:
- Detects patterns of distress through identity graph analysis
- Provides immediate grounding resources
- Facilitates creation and access to personalized safety plans
- Connects to governance for guardian intervention when needed
- Maintains complete audit trails for ethical accountability
- Integrates with the broader Mirror ecosystem (MirrorX AI, Identity Graph, Governance)

**Core Principle**: Prevention through pattern recognition + immediate compassionate response + escalation to human guardians when needed.

---

## System Architecture

### 1. Database Schema (Already Created ✅)

#### `safety_events` table
```sql
- id: BIGSERIAL PRIMARY KEY
- identity_id: UUID (references profiles)
- reflection_id: BIGINT (references reflections)
- category: TEXT (crisis_detected, safety_plan_created, guardian_notified, etc.)
- severity: safety_severity ENUM (info, warning, critical)
- action_taken: TEXT
- metadata: JSONB (detailed context, scores, patterns)
- created_at: TIMESTAMPTZ
```

#### `regression_markers` table (for pattern detection)
```sql
- id: BIGSERIAL PRIMARY KEY
- identity_id: UUID
- reflection_id: BIGINT
- kind: regression_type ENUM (loop, self_attack, judgment_spike, avoidance)
- description: TEXT
- severity: INTEGER (1-5)
- pattern_id: TEXT
- created_at: TIMESTAMPTZ
```

### 2. Crisis Detection Engine

**Location**: `core-api/app/services/crisis_detector.py` (NEW)

**Responsibilities**:
- Analyze reflections for crisis indicators using heuristics + ML
- Track regression patterns from identity graph
- Calculate crisis risk scores
- Trigger safety events
- Interface with MirrorX for AI-powered analysis

**Key Functions**:
```python
class CrisisDetector:
    async def analyze_reflection(reflection_id, content) -> CrisisAnalysis
    async def get_user_risk_score(identity_id) -> RiskScore
    async def detect_regression_patterns(identity_id, timeframe) -> List[RegressionMarker]
    async def should_alert_guardians(identity_id, crisis_analysis) -> bool
    async def create_safety_event(identity_id, category, severity, metadata) -> SafetyEvent
```

**Crisis Indicators**:
- Explicit self-harm language (keyword matching)
- Sustained negative sentiment patterns (from bias_insights)
- Regression loops (from regression_markers)
- Judgment spikes (from signal patterns)
- Avoidance patterns (lack of reflection, withdrawal)
- Integration with MirrorX tension analysis

### 3. Safety Plan System

**Location**: `core-api/app/services/safety_plans.py` (NEW)

**Responsibilities**:
- CRUD operations for personalized safety plans
- Versioning system for plan evolution
- Emergency contact management
- Crisis step templates (grounding, distraction, reaching out, etc.)
- Integration with identity graph for personalized recommendations

**Safety Plan Structure** (stored in safety_events metadata):
```json
{
  "plan_id": "uuid",
  "version": 2,
  "identity_id": "uuid",
  "warning_signs": ["feeling numb", "can't sleep", "avoiding people"],
  "coping_strategies": [
    {"step": 1, "action": "Pause and Ground exercises", "duration": "5 min"},
    {"step": 2, "action": "Call trusted friend", "contacts": ["contact_id_1"]},
    {"step": 3, "action": "Text crisis line", "resource": "741741"}
  ],
  "emergency_contacts": [
    {"name": "Sam", "phone": "xxx-xxx-xxxx", "relationship": "friend", "can_call_anytime": true},
    {"name": "Therapist Dr. Lee", "phone": "xxx-xxx-xxxx", "available": "Mon-Fri 9-5"}
  ],
  "reasons_to_live": ["my dog", "seeing mountains again", "finishing my book"],
  "environment_safety": {
    "remove_access_to": ["list of specific items"],
    "safe_space_location": "bedroom corner with pillows"
  },
  "professional_contacts": [
    {"type": "therapist", "name": "Dr. Lee", "phone": "xxx"},
    {"type": "crisis_line", "name": "988", "phone": "988"}
  ],
  "created_at": "timestamp",
  "last_updated": "timestamp"
}
```

### 4. Escalation Workflows

**Location**: `core-api/app/services/crisis_escalation.py` (NEW)

**Escalation Levels**:
1. **Level 1 - Info**: Log event, no action needed
2. **Level 2 - Warning**: Prompt user to access safety plan, notify them of resources
3. **Level 3 - Critical**: Alert designated guardians, create governance notification, log for review

**Guardian Integration**:
- Connect to governance system to identify user's chosen guardians
- Send notifications through existing notification system
- Create governance event for guardian review
- Maintain audit trail of all escalations

### 5. API Router - Crisis Endpoints

**Location**: `core-api/app/routers/crisis.py` (NEW)

**Endpoints**:

#### Safety Events
```python
POST   /api/crisis/events              # Create safety event (system or user-triggered)
GET    /api/crisis/events              # List user's safety events
GET    /api/crisis/events/{id}         # Get specific event details
GET    /api/crisis/events/stats        # Get user's crisis statistics/trends
```

#### Safety Plans
```python
POST   /api/crisis/safety-plan         # Create new safety plan
GET    /api/crisis/safety-plan         # Get current safety plan
PUT    /api/crisis/safety-plan         # Update safety plan
GET    /api/crisis/safety-plan/history # Get previous versions
DELETE /api/crisis/safety-plan         # Delete safety plan

POST   /api/crisis/safety-plan/contacts    # Add emergency contact
PUT    /api/crisis/safety-plan/contacts/{id} # Update contact
DELETE /api/crisis/safety-plan/contacts/{id} # Remove contact
```

#### Crisis Detection
```python
POST   /api/crisis/analyze             # Analyze reflection for crisis indicators
GET    /api/crisis/risk-score          # Get current user risk score
GET    /api/crisis/patterns            # Get regression patterns
POST   /api/crisis/check-in            # Manual user check-in
```

#### Escalation
```python
POST   /api/crisis/escalate            # Manually trigger escalation
GET    /api/crisis/guardians           # Get user's designated guardians
POST   /api/crisis/guardians/alert     # Alert specific guardian
```

#### Resources
```python
GET    /api/crisis/resources           # Get crisis resources (hotlines, etc.)
GET    /api/crisis/grounding-exercises # Get grounding exercise list
```

### 6. Frontend Integration

**API Client** (`frontend/src/lib/api.ts` addition):
```typescript
export const crisis = {
  // Safety Events
  createEvent: (data: SafetyEventCreate) => api.post('/crisis/events', data),
  getEvents: (params: { limit?: number; severity?: string }) => api.get('/crisis/events', { params }),
  getEvent: (id: number) => api.get(`/crisis/events/${id}`),
  getStats: () => api.get('/crisis/events/stats'),

  // Safety Plans
  createSafetyPlan: (data: SafetyPlanCreate) => api.post('/crisis/safety-plan', data),
  getSafetyPlan: () => api.get('/crisis/safety-plan'),
  updateSafetyPlan: (data: SafetyPlanUpdate) => api.put('/crisis/safety-plan', data),
  getPlanHistory: () => api.get('/crisis/safety-plan/history'),
  deleteSafetyPlan: () => api.delete('/crisis/safety-plan'),

  // Emergency Contacts
  addContact: (contact: EmergencyContact) => api.post('/crisis/safety-plan/contacts', contact),
  updateContact: (id: string, contact: EmergencyContact) => api.put(`/crisis/safety-plan/contacts/${id}`, contact),
  deleteContact: (id: string) => api.delete(`/crisis/safety-plan/contacts/${id}`),

  // Crisis Detection
  analyzeReflection: (reflectionId: number) => api.post('/crisis/analyze', { reflection_id: reflectionId }),
  getRiskScore: () => api.get('/crisis/risk-score'),
  getPatterns: (params: { days?: number }) => api.get('/crisis/patterns', { params }),
  checkIn: (data: { mood: string; notes?: string }) => api.post('/crisis/check-in', data),

  // Escalation
  escalate: (reason: string) => api.post('/crisis/escalate', { reason }),
  getGuardians: () => api.get('/crisis/guardians'),
  alertGuardian: (guardianId: string, message: string) => api.post(`/crisis/guardians/alert`, { guardian_id: guardianId, message }),

  // Resources
  getResources: () => api.get('/crisis/resources'),
  getGroundingExercises: () => api.get('/crisis/grounding-exercises'),
};
```

### 7. CrisisScreen Enhancements

**Current State**: Basic UI with static resources  
**Enhanced Version**: Connected to backend with:

1. **Real-time Risk Score Display**: Show user's current risk level
2. **Safety Plan Quick Access**: Load and display user's safety plan
3. **Crisis History Timeline**: Show past safety events with patterns
4. **Smart Resource Recommendations**: Based on current risk score and patterns
5. **Guardian Contact Interface**: Ability to reach out to designated guardians
6. **Crisis Check-In**: Quick mood/status logging
7. **Pattern Visualization**: Show regression markers on timeline

### 8. Integration Points

#### With MirrorX Engine
- Crisis detection uses MirrorX bias analysis and tension surfacing
- MirrorX provides natural language understanding for crisis indicators
- MirrorBack generation includes crisis-aware responses

#### With Identity Graph
- Track regression patterns over time
- Identify loops and triggers from graph structure
- Use tension analysis for early warning

#### With Governance System
- Guardian designation and management
- Escalation creates governance notifications
- Constitutional rules for crisis intervention

#### With Notification System
- Safety plan reminders
- Guardian alerts
- Crisis resource notifications

### 9. Monitoring & Analytics

**Crisis Dashboard** (for guardians/admins):
- Platform-wide crisis statistics (anonymized)
- Response time metrics
- Escalation effectiveness tracking
- Resource utilization patterns

**User Analytics**:
- Personal crisis trend charts
- Pattern detection history
- Safety plan usage tracking
- Progress indicators

### 10. Ethical Considerations

**Privacy**:
- All safety events are private by default
- User controls what guardians can see
- Encrypted storage of sensitive plan details
- Constitutional right to disconnect from crisis system

**Transparency**:
- Users see all crisis detection logic
- Audit trail of all escalations
- Explanation of risk score calculations
- User can challenge/dispute automated detections

**Human-in-the-Loop**:
- No automated emergency services contact without user consent
- Guardians are humans, not algorithms
- User always has final say in escalation

---

## Implementation Plan

### Phase 1: Core Infrastructure (Current)
1. ✅ Database schema created
2. ⏳ Crisis detector service
3. ⏳ Safety plan service
4. ⏳ Crisis router endpoints

### Phase 2: Detection & Analysis
5. Crisis detection heuristics
6. Integration with MirrorX
7. Regression pattern tracking
8. Risk score calculation

### Phase 3: Frontend Integration
9. API client methods
10. CrisisScreen backend connection
11. SafetyPlanInstrument editor
12. Crisis history visualizations

### Phase 4: Escalation & Monitoring
13. Guardian notification system
14. Escalation workflows
15. Crisis analytics dashboard
16. Monitoring and alerting

### Phase 5: Testing & Refinement
17. Crisis scenario testing
18. Guardian workflow testing
19. Performance optimization
20. Security audit

---

## Success Metrics

- **Detection Accuracy**: % of true crisis situations detected
- **False Positive Rate**: % of false alarms
- **Response Time**: Time from detection to resource access
- **User Adoption**: % of users with safety plans
- **Guardian Response**: % of guardian alerts answered
- **Escalation Appropriateness**: Guardian review of escalation decisions

---

## Future Enhancements

1. **Machine Learning**: Train models on anonymized crisis patterns
2. **Real-time Monitoring**: WebSocket connections for live risk tracking
3. **Integration with Professional Services**: Direct connection to crisis counselors
4. **Peer Support Network**: Connect users in similar situations
5. **Predictive Analytics**: Forecast high-risk periods based on patterns
6. **Mobile App**: Panic button and offline safety plan access
7. **Wearable Integration**: Heart rate, sleep patterns for early detection
8. **Multi-language Support**: Crisis resources in multiple languages

---

**Document Version**: 1.0  
**Last Updated**: December 15, 2025  
**Status**: Ready for Implementation
