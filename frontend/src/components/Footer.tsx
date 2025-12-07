import React from 'react';

interface FooterProps {
  className?: string;
}

/**
 * Footer Component
 * Matches original themirrorplatform.com footer structure
 * 3 columns: Logo/About | Contact | Social Links
 */
export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'Facebook', url: 'https://facebook.com/TheMirrorPlat', icon: 'facebook' },
    { name: 'LinkedIn', url: 'https://linkedin.com/themirrorvirtualplatform', icon: 'linkedin' },
    { name: 'Pinterest', url: 'https://pinterest.com/themirrorplatform', icon: 'pinterest' },
    { name: 'Twitter', url: 'https://twitter.com/mirrorvplat', icon: 'twitter' },
    { name: 'Instagram', url: 'https://instagram.com/mirror_platform', icon: 'instagram' },
    { name: 'YouTube', url: 'https://youtube.com/themirror-d7n', icon: 'youtube' },
    { name: 'Reddit', url: 'https://reddit.com/u/themirrorplatform', icon: 'reddit' },
    { name: 'Email', url: 'mailto:themirrorplatform@gmail.com', icon: 'email' },
  ];

  return (
    <footer className={`bg-mirror-void text-mirror-fog py-16 px-8 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Column 1: Logo & About */}
          <div className="space-y-4">
            <div className="w-32 h-32 mx-auto md:mx-0">
              {/* Logo placeholder - replace with actual logo */}
              <div className="w-full h-full bg-mirror-gold rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-white">M</span>
              </div>
            </div>
            <p className="text-sm text-mirror-fog/80 font-inter leading-relaxed">
              Creating innovative solutions through the introduction of emotional intelligence 
              and philosophical understanding to technology to raise user experiences.
            </p>
          </div>

          {/* Column 2: Contact */}
          <div className="space-y-4">
            <h4 className="text-white font-work-sans font-bold text-lg uppercase tracking-wider">
              Contact
            </h4>
            <div className="space-y-2 text-sm font-inter">
              <p className="text-mirror-fog/80">
                themirrorplatform@gmail.com
              </p>
              <p className="text-mirror-fog/80">
                555-555-5555
              </p>
            </div>
          </div>

          {/* Column 3: Social Links */}
          <div className="space-y-4">
            <h4 className="text-white font-work-sans font-bold text-lg uppercase tracking-wider">
              Connect
            </h4>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-mirror-gold rounded-full flex items-center justify-center hover:bg-mirror-goldDeep transition-colors"
                  aria-label={social.name}
                >
                  <span className="text-white text-sm font-bold">
                    {social.icon === 'facebook' && 'f'}
                    {social.icon === 'linkedin' && 'in'}
                    {social.icon === 'pinterest' && 'P'}
                    {social.icon === 'twitter' && 'X'}
                    {social.icon === 'instagram' && 'ig'}
                    {social.icon === 'youtube' && 'YT'}
                    {social.icon === 'reddit' && 'r'}
                    {social.icon === 'email' && '@'}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-mirror-line text-center">
          <p className="text-sm text-mirror-fog/60 font-inter">
            © {currentYear} The Mirror Platform LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
