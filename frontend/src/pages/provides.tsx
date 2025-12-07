import Layout from '@/components/Layout';

export default function Provides() {
  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative min-h-[400px] flex items-center justify-center bg-gradient-to-b from-black via-[#0a0a0a] to-black">
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="font-work-sans text-5xl md:text-6xl font-bold text-white mb-6">
            The Mirror Provides
          </h1>
          <p className="font-inter text-xl md:text-2xl text-[#bdbdbd]">
            Tools for reflection, frameworks for growth, insights for transformation
          </p>
        </div>
      </div>

      {/* Reflection Packages */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="font-work-sans text-4xl font-bold text-gold mb-4">Reflection Packages</h2>
          <p className="font-inter text-lg text-gray-300 max-w-2xl mx-auto">
            Choose the level of depth that matches your journey. All packages include lifetime access 
            to your reflections and MirrorX AI insights.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Starter Package */}
          <div className="border border-mirror-line rounded-lg p-8 hover:border-gold/50 transition-all hover:shadow-mirror-glow">
            <div className="text-center mb-6">
              <h3 className="font-work-sans text-2xl font-bold text-white mb-2">Starter</h3>
              <div className="font-work-sans text-5xl font-bold text-gold mb-2">$45.99</div>
              <p className="font-inter text-sm text-gray-400">One-time payment</p>
            </div>
            <ul className="space-y-3 mb-8 font-inter text-gray-300">
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>30 reflections per month</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>Basic MirrorX AI insights</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>Personal reflection journal</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>Export your data</span>
              </li>
            </ul>
            <button className="w-full py-3 bg-mirror-surface border border-gold rounded-full font-inter font-medium text-gold hover:bg-gold hover:text-black transition-all">
              Get Started
            </button>
          </div>

          {/* Growth Package */}
          <div className="border-2 border-gold rounded-lg p-8 relative hover:shadow-[0px_0px_30px_0px_rgba(214,175,54,0.3)] transition-all">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-black px-4 py-1 rounded-full font-inter text-sm font-bold">
              MOST POPULAR
            </div>
            <div className="text-center mb-6">
              <h3 className="font-work-sans text-2xl font-bold text-white mb-2">Growth</h3>
              <div className="font-work-sans text-5xl font-bold text-gold mb-2">$75</div>
              <p className="font-inter text-sm text-gray-400">Monthly</p>
            </div>
            <ul className="space-y-3 mb-8 font-inter text-gray-300">
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>Unlimited reflections</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>Advanced MirrorX AI analysis</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>Pattern recognition insights</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>Evolution tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>Private discussion circles</span>
              </li>
            </ul>
            <button className="w-full py-3 bg-gradient-to-r from-[#d6af36] to-[#ffd700] rounded-full font-inter font-bold text-black hover:shadow-[0px_6px_20px_0px_rgba(214,175,54,0.4)] transition-all">
              Start Growing
            </button>
          </div>

          {/* Pro Package */}
          <div className="border border-mirror-line rounded-lg p-8 hover:border-gold/50 transition-all hover:shadow-mirror-glow">
            <div className="text-center mb-6">
              <h3 className="font-work-sans text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="font-work-sans text-5xl font-bold text-gold mb-2">$195</div>
              <p className="font-inter text-sm text-gray-400">Monthly</p>
            </div>
            <ul className="space-y-3 mb-8 font-inter text-gray-300">
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>Everything in Growth</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>1-on-1 coaching sessions</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>Custom reflection frameworks</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>Priority AI insights</span>
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">✓</span>
                <span>Exclusive content library</span>
              </li>
            </ul>
            <button className="w-full py-3 bg-mirror-surface border border-gold rounded-full font-inter font-medium text-gold hover:bg-gold hover:text-black transition-all">
              Go Pro
            </button>
          </div>
        </div>

        {/* Enterprise Options */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-gold/30 rounded-lg p-8">
            <h3 className="font-work-sans text-3xl font-bold text-white mb-4">Enterprise</h3>
            <div className="font-work-sans text-4xl font-bold text-gold mb-4">$995/mo</div>
            <p className="font-inter text-gray-300 mb-6">
              For organizations seeking to integrate reflection practices into their culture. 
              Includes team dashboards, analytics, and dedicated support.
            </p>
            <button className="px-8 py-3 bg-mirror-surface border border-gold rounded-full font-inter font-medium text-gold hover:bg-gold hover:text-black transition-all">
              Contact Sales
            </button>
          </div>

          <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-gold/30 rounded-lg p-8">
            <h3 className="font-work-sans text-3xl font-bold text-white mb-4">Lifetime Access</h3>
            <div className="font-work-sans text-4xl font-bold text-gold mb-4">$495</div>
            <p className="font-inter text-gray-300 mb-6">
              One-time payment for unlimited reflections and all future features. Lock in your 
              personal reflection sanctuary forever.
            </p>
            <button className="px-8 py-3 bg-mirror-surface border border-gold rounded-full font-inter font-medium text-gold hover:bg-gold hover:text-black transition-all">
              Claim Lifetime
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-black to-[#0a0a0a] py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-work-sans text-4xl font-bold text-center text-gold mb-12">
            What You Get With Every Package
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-gold text-4xl mb-4">🪞</div>
              <h4 className="font-work-sans font-bold text-white mb-2">Reflection Tools</h4>
              <p className="font-inter text-sm text-gray-400">
                Guided prompts and frameworks
              </p>
            </div>
            <div className="text-center">
              <div className="text-gold text-4xl mb-4">🧠</div>
              <h4 className="font-work-sans font-bold text-white mb-2">AI Insights</h4>
              <p className="font-inter text-sm text-gray-400">
                Pattern recognition and analysis
              </p>
            </div>
            <div className="text-center">
              <div className="text-gold text-4xl mb-4">📊</div>
              <h4 className="font-work-sans font-bold text-white mb-2">Evolution Tracking</h4>
              <p className="font-inter text-sm text-gray-400">
                Visualize your growth over time
              </p>
            </div>
            <div className="text-center">
              <div className="text-gold text-4xl mb-4">🔒</div>
              <h4 className="font-work-sans font-bold text-white mb-2">Privacy Guaranteed</h4>
              <p className="font-inter text-sm text-gray-400">
                Your data is always encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
