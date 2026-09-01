export function JsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://saathika.app';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Saathika',
    url: siteUrl,
    logo: `${siteUrl}/saathika-logo.jpg`,
    description:
      'Saathika is a premium Indian dating platform offering verified profiles, smart matchmaking, voice-first chat, and privacy-focused connections.',
    sameAs: [
      'https://twitter.com/saathika_app',
      'https://facebook.com/saathika',
      'https://instagram.com/saathika_app',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Saathika Dating App',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/user/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const mobileAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'Saathika',
    operatingSystem: 'ANDROID, IOS, Web',
    applicationCategory: 'DatingApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '2450',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mobileAppSchema) }}
      />
    </>
  );
}
