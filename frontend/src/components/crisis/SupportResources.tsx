import { Phone, MessageCircle, Users, BookOpen, ExternalLink, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface Resource {
  id: string;
  type: 'hotline' | 'text' | 'community' | 'info';
  name: string;
  description: string;
  contact: string;
  availability: string;
  url?: string;
  icon: React.ReactNode;
}

interface SupportResourcesProps {
  userLocation?: string;
  onClose?: () => void;
}

export function SupportResources({
  userLocation = 'US',
  onClose,
}: SupportResourcesProps) {
  const resources: Resource[] = [
    {
      id: '1',
      type: 'hotline',
      name: '988 Suicide & Crisis Lifeline',
      description: 'Free, confidential support for people in distress. Available to everyone.',
      contact: '988',
      availability: '24/7',
      url: 'tel:988',
      icon: <Phone size={20} />,
    },
    {
      id: '2',
      type: 'text',
      name: 'Crisis Text Line',
      description: 'Text-based crisis support. Text "HELLO" to start.',
      contact: 'Text HELLO to 741741',
      availability: '24/7',
      url: 'sms:741741?body=HELLO',
      icon: <MessageCircle size={20} />,
    },
    {
      id: '3',
      type: 'hotline',
      name: 'SAMHSA National Helpline',
      description: 'Treatment referral and information for mental health and substance use.',
      contact: '1-800-662-4357',
      availability: '24/7',
      url: 'tel:1-800-662-4357',
      icon: <Phone size={20} />,
    },
    {
      id: '4',
      type: 'community',
      name: 'The Trevor Project',
      description: 'Crisis support for LGBTQ+ young people.',
      contact: '1-866-488-7386',
      availability: '24/7',
      url: 'https://www.thetrevorproject.org',
      icon: <Users size={20} />,
    },
    {
      id: '5',
      type: 'hotline',
      name: 'Trans Lifeline',
      description: 'Peer support hotline run by and for trans people.',
      contact: '877-565-8860',
      availability: 'Limited hours',
      url: 'tel:877-565-8860',
      icon: <Phone size={20} />,
    },
    {
      id: '6',
      type: 'community',
      name: 'NAMI Helpline',
      description: 'Information, resources, and referrals for mental health questions.',
      contact: '1-800-950-6264',
      availability: 'Mon-Fri, 10am-10pm ET',
      url: 'tel:1-800-950-6264',
      icon: <Users size={20} />,
    },
    {
      id: '7',
      type: 'info',
      name: 'AFSP Resources',
      description: 'American Foundation for Suicide Prevention - comprehensive resource directory.',
      contact: 'Visit website',
      availability: 'Always available',
      url: 'https://afsp.org/mental-health-resources',
      icon: <BookOpen size={20} />,
    },
  ];

  const groupedResources = {
    immediate: resources.filter(r => r.availability === '24/7'),
    community: resources.filter(r => r.type === 'community' && r.availability !== '24/7'),
    info: resources.filter(r => r.type === 'info'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2>Support Resources</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
            >
              Close
            </button>
          )}
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Help exists. These are real people who understand what it means to carry something heavy.
        </p>
      </div>

      {/* Location note */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <MapPin size={14} />
        <span>Showing resources for: {userLocation}</span>
      </div>

      {/* Immediate support (24/7) */}
      <section>
        <h3 className="mb-3 text-sm">Available now</h3>
        <div className="space-y-3">
          {groupedResources.immediate.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]">
                  {resource.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm mb-1">{resource.name}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-2 leading-relaxed">
                    {resource.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    {resource.url ? (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[var(--color-accent-gold)] hover:underline"
                      >
                        {resource.contact}
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-[var(--color-text-primary)]">{resource.contact}</span>
                    )}
                    <span className="text-[var(--color-text-muted)]">•</span>
                    <span className="text-[var(--color-text-muted)]">{resource.availability}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Community support */}
      {groupedResources.community.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm">Community support</h3>
          <div className="space-y-3">
            {groupedResources.community.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[var(--color-base-raised)] text-[var(--color-text-muted)]">
                    {resource.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm mb-1">{resource.name}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-2 leading-relaxed">
                      {resource.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      {resource.url ? (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[var(--color-accent-gold)] hover:underline"
                        >
                          {resource.contact}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-[var(--color-text-primary)]">{resource.contact}</span>
                      )}
                      <span className="text-[var(--color-text-muted)]">•</span>
                      <span className="text-[var(--color-text-muted)]">{resource.availability}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Information resources */}
      {groupedResources.info.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm">Learn more</h3>
          <div className="space-y-3">
            {groupedResources.info.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[var(--color-base-raised)] text-[var(--color-text-muted)]">
                    {resource.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm mb-1">{resource.name}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-2 leading-relaxed">
                      {resource.description}
                    </p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--color-accent-gold)] hover:underline"
                    >
                      {resource.contact}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Footer note */}
      <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          These resources are not affiliated with The Mirror. They are independent organizations 
          with trained professionals. Reaching out is not weakness—it's what people do when 
          they need what they need.
        </p>
      </div>
    </div>
  );
}
