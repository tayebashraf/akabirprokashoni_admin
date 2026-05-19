'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PenLine, Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { authorsApi } from '@/lib/api';
import type { Author, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';

export default function AuthorsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Author>>({
    queryKey: ['authors'],
    queryFn: () => authorsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (d: { name: string; bio?: string }) => authorsApi.create(d),
    onSuccess: () => { toast.success('লেখক যুক্ত হয়েছে!'); queryClient.invalidateQueries({ queryKey: ['authors'] }); setCreateOpen(false); },
    onError: () => toast.error('লেখক তৈরি ব্যর্থ।'),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => authorsApi.delete(slug),
    onSuccess: () => { toast.success('লেখক মুছে ফেলা হয়েছে।'); queryClient.invalidateQueries({ queryKey: ['authors'] }); },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({ name: fd.get('name') as string, bio: fd.get('bio') as string });
  };

  const authors = data?.results || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Hind Siliguri'" }}>✍️ লেখকগণ</h1>
          <p className="text-zinc-500 text-sm mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>মোট {authors.length}জন</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2" style={{ fontFamily: "'Hind Siliguri'" }}>
              <Plus className="w-4 h-4" /> নতুন লেখক
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800">
            <DialogHeader><DialogTitle className="text-white" style={{ fontFamily: "'Hind Siliguri'" }}>নতুন লেখক</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>নাম *</Label>
                <Input name="name" required className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>পরিচিতি</Label>
                <Textarea name="bio" rows={3} className="bg-zinc-900 border-zinc-800 text-white" />
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
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 bg-zinc-900/50" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {authors.map((a) => (
            <Card key={a.id} className="bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700/50 transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {a.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate" style={{ fontFamily: "'Hind Siliguri'" }}>{a.name}</p>
                  <p className="text-xs text-zinc-500 truncate" style={{ fontFamily: "'Hind Siliguri'" }}>{a.bio || 'পরিচিতি নেই'}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-500/10 h-8 w-8 shrink-0"
                  onClick={() => { if (confirm('নিশ্চিত?')) deleteMutation.mutate(a.slug); }}>
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
