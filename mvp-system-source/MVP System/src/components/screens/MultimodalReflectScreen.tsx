import { useState } from 'react';
import { Textarea } from '../Input';
import { Button } from '../Button';
import { Card } from '../Card';
import { ModalityChip } from '../Chip';
import { Mic, Video, FileText, Type } from 'lucide-react';

type Modality = 'text' | 'voice' | 'video' | 'document';

interface MultimodalReflectScreenProps {
  defaultMode?: Modality;
}

export function MultimodalReflectScreen({ defaultMode = 'text' }: MultimodalReflectScreenProps = {}) {
  const [selectedModality, setSelectedModality] = useState<Modality>(defaultMode);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="mb-2">Reflect</h1>
        <p className="text-[var(--color-text-secondary)]">
          Choose how you want to reflect today
        </p>
      </div>

      {/* Modality Selector */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <ModalityButton
          icon={<Type size={20} />}
          label="Text"
          active={selectedModality === 'text'}
          onClick={() => setSelectedModality('text')}
        />
        <ModalityButton
          icon={<Mic size={20} />}
          label="Voice"
          active={selectedModality === 'voice'}
          onClick={() => setSelectedModality('voice')}
        />
        <ModalityButton
          icon={<Video size={20} />}
          label="Video"
          active={selectedModality === 'video'}
          onClick={() => setSelectedModality('video')}
        />
        <ModalityButton
          icon={<FileText size={20} />}
          label="Document"
          active={selectedModality === 'document'}
          onClick={() => setSelectedModality('document')}
        />
      </div>

      {/* Modality Content */}
      {selectedModality === 'text' && <TextReflection />}
      {selectedModality === 'voice' && <VoiceReflection />}
      {selectedModality === 'video' && <VideoReflection />}
      {selectedModality === 'document' && <DocumentReflection />}
    </div>
  );
}

function ModalityButton({ 
  icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
        ${active 
          ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10' 
          : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
        }
      `}
    >
      <div className={active ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-muted)]'}>
        {icon}
      </div>
      <span className={`text-sm ${active ? 'text-[var(--color-text-accent)]' : 'text-[var(--color-text-secondary)]'}`}>
        {label}
      </span>
    </button>
  );
}

function TextReflection() {
  const [input, setInput] = useState('');

  return (
    <div className="flex flex-col gap-6">
      <Textarea
        value={input}
        onChange={setInput}
        placeholder="Write what feels most present right now..."
        rows={8}
      />
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-muted)]">
          Engine: MirrorCore v1.0.3 • Stored locally
        </span>
        <Button disabled={!input.trim()}>
          Reflect
        </Button>
      </div>
    </div>
  );
}

function VoiceReflection() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);

  const handleRecord = () => {
    setIsRecording(!isRecording);
    if (isRecording) {
      setHasRecording(true);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="text-center py-12">
          <button
            onClick={handleRecord}
            className={`
              w-24 h-24 rounded-full mx-auto mb-6
              flex items-center justify-center
              transition-all
              ${isRecording 
                ? 'bg-[var(--color-accent-red)] animate-pulse scale-110' 
                : 'bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold-deep)]'
              }
            `}
          >
            <Mic size={32} className="text-[var(--color-text-inverse)]" />
          </button>
          
          <h3 className="mb-2">
            {isRecording ? 'Recording...' : hasRecording ? 'Recording Complete' : 'Hold to Speak'}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {isRecording 
              ? 'Click to stop recording' 
              : hasRecording 
              ? 'Your voice recording is ready'
              : 'Your audio stays on this device unless you choose otherwise'
            }
          </p>
        </div>

        {!isRecording && !hasRecording && (
          <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked className="rounded" />
              <span>Save transcript</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" />
              <span>Use this voice clip for learning</span>
            </label>
            <p className="text-xs text-[var(--color-text-muted)]">
              You can always change this later in History
            </p>
          </div>
        )}

        {hasRecording && (
          <div className="pt-6 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-12 bg-[var(--color-base-raised)] rounded flex items-center px-4">
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Transcribing...
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1">Reflect on This</Button>
              <Button variant="ghost" onClick={() => setHasRecording(false)}>Discard</Button>
            </div>
          </div>
        )}
      </Card>

      <div className="text-xs text-[var(--color-text-muted)] text-center">
        Voice processing happens locally. No audio leaves your device.
      </div>
    </div>
  );
}

function VideoReflection() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="aspect-video bg-[var(--color-base-sunken)] rounded-lg mb-6 flex items-center justify-center">
          <div className="text-center">
            <Video size={48} className="text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-text-muted)]">
              Camera preview
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked className="rounded" />
            <span>Show my face (default on for honesty)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded" />
            <span>Analyze body language {"&"} tone</span>
          </label>
        </div>

        <Button 
          onClick={() => setIsRecording(!isRecording)}
          variant={isRecording ? 'destructive' : 'primary'}
          className="w-full"
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
      </Card>

      <div className="text-xs text-[var(--color-text-muted)] text-center">
        Your video is stored locally. You decide if Mirror learns from it.
      </div>
    </div>
  );
}

function DocumentReflection() {
  const [hasDocument, setHasDocument] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="text-center py-12">
          <FileText size={48} className="text-[var(--color-text-muted)] mx-auto mb-4" />
          <h3 className="mb-2">Import or Write Longform</h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Reflect on journal entries, essays, or extended writing
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setHasDocument(true)}>
              Paste Text
            </Button>
            <Button variant="secondary">
              Import File
            </Button>
          </div>
        </div>

        {hasDocument && (
          <div className="pt-6 border-t border-[var(--color-border-subtle)]">
            <Textarea
              value=""
              onChange={() => {}}
              placeholder="Paste your longform writing here..."
              rows={12}
            />
            <div className="flex gap-2 mt-4">
              <Button>Reflect on This</Button>
              <Button variant="ghost" onClick={() => setHasDocument(false)}>Clear</Button>
            </div>
          </div>
        )}
      </Card>

      <div className="text-xs text-[var(--color-text-muted)] text-center">
        Select specific passages to reflect on, or let Mirror read the whole document
      </div>
    </div>
  );
}