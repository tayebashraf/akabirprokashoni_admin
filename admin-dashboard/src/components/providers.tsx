'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // ৩০ সেকেন্ড
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                fontFamily: "'Hind Siliguri', 'Inter', sans-serif",
              },
            }}
          />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
