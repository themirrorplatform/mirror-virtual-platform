# Video Assets for The Mirror Platform

## Required Videos

### 1. Hero Video (hero-video.mp4)
- **Aspect Ratio**: 16:9 (0.5625)
- **Recommended Resolution**: 1920x1080 or higher
- **Duration**: 30-60 seconds (looping)
- **Theme**: Temple reflection, sacred spaces, stillness
- **Format**: MP4 (H.264 codec)
- **Size**: Under 10MB for optimal loading
- **Poster Image**: hero-poster.jpg (1920x1080)

**Usage**: Home page hero background

### 2. About Video (about-video.mp4)
- **Aspect Ratio**: 16:9 with slight crop (0.525)
- **Recommended Resolution**: 1920x1080
- **Duration**: 20-40 seconds (looping)
- **Theme**: Philosophy, reflection, contemplation
- **Format**: MP4 (H.264 codec)
- **Size**: Under 8MB
- **Poster Image**: about-poster.jpg (1920x1080)

**Usage**: About page hero background

### 3. Future Video (future-video.mp4)
- **Aspect Ratio**: 9:16 Portrait (1.5)
- **Recommended Resolution**: 1080x1920 (vertical)
- **Duration**: 30-45 seconds (looping)
- **Theme**: Technology, AI, future vision
- **Format**: MP4 (H.264 codec)
- **Size**: Under 8MB
- **Poster Image**: future-poster.jpg (1080x1920)

**Usage**: Future page hero background (portrait orientation)

## Video Guidelines

### Technical Requirements
- **Codec**: H.264 (most compatible)
- **Container**: MP4
- **Audio**: Optional (usually muted for background videos)
- **Compression**: Balance quality vs file size (aim for under 10MB)
- **Optimization**: Use tools like HandBrake or FFmpeg for web optimization

### Content Guidelines
- **Theme**: Mirror/reflection motifs consistent with brand
- **Motion**: Subtle, slow movements (avoid jarring cuts)
- **Color Palette**: Dark backgrounds with gold accents (#d6af36)
- **Lighting**: Cinematic, contemplative mood
- **Loop**: Seamless loop for continuous playback

## Compression Commands

### FFmpeg Commands for Optimization

```bash
# Hero Video (landscape)
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -vf "scale=1920:1080" -crf 23 -preset slow hero-video.mp4

# About Video (landscape)
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -vf "scale=1920:1080" -crf 23 -preset slow about-video.mp4

# Future Video (portrait)
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -vf "scale=1080:1920" -crf 23 -preset slow future-video.mp4

# Generate poster images
ffmpeg -i hero-video.mp4 -ss 00:00:02 -vframes 1 ../images/hero-poster.jpg
ffmpeg -i about-video.mp4 -ss 00:00:02 -vframes 1 ../images/about-poster.jpg
ffmpeg -i future-video.mp4 -ss 00:00:02 -vframes 1 ../images/future-poster.jpg
```

## Placeholder Videos

Until actual videos are uploaded, the components will gracefully handle missing files:
- VideoBackground component has built-in error handling
- Poster images display while video loads
- Fallback to static background if video fails

## Upload Process

1. **Prepare videos** using the specifications above
2. **Optimize** using FFmpeg or similar tools
3. **Test locally** by placing in `public/videos/`
4. **Generate posters** for each video
5. **Deploy** by pushing to repository or uploading to CDN

## CDN Hosting (Optional)

For production, consider hosting videos on a CDN:
- **Cloudflare Stream**: Video hosting with adaptive streaming
- **AWS S3 + CloudFront**: Cost-effective with global CDN
- **Vercel**: Automatic optimization for Next.js deployments
- **Supabase Storage**: Integrated with existing backend

Update video URLs in components if using CDN.
