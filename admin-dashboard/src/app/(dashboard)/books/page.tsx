'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Search, Trash2, Edit, Grid3X3, List, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { booksApi, authorsApi, categoriesApi } from '@/lib/api';
import type { BookListItem, Author, Category, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';

const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function BooksPage() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const params: Record<string, string> = {};
  if (search) params.search = search;

  const { data, isLoading } = useQuery<PaginatedResponse<BookListItem>>({
    queryKey: ['books', params],
    queryFn: () => booksApi.getAll(params),
  });

  const { data: authors } = useQuery<PaginatedResponse<Author>>({
    queryKey: ['authors'],
    queryFn: () => authorsApi.getAll(),
  });

  const { data: categories } = useQuery<PaginatedResponse<Category>>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => booksApi.delete(slug),
    onSuccess: () => {
      toast.success('বই মুছে ফেলা হয়েছে।');
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: () => toast.error('বই মুছতে ব্যর্থ।'),
  });

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => booksApi.create(formData),
    onSuccess: () => {
      toast.success('নতুন বই যুক্ত হয়েছে!');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data ? JSON.stringify(err.response.data) : 'বই তৈরি ব্যর্থ।'),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate(fd);
  };

  const books = data?.results || [];

  return (
    <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
      initial="hidden" animate="show" className="space-y-6">

      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Hind Siliguri'" }}>📚 বইসমূহ</h1>
          <p className="text-zinc-500 text-sm mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>মোট {data?.count || 0}টি বই</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-lg p-0.5">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"
              onClick={() => setViewMode('grid')}><Grid3X3 className="w-4 h-4" /></Button>
            <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"
              onClick={() => setViewMode('table')}><List className="w-4 h-4" /></Button>
          </div>
          <a href="/books/add">
            <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2" style={{ fontFamily: "'Hind Siliguri'" }}>
              <Plus className="w-4 h-4" /> নতুন বই
            </Button>
          </a>
        </div>
      </motion.div>

      {/* সার্চ */}
      <motion.div variants={item} className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input placeholder="বই খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-zinc-900/50 border-zinc-800 text-white" style={{ fontFamily: "'Hind Siliguri'" }} />
      </motion.div>

      {/* বই তালিকা */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-64 bg-zinc-900/50" />)}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
          <p className="text-zinc-400 text-lg" style={{ fontFamily: "'Hind Siliguri'" }}>কোনো বই পাওয়া যায়নি</p>
          <p className="text-zinc-600 text-sm mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>প্রথম বই যুক্ত করতে উপরের বাটনে ক্লিক করুন</p>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {books.map((book) => (
            <Card key={book.id} className="bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700/50 transition-all group overflow-hidden">
              <div className="aspect-[3/4] bg-zinc-800/50 relative overflow-hidden">
                {book.cover ? (
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="flex items-center justify-center h-full"><BookOpen className="w-12 h-12 text-zinc-700" /></div>
                )}
                {book.discount > 0 && (
                  <Badge className="absolute top-2 right-2 bg-red-500 text-white border-0">{book.discount}% ছাড়</Badge>
                )}
                {!book.in_stock && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge variant="destructive" className="text-sm" style={{ fontFamily: "'Hind Siliguri'" }}>স্টক আউট</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-white line-clamp-2" style={{ fontFamily: "'Hind Siliguri'" }}>{book.title}</h3>
                <p className="text-xs text-zinc-500" style={{ fontFamily: "'Hind Siliguri'" }}>{book.author_name}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-emerald-400">৳{book.price}</span>
                    {book.original_price > book.price && (
                      <span className="text-xs text-zinc-600 line-through">৳{book.original_price}</span>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">{book.stock}টি</Badge>
                </div>
                {book.production_status && book.production_status !== 'published' && (
                  <Badge variant="outline" className="text-[10px] w-fit border-amber-500/30 text-amber-400 bg-amber-500/10" style={{ fontFamily: "'Hind Siliguri'" }}>
                    {book.production_status === 'manuscript' ? 'পাণ্ডুলিপি চলছে' :
                     book.production_status === 'editing' ? 'সম্পাদনা চলছে' :
                     book.production_status === 'printing' ? 'প্রিন্টিং এ আছে' : ''}
                  </Badge>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs border-zinc-700 text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>
                    <Edit className="w-3 h-3 mr-1" /> সম্পাদনা
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => { if (confirm('নিশ্চিত?')) deleteMutation.mutate(book.slug); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : (
        <motion.div variants={item} className="rounded-xl border border-zinc-800/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800/50">
                {['শিরোনাম', 'লেখক', 'অবস্থা', 'মূল্য', 'স্টক', 'রেটিং', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/30">
                  <td className="px-4 py-3 text-sm text-white" style={{ fontFamily: "'Hind Siliguri'" }}>{book.title}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>{book.author_name}</td>
                  <td className="px-4 py-3">
                    {book.production_status === 'published' ? (
                      <span className="text-emerald-400 text-xs">প্রকাশিত</span>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10" style={{ fontFamily: "'Hind Siliguri'" }}>
                        {book.production_status === 'manuscript' ? 'পাণ্ডুলিপি' :
                         book.production_status === 'editing' ? 'সম্পাদনা' :
                         book.production_status === 'printing' ? 'প্রিন্টিং' : ''}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-emerald-400 font-semibold">৳{book.price}</td>
                  <td className="px-4 py-3">
                    <Badge variant={book.stock === 0 ? 'destructive' : 'secondary'} className="text-xs">
                      {book.stock === 0 ? 'আউট' : `${book.stock}টি`}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-amber-400">⭐ {book.rating}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-500/10 h-8 w-8"
                      onClick={() => { if (confirm('নিশ্চিত?')) deleteMutation.mutate(book.slug); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </motion.div>
  );
}
