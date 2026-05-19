'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ImageIcon, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { heroSlidesApi } from '@/lib/api';
import type { HeroSlide } from '@/lib/types';
import { toast } from 'sonner';

export default function HeroSlidesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: slides, isLoading } = useQuery<HeroSlide[]>({
    queryKey: ['hero-slides'],
    queryFn: heroSlidesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => heroSlidesApi.create(fd),
    onSuccess: () => { toast.success('স্লাইড যুক্ত হয়েছে!'); queryClient.invalidateQueries({ queryKey: ['hero-slides'] }); setCreateOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => heroSlidesApi.delete(id),
    onSuccess: () => { toast.success('স্লাইড মুছে ফেলা হয়েছে।'); queryClient.invalidateQueries({ queryKey: ['hero-slides'] }); },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate(fd);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Hind Siliguri'" }}>🖼️ হিরো স্লাইড</h1>
          <p className="text-zinc-500 text-sm mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>হোমপেজের ব্যানার স্লাইড</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2" style={{ fontFamily: "'Hind Siliguri'" }}>
              <Plus className="w-4 h-4" /> নতুন স্লাইড
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800">
            <DialogHeader><DialogTitle className="text-white" style={{ fontFamily: "'Hind Siliguri'" }}>নতুন স্লাইড</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>শিরোনাম</Label>
                <Input name="title" required className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>সাবটাইটেল</Label>
                <Input name="subtitle" className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>ইমেজ *</Label>
                <Input name="image" type="file" accept="image/*" required className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>লিংক</Label>
                <Input name="link" className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full bg-emerald-600" style={{ fontFamily: "'Hind Siliguri'" }}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} যুক্ত করুন
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 bg-zinc-900/50" />)}
        </div>
      ) : !slides?.length ? (
        <div className="text-center py-20">
          <ImageIcon className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
          <p className="text-zinc-400 text-lg" style={{ fontFamily: "'Hind Siliguri'" }}>কোনো স্লাইড নেই</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {slides.map((slide) => (
            <Card key={slide.id} className="bg-zinc-900/50 border-zinc-800/50 overflow-hidden">
              <div className="aspect-[16/7] bg-zinc-800 relative">
                {slide.image && (
                  <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Hind Siliguri'" }}>{slide.title}</p>
                  {slide.subtitle && <p className="text-zinc-300 text-xs mt-0.5" style={{ fontFamily: "'Hind Siliguri'" }}>{slide.subtitle}</p>}
                </div>
                <Badge className={`absolute top-2 right-2 ${slide.is_active ? 'bg-emerald-500' : 'bg-zinc-600'} text-white border-0 text-xs`}>
                  {slide.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </Badge>
              </div>
              <CardContent className="p-3 flex justify-between items-center">
                <span className="text-xs text-zinc-500">ক্রম: {slide.order}</span>
                <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-500/10 h-8 w-8"
                  onClick={() => { if (confirm('নিশ্চিত?')) deleteMutation.mutate(slide.id); }}>
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
