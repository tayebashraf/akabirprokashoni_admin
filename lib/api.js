export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-bd153.up.railway.app/api';

// Global fetch wrapper with timeout and automatic JWT token refresh mechanism
const originalFetch = globalThis.fetch;
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

const fetch = async (resource, options = {}) => {
  const { timeout = 15000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    let response = await originalFetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);

    // If unauthorized (401), attempt to refresh the JWT access token automatically
    if (response.status === 401 && typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await originalFetch(`${API_URL}/accounts/token/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken })
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              const newAccessToken = refreshData.access;
              localStorage.setItem('access_token', newAccessToken);
              isRefreshing = false;
              onRefreshed(newAccessToken);
            } else {
              isRefreshing = false;
              // Clear tokens and redirect to login if refresh token is expired or invalid
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
              window.location.href = '/login';
              throw new Error('Session expired. Please log in again.');
            }
          } catch (err) {
            isRefreshing = false;
            throw err;
          }
        }

        // Retry the original request with the new token
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            const newOptions = { ...options };
            newOptions.headers = {
              ...newOptions.headers,
              'Authorization': `Bearer ${newToken}`
            };
            resolve(fetch(resource, newOptions));
          });
        });
      }
    }

    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Export the custom fetch wrapper for client components that need token auto-refresh
export const apiFetch = fetch;

const FIELD_TRANSLATIONS = {
  title: 'বইয়ের নাম',
  slug: 'ইউআরএল (Slug)',
  price: 'বিক্রয় মূল্য',
  original_price: 'আসল মূল্য',
  stock: 'স্টক সংখ্যা',
  weight: 'ওজন',
  pages: 'পৃষ্ঠা সংখ্যা',
  isbn: 'আইএসবিএন (ISBN)',
  language: 'ভাষা',
  edition: 'সংস্করণ',
  dimensions: 'মাপ',
  cover: 'কভার ইমেজ',
  sample_pdf: 'স্যাম্পল পিডিএফ',
  description: 'সারসংক্ষেপ',
  author_bio: 'লেখক পরিচিতি',
  translator_bio: 'অনুবাদক পরিচিতি',
  authors: 'লেখকগণ',
  categories: 'ক্যাটাগরি/বিষয়সমূহ',
  category: 'ক্যাটাগরি/বিষয়',
  name: 'নাম',
  bio: 'পরিচিতি/বায়ো',
  phone: 'মোবাইল নম্বর',
  address: 'ঠিকানা',
  email: 'ইমেইল',
  password: 'পাসওয়ার্ড',
};

const ERROR_TRANSLATIONS = [
  { eng: /This field is required/i, bng: 'ফিল্ডটি পূরণ করা আবশ্যক।' },
  { eng: /This field may not be null/i, bng: 'ফিল্ডটি ফাঁকা রাখা যাবে না।' },
  { eng: /This list may not be empty/i, bng: 'কমপক্ষে একটি মান নির্বাচন বা সিলেক্ট করতে হবে।' },
  { eng: /Ensure this value is greater than or equal to (\d+)/i, bng: 'মানটি অবশ্যই $1 বা তার চেয়ে বেশি হতে হবে।' },
  { eng: /Ensure this value is less than or equal to (\d+)/i, bng: 'মানটি অবশ্যই $1 বা তার চেয়ে কম হতে হবে।' },
  { eng: /A valid number is required/i, bng: 'একটি সঠিক সংখ্যা দেওয়া আবশ্যক।' },
  { eng: /Enter a valid email address/i, bng: 'একটি সঠিক ইমেইল ঠিকানা লিখুন।' },
  { eng: /Ensure this field has no more than (\d+) characters/i, bng: 'সর্বোচ্চ $1 অক্ষরের মধ্যে লিখতে হবে।' },
  { eng: /Ensure this field has at least (\d+) characters/i, bng: 'কমপক্ষে $1 অক্ষরের হতে হবে।' },
];

function translateDRFMessage(field, rawMessage) {
  let translatedMsg = rawMessage;

  for (const rule of ERROR_TRANSLATIONS) {
    if (rule.eng.test(rawMessage)) {
      translatedMsg = rawMessage.replace(rule.eng, rule.bng);
      break;
    }
  }

  if (field === 'non_field_errors' || field === 'detail') {
    return translatedMsg;
  }
  return `${field}: ${translatedMsg}`;
}

// Helper: Parse DRF error responses into a readable message
async function parseDRFError(res, fallbackMsg) {
  const status = res.status;
  try {
    const text = await res.text();
    try {
      const error = JSON.parse(text);
      if (error.detail) {
        let det = String(error.detail).replace(/\[?ErrorDetail\(string=(["'])(.*?)\1,\s*code=(["'])(.*?)\3\)\]?/g, '$2');
        det = translateDRFMessage('detail', det);
        return `[${status}] ${det}`;
      }
      const messages = [];
      for (const [field, errors] of Object.entries(error)) {
        let errList = Array.isArray(errors) ? errors.join(', ') : errors;
        errList = String(errList).replace(/\[?ErrorDetail\(string=(["'])(.*?)\1,\s*code=(["'])(.*?)\3\)\]?/g, '$2');
        messages.push(translateDRFMessage(field, errList));
      }
      if (messages.length > 0) return `[${status}] ${messages.join(' | ')}`;
      return `[${status}] ${fallbackMsg}`;
    } catch {
      return `[${status}] ${text.substring(0, 200)}`;
    }
  } catch {
    return `[${status}] ${fallbackMsg}`;
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

export function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const base = API_URL.replace('/api', '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function getCategories() {
  const res = await fetch(`${API_URL}/categories/`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getAuthors() {
  const res = await fetch(`${API_URL}/authors/`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to fetch authors');
  return res.json();
}

export async function getTrendingBooks() {
  const res = await fetch(`${API_URL}/books/trending/?v=2`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to fetch trending books');
  return res.json();
}

export async function getNewReleases() {
  const res = await fetch(`${API_URL}/books/new_releases/?v=2`, { next: { revalidate: 60 } });
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
  const res = await fetch(`${API_URL}/books/${slug}/?v=2`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function getRelatedBooks(slug) {
  const res = await fetch(`${API_URL}/books/${slug}/related/`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export async function createOrder(orderData) {
  const res = await fetch(`${API_URL}/orders/create/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
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
    timeout: 30000,
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
    timeout: 30000,
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
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) {
    throw new Error('Failed to upload book images');
  }
  return res.json();
}

export async function deleteBookImage(id) {
  const res = await fetch(`${API_URL}/book-images/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to delete book image');
  }
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
  const res = await fetch(`${API_URL}/hero-slides/`, { next: { revalidate: 60 } });
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
  const res = await fetch(`${API_URL}/site-settings/current/`, { next: { revalidate: 60 } });
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

// Steadfast কানেকশন ডায়াগনস্টিক — saved key দিয়ে সত্যিকারের auth টেস্ট করে
export async function testSteadfastConnection() {
  const res = await fetch(`${API_URL}/orders/admin/steadfast/test/`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('টেস্ট রিকোয়েস্ট ব্যর্থ হয়েছে।');
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

export async function getAdminCustomers() {
  const res = await fetch(`${API_URL}/accounts/admin/users/`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('গ্রাহক তালিকা লোড করতে সমস্যা হয়েছে।');
  return res.json();
}

export async function updateAdminOrder(orderId, updateData) {
  const res = await fetch(`${API_URL}/orders/admin/orders/${orderId}/status/`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });
  if (!res.ok) throw new Error('Failed to update order');
  return res.json();
}

export async function sendOrderToSteadfast(orderId) {
  const res = await fetch(`${API_URL}/orders/admin/orders/${orderId}/steadfast/`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to send to SteadFast');
  return data;
}

export async function sendOrderEmailNotification(orderId, type) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 সেকেন্ড timeout
  try {
    const res = await fetch(`${API_URL}/orders/admin/orders/${orderId}/email/`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send email notification');
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('ইমেল পাঠাতে অনেক সময় লেগেছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
    throw err;
  }
}

export async function getAdminReviews() {
  const res = await fetch(`${API_URL}/orders/admin/reviews/`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

export async function adminReviewAction(reviewId, action) {
  const res = await fetch(`${API_URL}/orders/admin/reviews/${reviewId}/`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action })
  });
  if (!res.ok) throw new Error('Failed to perform review action');
  return res.json();
}

export async function getAdminSteadfastBalance() {
  const res = await fetch(`${API_URL}/orders/admin/steadfast/balance/`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch balance');
  return res.json();
}

export async function getAdminSteadfastTracking(orderId) {
  const res = await fetch(`${API_URL}/orders/admin/orders/${orderId}/steadfast/track/`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to fetch SteadFast tracking');
  return data;
}


// Offer Banner
export async function getOfferBanners() {
  const res = await fetch(`${API_URL}/offer-banners/`, { next: { revalidate: 60 } });
  if (!res.ok) return { results: [] };
  return res.json();
}

// Sub-Admin Management (Super Admin only)
export async function getAdminSubadmins() {
  const res = await fetch(`${API_URL}/accounts/admin/subadmins/`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('সাব-অ্যাডমিন তালিকা লোড করতে সমস্যা হয়েছে।');
  return res.json();
}

export async function createAdminSubadmin(data) {
  const res = await fetch(`${API_URL}/accounts/admin/subadmins/`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const msg = await parseDRFError(res, 'সাব-অ্যাডমিন তৈরি করতে সমস্যা হয়েছে।');
    throw new Error(msg);
  }
  return res.json();
}

export async function updateAdminSubadmin(id, data) {
  const res = await fetch(`${API_URL}/accounts/admin/subadmins/${id}/`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const msg = await parseDRFError(res, 'সাব-অ্যাডমিন তথ্য আপডেট করতে সমস্যা হয়েছে।');
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteAdminSubadmin(id) {
  const res = await fetch(`${API_URL}/accounts/admin/subadmins/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('সাব-অ্যাডমিন মুছতে সমস্যা হয়েছে।');
  return true;
}

export async function getAdminPermissions() {
  const res = await fetch(`${API_URL}/accounts/admin/permissions/`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('পারমিশন তালিকা লোড করতে সমস্যা হয়েছে।');
  return res.json();
}

export function normalizePhone(input) {
  if (!input) return '';
  // Check if it looks like an email. If so, don't normalize it.
  if (input.includes('@')) {
    return input.trim();
  }
  // Strip all non-digit characters
  let cleaned = input.replace(/\D/g, '');
  // Remove 88 prefix if it exists and remaining is a valid number (> 10 digits)
  if (cleaned.startsWith('88') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

export async function recoverAccount(data) {
  const res = await fetch(`${API_URL}/accounts/recover/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || 'রিকভারি রিকোয়েস্ট ব্যর্থ হয়েছে।');
  }

  return res.json();
}

