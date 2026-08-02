const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.akabirprokashoni.com/api';

const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

async function fetchAllBooks() {
  let books = [];
  let url = `${API_URL}/books/`;
  while (url) {
    try {
      const res = await fetchWithTimeout(url, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const data = await res.json();
      books = [...books, ...(data.results || [])];
      url = data.next;
    } catch (e) {
      console.error('Error fetching books for sitemap page:', e);
      break;
    }
  }
  return books;
}

async function fetchAllCategories() {
  let categories = [];
  let url = `${API_URL}/categories/`;
  while (url) {
    try {
      const res = await fetchWithTimeout(url, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const data = await res.json();
      categories = [...categories, ...(data.results || data || [])];
      url = data.next || null;
    } catch (e) {
      console.error('Error fetching categories for sitemap page:', e);
      break;
    }
  }
  return categories;
}

async function fetchAllAuthors() {
  let authors = [];
  let url = `${API_URL}/authors/`;
  while (url) {
    try {
      const res = await fetchWithTimeout(url, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const data = await res.json();
      authors = [...authors, ...(data.results || data || [])];
      url = data.next || null;
    } catch (e) {
      console.error('Error fetching authors for sitemap page:', e);
      break;
    }
  }
  return authors;
}

export default async function sitemap() {
  const baseUrl = 'https://akabirprokashoni.com';

  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/books`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const books = await fetchAllBooks();
    const bookEntries = books.map(book => ({
      url: `${baseUrl}/books/${book.slug}`,
      lastModified: book.updated_at ? new Date(book.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
    routes.push(...bookEntries);
  } catch (e) {
    console.error('Error adding books to sitemap:', e);
  }

  try {
    const categories = await fetchAllCategories();
    const categoryEntries = categories.map(cat => ({
      url: `${baseUrl}/books?category=${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
    routes.push(...categoryEntries);
  } catch (e) {
    console.error('Error adding categories to sitemap:', e);
  }

  try {
    const authors = await fetchAllAuthors();
    const authorEntries = authors.map(auth => ({
      url: `${baseUrl}/books?author=${auth.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
    routes.push(...authorEntries);
  } catch (e) {
    console.error('Error adding authors to sitemap:', e);
  }

  return routes;
}

