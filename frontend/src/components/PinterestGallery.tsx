import { useState } from 'react';
import Image from 'next/image';

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}

interface PinterestGalleryProps {
  images: GalleryImage[];
  columns?: number;
  gap?: number;
  className?: string;
}

export default function PinterestGallery({ 
  images, 
  columns = 3, 
  gap = 16,
  className = '' 
}: PinterestGalleryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div 
      className={`pinterest-gallery grid gap-[${gap}px] ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`
      }}
    >
      {images.map((image) => (
        <div
          key={image.id}
          className="relative overflow-hidden rounded-2xl group cursor-pointer"
          onMouseEnter={() => setHoveredId(image.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            aspectRatio: `${image.width} / ${image.height}`
          }}
        >
          {/* Image */}
          <div className={`absolute inset-0 transition-transform duration-500 ${
            hoveredId === image.id ? 'scale-95' : 'scale-100'
          }`}>
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Overlay with caption */}
          <div className={`absolute inset-0 bg-black/60 flex items-center justify-center p-6 transition-opacity duration-300 ${
            hoveredId === image.id ? 'opacity-100' : 'opacity-0'
          }`}>
            {image.caption && (
              <p className="font-work-sans text-white text-center text-lg font-medium">
                {image.caption}
              </p>
            )}
          </div>

          {/* Gold border on hover */}
          <div className={`absolute inset-0 border-2 border-[#d6af36] rounded-2xl transition-opacity duration-300 pointer-events-none ${
            hoveredId === image.id ? 'opacity-100' : 'opacity-0'
          }`} />
        </div>
      ))}
    </div>
  );
}

// Responsive version with masonry layout
export function PinterestGalleryMasonry({ 
  images, 
  className = '' 
}: Omit<PinterestGalleryProps, 'columns' | 'gap'>) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className={`columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4 ${className}`}>
      {images.map((image) => (
        <div
          key={image.id}
          className="relative overflow-hidden rounded-2xl group cursor-pointer break-inside-avoid mb-4"
          onMouseEnter={() => setHoveredId(image.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Image */}
          <div className={`transition-transform duration-500 ${
            hoveredId === image.id ? 'scale-95' : 'scale-100'
          }`}>
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Overlay with caption */}
          <div className={`absolute inset-0 bg-black/60 flex items-center justify-center p-6 transition-opacity duration-300 ${
            hoveredId === image.id ? 'opacity-100' : 'opacity-0'
          }`}>
            {image.caption && (
              <p className="font-work-sans text-white text-center text-lg font-medium">
                {image.caption}
              </p>
            )}
          </div>

          {/* Gold border on hover */}
          <div className={`absolute inset-0 border-2 border-[#d6af36] rounded-2xl transition-opacity duration-300 pointer-events-none ${
            hoveredId === image.id ? 'opacity-100' : 'opacity-0'
          }`} />
        </div>
      ))}
    </div>
  );
}
