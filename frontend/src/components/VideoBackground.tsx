import React, { useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  src: string;
  poster?: string;
  className?: string;
  objectPosition?: string;
  muted?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  playsinline?: boolean;
  children?: React.ReactNode;
}

/**
 * VideoBackground Component
 * Matches original themirrorplatform.com video background implementation
 * Features: autoplay, muted, loop, poster fallback, responsive
 */
export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  src,
  poster,
  className = '',
  objectPosition = '50% 50%',
  muted = true,
  loop = true,
  autoplay = true,
  playsinline = true,
  children,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video plays on mount (some browsers block autoplay)
    if (videoRef.current && autoplay) {
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Autoplay prevented:', error);
          // Fallback: show poster image if autoplay fails
        });
      }
    }
  }, [autoplay]);

  return (
    <div className={`video-background-container relative overflow-hidden ${className}`}>
      <div className="videobgwrapper absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        <video
          ref={videoRef}
          className="videobgframe absolute w-full h-full object-cover"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translateY(-50%) translateX(-50%)',
            width: '101%',
            objectPosition,
          }}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          playsInline={playsinline}
          poster={poster}
          preload="auto"
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
};

export default VideoBackground;
