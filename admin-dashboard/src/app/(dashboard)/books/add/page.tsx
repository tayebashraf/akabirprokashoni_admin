'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, ImagePlus, FileText, X, Search } from 'lucide-react';
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
    'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
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


/* ─────────────────────────────────────────────────────────────
   AuthorAutocomplete — reusable autocomplete with chip tags
   ───────────────────────────────────────────────────────────── */
interface AuthorChip {
  id: number | null;   // null = free-text (not in DB)
  name: string;
}

function AuthorAutocomplete({
  label,
  allAuthors,
  selected,
  onChange,
  placeholder = 'টাইপ করুন...',
}: {
  label: string;
  allAuthors: Author[];
  selected: AuthorChip[];
  onChange: (chips: AuthorChip[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter authors by query, exclude already-selected IDs
  const selectedIds = new Set(selected.filter(c => c.id !== null).map(c => c.id));
  const selectedNames = new Set(selected.map(c => c.name.trim().toLowerCase()));
  const filtered = allAuthors.filter(a => {
    if (selectedIds.has(a.id)) return false;
    if (!query.trim()) return true;
    return a.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addChip = useCallback((chip: AuthorChip) => {
    // Prevent duplicate names
    if (selectedNames.has(chip.name.trim().toLowerCase())) return;
    onChange([...selected, chip]);
    setQuery('');
    setOpen(false);
    setHighlightIdx(-1);
    inputRef.current?.focus();
  }, [selected, selectedNames, onChange]);

  const removeChip = useCallback((idx: number) => {
    onChange(selected.filter((_, i) => i !== idx));
  }, [selected, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < filtered.length) {
        addChip({ id: filtered[highlightIdx].id, name: filtered[highlightIdx].name });
      } else if (query.trim()) {
        // Free text — check if exact match exists
        const exact = allAuthors.find(a => a.name.trim().toLowerCase() === query.trim().toLowerCase());
        if (exact) {
          addChip({ id: exact.id, name: exact.name });
        } else {
          addChip({ id: null, name: query.trim() });
        }
      }
    } else if (e.key === 'Backspace' && !query && selected.length > 0) {
      removeChip(selected.length - 1);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>{label}</Label>
      <div ref={wrapperRef} className="relative">
        {/* Chips + input wrapper */}
        <div
          className="flex flex-wrap items-center gap-1.5 p-2 min-h-[44px] border border-zinc-700 rounded-lg bg-zinc-800/50 focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50 transition-all cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {selected.map((chip, idx) => (
            <span
              key={`${chip.id ?? chip.name}-${idx}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 transition-all hover:bg-emerald-500/25"
              style={{ fontFamily: "'Hind Siliguri'" }}
            >
              {chip.name}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeChip(idx); }}
                className="ml-0.5 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <div className="relative flex-1 min-w-[120px] flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlightIdx(-1); }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={selected.length === 0 ? placeholder : 'আরো যোগ করুন...'}
              className="bg-transparent outline-none text-sm text-white placeholder:text-zinc-500 w-full"
              style={{ fontFamily: "'Hind Siliguri'" }}
            />
          </div>
        </div>

        {/* Dropdown */}
        {open && (query.trim() || filtered.length > 0) && (
          <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/30 animate-in fade-in-0 zoom-in-95 duration-150">
            {filtered.length === 0 && query.trim() && (
              <button
                type="button"
                onClick={() => {
                  const exact = allAuthors.find(a => a.name.trim().toLowerCase() === query.trim().toLowerCase());
                  if (exact) addChip({ id: exact.id, name: exact.name });
                  else addChip({ id: null, name: query.trim() });
                }}
                className="w-full text-left px-3 py-2.5 text-sm text-emerald-400 hover:bg-zinc-800 transition-colors"
                style={{ fontFamily: "'Hind Siliguri'" }}
              >
                ✨ &quot;{query.trim()}&quot; নতুন হিসেবে যোগ করুন
              </button>
            )}
            {filtered.map((a, idx) => (
              <button
                key={a.id}
                type="button"
                onClick={() => addChip({ id: a.id, name: a.name })}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  idx === highlightIdx
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
                style={{ fontFamily: "'Hind Siliguri'" }}
                onMouseEnter={() => setHighlightIdx(idx)}
              >
                {a.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


const PRESET_TAGS = [
  'ইসলামিক বই', 'ইসলামী বই', 'দ্বীনি বই', 'ধর্মীয় বই', 'বাংলা ইসলামিক বই',
  'অনলাইনে বই কিনুন', 'ক্যাশ অন ডেলিভারি বই',
  'আত্মশুদ্ধির বই', 'তাযকিয়ায়ে নফস', 'আত্মশুদ্ধি ও তাসাউফ',
  'তাসাউফ', 'আধ্যাত্মিক বই', 'বুযুর্গদের জীবনী',
  'আখেরাত', 'পরকাল', 'জান্নাত জাহান্নাম', 'মৃত্যু পরবর্তী জীবন',
  'ইসলামিক ফিকহ', 'হানাফী ফিকহ', 'মাসআলা মাসায়েল', 'ইসলামী বিধান',
  'ইসলামিক জীবনী', 'আলেমদের জীবনী', 'সীরাত',
  'ইসলাহী বই', 'সংশোধনমূলক বই', 'তাবলীগ', 'দাওয়াত',
  'মুফতি তাকী উসমানী', 'হাকীমুল উম্মত', 'আশরাফ আলী থানভী',
  'হাকীম আখতার', 'দেওবন্দ', 'আকাবিরে উম্মত',
];

function TagInputField() {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = PRESET_TAGS.filter(
    t => !tags.includes(t) && t.includes(input.trim())
  );

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (idx: number) => setTags(tags.filter((_, i) => i !== idx));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>ট্যাগ (SEO)</Label>
      <input type="hidden" name="tags" value={tags.join(', ')} />
      <div ref={wrapperRef} className="relative">
        <div
          className="flex flex-wrap items-center gap-1.5 p-2 min-h-[44px] border border-zinc-700 rounded-lg bg-zinc-800/50 focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50 transition-all cursor-text"
          onClick={() => { setShowSuggestions(true); }}
        >
          {tags.map((tag, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-zinc-700 text-zinc-200 border border-zinc-600" style={{ fontFamily: "'Hind Siliguri'" }}>
              {tag}
              <button type="button" onClick={() => removeTag(idx)} className="hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          ))}
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? 'ট্যাগ লিখুন বা নিচ থেকে বেছে নিন...' : 'আরো যোগ করুন...'}
            className="bg-transparent outline-none text-sm text-white placeholder:text-zinc-500 flex-1 min-w-[140px]"
            style={{ fontFamily: "'Hind Siliguri'" }}
          />
        </div>
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full max-h-44 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
            <p className="px-3 py-1.5 text-[10px] text-zinc-500 uppercase font-bold tracking-wider border-b border-zinc-800" style={{ fontFamily: "'Hind Siliguri'" }}>প্রি-সেট ট্যাগ</p>
            <div className="flex flex-wrap gap-1.5 p-2">
              {filtered.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="px-2.5 py-1 rounded-full text-xs text-zinc-300 bg-zinc-800 border border-zinc-700 hover:bg-emerald-500/15 hover:text-emerald-300 hover:border-emerald-500/40 transition-all"
                  style={{ fontFamily: "'Hind Siliguri'" }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-500" style={{ fontFamily: "'Hind Siliguri'" }}>Enter বা কমা দিয়ে ট্যাগ আলাদা করুন। সাজেশন থেকেও বেছে নিতে পারেন।</p>
    </div>
  );
}


export default function AddBookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ফর্ম স্টেট
  const [title, setTitle] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [bookType, setBookType] = useState('original');
  const [authorChips, setAuthorChips] = useState<AuthorChip[]>([]);
  const [translatorChips, setTranslatorChips] = useState<AuthorChip[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [language, setLanguage] = useState('bangla');
  const [coverType, setCoverType] = useState('paperback');
  const [productionStatus, setProductionStatus] = useState('published');
  const [isNewRelease, setIsNewRelease] = useState(true);
  const [isTrending, setIsTrending] = useState(false);
  const [isPreorder, setIsPreorder] = useState(false);
  const [sampleImages, setSampleImages] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Helper: get first error message for a field
  const fe = (name: string) => fieldErrors[name]?.[0] ?? '';
  // Helper: error border class
  const errBorder = (name: string) => fe(name) ? 'border-red-500 focus:border-red-500' : 'border-zinc-700';

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

      if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
        // Field-specific errors from backend
        const errors: Record<string, string[]> = {};
        Object.entries(detail).forEach(([k, v]) => {
          errors[k] = Array.isArray(v) ? v.map(String) : [String(v)];
        });
        setFieldErrors(errors);

        // Scroll to first error field
        const firstKey = Object.keys(errors)[0];
        setTimeout(() => {
          const el = document.querySelector(`[data-field="${firstKey}"]`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);

        const firstMsg = errors[firstKey]?.[0] ?? 'তথ্য পূরণে সমস্যা আছে';
        toast.error(`সমস্যা: ${firstMsg}`);
      } else {
        const msg = typeof detail === 'string' ? detail : 'বই যোগ করতে সমস্যা হয়েছে';
        toast.error(msg);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Authors (ManyToMany) — only IDs of existing authors
    fd.delete('authors');
    authorChips.forEach(chip => {
      if (chip.id !== null) {
        fd.append('authors', String(chip.id));
      }
    });

    // Category
    if (categoryId) {
      fd.set('category', categoryId);
    }

    // Book type — model expects 'translated', not 'translation'
    fd.set('book_type', bookType === 'translation' ? 'translated' : bookType);

    // Translator (CharField) — combine translator chip names
    fd.delete('translator');
    if (bookType === 'translation' && translatorChips.length > 0) {
      fd.set('translator', translatorChips.map(c => c.name).join(', '));
    }

    // Select-based fields (base-ui Select doesn't submit natively)
    fd.set('language', language);
    fd.set('cover_type', coverType);
    fd.set('production_status', productionStatus);

    // Switch/Boolean fields (base-ui Switch doesn't submit natively)
    fd.set('is_new_release', isNewRelease ? 'true' : 'false');
    fd.set('is_trending', isTrending ? 'true' : 'false');
    fd.set('is_preorder', isPreorder ? 'true' : 'false');

    const cover = fd.get('cover') as File | null;
    if (cover && cover.size === 0) fd.delete('cover');

    createMutation.mutate(fd);
  };

  const authors: Author[] = Array.isArray(authorsData) ? authorsData : (authorsData?.results || []);
  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.results || []);

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
          <p className="text-zinc-500 text-sm mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>বিস্তারিত তথ্য দিয়ে নতুন বই যুক্ত করুন</p>
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
                <div className="space-y-2" data-field="title">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বইয়ের নাম *</Label>
                  <Input
                    name="title"
                    required
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); if (fe('title')) setFieldErrors(p => ({...p, title: []})); }}
                    placeholder="যেমন: প্যারাডক্সিক্যাল সাজিদ"
                    className={`bg-zinc-800/50 text-white text-lg ${errBorder('title')}`}
                    style={{ fontFamily: "'Hind Siliguri'" }}
                  />
                  {fe('title') && <p className="text-xs text-red-400 mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>⚠ {fe('title')}</p>}
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
                  <div className="space-y-2" data-field="category">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বিষয়/ক্যাটাগরি *</Label>
                    <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setFieldErrors(p => ({...p, category: []})); }} required>
                      <SelectTrigger className={`bg-zinc-800/50 text-white ${errBorder('category')}`} style={{ fontFamily: "'Hind Siliguri'" }}>
                        <SelectValue placeholder="বিষয় নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)} className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fe('category') && <p className="text-xs text-red-400 mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>⚠ {fe('category')}</p>}
                  </div>
                </div>

                {/* মূল লেখক — Autocomplete */}
                <div data-field="authors">
                  <AuthorAutocomplete
                    label="মূল লেখক * (একাধিক নির্বাচন সম্ভব)"
                    allAuthors={authors}
                    selected={authorChips}
                    onChange={(chips) => { setAuthorChips(chips); setFieldErrors(p => ({...p, authors: []})); }}
                    placeholder="লেখকের নাম টাইপ করুন..."
                  />
                  {(authorChips.length === 0 || fe('authors')) && (
                    <p className="text-xs text-red-400 mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>
                      ⚠ {fe('authors') || 'কমপক্ষে একজন লেখক নির্বাচন করুন'}
                    </p>
                  )}
                </div>

                {/* অনুবাদক — Autocomplete (শুধুমাত্র অনুবাদ বই হলে) */}
                {bookType === 'translation' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>মূল ভাষার শিরোনাম</Label>
                      <Input name="original_title" placeholder="যেমন: علاج الغضب" className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }} />
                      <p className="text-xs text-zinc-500" style={{ fontFamily: "'Hind Siliguri'" }}>আরবি/উর্দু/ফার্সি মূল বইয়ের নাম</p>
                    </div>
                    <AuthorAutocomplete
                      label="অনুবাদক (একাধিক নির্বাচন সম্ভব)"
                      allAuthors={authors}
                      selected={translatorChips}
                      onChange={setTranslatorChips}
                      placeholder="অনুবাদকের নাম টাইপ করুন..."
                    />
                  </>
                )}

                <div className="space-y-2 pt-2">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>প্রকাশক</Label>
                  <Input name="publisher" placeholder="যেমন: সমকালীন প্রকাশন" className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }} />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>সম্পাদক</Label>
                  <Input name="editor" placeholder="সম্পাদকের নাম" className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }} />
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
                {bookType === 'translation' && (
                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>অনুবাদক পরিচিতি</Label>
                    <Textarea name="translator_bio" rows={3} placeholder="অনুবাদকের সংক্ষিপ্ত পরিচিতি..." className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }} />
                  </div>
                )}
                <TagInputField />
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
                  <div className="space-y-2" data-field="original_price">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>আসল/মুদ্রিত মূল্য (৳) *</Label>
                    <Input name="original_price" type="number" required placeholder="0" className={`bg-zinc-800/50 text-white ${errBorder('original_price')}`} onChange={() => setFieldErrors(p => ({...p, original_price: []}))} />
                    {fe('original_price') && <p className="text-xs text-red-400 mt-1">⚠ {fe('original_price')}</p>}
                  </div>
                  <div className="space-y-2" data-field="price">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বিক্রয় মূল্য (৳) *</Label>
                    <Input name="price" type="number" required placeholder="0" className={`bg-zinc-800/50 text-white ${errBorder('price')}`} onChange={() => setFieldErrors(p => ({...p, price: []}))} />
                    {fe('price') && <p className="text-xs text-red-400 mt-1">⚠ {fe('price')}</p>}
                  </div>
                </div>
                <div className="space-y-2" data-field="stock">
                  <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>আসল স্টক *</Label>
                  <Input name="stock" type="number" required defaultValue="0" className={`bg-zinc-800/50 text-white ${errBorder('stock')}`} onChange={() => setFieldErrors(p => ({...p, stock: []}))} />
                  {fe('stock') && <p className="text-xs text-red-400 mt-1">⚠ {fe('stock')}</p>}
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
                        <SelectItem value="arabic" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>আরবি</SelectItem>
                        <SelectItem value="urdu" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>উর্দু</SelectItem>
                        <SelectItem value="farsi" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>ফার্সি</SelectItem>
                        <SelectItem value="english" className="text-zinc-300">English</SelectItem>
                        <SelectItem value="turkish" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>তুর্কি</SelectItem>
                        <SelectItem value="hindi" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>হিন্দি</SelectItem>
                        <SelectItem value="malay" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>মালয়/ইন্দোনেশীয়</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বাইন্ডিং ধরন</Label>
                    <Select value={coverType} onValueChange={setCoverType}>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="paperback" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>পেপারব্যাক</SelectItem>
                        <SelectItem value="hardcover" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>হার্ডকভার</SelectItem>
                        <SelectItem value="spiral" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>স্পাইরাল</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>প্রকাশসাল</Label>
                    <Input name="publish_year" placeholder="যেমন: ২০২৪ বা 2024" className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>সংস্করণ</Label>
                    <Input name="edition" placeholder="যেমন: ৩য় সংস্করণ" className="bg-zinc-800/50 border-zinc-700 text-white" style={{ fontFamily: "'Hind Siliguri'" }} />
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
          <Button type="submit" disabled={createMutation.isPending || isUploadingImages || authorChips.length === 0} className="bg-emerald-600 hover:bg-emerald-500 gap-2 min-w-[150px]" style={{ fontFamily: "'Hind Siliguri'" }}>
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
