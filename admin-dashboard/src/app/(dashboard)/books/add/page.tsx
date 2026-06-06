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

function slugifyBengali(text: string) {
  const map: { [key: string]: string } = {
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ny',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'z', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
    'া': 'a', 'ি': 'i', 'ী': 'ee', 'ু': 'u', 'ূ': 'oo', 'ৃ': 'ri',
    'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
    'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': '',
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  
  let result = '';
  const lowercase = (text || '').toLowerCase();
  for (let i = 0; i < lowercase.length; i++) {
    const char = lowercase[i];
    if (map[char] !== undefined) {
      result += map[char];
    } else if (/[a-z0-9]/.test(char)) {
      result += char;
    } else if (/\s/.test(char) || char === '-') {
      result += '-';
    }
  }
  
  return result
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AddBookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ফর্ম স্টেট
  const [title, setTitle] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [bookType, setBookType] = useState('original');
  const [selectedAuthors, setSelectedAuthors] = useState<number[]>([]);
  const [selectedTranslators, setSelectedTranslators] = useState<number[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [language, setLanguage] = useState('bangla');
  const [productionStatus, setProductionStatus] = useState('published');
  const [isNewRelease, setIsNewRelease] = useState(true);
  const [isTrending, setIsTrending] = useState(false);
  const [isPreorder, setIsPreorder] = useState(false);
  const [sampleImages, setSampleImages] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

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
    onSuccess: async (data: any) => {
      if (sampleImages.length > 0 && data?.id) {
        setIsUploadingImages(true);
        toast.info('বই তৈরি হয়েছে, এখন পৃষ্ঠার ছবি আপলোড হচ্ছে...');
        try {
          const { default: api } = await import('@/lib/api/client');
          for (let i = 0; i < sampleImages.length; i++) {
            const fd = new FormData();
            fd.append('book', data.id);
            fd.append('image', sampleImages[i]);
            fd.append('order', String(i + 1));
            
            await api.post('/book-images/', fd, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          }
        } catch (err) {
          console.error('Error uploading sample images:', err);
          toast.error('পৃষ্ঠার ছবি আপলোড করতে সমস্যা হয়েছে');
        }
        setIsUploadingImages(false);
      }
      
      toast.success('নতুন বই সফলভাবে যুক্ত হয়েছে!');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      router.push('/books');
    },
    onError: (err: any) => {
      console.error('Book creation error:', err);
      const detail = err?.response?.data;
      let msg = 'সমস্যা হয়েছে: Failed to create book';
      if (detail) {
        if (typeof detail === 'string') msg = detail;
        else if (typeof detail === 'object') {
          const parts = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
          msg = parts.join('\n');
        }
      }
      toast.error(msg);
      alert(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Base UI Select/Switch components don't produce native form data,
    // so we must explicitly set all controlled fields.

    // Authors (ManyToMany)
    fd.delete('authors');
    selectedAuthors.forEach(id => fd.append('authors', String(id)));

    // Category
    if (categoryId) {
      fd.set('category', categoryId);
    }

    // Book type — model expects 'translated', not 'translation'
    fd.set('book_type', bookType === 'translation' ? 'translated' : bookType);

    // Translator (CharField, not M2M) — if translation, combine translator names
    fd.delete('translators');

    // Select-based fields (base-ui Select doesn't submit natively)
    fd.set('language', language);
    fd.set('production_status', productionStatus);

    // Switch/Boolean fields (base-ui Switch doesn't submit natively)
    fd.set('is_new_release', isNewRelease ? 'true' : 'false');
    fd.set('is_trending', isTrending ? 'true' : 'false');
    fd.set('is_preorder', isPreorder ? 'true' : 'false');

    const cover = fd.get('cover') as File | null;
    if (cover && cover.size === 0) fd.delete('cover');
    // `sample_pdf` is no longer used, so we don't need to append it.

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
                  <Input 
                    name="title" 
                    required 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="যেমন: প্যারাডক্সিক্যাল সাজিদ" 
                    className="bg-zinc-800/50 border-zinc-700 text-white text-lg" 
                    style={{ fontFamily: "'Hind Siliguri'" }} 
                  />
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

            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-base text-zinc-300 flex items-center gap-2" style={{ fontFamily: "'Hind Siliguri'" }}>
                  🔎 এসইও (SEO) অপটিমাইজেশন
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Google SERP Preview */}
                <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-zinc-400">Google Search Preview</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-emerald-400 block truncate font-mono">
                      https://akabirprokashoni.com <span className="text-zinc-500">&gt; books &gt; {slugifyBengali(title) || 'book-title'}</span>
                    </span>
                    <h3 className="text-blue-400 hover:underline text-lg font-medium leading-snug cursor-pointer truncate">
                      {metaTitle || title || 'বইয়ের শিরোনাম — আকাবির প্রকাশনী'}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed" style={{ fontFamily: "'Hind Siliguri'" }}>
                      {metaDescription || (title ? `${title} বইটি আকাবির প্রকাশনী থেকে সেরা মূল্যে কিনুন। লেখক পরিচিতি, সারসংক্ষেপ ও কিছু পৃষ্ঠা পড়ে দেখতে এখনই ভিজিট করুন।` : 'বইয়ের সংক্ষিপ্ত বিবরণ এখানে প্রদর্শিত হবে...')}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>SEO টাইটেল (Meta Title)</Label>
                      <span className="text-xs text-zinc-500">{metaTitle.length}/60 chars</span>
                    </div>
                    <Input 
                      name="meta_title" 
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="খালি রাখলে বইয়ের নাম ব্যবহার করা হবে" 
                      maxLength={60}
                      className="bg-zinc-800/50 border-zinc-700 text-white" 
                      style={{ fontFamily: "'Hind Siliguri'" }} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>SEO বিবরণ (Meta Description)</Label>
                      <span className="text-xs text-zinc-500">{metaDescription.length}/160 chars</span>
                    </div>
                    <Textarea 
                      name="meta_description" 
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      rows={3}
                      placeholder="গুগল সার্চের জন্য আকর্ষণীয় বিবরণ লিখুন (১৫০-১৬০ অক্ষরের মধ্যে)" 
                      maxLength={160}
                      className="bg-zinc-800/50 border-zinc-700 text-white resize-none" 
                      style={{ fontFamily: "'Hind Siliguri'" }} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>SEO কিওয়ার্ডস (Meta Keywords)</Label>
                    <Input 
                      name="meta_keywords" 
                      placeholder="যেমন: বইয়ের নাম, লেখকের নাম, ইসলামী বই" 
                      className="bg-zinc-800/50 border-zinc-700 text-white" 
                      style={{ fontFamily: "'Hind Siliguri'" }} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>SEO শর্ট ডেসক্রিপশন (Short Description)</Label>
                    <Textarea 
                      name="short_description" 
                      placeholder="১-২ লাইনের বইয়ের সংক্ষিপ্ত পরিচিতি (না দিলে মূল বিবরণের প্রথম ১৬০ অক্ষর ব্যবহার হবে)" 
                      className="bg-zinc-800/50 border-zinc-700 text-white" 
                      style={{ fontFamily: "'Hind Siliguri'" }} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>কভার ইমেজ অল্টার টেক্সট (Cover Alt Text)</Label>
                    <Input 
                      name="cover_alt_text" 
                      placeholder="ইমেজের অল্টার টেক্সট (খালি রাখলে অটোমেটিক জেনারেট হবে)" 
                      className="bg-zinc-800/50 border-zinc-700 text-white" 
                      style={{ fontFamily: "'Hind Siliguri'" }} 
                    />
                  </div>
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
                  <input type="file" multiple accept="image/*" onChange={(e) => {
                    if (e.target.files) {
                      const filesArray = Array.from(e.target.files);
                      setSampleImages(prev => [...prev, ...filesArray]);
                    }
                  }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <FileText className="w-8 h-8 text-zinc-500 group-hover:text-blue-400 mb-2 transition-colors" />
                  <p className="text-sm font-medium text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>"একটু পড়ে দেখুন" (পৃষ্ঠার ছবিসমূহ)</p>
                  <p className="text-xs text-zinc-500 mt-1">একাধিক ছবি আপলোড করতে পারবেন (JPG, PNG)</p>
                </div>
                
                {sampleImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-4">
                    {sampleImages.map((file, idx) => (
                      <div key={idx} className="relative group w-20 h-24 bg-zinc-800 rounded border border-zinc-700 overflow-hidden">
                        <img src={URL.createObjectURL(file)} alt={`Sample ${idx+1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setSampleImages(sampleImages.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">Page {idx+1}</div>
                      </div>
                    ))}
                  </div>
                )}
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
                    <Select value={language} onValueChange={setLanguage}>
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
                  <Select value={productionStatus} onValueChange={setProductionStatus}>
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
                  <Switch checked={isNewRelease} onCheckedChange={setIsNewRelease} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>ট্রেন্ডিং?</Label>
                  <Switch checked={isTrending} onCheckedChange={setIsTrending} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>প্রি-অর্ডার?</Label>
                  <Switch checked={isPreorder} onCheckedChange={setIsPreorder} />
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
          <Button type="submit" disabled={createMutation.isPending || isUploadingImages || selectedAuthors.length === 0} className="bg-emerald-600 hover:bg-emerald-500 gap-2 min-w-[150px]" style={{ fontFamily: "'Hind Siliguri'" }}>
            {createMutation.isPending || isUploadingImages ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {isUploadingImages ? 'ছবি আপলোড হচ্ছে...' : 'সংরক্ষণ হচ্ছে...'}</>
            ) : (
              <><Save className="w-5 h-5" /> সংরক্ষণ করুন</>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
