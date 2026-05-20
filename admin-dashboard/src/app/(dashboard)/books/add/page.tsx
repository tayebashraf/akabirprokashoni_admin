'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, ImagePlus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { booksApi, authorsApi, categoriesApi } from '@/lib/api';
import type { Author, Category, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AddBookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ফর্ম স্টেট
  const [bookType, setBookType] = useState('original');
  const [selectedAuthors, setSelectedAuthors] = useState<number[]>([]);
  const [selectedTranslators, setSelectedTranslators] = useState<number[]>([]);
  const [categoryId, setCategoryId] = useState('');

  const { data: authorsData } = useQuery<PaginatedResponse<Author>>({
    queryKey: ['authors'],
    queryFn: () => authorsApi.getAll(),
  });

  const { data: categoriesData } = useQuery<PaginatedResponse<Category>>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => booksApi.create(formData),
    onSuccess: () => {
      toast.success('নতুন বই সফলভাবে যুক্ত হয়েছে!');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      router.push('/books');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('বই তৈরি করতে সমস্যা হয়েছে। ডেটা চেক করুন।');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    // ManyToMany ফিল্ডগুলো ম্যানুয়ালি যুক্ত করতে হবে
    fd.delete('authors');
    selectedAuthors.forEach(id => fd.append('authors', String(id)));

    fd.delete('translators');
    if (bookType === 'translation') {
      selectedTranslators.forEach(id => fd.append('translators', String(id)));
    }

    if (categoryId) {
      fd.set('category', categoryId);
    }
    
    fd.set('book_type', bookType);

    createMutation.mutate(fd);
  };

  const authors = authorsData?.results || [];
  const categories = categoriesData?.results || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Link href="/books">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Hind Siliguri'" }}>বই যুক্ত করুন</h1>
          <p className="text-zinc-500 text-sm mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>বিস্তারিত তথ্য দিয়ে নতুন বই যুক্ত করুন</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* মূল তথ্য - বাম পাশ */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-base text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>প্রাথমিক তথ্য</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বইয়ের নাম *</Label>
                  <Input name="title" required placeholder="যেমন: প্যারাডক্সিক্যাল সাজিদ" className="bg-zinc-800/50 border-zinc-700 text-white text-lg" style={{ fontFamily: "'Hind Siliguri'" }} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বইয়ের ধরন *</Label>
                    <Select value={bookType} onValueChange={setBookType}>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="original" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>মূল কিতাব</SelectItem>
                        <SelectItem value="translation" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>অনুবাদ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বিষয়/ক্যাটাগরি *</Label>
                    <Select value={categoryId} onValueChange={setCategoryId} required>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }}>
                        <SelectValue placeholder="বিষয় নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)} className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* লেখক নির্বাচন */}
                <div className="space-y-2">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>লেখকগণ * (একাধিক নির্বাচন সম্ভব)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border border-zinc-700 rounded-lg bg-zinc-800/30 max-h-48 overflow-y-auto">
                    {authors.map(a => (
                      <label key={a.id} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-zinc-800 rounded">
                        <input type="checkbox" className="accent-emerald-500 rounded border-zinc-600 bg-zinc-800"
                          checked={selectedAuthors.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedAuthors([...selectedAuthors, a.id]);
                            else setSelectedAuthors(selectedAuthors.filter(id => id !== a.id));
                          }}
                        />
                        <span className="text-sm text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>{a.name}</span>
                      </label>
                    ))}
                  </div>
                  {selectedAuthors.length === 0 && <p className="text-xs text-red-400">কমপক্ষে একজন লেখক নির্বাচন করুন</p>}
                </div>

                {/* অনুবাদক নির্বাচন (শুধুমাত্র অনুবাদ বই হলে) */}
                {bookType === 'translation' && (
                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>অনুবাদকগণ</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border border-zinc-700 rounded-lg bg-zinc-800/30 max-h-40 overflow-y-auto">
                      {authors.map(a => (
                        <label key={a.id} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-zinc-800 rounded">
                          <input type="checkbox" className="accent-emerald-500 rounded border-zinc-600 bg-zinc-800"
                            checked={selectedTranslators.includes(a.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedTranslators([...selectedTranslators, a.id]);
                              else setSelectedTranslators(selectedTranslators.filter(id => id !== a.id));
                            }}
                          />
                          <span className="text-sm text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>{a.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 pt-2">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>প্রকাশক</Label>
                  <Input name="publisher" placeholder="যেমন: সমকালীন প্রকাশন" className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-base text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বিস্তারিত বিবরণ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বইয়ের সারসংক্ষেপ / ফ্ল্যাপের লেখা</Label>
                  <Textarea name="description" rows={8} placeholder="বইটি সম্পর্কে বিস্তারিত লিখুন..." className="bg-zinc-800/50 border-zinc-700 text-white resize-y" style={{ fontFamily: "'Hind Siliguri'" }} />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>লেখক পরিচিতি (এই বইয়ের প্রেক্ষাপটে)</Label>
                  <Textarea name="author_bio" rows={4} placeholder="লেখকের সংক্ষিপ্ত পরিচিতি..." className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* সাইডবার - ডান পাশ */}
          <div className="space-y-6">
            {/* ছবি ও ফাইল */}
            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-base text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>ছবি ও একটু পড়ে দেখুন</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors cursor-pointer relative overflow-hidden group">
                  <input type="file" name="cover" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <ImagePlus className="w-8 h-8 text-zinc-500 group-hover:text-emerald-400 mb-2 transition-colors" />
                  <p className="text-sm font-medium text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>কভার আপলোড করুন</p>
                  <p className="text-xs text-zinc-500 mt-1">JPG, PNG (max 2MB)</p>
                </div>

                <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors cursor-pointer relative overflow-hidden group">
                  <input type="file" name="sample_pdf" accept=".pdf,image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <FileText className="w-8 h-8 text-zinc-500 group-hover:text-blue-400 mb-2 transition-colors" />
                  <p className="text-sm font-medium text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>"একটু পড়ে দেখুন" ফাইল</p>
                  <p className="text-xs text-zinc-500 mt-1">PDF অথবা Image (অপশনাল)</p>
                </div>
              </CardContent>
            </Card>

            {/* মূল্য ও স্টক */}
            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-base text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>মূল্য ও স্টক</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>আসল/মুদ্রিত মূল্য (৳) *</Label>
                    <Input name="original_price" type="number" required placeholder="0" className="bg-zinc-800/50 border-zinc-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বিক্রয় মূল্য (৳) *</Label>
                    <Input name="price" type="number" required placeholder="0" className="bg-zinc-800/50 border-zinc-700 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>আসল স্টক *</Label>
                  <Input name="stock" type="number" required defaultValue="0" className="bg-zinc-800/50 border-zinc-700 text-white" />
                  <p className="text-xs text-zinc-500" style={{ fontFamily: "'Hind Siliguri'" }}>নোট: এখানে যত খুশি দিন, ওয়েবসাইটে কাস্টমার সর্বোচ্চ ৫০ কপি দেখতে পাবে।</p>
                </div>
              </CardContent>
            </Card>

            {/* স্পেসিফিকেশন */}
            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-base text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>স্পেসিফিকেশন</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>পৃষ্ঠা</Label>
                    <Input name="pages" type="number" placeholder="0" className="bg-zinc-800/50 border-zinc-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>ভাষা</Label>
                    <Select name="language" defaultValue="bangla">
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="bangla" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বাংলা</SelectItem>
                        <SelectItem value="english" className="text-zinc-300">English</SelectItem>
                        <SelectItem value="arabic" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>আরবি</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বাঁধাই/কভার</Label>
                    <Input name="edition" placeholder="যেমন: হার্ডকভার" className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>ওজন (গ্রাম)</Label>
                    <Input name="weight" type="number" placeholder="0" className="bg-zinc-800/50 border-zinc-700 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">ISBN</Label>
                  <Input name="isbn" className="bg-zinc-800/50 border-zinc-700 text-white" />
                </div>
              </CardContent>
            </Card>

            {/* স্ট্যাটাস ও SEO */}
            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-base text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>স্ট্যাটাস ও প্রোডাকশন</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বর্তমান অবস্থা *</Label>
                  <Select name="production_status" defaultValue="published">
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="manuscript" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>পাণ্ডুলিপি লেখা/অনুবাদ চলছে</SelectItem>
                      <SelectItem value="editing" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>সম্পাদনা/প্রুফরিডিং চলছে</SelectItem>
                      <SelectItem value="printing" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>প্রেসে/প্রিন্টিং এ আছে</SelectItem>
                      <SelectItem value="published" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>প্রকাশিত ও স্টকে আছে</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>সম্ভাব্য প্রকাশের তারিখ</Label>
                  <Input name="estimated_publish_date" type="date" className="bg-zinc-800/50 border-zinc-700 text-white dark:[color-scheme:dark]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>যোগাযোগ ও নোটস</Label>
                  <Textarea name="production_notes" rows={3} placeholder="লেখক বা প্রেসের সাথে সর্বশেষ যোগাযোগের আপডেট..." className="bg-zinc-800/50 border-zinc-700 text-white resize-y" style={{ fontFamily: "'Hind Siliguri'" }} />
                </div>
                
                <hr className="border-zinc-800/50 my-4" />
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>নতুন রিলিজ?</Label>
                  <Switch name="is_new_release" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>ট্রেন্ডিং?</Label>
                  <Switch name="is_trending" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>প্রি-অর্ডার?</Label>
                  <Switch name="is_preorder" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* সাবমিট */}
        <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-zinc-800/50">
          <Link href="/books">
            <Button type="button" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white" style={{ fontFamily: "'Hind Siliguri'" }}>
              বাতিল
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending || selectedAuthors.length === 0} className="bg-emerald-600 hover:bg-emerald-500 gap-2 min-w-[150px]" style={{ fontFamily: "'Hind Siliguri'" }}>
            {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            সংরক্ষণ করুন
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
