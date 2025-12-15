/**
 * Template System - Reflection templates and frameworks
 * 
 * Features:
 * - Pre-defined reflection frameworks
 * - Custom template creation
 * - Constitutional prompts only
 * - No prescriptive guidance
 * - User-defined structures
 * - Template library
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Star,
  Layout,
  List,
  CheckCircle,
  X
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { Badge } from '../finder/Badge';

interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'multiselect';
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  fields: TemplateField[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite?: boolean;
  isBuiltIn?: boolean;
  useCount?: number;
}

interface TemplateSystemProps {
  templates: Template[];
  onUseTemplate: (templateId: string, values: Record<string, any>) => void;
  onCreateTemplate?: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTemplate?: (templateId: string, updates: Partial<Template>) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onToggleFavorite?: (templateId: string) => void;
}

export function TemplateSystem({
  templates,
  onUseTemplate,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onToggleFavorite,
}: TemplateSystemProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'favorites' | 'custom'>('all');

  const filteredTemplates = templates.filter(template => {
    if (filter === 'favorites') return template.isFavorite;
    if (filter === 'custom') return !template.isBuiltIn;
    return true;
  });

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowUseModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium mb-1">Reflection Frameworks</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Structures to support your reflection process
          </p>
        </div>
        {onCreateTemplate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create Template
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'favorites', 'custom'] as const).map(filterOption => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === filterOption
                ? 'bg-[var(--color-accent-blue)] text-white'
                : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={() => handleUseTemplate(template)}
            onEdit={onUpdateTemplate ? () => {
              setSelectedTemplate(template);
              setShowCreateModal(true);
            } : undefined}
            onDelete={onDeleteTemplate ? () => onDeleteTemplate(template.id) : undefined}
            onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(template.id) : undefined}
          />
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              No templates found
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <TemplateEditor
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedTemplate(null);
          }}
          onSave={(template) => {
            if (selectedTemplate) {
              onUpdateTemplate?.(selectedTemplate.id, template);
            } else {
              onCreateTemplate?.(template);
            }
            setShowCreateModal(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate || undefined}
        />
      )}

      {/* Use Template Modal */}
      {showUseModal && selectedTemplate && (
        <TemplateUseModal
          isOpen={showUseModal}
          onClose={() => {
            setShowUseModal(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          onSubmit={(values) => {
            onUseTemplate(selectedTemplate.id, values);
            setShowUseModal(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
}

// Template Card

interface TemplateCardProps {
  template: Template;
  onUse: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
}

function TemplateCard({ template, onUse, onEdit, onDelete, onToggleFavorite }: TemplateCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card variant="emphasis">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">{template.name}</h3>
              {template.isFavorite && (
                <Star size={14} className="text-[var(--color-accent-yellow)] fill-current" />
              )}
              {template.isBuiltIn && (
                <Badge variant="default" className="text-xs">Built-in</Badge>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {template.category}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              •••
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 z-10"
                >
                  <Card className="min-w-[150px] p-1">
                    {onToggleFavorite && (
                      <button
                        onClick={() => {
                          onToggleFavorite();
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-[var(--color-surface-hover)] transition-colors"
                      >
                        <Star size={14} />
                        {template.isFavorite ? 'Unfavorite' : 'Favorite'}
                      </button>
                    )}
                    {onEdit && !template.isBuiltIn && (
                      <button
                        onClick={() => {
                          onEdit();
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-[var(--color-surface-hover)] transition-colors"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                    )}
                    {onDelete && !template.isBuiltIn && (
                      <button
                        onClick={() => {
                          onDelete();
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-[var(--color-border-error)]/10 text-[var(--color-border-error)] transition-colors"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Description */}
        {template.description && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {template.description}
          </p>
        )}

        {/* Fields Preview */}
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <List size={14} />
          <span>{template.fields.length} fields</span>
          {template.useCount && template.useCount > 0 && (
            <>
              <span>•</span>
              <span>Used {template.useCount} times</span>
            </>
          )}
        </div>

        {/* Action */}
        <Button onClick={onUse} className="w-full">
          Use Template
        </Button>
      </div>
    </Card>
  );
}

// Template Editor

interface TemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void;
  template?: Template;
}

function TemplateEditor({ isOpen, onClose, onSave, template }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState(template?.category || 'reflection');
  const [fields, setFields] = useState<TemplateField[]>(template?.fields || []);

  const addField = () => {
    setFields([
      ...fields,
      {
        id: `field-${Date.now()}`,
        label: '',
        type: 'text',
        placeholder: '',
        required: false,
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    setFields(fields.map((field, i) => (i === index ? { ...field, ...updates } : field)));
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      category,
      fields: fields.filter(f => f.label.trim() !== ''),
      isFavorite: template?.isFavorite || false,
      isBuiltIn: false,
      useCount: template?.useCount || 0,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={template ? 'Edit Template' : 'Create Template'} size="lg">
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-2">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily Reflection"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this template for?"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., reflection, work, personal"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
            />
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Fields</label>
            <Button variant="ghost" size="sm" onClick={addField}>
              <Plus size={14} />
              Add Field
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {fields.map((field, index) => (
              <Card key={field.id} variant="emphasis">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="Field label"
                      className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value as any })}
                      className="px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Long Text</option>
                      <option value="date">Date</option>
                      <option value="select">Select</option>
                    </select>
                    <Button variant="ghost" size="sm" onClick={() => removeField(index)}>
                      <X size={14} />
                    </Button>
                  </div>
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                    placeholder="Placeholder (optional)"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-sm"
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || fields.length === 0}>
            {template ? 'Update' : 'Create'} Template
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Template Use Modal

interface TemplateUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  onSubmit: (values: Record<string, any>) => void;
}

function TemplateUseModal({ isOpen, onClose, template, onSubmit }: TemplateUseModalProps) {
  const [values, setValues] = useState<Record<string, any>>({});

  const handleSubmit = () => {
    onSubmit(values);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={template.name} size="lg">
      <div className="space-y-4">
        {template.description && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {template.description}
          </p>
        )}

        <div className="space-y-3">
          {template.fields.map((field) => (
            <div key={field.id}>
              <label className="text-sm font-medium block mb-2">
                {field.label}
                {field.required && <span className="text-[var(--color-border-error)]"> *</span>}
              </label>

              {field.type === 'text' && (
                <input
                  type="text"
                  value={values[field.id] || ''}
                  onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  value={values[field.id] || ''}
                  onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] resize-none"
                  rows={4}
                />
              )}

              {field.type === 'date' && (
                <input
                  type="date"
                  value={values[field.id] || ''}
                  onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
                />
              )}

              {field.type === 'select' && field.options && (
                <select
                  value={values[field.id] || ''}
                  onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
                >
                  <option value="">Select...</option>
                  {field.options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Use Template
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Built-in Templates
 */
export const builtInTemplates: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Daily Reflection',
    description: 'A simple daily reflection structure',
    category: 'reflection',
    isBuiltIn: true,
    fields: [
      { id: 'what-appeared', label: 'What appeared today?', type: 'textarea', placeholder: '...' },
      { id: 'what-shifted', label: 'What shifted?', type: 'textarea', placeholder: '...' },
      { id: 'what-remains', label: 'What remains?', type: 'textarea', placeholder: '...' },
    ],
  },
  {
    name: 'Decision Reflection',
    description: 'Explore a decision without judgment',
    category: 'reflection',
    isBuiltIn: true,
    fields: [
      { id: 'decision', label: 'What decision exists?', type: 'text', placeholder: '...' },
      { id: 'context', label: 'What context surrounds it?', type: 'textarea', placeholder: '...' },
      { id: 'tensions', label: 'What tensions appear?', type: 'textarea', placeholder: '...' },
      { id: 'what-emerges', label: 'What emerges?', type: 'textarea', placeholder: '...' },
    ],
  },
  {
    name: 'Thread Starter',
    description: 'Begin a new thread of exploration',
    category: 'thread',
    isBuiltIn: true,
    fields: [
      { id: 'question', label: 'What question exists?', type: 'text', placeholder: '...' },
      { id: 'why-now', label: 'Why does this appear now?', type: 'textarea', placeholder: '...' },
      { id: 'initial-thoughts', label: 'What emerges first?', type: 'textarea', placeholder: '...' },
    ],
  },
];

export type { Template, TemplateField, TemplateSystemProps };
