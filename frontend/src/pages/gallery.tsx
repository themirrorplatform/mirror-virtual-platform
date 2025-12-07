import Layout from '@/components/Layout';
import PinterestGallery from '@/components/PinterestGallery';

// Sample gallery images - replace with real images
const sampleImages = [
  {
    id: '1',
    src: '/images/gallery/reflection-1.jpg',
    alt: 'Peaceful temple reflection',
    caption: 'Finding stillness in motion',
    width: 400,
    height: 600
  },
  {
    id: '2',
    src: '/images/gallery/reflection-2.jpg',
    alt: 'Mountain lake mirror',
    caption: 'Nature as the original mirror',
    width: 600,
    height: 400
  },
  {
    id: '3',
    src: '/images/gallery/reflection-3.jpg',
    alt: 'City lights reflected',
    caption: 'Urban contemplation',
    width: 400,
    height: 500
  },
  {
    id: '4',
    src: '/images/gallery/reflection-4.jpg',
    alt: 'Forest path reflection',
    caption: 'The journey inward',
    width: 500,
    height: 700
  },
  {
    id: '5',
    src: '/images/gallery/reflection-5.jpg',
    alt: 'Desert sunset mirror',
    caption: 'Solitude and clarity',
    width: 600,
    height: 450
  },
  {
    id: '6',
    src: '/images/gallery/reflection-6.jpg',
    alt: 'Ocean horizon',
    caption: 'Where sky meets self',
    width: 700,
    height: 500
  },
  {
    id: '7',
    src: '/images/gallery/reflection-7.jpg',
    alt: 'Ancient architecture',
    caption: 'Timeless wisdom',
    width: 400,
    height: 600
  },
  {
    id: '8',
    src: '/images/gallery/reflection-8.jpg',
    alt: 'Misty morning',
    caption: 'Clarity through obscurity',
    width: 500,
    height: 500
  },
  {
    id: '9',
    src: '/images/gallery/reflection-9.jpg',
    alt: 'Zen garden',
    caption: 'Curated consciousness',
    width: 600,
    height: 400
  }
];

export default function Gallery() {
  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative min-h-[400px] flex items-center justify-center bg-gradient-to-b from-black via-[#0a0a0a] to-black">
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="font-work-sans text-5xl md:text-6xl font-bold text-white mb-6">
            Reflections Gallery
          </h1>
          <p className="font-inter text-xl md:text-2xl text-[#bdbdbd] max-w-2xl mx-auto">
            Visual meditations on the art of reflection. Each image tells a story of looking deeper.
          </p>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <p className="font-inter text-lg text-gray-300 max-w-3xl mx-auto">
            These images represent moments of clarity, spaces of contemplation, and the beauty of 
            seeing ourselves reflected in the world around us. Hover over each image to reveal its message.
          </p>
        </div>

        {/* Pinterest-style Gallery */}
        <PinterestGallery images={sampleImages} columns={3} gap={20} />

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="font-work-sans text-3xl font-bold text-gold mb-6">
            Share Your Reflection
          </h2>
          <p className="font-inter text-gray-300 mb-8 max-w-2xl mx-auto">
            Every member can contribute to our gallery. Share images that inspire reflection, 
            capture moments of insight, or represent your journey of self-discovery.
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-[#d6af36] to-[#ffd700] rounded-full font-inter font-bold text-black hover:shadow-[0px_6px_20px_0px_rgba(214,175,54,0.4)] transition-all">
            Submit to Gallery
          </button>
        </div>
      </div>

      {/* Featured Collections */}
      <div className="bg-gradient-to-b from-[#0a0a0a] to-black py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-work-sans text-4xl font-bold text-center text-gold mb-12">
            Featured Collections
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-mirror-surface border border-mirror-line rounded-lg p-6 hover:border-gold/50 transition-colors cursor-pointer">
              <div className="text-4xl mb-4">🌅</div>
              <h3 className="font-work-sans text-xl font-bold text-white mb-2">Dawn & Dusk</h3>
              <p className="font-inter text-gray-400 text-sm mb-4">
                Liminal moments between day and night, symbolic of transformation
              </p>
              <span className="font-inter text-gold text-sm">View 24 images →</span>
            </div>

            <div className="bg-mirror-surface border border-mirror-line rounded-lg p-6 hover:border-gold/50 transition-colors cursor-pointer">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="font-work-sans text-xl font-bold text-white mb-2">Sacred Spaces</h3>
              <p className="font-inter text-gray-400 text-sm mb-4">
                Architecture designed for contemplation across cultures and centuries
              </p>
              <span className="font-inter text-gold text-sm">View 18 images →</span>
            </div>

            <div className="bg-mirror-surface border border-mirror-line rounded-lg p-6 hover:border-gold/50 transition-colors cursor-pointer">
              <div className="text-4xl mb-4">🌊</div>
              <h3 className="font-work-sans text-xl font-bold text-white mb-2">Water & Light</h3>
              <p className="font-inter text-gray-400 text-sm mb-4">
                The original mirror—how water has reflected humanity for millennia
              </p>
              <span className="font-inter text-gold text-sm">View 32 images →</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
