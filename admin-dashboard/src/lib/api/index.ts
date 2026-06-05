import api from './client';
import type { LoginResponse, DashboardStats, Order, PaginatedResponse, Review, SteadfastTestResult } from '../types';

// ============================================
// অথেনটিকেশন
// ============================================
export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/accounts/login/', { username, password });
    return data;
  },
  refreshToken: async (refresh: string) => {
    const { data } = await api.post('/accounts/token/refresh/', { refresh });
    return data;
  },
  getProfile: async () => {
    const { data } = await api.get('/accounts/profile/');
    return data;
  },
};

// ============================================
// ড্যাশবোর্ড
// ============================================
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/orders/admin/dashboard/');
    return data;
  },
  getSteadfastBalance: async (): Promise<{ balance: number }> => {
    const { data } = await api.get('/orders/admin/steadfast/balance/');
    return data;
  },
};

// ============================================
// অর্ডার ম্যানেজমেন্ট
// ============================================
export const ordersApi = {
  getAll: async (params?: Record<string, string>): Promise<PaginatedResponse<Order>> => {
    const { data } = await api.get('/orders/admin/orders/', { params });
    return data;
  },
  updateStatus: async (orderId: string, status: string): Promise<Order> => {
    const { data } = await api.patch(`/orders/admin/orders/${orderId}/status/`, { status });
    return data;
  },
  sendToSteadfast: async (orderId: string) => {
    const { data } = await api.post(`/orders/admin/orders/${orderId}/steadfast/`);
    return data;
  },
};

// ============================================
// বই ম্যানেজমেন্ট
// ============================================
export const booksApi = {
  getAll: async (params?: Record<string, string>) => {
    const { data } = await api.get('/books/', { params });
    return data;
  },
  getBySlug: async (slug: string) => {
    const { data } = await api.get(`/books/${slug}/`);
    return data;
  },
  create: async (formData: FormData) => {
    const { data } = await api.post('/books/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  update: async (slug: string, formData: FormData) => {
    const { data } = await api.patch(`/books/${slug}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  delete: async (slug: string) => {
    await api.delete(`/books/${slug}/`);
  },
};

// ============================================
// লেখক ম্যানেজমেন্ট
// ============================================
export const authorsApi = {
  getAll: async () => {
    const { data } = await api.get('/authors/');
    return data;
  },
  create: async (authorData: { name: string; bio?: string }) => {
    const { data } = await api.post('/authors/', authorData);
    return data;
  },
  update: async (slug: string, authorData: Partial<{ name: string; bio: string }>) => {
    const { data } = await api.patch(`/authors/${slug}/`, authorData);
    return data;
  },
  delete: async (slug: string) => {
    await api.delete(`/authors/${slug}/`);
  },
};

// ============================================
// বিষয়/ক্যাটাগরি ম্যানেজমেন্ট
// ============================================
export const categoriesApi = {
  getAll: async () => {
    const { data } = await api.get('/categories/');
    return data;
  },
  create: async (catData: { name: string; icon?: string; description?: string }) => {
    const { data } = await api.post('/categories/', catData);
    return data;
  },
  update: async (slug: string, catData: Partial<{ name: string; icon: string; description: string }>) => {
    const { data } = await api.patch(`/categories/${slug}/`, catData);
    return data;
  },
  delete: async (slug: string) => {
    await api.delete(`/categories/${slug}/`);
  },
};

// ============================================
// রিভিউ মডারেশন
// ============================================
export const reviewsApi = {
  getAll: async (filter: string = 'pending'): Promise<Review[]> => {
    const { data } = await api.get('/orders/admin/reviews/', { params: { filter } });
    return data;
  },
  create: async (reviewData: { book: number; customer_name: string; rating: number; comment: string }) => {
    const { data } = await api.post('/orders/admin/reviews/add/', reviewData);
    return data;
  },
  approve: async (reviewId: number) => {
    const { data } = await api.patch(`/orders/admin/reviews/${reviewId}/`, { action: 'approve' });
    return data;
  },
  reject: async (reviewId: number) => {
    const { data } = await api.patch(`/orders/admin/reviews/${reviewId}/`, { action: 'reject' });
    return data;
  },
};

// ============================================
// হিরো স্লাইড
// ============================================
export const heroSlidesApi = {
  getAll: async () => {
    const { data } = await api.get('/hero-slides/');
    return data;
  },
  create: async (formData: FormData) => {
    const { data } = await api.post('/hero-slides/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  update: async (id: number, formData: FormData) => {
    const { data } = await api.patch(`/hero-slides/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  delete: async (id: number) => {
    await api.delete(`/hero-slides/${id}/`);
  },
};

// ============================================
// সাইট সেটিংস
// ============================================
export const siteSettingsApi = {
  get: async () => {
    const { data } = await api.get('/site-settings/current/');
    return data;
  },
  update: async (formData: FormData) => {
    const { data } = await api.patch('/site-settings/1/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  testSteadfast: async (): Promise<SteadfastTestResult> => {
    const { data } = await api.get('/orders/admin/steadfast/test/');
    return data;
  },
};
