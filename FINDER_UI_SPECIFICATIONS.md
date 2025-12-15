# Mirror Finder - UI Component Specifications

TypeScript/React interfaces for all Finder UI components.

---

## Core Data Types

```typescript
// Mirror Finder Core Types
export type NodeType = 'thought' | 'belief' | 'emotion' | 'action' | 'experience' | 'consequence';
export type EdgeType = 'reinforces' | 'contradicts' | 'undermines' | 'leads_to' | 'co_occurs_with';
export type Posture = 'unknown' | 'overwhelmed' | 'guarded' | 'grounded' | 'open' | 'exploratory';
export type InteractionStyle = 'witness' | 'dialogue' | 'debate' | 'structured';
export type CardType = 'person' | 'room' | 'artifact' | 'practice';
export type MistakeType = 'consent_violation' | 'timing_mismatch' | 'corruption_risk' | 'bandwidth_overload' | 'discomfort';
export type AsymmetryLevel = 'low' | 'medium' | 'high';
export type EvidenceTier = 'declared' | 'attested' | 'observed';
export type FinderMode = 'first_mirror' | 'active' | 'manual' | 'random' | 'off';

export interface GraphNode {
  id: string;
  nodeType: NodeType;
  label: string;
  content: string;
  lensTags: string[];
  createdAt: string;
  lastActivated: string;
  activationCount: number;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  edgeType: EdgeType;
  weight: {
    frequency: number;
    intensity: number;
    recency: number;
    confidence: number;
  };
  lastObserved: string;
}

export interface Tension {
  id: string;
  nodeAId: string;
  nodeBId: string;
  name: string;
  energy: number;
  durationDays: number;
  lensTags: string[];
}

export interface TPV {
  userId: string;
  vector: Record<string, number>;
  isManualOverride: boolean;
  lastComputed: string | null;
  ambiguityScore: number;
  isNull: boolean;
}

export interface PostureState {
  declared: Posture;
  suggested: Posture | null;
  declaredAt: string;
  suggestedAt: string | null;
  divergenceCount: number;
  lastDivergencePrompt: string | null;
}

export interface FinderTarget {
  id: string;
  targetType: string;
  description: string;
  lensTags: string[];
  interactionStylePreference: InteractionStyle | null;
  intensityLevel: 'low' | 'medium' | 'high';
  userEdited: boolean;
}

export interface AsymmetryReport {
  exitFriction: AsymmetryLevel;
  dataDemandRatio: number;
  opacity: boolean;
  identityCoercion: boolean;
  unilateralControl: boolean;
  lockInTerms: boolean;
  evidenceTier: EvidenceTier;
  riskScore: number;
}

export interface CandidateCard {
  nodeId: string;
  cardType: CardType;
  interactionStyle: InteractionStyle;
  lensTags: string[];
  title?: string;
  description?: string;
  creatorId?: string;
  asymmetryReport?: AsymmetryReport;
  attestationCount: number;
  createdAt: string;
}

export interface ScoreComponents {
  postureFit: number;
  targetCoverage: number;
  tensionAdjacency: number;
  diversityPressure: number;
  novelty: number;
  riskPenalty: number;
}

export interface ScoredCandidate {
  card: CandidateCard;
  totalScore: number;
  components: ScoreComponents;
}

export interface Door {
  candidate: ScoredCandidate;
  targetMatch: FinderTarget;
  whyNow: string;
  dismissible: boolean;
}

export interface MistakeReport {
  mistakeType: MistakeType;
  nodeId: string;
  context: string;
  reportedAt: string;
  correctionApplied: boolean;
}
```

---

## Component: DoorCard

Display a single reflective possibility.

```tsx
interface DoorCardProps {
  door: Door;
  onEnter: (nodeId: string) => void;
  onDismiss: (nodeId: string) => void;
  onExplain: (door: Door) => void;
  onReportMistake: (nodeId: string) => void;
}

export const DoorCard: React.FC<DoorCardProps> = ({
  door,
  onEnter,
  onDismiss,
  onExplain,
  onReportMistake
}) => {
  return (
    <Card className="door-card">
      <CardHeader>
        <Badge variant={door.candidate.card.interactionStyle}>
          {door.candidate.card.interactionStyle}
        </Badge>
        {door.candidate.card.title && (
          <h3>{door.candidate.card.title}</h3>
        )}
      </CardHeader>
      
      <CardContent>
        <p className="why-now">{door.whyNow}</p>
        
        {door.candidate.card.description && (
          <p className="description">{door.candidate.card.description}</p>
        )}
        
        <div className="lens-tags">
          {door.candidate.card.lensTags.map(tag => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
        
        {door.candidate.card.asymmetryReport && (
          <AsymmetryIndicator report={door.candidate.card.asymmetryReport} />
        )}
        
        <div className="score-preview">
          <span className="total-score">
            Match: {Math.round(door.candidate.totalScore * 100)}%
          </span>
          <Button variant="ghost" onClick={() => onExplain(door)}>
            Why this door?
          </Button>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button onClick={() => onEnter(door.candidate.card.nodeId)}>
          Enter
        </Button>
        
        {door.dismissible && (
          <Button variant="outline" onClick={() => onDismiss(door.candidate.card.nodeId)}>
            Not now
          </Button>
        )}
        
        <Button variant="ghost" onClick={() => onReportMistake(door.candidate.card.nodeId)}>
          Report issue
        </Button>
      </CardFooter>
    </Card>
  );
};
```

---

## Component: ExplainPanel

Show score breakdown for transparency.

```tsx
interface ExplainPanelProps {
  door: Door;
  tpv: TPV;
  posture: Posture;
}

export const ExplainPanel: React.FC<ExplainPanelProps> = ({
  door,
  tpv,
  posture
}) => {
  const { components } = door.candidate;
  
  return (
    <Sheet>
      <SheetTrigger>Why this door?</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Score Breakdown</SheetTitle>
          <SheetDescription>
            How we calculated this match
          </SheetDescription>
        </SheetHeader>
        
        <div className="score-components">
          <ComponentBar
            label="Posture Fit"
            value={components.postureFit}
            explanation={`Matches your ${posture} posture with ${door.candidate.card.interactionStyle} style`}
          />
          
          <ComponentBar
            label="Target Coverage"
            value={components.targetCoverage}
            explanation={`Addresses: ${door.targetMatch.description}`}
          />
          
          <ComponentBar
            label="Tension Adjacency"
            value={components.tensionAdjacency}
            explanation="Similar but not identical tensions"
          />
          
          <ComponentBar
            label="Diversity Pressure"
            value={components.diversityPressure}
            explanation="Underrepresented in recent doors"
          />
          
          <ComponentBar
            label="Novelty"
            value={components.novelty}
            explanation={components.novelty > 0.5 ? "New to you" : "Seen before"}
          />
          
          {components.riskPenalty > 0 && (
            <ComponentBar
              label="Risk Penalty"
              value={-components.riskPenalty}
              explanation="Structural asymmetry detected"
              variant="warning"
            />
          )}
        </div>
        
        <div className="total-calculation">
          <p>Total Score: {Math.round(door.candidate.totalScore * 100)}%</p>
          <p className="footnote">
            Weights adjusted for {posture} posture
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
```

---

## Component: PostureSelector

Two-layer posture selection.

```tsx
interface PostureSelectorProps {
  currentState: PostureState;
  onSetDeclared: (posture: Posture) => void;
  onDismissSuggestion: () => void;
}

export const PostureSelector: React.FC<PostureSelectorProps> = ({
  currentState,
  onSetDeclared,
  onDismissSuggestion
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Posture</CardTitle>
      </CardHeader>
      
      <CardContent>
        <Label>Declared (canonical)</Label>
        <Select value={currentState.declared} onValueChange={onSetDeclared}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unknown">Unknown</SelectItem>
            <SelectItem value="overwhelmed">Overwhelmed</SelectItem>
            <SelectItem value="guarded">Guarded</SelectItem>
            <SelectItem value="grounded">Grounded</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="exploratory">Exploratory</SelectItem>
          </SelectContent>
        </Select>
        
        {currentState.suggested && currentState.suggested !== currentState.declared && (
          <Alert className="suggestion-alert">
            <AlertDescription>
              System suggests: <strong>{currentState.suggested}</strong>
              <p className="text-sm">
                Your recent activity suggests {currentState.suggested} posture, 
                but your declared {currentState.declared} is always canonical.
              </p>
              <Button variant="outline" onClick={onDismissSuggestion}>
                Keep {currentState.declared}
              </Button>
              <Button onClick={() => onSetDeclared(currentState.suggested!)}>
                Switch to {currentState.suggested}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
```

---

## Component: TPVEditor

View and edit Tension Proxy Vector.

```tsx
interface TPVEditorProps {
  tpv: TPV;
  lensCatalog: string[];
  onManualEdit: (vector: Record<string, number>) => void;
  onResetToComputed: () => void;
}

export const TPVEditor: React.FC<TPVEditorProps> = ({
  tpv,
  lensCatalog,
  onManualEdit,
  onResetToComputed
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tension Proxy Vector</CardTitle>
        <CardDescription>
          {tpv.isManualOverride ? "Manual override" : "Computed from lens usage"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {tpv.isNull ? (
          <Alert>
            <AlertDescription>
              Not enough lens usage data. Use instruments to build your TPV.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="tpv-chart">
            {Object.entries(tpv.vector)
              .sort((a, b) => b[1] - a[1])
              .map(([lens, weight]) => (
                <div key={lens} className="tpv-bar">
                  <Label>{lens}</Label>
                  <Progress value={weight * 100} />
                  <span>{Math.round(weight * 100)}%</span>
                </div>
              ))
            }
            
            {tpv.ambiguityScore > 0.3 && (
              <Alert>
                <AlertDescription>
                  {Math.round(tpv.ambiguityScore * 100)}% of usage is unlabeled
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        {tpv.isManualOverride && (
          <Button variant="outline" onClick={onResetToComputed}>
            Reset to computed TPV
          </Button>
        )}
        
        <Button variant="ghost" onClick={() => {/* Open manual editor */}}>
          Edit manually
        </Button>
      </CardContent>
    </Card>
  );
};
```

---

## Component: FinderAuditLog

Complete transparency into routing decisions.

```tsx
interface AuditLogEntry {
  mode: FinderMode;
  posture: Posture;
  tpv: TPV;
  targetsGenerated: number;
  candidatesQueried: number;
  candidatesGated: number;
  doorsPresented: number;
  timestamp: string;
}

interface FinderAuditLogProps {
  entries: AuditLogEntry[];
}

export const FinderAuditLog: React.FC<FinderAuditLogProps> = ({ entries }) => {
  return (
    <Accordion type="single" collapsible>
      {entries.map((entry, i) => (
        <AccordionItem key={i} value={`entry-${i}`}>
          <AccordionTrigger>
            {new Date(entry.timestamp).toLocaleString()} - {entry.doorsPresented} doors
          </AccordionTrigger>
          <AccordionContent>
            <dl className="audit-details">
              <dt>Mode</dt>
              <dd>{entry.mode}</dd>
              
              <dt>Posture</dt>
              <dd>{entry.posture}</dd>
              
              <dt>TPV Status</dt>
              <dd>{entry.tpv.isNull ? "Null (insufficient data)" : `${Object.keys(entry.tpv.vector).length} channels`}</dd>
              
              <dt>Pipeline</dt>
              <dd>
                {entry.targetsGenerated} targets → 
                {entry.candidatesQueried} candidates → 
                {entry.candidatesGated} after gates → 
                {entry.doorsPresented} doors
              </dd>
            </dl>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
```

---

## Component: MistakeReporter

Report Finder mistakes.

```tsx
interface MistakeReporterProps {
  nodeId: string;
  onSubmit: (report: Omit<MistakeReport, 'reportedAt' | 'correctionApplied'>) => void;
}

export const MistakeReporter: React.FC<MistakeReporterProps> = ({
  nodeId,
  onSubmit
}) => {
  const [mistakeType, setMistakeType] = React.useState<MistakeType>('timing_mismatch');
  const [context, setContext] = React.useState('');
  
  return (
    <Dialog>
      <DialogTrigger>Report issue</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Finder Mistake</DialogTitle>
          <DialogDescription>
            Help us learn delivery (not content) preferences
          </DialogDescription>
        </DialogHeader>
        
        <div className="mistake-form">
          <Label>What went wrong?</Label>
          <Select value={mistakeType} onValueChange={(v) => setMistakeType(v as MistakeType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consent_violation">
                Consent Violation (I blocked this)
              </SelectItem>
              <SelectItem value="timing_mismatch">
                Timing Mismatch (Wrong moment)
              </SelectItem>
              <SelectItem value="corruption_risk">
                Corruption Risk (Manipulative)
              </SelectItem>
              <SelectItem value="bandwidth_overload">
                Bandwidth Overload (Too many doors)
              </SelectItem>
              <SelectItem value="discomfort">
                Discomfort (Made me uncomfortable)
              </SelectItem>
            </SelectContent>
          </Select>
          
          {mistakeType === 'discomfort' && (
            <Alert>
              <AlertDescription>
                Note: Discomfort is not treated as negative signal. 
                We won't avoid similar content.
              </AlertDescription>
            </Alert>
          )}
          
          <Label>Context (optional)</Label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="What happened? What would have been better?"
          />
        </div>
        
        <DialogFooter>
          <Button onClick={() => onSubmit({ mistakeType, nodeId, context })}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

## Component: FinderModeToggle

User control over Finder operational mode.

```tsx
interface FinderModeToggleProps {
  currentMode: FinderMode;
  onSetMode: (mode: FinderMode) => void;
}

export const FinderModeToggle: React.FC<FinderModeToggleProps> = ({
  currentMode,
  onSetMode
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Finder Mode</CardTitle>
      </CardHeader>
      
      <CardContent>
        <RadioGroup value={currentMode} onValueChange={(v) => onSetMode(v as FinderMode)}>
          <div className="radio-item">
            <RadioGroupItem value="active" id="active" />
            <Label htmlFor="active">Active (Constitutional routing)</Label>
          </div>
          
          <div className="radio-item">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual">Manual (I choose)</Label>
          </div>
          
          <div className="radio-item">
            <RadioGroupItem value="random" id="random" />
            <Label htmlFor="random">Random (Surprise me)</Label>
          </div>
          
          <div className="radio-item">
            <RadioGroupItem value="off" id="off" />
            <Label htmlFor="off">Off (No doors)</Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
```

---

## API Hooks

```typescript
// React hooks for Finder API
export const useFinderDoors = (maxDoors: number = 3) => {
  return useQuery({
    queryKey: ['finder', 'doors', maxDoors],
    queryFn: async () => {
      const response = await fetch(`/api/finder/doors?max=${maxDoors}`);
      return response.json() as Promise<Door[]>;
    },
    staleTime: 60000, // 1 minute
  });
};

export const useTPV = () => {
  return useQuery({
    queryKey: ['finder', 'tpv'],
    queryFn: async () => {
      const response = await fetch('/api/finder/tpv');
      return response.json() as Promise<TPV>;
    },
  });
};

export const usePostureState = () => {
  return useQuery({
    queryKey: ['finder', 'posture'],
    queryFn: async () => {
      const response = await fetch('/api/finder/posture');
      return response.json() as Promise<PostureState>;
    },
  });
};

export const useReportMistake = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (report: Omit<MistakeReport, 'reportedAt' | 'correctionApplied'>) => {
      const response = await fetch('/api/finder/mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finder'] });
    },
  });
};
```

---

## Integration Points

### MirrorX Context Call
```typescript
// What MirrorX Engine calls to get Finder context
interface FinderContext {
  doors: Door[];
  tpv: TPV;
  posture: Posture;
  recentTargets: FinderTarget[];
  auditLog: AuditLogEntry[];
}

export const getFinderContext = async (userId: string): Promise<FinderContext> => {
  const response = await fetch(`/api/finder/context/${userId}`);
  return response.json();
};
```

### Commons Query
```typescript
// How local instance queries Commons
export const queryCommonsCards = async (
  lensTags: string[],
  interactionStyle?: InteractionStyle,
  maxResults: number = 50
): Promise<CandidateCard[]> => {
  const params = new URLSearchParams({
    lens_tags: lensTags.join(','),
    max_results: maxResults.toString(),
  });
  
  if (interactionStyle) {
    params.append('interaction_style', interactionStyle);
  }
  
  const response = await fetch(`${COMMONS_URL}/v1/cards?${params}`);
  const data = await response.json();
  return data.cards;
};
```

---

**Document Status**: Implementation-Ready  
**UI Framework**: React + TypeScript + shadcn/ui  
**State Management**: TanStack Query (React Query)  
**Next**: Implement components in frontend/src/components/finder/
