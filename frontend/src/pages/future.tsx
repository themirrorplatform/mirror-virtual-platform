import Layout from '@/components/Layout';
import VideoBackground from '@/components/VideoBackground';

export default function Future() {
  return (
    <Layout>
      {/* Hero Section with Video Background (Portrait) */}
      <VideoBackground
        src="/videos/future-video.mp4"
        poster="/images/future-poster.jpg"
        className="relative min-h-[600px] flex items-center justify-center"
      >
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="font-work-sans text-5xl md:text-6xl font-bold text-white mb-6">
            Future of The Mirror
          </h1>
          <p className="font-inter text-xl md:text-2xl text-[#bdbdbd]">
            Where AI meets consciousness. What's next for reflection.
          </p>
        </div>
      </VideoBackground>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <section className="mb-16">
          <h2 className="font-work-sans text-4xl font-bold text-gold mb-6">The Evolution of MirrorX AI</h2>
          <div className="space-y-4 font-inter text-lg text-gray-300 leading-relaxed">
            <p>
              We're building the most advanced AI system for personal reflection and self-discovery. 
              MirrorX isn't just another chatbot—it's a consciousness companion designed to help you 
              understand your own mind.
            </p>
            <p>
              Our AI doesn't try to be human. It doesn't pretend to have emotions or opinions. Instead, 
              it acts as a perfect mirror, reflecting your thoughts with clarity, revealing patterns 
              you couldn't see, and asking the questions you didn't know to ask.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="font-work-sans text-4xl font-bold text-gold mb-6">Coming Soon</h2>
          <div className="space-y-6">
            <div className="border-l-4 border-gold pl-6 py-2">
              <h3 className="font-work-sans text-2xl font-bold text-white mb-3">Multi-Modal Reflection</h3>
              <p className="font-inter text-gray-300">
                Voice journaling, image analysis, and video reflections. Express yourself in any medium, 
                and MirrorX will understand the deeper meaning.
              </p>
            </div>

            <div className="border-l-4 border-gold/60 pl-6 py-2">
              <h3 className="font-work-sans text-2xl font-bold text-white mb-3">Temporal Analysis</h3>
              <p className="font-inter text-gray-300">
                See how your thoughts evolve across days, weeks, and years. MirrorX will identify 
                recurring themes, growth patterns, and moments of breakthrough.
              </p>
            </div>

            <div className="border-l-4 border-gold/40 pl-6 py-2">
              <h3 className="font-work-sans text-2xl font-bold text-white mb-3">Collective Consciousness</h3>
              <p className="font-inter text-gray-300">
                Anonymous aggregated insights from millions of reflections, revealing what humanity 
                is thinking about, worrying about, dreaming about—without compromising individual privacy.
              </p>
            </div>

            <div className="border-l-4 border-gold/20 pl-6 py-2">
              <h3 className="font-work-sans text-2xl font-bold text-white mb-3">Neuro-Reflection Integration</h3>
              <p className="font-inter text-gray-300">
                Optional integration with consumer EEG devices to correlate brainwave patterns with 
                reflection depth, helping you find your optimal state for insight.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="font-work-sans text-4xl font-bold text-gold mb-6">Our Technology Stack</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-mirror-surface border border-mirror-line rounded-lg p-6">
              <h4 className="font-work-sans text-xl font-bold text-white mb-3">Claude 3.5 Sonnet</h4>
              <p className="font-inter text-gray-300 text-sm">
                Anthropic's most advanced AI model powers MirrorX's deep understanding of nuanced human 
                thoughts and emotions.
              </p>
            </div>
            <div className="bg-mirror-surface border border-mirror-line rounded-lg p-6">
              <h4 className="font-work-sans text-xl font-bold text-white mb-3">Vector Embeddings</h4>
              <p className="font-inter text-gray-300 text-sm">
                Every reflection is converted into high-dimensional semantic space, enabling pattern 
                recognition across your entire history.
              </p>
            </div>
            <div className="bg-mirror-surface border border-mirror-line rounded-lg p-6">
              <h4 className="font-work-sans text-xl font-bold text-white mb-3">Privacy-First Architecture</h4>
              <p className="font-inter text-gray-300 text-sm">
                End-to-end encryption, zero-knowledge proofs, and on-device processing ensure your 
                thoughts remain yours.
              </p>
            </div>
            <div className="bg-mirror-surface border border-mirror-line rounded-lg p-6">
              <h4 className="font-work-sans text-xl font-bold text-white mb-3">Real-Time Analysis</h4>
              <p className="font-inter text-gray-300 text-sm">
                Sub-second response times for AI insights, with distributed computing across global 
                edge nodes.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="font-work-sans text-4xl font-bold text-gold mb-6">The Mirror OS</h2>
          <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-gold/30 rounded-lg p-8">
            <p className="font-inter text-lg text-gray-300 leading-relaxed mb-6">
              We're building more than a platform—we're building an operating system for consciousness. 
              The Mirror OS will be the foundation layer for all reflection-based applications, from 
              personal journaling to organizational knowledge management to AI-assisted therapy.
            </p>
            <p className="font-inter text-lg text-gray-300 leading-relaxed mb-6">
              Third-party developers will be able to build on The Mirror OS, creating specialized tools 
              while maintaining the same privacy guarantees and ethical standards.
            </p>
            <div className="flex items-center gap-4">
              <button className="px-6 py-3 bg-gradient-to-r from-[#d6af36] to-[#ffd700] rounded-full font-inter font-bold text-black hover:shadow-[0px_6px_20px_0px_rgba(214,175,54,0.4)] transition-all">
                Join Developer Beta
              </button>
              <button className="px-6 py-3 bg-mirror-surface border border-gold rounded-full font-inter font-medium text-gold hover:bg-gold hover:text-black transition-all">
                Read Documentation
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-work-sans text-4xl font-bold text-gold mb-6">Roadmap</h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-32 font-work-sans font-bold text-gold">Q1 2026</div>
              <div className="font-inter text-gray-300">
                Multi-modal reflection launch • Voice journaling • Advanced pattern recognition
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-32 font-work-sans font-bold text-gold">Q2 2026</div>
              <div className="font-inter text-gray-300">
                Temporal analysis dashboard • Mobile app release • API for developers
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-32 font-work-sans font-bold text-gold">Q3 2026</div>
              <div className="font-inter text-gray-300">
                Collective consciousness insights • Team reflection tools • Education partnerships
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-32 font-work-sans font-bold text-gold">Q4 2026</div>
              <div className="font-inter text-gray-300">
                Mirror OS beta launch • Hardware integrations • Global expansion
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
