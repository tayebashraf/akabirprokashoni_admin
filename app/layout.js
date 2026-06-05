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
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    url: 'https://akabirprokashoni.com',
    siteName: 'আকাবির প্রকাশনী',
    title: 'আকাবির প্রকাশনী | ইসলামিক ও দ্বীনি বইয়ের সেরা কালেকশন',
    description: 'আকাবির প্রকাশনী থেকে কিনুন ইসলামিক, দ্বীনি এবং আত্মশুদ্ধির বই।',
  },
};

export default function RootLayout({ children }) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Akabir Prokashoni',
    url: 'https://akabirprokashoni.com',
    logo: 'https://akabirprokashoni.com/logo.png',
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

  return (
    <html lang="bn">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
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
