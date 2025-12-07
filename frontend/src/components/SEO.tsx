import React from 'react';
import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  structuredData?: Record<string, any>;
}

/**
 * SEO Component
 * Adds comprehensive meta tags, OpenGraph, Twitter Cards, and JSON-LD
 * 
 * Usage:
 * <SEO 
 *   title="About The Mirror"
 *   description="Learn about The Mirror platform..."
 *   image="/images/og-about.jpg"
 * />
 */
export const SEO: React.FC<SEOProps> = ({
  title = 'The Mirror - Social Reflection Platform',
  description = 'A private, thoughtful space for reflection. The Mirror is anti-engagement, pro-depth. Your thoughts, your time, your authentic self.',
  image = '/images/og-default.jpg',
  url = 'https://themirrorplatform.com',
  type = 'website',
  structuredData,
}) => {
  const fullTitle = title.includes('The Mirror') ? title : `${title} | The Mirror`;
  const fullUrl = url.startsWith('http') ? url : `https://themirrorplatform.com${url}`;
  const fullImage = image.startsWith('http') ? image : `https://themirrorplatform.com${image}`;

  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'The Mirror',
    url: 'https://themirrorplatform.com',
    logo: 'https://themirrorplatform.com/images/logo.png',
    description: 'A private, thoughtful space for reflection. Anti-engagement, pro-depth.',
    sameAs: [
      // Add social media links when available
    ],
  };

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="The Mirror" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImage} />

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#0a0a0a" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="The Mirror" />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* JSON-LD Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
      
      {!structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(defaultStructuredData),
          }}
        />
      )}
    </Head>
  );
};

export default SEO;
