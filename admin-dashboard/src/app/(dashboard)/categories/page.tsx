'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Tag, Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { categoriesApi } from '@/lib/api';
import type { Category, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Category>>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (d: { name: string; icon?: string }) => categoriesApi.create(d),
    onSuccess: () => { toast.success('বিষয় যুক্ত হয়েছে!'); queryClient.invalidateQueries({ queryKey: ['categories'] }); setCreateOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => categoriesApi.delete(slug),
    onSuccess: () => { toast.success('বিষয় মুছে ফেলা হয়েছে।'); queryClient.invalidateQueries({ queryKey: ['categories'] }); },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({ name: fd.get('name') as string, icon: fd.get('icon') as string || '📚' });
  };

  const categories = data?.results || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Hind Siliguri'" }}>🏷️ বিষয়সমূহ</h1>
          <p className="text-zinc-500 text-sm mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>মোট {categories.length}টি</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2" style={{ fontFamily: "'Hind Siliguri'" }}>
              <Plus className="w-4 h-4" /> নতুন বিষয়
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800">
            <DialogHeader><DialogTitle className="text-white" style={{ fontFamily: "'Hind Siliguri'" }}>নতুন বিষয়</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>নাম *</Label>
                <Input name="name" required className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>আইকন (ইমোজি)</Label>
                <Input name="icon" placeholder="📚" defaultValue="📚" className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full bg-emerald-600" style={{ fontFamily: "'Hind Siliguri'" }}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} যুক্ত করুন
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 bg-zinc-900/50" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <Card key={c.id} className="bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700/50 transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-3xl">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium" style={{ fontFamily: "'Hind Siliguri'" }}>{c.name}</p>
                  <Badge variant="secondary" className="text-xs mt-1">{c.book_count}টি বই</Badge>
                </div>
                <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-500/10 h-8 w-8 shrink-0"
                  onClick={() => { if (confirm('নিশ্চিত?')) deleteMutation.mutate(c.slug); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
