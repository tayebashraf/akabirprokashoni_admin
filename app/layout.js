import './globals.css';
import { CartProvider } from '@/lib/CartContext';
import { AuthProvider } from '@/lib/AuthContext';
import { FavoriteProvider } from '@/lib/FavoriteContext';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';

export const metadata = {
  metadataBase: new URL('https://akabirprokashoni.com'),
  title: {
    default: 'আকাবির প্রকাশনী | Akabir Prokashoni — ইসলামিক ও দ্বীনি বইয়ের বিশ্বস্ত অনলাইন বুকশপ',
    template: '%s | আকাবির প্রকাশনী',
  },
  description: 'আকাবির প্রকাশনী (Akabir Prokashoni) থেকে কিনুন ইসলামিক বই, দ্বীনি বই, আত্মশুদ্ধির বই এবং ইসলাহ (Islah) বিষয়ক সেরা সব কালেকশন। বাংলাদেশের অন্যতম সেরা অনলাইন বুকশপ।',
  keywords: [
    'প্রকাশনী', 'Prokashoni', 'Prokashani', 
    'আকাবির', 'Akabir', 'আকাবির প্রকাশনী', 'Akabir Prokashoni',
    'ইসলামিক বই', 'Islamic Books', 
    'দ্বীনি বই', 'Deeni Books', 'Dini Boi',
    'আত্মশুদ্ধির বই', 'Atmosuddhi Books', 'আত্মশুদ্ধি', 'Atmosuddho',
    'ইসলাহ', 'Islah', 'ইসলাহী বই',
    'অনলাইন বুকশপ', 'বই কিনুন', 'বাংলাদেশ'
  ],
  alternates: {
    canonical: 'https://akabirprokashoni.com',
    languages: {
      'bn-BD': 'https://akabirprokashoni.com',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    url: 'https://akabirprokashoni.com',
    siteName: 'আকাবির প্রকাশনী',
    title: 'আকাবির প্রকাশনী | ইসলামিক ও দ্বীনি বইয়ের সেরা কালেকশন',
    description: 'আকাবির প্রকাশনী থেকে কিনুন ইসলামিক, দ্বীনি এবং আত্মশুদ্ধির বই।',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'আকাবির প্রকাশনী | Akabir Prokashoni',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'আকাবির প্রকাশনী | ইসলামিক ও দ্বীনি বইয়ের সেরা কালেকশন',
    description: 'আকাবির প্রকাশনী থেকে কিনুন ইসলামিক, দ্বীনি এবং আত্মশুদ্ধির বই।',
    images: ['/og-default.png'],
  }
};

export default function RootLayout({ children }) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Akabir Prokashoni',
    url: 'https://akabirprokashoni.com',
    logo: 'https://akabirprokashoni.com/images/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+8801718763978',
      contactType: 'customer service',
      areaServed: 'BD',
      availableLanguage: ['Bengali', 'English']
    },
    sameAs: [
      'https://www.facebook.com/akabirprokashoni',
    ]
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'আকাবির প্রকাশনী',
    url: 'https://akabirprokashoni.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://akabirprokashoni.com/books?search={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <AuthProvider>
          <FavoriteProvider>
            <CartProvider>
              <ClientLayoutWrapper>
                {children}
              </ClientLayoutWrapper>
            </CartProvider>
          </FavoriteProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
