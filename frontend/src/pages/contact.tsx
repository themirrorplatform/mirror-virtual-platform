import Layout from '@/components/Layout';
import ContactForm from '@/components/ContactForm';

export default function Contact() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="font-work-sans text-5xl font-bold text-gold mb-4">
            Contact Us
          </h1>
          <p className="font-inter text-xl text-gray-300 max-w-2xl mx-auto">
            Have a question? We are here to help. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* Contact Form */}
        <div className="bg-mirror-surface border border-mirror-line rounded-lg p-8 shadow-mirror-glow">
          <ContactForm />
        </div>

        {/* Additional Info */}
        <div className="mt-12 grid md:grid-cols-2 gap-8 text-center">
          <div className="p-6 border border-mirror-line rounded-lg">
            <h3 className="font-work-sans text-xl font-bold text-gold mb-2">Email</h3>
            <p className="font-inter text-gray-300">themirrorplatform@gmail.com</p>
          </div>
          <div className="p-6 border border-mirror-line rounded-lg">
            <h3 className="font-work-sans text-xl font-bold text-gold mb-2">Phone</h3>
            <p className="font-inter text-gray-300">(555) 123-4567</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
