import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: { id: number; name: string; phone: string } | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (access: string, refresh: string, user: { id: number; name: string; phone: string }) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  login: (access, refresh, user) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    set({ isAuthenticated: true, accessToken: access, refreshToken: refresh, user });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ isAuthenticated: false, accessToken: null, refreshToken: null, user: null });
    window.location.href = '/login';
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    const userStr = localStorage.getItem('user');
    if (access && refresh && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ isAuthenticated: true, accessToken: access, refreshToken: refresh, user });
      } catch {
        set({ isAuthenticated: false });
      }
    }
  },
}));

// সাইডবার UI স্টেট
interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCollapse: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleCollapse: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
