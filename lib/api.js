export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// Global fetch wrapper with timeout to prevent hanging build processes
const originalFetch = globalThis.fetch;
const fetch = async (resource, options = {}) => {
  const { timeout = 5000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await originalFetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Helper: Parse DRF error responses into a readable message
async function parseDRFError(res, fallbackMsg) {
  try {
    const error = await res.json();
    if (error.detail) return error.detail;
    // DRF returns field-level errors like {"author": ["This field is required."]}
    const messages = [];
    for (const [field, errors] of Object.entries(error)) {
      let errList = Array.isArray(errors) ? errors.join(', ') : errors;
      // Strip Technical [ErrorDetail(string="...", code="...")] if it appears
      errList = String(errList).replace(/\[?ErrorDetail\(string="(.+?)", code=".+?"\)\]?/g, '$1');
      messages.push(errList);
    }
    if (messages.length > 0) return messages.join(' | ');
    return fallbackMsg;
  } catch {
    return fallbackMsg;
  }
}

function getAuthHeaders() {
  const headers = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function getCategories() {
  const res = await fetch(`${API_URL}/categories/`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getAuthors() {
  const res = await fetch(`${API_URL}/authors/`);
  if (!res.ok) throw new Error('Failed to fetch authors');
  return res.json();
}

export async function getTrendingBooks() {
  const res = await fetch(`${API_URL}/books/trending/`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to fetch trending books');
  return res.json();
}

export async function getNewReleases() {
  const res = await fetch(`${API_URL}/books/new_releases/`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to fetch new releases');
  return res.json();
}

export async function getBooks(searchParams = {}) {
  const url = new URL(`${API_URL}/books/`);
  Object.keys(searchParams).forEach(key => {
    if (searchParams[key]) url.searchParams.append(key, searchParams[key]);
  });
  
  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to fetch books');
  return res.json();
}

export async function getBookBySlug(slug) {
  const res = await fetch(`${API_URL}/books/${slug}/`);
  if (!res.ok) return null;
  return res.json();
}

export async function getRelatedBooks(slug) {
  const res = await fetch(`${API_URL}/books/${slug}/related/`);
  if (!res.ok) return [];
  return res.json();
}

export async function createOrder(orderData) {
  const res = await fetch(`${API_URL}/orders/create/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  
  if (!res.ok) {
    const msg = await parseDRFError(res, 'অর্ডার করতে সমস্যা হয়েছে।');
    throw new Error(msg);
  }
  
  return res.json();
}

export async function trackOrder(orderId) {
  const res = await fetch(`${API_URL}/orders/track/${orderId}/`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function trackOrdersByPhone(phone) {
  const res = await fetch(`${API_URL}/orders/track/phone/${phone}/`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function submitReview(slug, reviewData) {
  const res = await fetch(`${API_URL}/books/${slug}/add_review/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reviewData),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || error.detail || 'Failed to submit review');
  }
  
  return res.json();
}

export async function deleteBook(slug) {
  const res = await fetch(`${API_URL}/books/${slug}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to delete book');
  }
  return true;
}

export async function createBook(formData) {
  const res = await fetch(`${API_URL}/books/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const msg = await parseDRFError(res, 'Failed to create book');
    throw new Error(msg);
  }
  return res.json();
}

export async function updateBook(slug, formData) {
  const res = await fetch(`${API_URL}/books/${slug}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const msg = await parseDRFError(res, 'Failed to update book');
    throw new Error(msg);
  }
  return res.json();
}

export async function uploadBookImages(formData) {
  const res = await fetch(`${API_URL}/book-images/`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error('Failed to upload book images');
  }
  return res.json();
}

// Author Management
export async function createAuthor(data) {
  // Check if data is FormData
  const isFormData = data instanceof FormData;
  const authHeaders = getAuthHeaders();
  const options = {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  };
  if (isFormData) {
    options.headers = authHeaders;
  } else {
    options.headers = { 'Content-Type': 'application/json', ...authHeaders };
  }
  const res = await fetch(`${API_URL}/authors/`, options);
  if (!res.ok) {
    const msg = await parseDRFError(res, 'Failed to create author');
    throw new Error(msg);
  }
  return res.json();
}

export async function updateAuthor(slug, data) {
  const isFormData = data instanceof FormData;
  const authHeaders = getAuthHeaders();
  const options = {
    method: 'PATCH',
    body: isFormData ? data : JSON.stringify(data),
  };
  if (isFormData) {
    options.headers = authHeaders;
  } else {
    options.headers = { 'Content-Type': 'application/json', ...authHeaders };
  }
  const res = await fetch(`${API_URL}/authors/${slug}/`, options);
  if (!res.ok) {
    const msg = await parseDRFError(res, 'Failed to update author');
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteAuthor(slug) {
  const res = await fetch(`${API_URL}/authors/${slug}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete author');
  return true;
}

// Category Management
export async function createCategory(formData) {
  const res = await fetch(`${API_URL}/categories/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const msg = await parseDRFError(res, 'Failed to create category');
    throw new Error(msg);
  }
  return res.json();
}

export async function updateCategory(slug, formData) {
  const res = await fetch(`${API_URL}/categories/${slug}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const msg = await parseDRFError(res, 'Failed to update category');
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteCategory(slug) {
  const res = await fetch(`${API_URL}/categories/${slug}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete category');
  return true;
}

// Hero Slide Management
export async function getHeroSlides() {
  const res = await fetch(`${API_URL}/hero-slides/`);
  if (!res.ok) return { results: [] };
  return res.json();
}

export async function createHeroSlide(formData) {
  const res = await fetch(`${API_URL}/hero-slides/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to create slide');
  return res.json();
}

export async function updateHeroSlide(id, formData) {
  const res = await fetch(`${API_URL}/hero-slides/${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to update slide');
  return res.json();
}

export async function deleteHeroSlide(id) {
  const res = await fetch(`${API_URL}/hero-slides/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete slide');
  return true;
}

// Site Settings Management
export async function getSiteSettings() {
  const res = await fetch(`${API_URL}/site-settings/current/`);
  if (!res.ok) return null;
  return res.json();
}

export async function updateSiteSettings(formData) {
  // Assuming the settings id is 1 as it's a singleton
  const res = await fetch(`${API_URL}/site-settings/1/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

// Admin Dashboard & Orders Management
export async function getAdminDashboardStats() {
  const res = await fetch(`${API_URL}/orders/admin/dashboard/`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch admin stats');
  return res.json();
}

export async function getAdminOrders() {
  const res = await fetch(`${API_URL}/orders/admin/orders/`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch admin orders');
  return res.json();
}

export async function updateOrderStatus(orderId, statusValue) {
  const res = await fetch(`${API_URL}/orders/admin/orders/${orderId}/status/`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: statusValue })
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}
