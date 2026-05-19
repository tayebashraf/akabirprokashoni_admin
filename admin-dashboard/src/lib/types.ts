// ============================================
// API মডেল টাইপস — ব্যাকএন্ড সিরিয়ালাইজার থেকে
// ============================================

// বই সম্পর্কিত
export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  order: number;
  book_count: number;
}

export interface Author {
  id: number;
  name: string;
  slug: string;
  bio: string;
  image: string | null;
}

export interface BookListItem {
  id: number;
  title: string;
  slug: string;
  author_name: string;
  category_name: string;
  price: number;
  original_price: number;
  discount: number;
  cover: string | null;
  rating: number;
  review_count: number;
  in_stock: boolean;
  stock: number;
  is_trending: boolean;
  is_new_release: boolean;
  is_preorder: boolean;
  production_status?: 'manuscript' | 'editing' | 'printing' | 'published';
  estimated_publish_date?: string | null;
}

export interface BookImage {
  id: number;
  book: number;
  image: string;
  caption: string;
  order: number;
}

export interface Review {
  id: number;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  // অ্যাডমিন ফিল্ড
  book_title?: string;
  book_slug?: string;
  is_approved?: boolean;
}

export interface BookDetail {
  id: number;
  title: string;
  slug: string;
  book_type: 'original' | 'translation';
  authors: number[];
  authors_details: Author[];
  translators: number[];
  translators_details: Author[];
  category: number;
  category_details: Category;
  publisher: string;
  price: number;
  original_price: number;
  discount: number;
  pages: number;
  isbn: string;
  language: string;
  stock: number;
  cover: string | null;
  sample_pdf: string | null;
  description: string;
  author_bio: string;
  tags: string;
  tags_list: string[];
  rating: number;
  review_count: number;
  in_stock: boolean;
  is_trending: boolean;
  is_new_release: boolean;
  is_preorder: boolean;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  edition: string;
  weight: number;
  dimensions: string;
  created_at: string;
  production_status: 'manuscript' | 'editing' | 'printing' | 'published';
  production_notes: string;
  estimated_publish_date: string | null;
  reviews: Review[];
  images: BookImage[];
}

// অর্ডার সম্পর্কিত
export interface OrderItem {
  id: number;
  book: number;
  book_title: string;
  quantity: number;
  price: number;
  line_total: number;
}

export interface Order {
  order_id: string;
  customer_name: string;
  phone: string;
  email: string;
  district: string;
  upazila: string;
  address: string;
  payment_method: string;
  payment_display: string;
  status: OrderStatus;
  status_display: string;
  subtotal: number;
  delivery_charge: number;
  total: number;
  items: OrderItem[];
  created_at: string;
  note?: string;
  steadfast_consignment_id?: string;
  steadfast_tracking_code?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'packaging' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'card';

// হিরো স্লাইড
export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

// সাইট সেটিংস
export interface SiteSettings {
  id: number;
  site_name: string;
  site_tagline: string;
  logo: string | null;
  favicon: string | null;
  phone: string;
  email: string;
  address: string;
  facebook_url: string;
  youtube_url: string;
  instagram_url: string;
  footer_text: string;
  announcement: string;
}

// ড্যাশবোর্ড পরিসংখ্যান
export interface DashboardStats {
  orders: {
    total: number;
    today: number;
    pending: number;
    this_week: number;
    status_breakdown: Record<string, number>;
  };
  revenue: {
    total: number;
    today: number;
    this_week: number;
    this_month: number;
    daily_chart: { date: string; revenue: number }[];
  };
  catalog: {
    total_books: number;
    low_stock: number;
    out_of_stock: number;
    total_authors: number;
    total_categories: number;
  };
  reviews: {
    pending: number;
  };
  low_stock_alerts: {
    id: number;
    title: string;
    slug: string;
    stock: number;
    cover: string | null;
  }[];
}

// ইউজার / অথ
export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profile?: {
    phone: string;
    address: string;
    city: string;
  };
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    name: string;
    phone: string;
  };
}

// পেজিনেটেড রেসপন্স
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
