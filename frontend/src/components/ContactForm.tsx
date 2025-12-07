import React, { useState } from 'react';

interface ContactFormProps {
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

/**
 * ContactForm Component
 * Matches original themirrorplatform.com contact form
 * Features: Name (required), Email (required), Phone (optional), Message (optional), reCAPTCHA
 */
export const ContactForm: React.FC<ContactFormProps> = ({ className = '' }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // TODO: Integrate with your backend API or email service
      // For now, just simulate submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Form submitted:', formData);
      setSubmitStatus('success');
      
      // Reset form
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`contact-form-container ${className}`}>
      {submitStatus === 'success' && (
        <div className="dmform-success mb-4 p-4 bg-mirror-gold/20 text-mirror-fog rounded">
          Thank you for contacting us.<br />
          We will get back to you as soon as possible
        </div>
      )}
      
      {submitStatus === 'error' && (
        <div className="dmform-error mb-4 p-4 bg-mirror-ember/20 text-mirror-fog rounded">
          Oops, there was an error sending your message.<br />
          Please try again later
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field (Required) */}
        <div className="form-field">
          <label 
            htmlFor="name" 
            className="block text-mirror-fog/70 mb-2 font-inter text-sm"
          >
            Name: <span className="text-mirror-ember">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full bg-transparent border-0 border-b border-mirror-line text-mirror-fog py-2 px-0 focus:outline-none focus:border-mirror-gold transition-colors"
            placeholder="Your name"
          />
        </div>

        {/* Email Field (Required) */}
        <div className="form-field">
          <label 
            htmlFor="email" 
            className="block text-mirror-fog/70 mb-2 font-inter text-sm"
          >
            Email: <span className="text-mirror-ember">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full bg-transparent border-0 border-b border-mirror-line text-mirror-fog py-2 px-0 focus:outline-none focus:border-mirror-gold transition-colors"
            placeholder="your.email@example.com"
          />
        </div>

        {/* Phone Field (Optional) */}
        <div className="form-field">
          <label 
            htmlFor="phone" 
            className="block text-mirror-fog/70 mb-2 font-inter text-sm"
          >
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full bg-transparent border-0 border-b border-mirror-line text-mirror-fog py-2 px-0 focus:outline-none focus:border-mirror-gold transition-colors"
            placeholder="555-555-5555"
          />
        </div>

        {/* Message Field (Optional) */}
        <div className="form-field">
          <label 
            htmlFor="message" 
            className="block text-mirror-fog/70 mb-2 font-inter text-sm"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="w-full bg-transparent border-0 border-b border-mirror-line text-mirror-fog py-2 px-0 focus:outline-none focus:border-mirror-gold transition-colors resize-none"
            placeholder="Your message..."
          />
        </div>

        {/* Submit Button */}
        <div className="form-submit pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 bg-mirror-gold text-white font-inter font-semibold rounded-full shadow-mirror-glow hover:bg-mirror-goldDeep transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>

        {/* Note about reCAPTCHA */}
        <p className="text-mirror-fog/50 text-xs font-inter mt-4">
          This form is protected by reCAPTCHA (integration pending)
        </p>
      </form>
    </div>
  );
};

export default ContactForm;
