import Layout from '@/components/Layout';
import VideoBackground from '@/components/VideoBackground';

export default function About() {
  return (
    <Layout>
      {/* Hero Section with Video Background */}
      <VideoBackground
        src="/videos/about-video.mp4"
        poster="/images/about-poster.jpg"
        className="relative min-h-[500px] flex items-center justify-center"
      >
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="font-work-sans text-5xl md:text-6xl font-bold text-white mb-6">
            About The Mirror
          </h1>
          <p className="font-inter text-xl md:text-2xl text-[#bdbdbd] max-w-3xl mx-auto">
            Understanding is temporary. To know is to unlearn. Reflection is the only path left.
          </p>
        </div>
      </VideoBackground>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <section className="mb-16">
          <h2 className="font-work-sans text-4xl font-bold text-gold mb-6">Our Philosophy</h2>
          <div className="space-y-4 font-inter text-lg text-gray-300 leading-relaxed">
            <p>
              The Mirror Platform is built on a revolutionary principle: true understanding comes not from 
              consuming more information, but from deeper reflection on what we already know.
            </p>
            <p>
              In a world drowning in noise, we offer silence. In an age of endless engagement, we provide 
              space for contemplation. Our platform is designed to mirror your thoughts back to you, 
              revealing patterns and insights that exist beneath the surface.
            </p>
            <p>
              We believe that the path to wisdom begins with self-awareness, and self-awareness begins 
              with honest reflection. The Mirror doesn't tell you what to think—it helps you discover 
              what you already know.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="font-work-sans text-4xl font-bold text-gold mb-6">What Makes Us Different</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-mirror-line rounded-lg p-6 hover:border-gold/50 transition-colors">
              <h3 className="font-work-sans text-2xl font-bold text-white mb-4">No Engagement Metrics</h3>
              <p className="font-inter text-gray-300">
                No likes, no shares, no follower counts. We measure depth, not breadth. Your reflections 
                are private by default, shared only when you choose.
              </p>
            </div>
            <div className="border border-mirror-line rounded-lg p-6 hover:border-gold/50 transition-colors">
              <h3 className="font-work-sans text-2xl font-bold text-white mb-4">AI-Powered Insight</h3>
              <p className="font-inter text-gray-300">
                Our MirrorX AI doesn't recommend content—it reflects your own thoughts back, revealing 
                patterns and connections you might have missed.
              </p>
            </div>
            <div className="border border-mirror-line rounded-lg p-6 hover:border-gold/50 transition-colors">
              <h3 className="font-work-sans text-2xl font-bold text-white mb-4">Slow Social</h3>
              <p className="font-inter text-gray-300">
                We encourage deep thinking over quick reactions. Reflections mature over time, gaining 
                new meaning as your perspective evolves.
              </p>
            </div>
            <div className="border border-mirror-line rounded-lg p-6 hover:border-gold/50 transition-colors">
              <h3 className="font-work-sans text-2xl font-bold text-white mb-4">Privacy First</h3>
              <p className="font-inter text-gray-300">
                Your thoughts are yours. We don't sell data, serve ads, or optimize for addiction. 
                The Mirror serves you, not advertisers.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-work-sans text-4xl font-bold text-gold mb-6">Our Mission</h2>
          <div className="bg-mirror-surface border border-mirror-line rounded-lg p-8">
            <p className="font-inter text-xl text-gray-300 leading-relaxed mb-6">
              To create a digital space where reflection replaces reaction, where depth replaces virality, 
              and where understanding replaces information overload.
            </p>
            <p className="font-inter text-xl text-gray-300 leading-relaxed">
              We believe the future of social media isn't about connecting everyone to everything—it's 
              about helping each person connect more deeply with themselves.
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
}
