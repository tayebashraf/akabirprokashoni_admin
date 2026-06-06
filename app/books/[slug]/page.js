import { getBookBySlug, getRelatedBooks } from '@/lib/api';
import BookDetailClient from './BookDetailClient';
import { notFound } from 'next/navigation';

function getAbsoluteImageUrl(url) {
  if (!url) return 'https://akabirprokashoni.com/default-book.png';
  if (url.startsWith('http')) return url;
  
  const apiBase = process.env.NEXT_PUBLIC_API_URL 
    ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
    : 'https://api.akabirprokashoni.com';
    
  if (url.startsWith('/media/')) {
    return `${apiBase}${url}`;
  }
  
  return `https://akabirprokashoni.com${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const book = await getBookBySlug(resolvedParams.slug);
  
  if (!book) return { title: 'Book Not Found' };

  // Handle multiple authors name join
  let authorNames = '';
  if (Array.isArray(book.author_details) && book.author_details.length > 0) {
    authorNames = book.author_details.map(a => a.name).join(', ');
  } else {
    authorNames = book.author?.name || book.author_details?.name || 'আকাবির প্রকাশনী';
  }

  const title = book.meta_title || `${book.title} — ${authorNames}`;
  const description = book.meta_description || book.short_description || book.description?.substring(0, 160) || `আকাবির প্রকাশনী থেকে "${book.title}" বইটি কিনুন। লেখক পরিচিতি, বিবরণ ও রিভিউ দেখে সহজেই সংগ্রহ করুন।`;
  const keywords = book.meta_keywords || book.tags_list?.join(', ') || '';

  const absoluteImageUrl = getAbsoluteImageUrl(book.cover_url || book.cover);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://akabirprokashoni.com/books/${book.slug}`,
    },
    openGraph: {
      title,
      description,
      images: [absoluteImageUrl],
      type: 'book',
      authors: Array.isArray(book.author_details) && book.author_details.length > 0 
        ? book.author_details.map(a => a.name) 
        : [book.author?.name || book.author_details?.name || 'আকাবির প্রকাশনী'],
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

  // Multiple authors support for JSON-LD
  const authorsLd = Array.isArray(book.author_details) && book.author_details.length > 0
    ? book.author_details.map(a => ({
        '@type': 'Person',
        name: a.name
      }))
    : [{ '@type': 'Person', name: book.author?.name || book.author_details?.name || 'অজানা লেখক' }];

  // JSON-LD Structured Data for Product/Book
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Product', 'Book'],
    name: book.title,
    author: authorsLd,
    image: book.cover ? [getAbsoluteImageUrl(book.cover_url || book.cover)] : [],
    description: book.meta_description || book.short_description || book.description || `আকাবির প্রকাশনী থেকে "${book.title}" বইটি কিনুন।`,
    isbn: book.isbn,
    numberOfPages: book.pages,
    inLanguage: book.language,
    publisher: {
      '@type': 'Organization',
      name: book.publisher || 'আকাবির প্রকাশনী'
    },
    offers: {
      '@type': 'Offer',
      price: book.price,
      priceCurrency: 'BDT',
      availability: book.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://akabirprokashoni.com/books/${book.slug}`,
      seller: {
        '@type': 'Organization',
        name: 'আকাবির প্রকাশনী'
      }
    },
    ...(book.rating > 0 && book.review_count > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: book.rating,
        reviewCount: book.review_count,
        bestRating: '5',
        worstRating: '1'
      }
    } : {})
  };

  // BreadcrumbList JSON-LD Schema
  const categoryName = book.category_details?.name || book.category?.name || book.category_name || '';
  const categorySlug = book.category_details?.slug || book.category?.slug || '';

  const breadcrumbElements = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'হোম',
      item: 'https://akabirprokashoni.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'সকল বই',
      item: 'https://akabirprokashoni.com/books',
    }
  ];

  if (categoryName && categorySlug) {
    breadcrumbElements.push({
      '@type': 'ListItem',
      position: 3,
      name: categoryName,
      item: `https://akabirprokashoni.com/books?category=${categorySlug}`,
    });
  }

  breadcrumbElements.push({
    '@type': 'ListItem',
    position: categoryName && categorySlug ? 4 : 3,
    name: book.title,
    item: `https://akabirprokashoni.com/books/${book.slug}`,
  });

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbElements,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <BookDetailClient book={book} relatedBooks={relatedBooks} />
    </>
  );
}
