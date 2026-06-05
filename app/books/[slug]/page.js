import { getBookBySlug, getRelatedBooks } from '@/lib/api';
import BookDetailClient from './BookDetailClient';
import { notFound } from 'next/navigation';

function getAbsoluteImageUrl(url) {
  if (!url) return 'https://www.akabirprokashoni.com/default-book.png';
  if (url.startsWith('http')) return url;
  
  const apiBase = process.env.NEXT_PUBLIC_API_URL 
    ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
    : 'https://api.akabirprokashoni.com';
    
  if (url.startsWith('/media/')) {
    return `${apiBase}${url}`;
  }
  
  return `https://www.akabirprokashoni.com${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const book = await getBookBySlug(resolvedParams.slug);
  
  if (!book) return { title: 'Book Not Found' };

  const title = book.meta_title || `${book.title} — ${book.author?.name || book.author_details?.name || 'আকাবির প্রকাশনী'}`;
  const description = book.meta_description || book.description?.substring(0, 160) || `Buy ${book.title} from Akabir Prokashoni.`;
  const keywords = book.meta_keywords || book.tags_list?.join(', ') || '';

  const absoluteImageUrl = getAbsoluteImageUrl(book.cover);

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: [absoluteImageUrl],
      type: 'book',
      authors: [book.author?.name || book.author_details?.name],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteImageUrl],
    }
  };
}

export default async function BookDetail({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // Fetch from Django API
  const book = await getBookBySlug(slug);
  
  if (!book) {
    notFound();
  }

  const relatedBooksResponse = await getRelatedBooks(slug);
  const relatedBooks = relatedBooksResponse.results || relatedBooksResponse;

  // JSON-LD Structured Data for Product/Book
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: {
      '@type': 'Person',
      name: book.author?.name || book.author_details?.name
    },
    image: book.cover ? [book.cover] : [],
    description: book.meta_description || book.description,
    isbn: book.isbn,
    numberOfPages: book.pages,
    inLanguage: book.language,
    publisher: {
      '@type': 'Organization',
      name: book.publisher || 'Akabir Prokashoni'
    },
    offers: {
      '@type': 'Offer',
      price: book.price,
      priceCurrency: 'BDT',
      availability: book.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://akabirprokashoni.com/books/${book.slug}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BookDetailClient book={book} relatedBooks={relatedBooks} />
    </>
  );
}
