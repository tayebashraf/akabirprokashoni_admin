'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getBooks, deleteBook, createBook, updateBook, getCategories, getAuthors, getBookBySlug, createAuthor, createCategory, getImageUrl, uploadBookImages, deleteBookImage } from '@/lib/api';
import styles from './page.module.css';


/* ─────────────────────────────────────────────────────────────
   AuthorAutocomplete — reusable autocomplete with chip tags
   ───────────────────────────────────────────────────────────── */
function AuthorAutocomplete({ label, allAuthors, selected, onChange, placeholder = 'টাইপ করুন...', id }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedIds = new Set(selected.filter(c => c.id !== null).map(c => c.id));
  const selectedNames = new Set(selected.map(c => c.name.trim().toLowerCase()));
  const filtered = allAuthors.filter(a => {
    if (selectedIds.has(a.id)) return false;
    if (!query.trim()) return true;
    return a.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  useEffect(() => {
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addChip = useCallback((chip) => {
    if (selectedNames.has(chip.name.trim().toLowerCase())) return;
    onChange([...selected, chip]);
    setQuery('');
    setOpen(false);
    setHighlightIdx(-1);
    inputRef.current?.focus();
  }, [selected, selectedNames, onChange]);

  const removeChip = useCallback((idx) => {
    onChange(selected.filter((_, i) => i !== idx));
  }, [selected, onChange]);

  const handleKeyDown = (e) => {
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
        const exact = allAuthors.find(a => a.name.trim().toLowerCase() === query.trim().toLowerCase());
        if (exact) addChip({ id: exact.id, name: exact.name });
        else addChip({ id: null, name: query.trim() });
      }
    } else if (e.key === 'Backspace' && !query && selected.length > 0) {
      removeChip(selected.length - 1);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div>
      <label>{label}</label>
      <div ref={wrapperRef} id={id} style={{ position: 'relative' }}>
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
            padding: '8px 12px', minHeight: '44px',
            border: '1.5px solid #d1d5db', borderRadius: '10px',
            background: '#fff', cursor: 'text', transition: 'border-color 0.2s',
          }}
        >
          {selected.map((chip, idx) => (
            <span
              key={`${chip.id ?? chip.name}-${idx}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '20px',
                fontSize: '13px', fontWeight: 500,
                background: '#dcfce7', color: '#166534',
                border: '1px solid #bbf7d0',
              }}
            >
              {chip.name}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeChip(idx); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#dc2626', fontSize: '14px', lineHeight: 1,
                  padding: '0 2px', marginLeft: '2px',
                }}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlightIdx(-1); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? placeholder : 'আরো যোগ করুন...'}
            style={{
              flex: 1, minWidth: '120px', border: 'none', outline: 'none',
              fontSize: '14px', background: 'transparent',
            }}
          />
        </div>

        {open && (query.trim() || filtered.length > 0) && (
          <div style={{
            position: 'absolute', zIndex: 100, marginTop: '4px',
            width: '100%', maxHeight: '200px', overflowY: 'auto',
            borderRadius: '10px', border: '1px solid #e5e7eb',
            background: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          }}>
            {filtered.length === 0 && query.trim() && (
              <button
                type="button"
                onClick={() => {
                  const exact = allAuthors.find(a => a.name.trim().toLowerCase() === query.trim().toLowerCase());
                  if (exact) addChip({ id: exact.id, name: exact.name });
                  else addChip({ id: null, name: query.trim() });
                }}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: '14px', color: '#16a34a',
                }}
              >
                ✨ &quot;{query.trim()}&quot; নতুন হিসেবে যোগ করুন
              </button>
            )}
            {filtered.map((a, idx) => (
              <button
                key={a.id}
                type="button"
                onClick={() => addChip({ id: a.id, name: a.name })}
                onMouseEnter={() => setHighlightIdx(idx)}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 14px',
                  border: 'none', cursor: 'pointer', fontSize: '14px',
                  background: idx === highlightIdx ? '#f0fdf4' : 'transparent',
                  color: idx === highlightIdx ? '#166534' : '#374151',
                  transition: 'background 0.15s',
                }}
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

/* ─────────────────────────────────────────────────────────────
   CategoryAutocomplete — autocomplete with chips & plus button
   ───────────────────────────────────────────────────────────── */
function CategoryAutocomplete({ label, allCategories, selected, onChange, placeholder = 'টাইপ করুন...', onCreateNew, id }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedIds = new Set(selected.filter(c => c.id !== null).map(c => c.id));
  const selectedNames = new Set(selected.map(c => c.name.trim().toLowerCase()));
  const filtered = allCategories.filter(a => {
    if (selectedIds.has(a.id)) return false;
    if (!query.trim()) return true;
    return a.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  useEffect(() => {
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addChip = useCallback((chip) => {
    if (selectedNames.has(chip.name.trim().toLowerCase())) return;
    onChange([...selected, chip]);
    setQuery('');
    setOpen(false);
    setHighlightIdx(-1);
    inputRef.current?.focus();
  }, [selected, selectedNames, onChange]);

  const removeChip = useCallback((idx) => {
    onChange(selected.filter((_, i) => i !== idx));
  }, [selected, onChange]);

  const handleKeyDown = (e) => {
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
        const exact = allCategories.find(a => a.name.trim().toLowerCase() === query.trim().toLowerCase());
        if (exact) addChip({ id: exact.id, name: exact.name });
      }
    } else if (e.key === 'Backspace' && !query && selected.length > 0) {
      removeChip(selected.length - 1);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleAddCategoryClick = () => {
    const catName = prompt("নতুন ক্যাটাগরির নাম লিখুন:");
    if (catName && catName.trim()) {
      onCreateNew(catName.trim(), (newCat) => {
        if (newCat) {
          addChip({ id: newCat.id, name: newCat.name });
        }
      });
    }
  };

  return (
    <div id={id} style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label style={{ margin: 0, fontWeight: 'bold' }}>{label}</label>
        <button
          type="button"
          onClick={handleAddCategoryClick}
          style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534',
            fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '6px', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.target.style.background = '#dcfce7'}
          onMouseLeave={e => e.target.style.background = '#f0fdf4'}
        >
          ➕ নতুন বিষয় তৈরি করুন
        </button>
      </div>
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
            padding: '8px 12px', minHeight: '44px',
            border: '1.5px solid #d1d5db', borderRadius: '10px',
            background: '#fff', cursor: 'text', transition: 'border-color 0.2s',
          }}
        >
          {selected.map((chip, idx) => (
            <span
              key={`${chip.id ?? chip.name}-${idx}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '20px',
                fontSize: '13px', fontWeight: 500,
                background: '#e0f2fe', color: '#0369a1',
                border: '1px solid #bae6fd',
              }}
            >
              {chip.name}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeChip(idx); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#dc2626', fontSize: '14px', lineHeight: 1,
                  padding: '0 2px', marginLeft: '2px',
                }}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlightIdx(-1); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? placeholder : 'আরো যোগ করুন...'}
            style={{
              flex: 1, minWidth: '120px', border: 'none', outline: 'none',
              fontSize: '14px', background: 'transparent',
            }}
          />
        </div>

        {open && (query.trim() || filtered.length > 0) && (
          <div style={{
            position: 'absolute', zIndex: 100, marginTop: '4px',
            width: '100%', maxHeight: '200px', overflowY: 'auto',
            borderRadius: '10px', border: '1px solid #e5e7eb',
            background: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          }}>
            {filtered.map((a, idx) => (
              <button
                key={a.id}
                type="button"
                onClick={() => addChip({ id: a.id, name: a.name })}
                onMouseEnter={() => setHighlightIdx(idx)}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 14px',
                  border: 'none', cursor: 'pointer', fontSize: '14px',
                  background: idx === highlightIdx ? '#f0f9ff' : 'transparent',
                  color: idx === highlightIdx ? '#0369a1' : '#374151',
                  transition: 'background 0.15s',
                }}
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


export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [editingSlug, setEditingSlug] = useState(null);
  const [showNewAuthor, setShowNewAuthor] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState('');
  const [bookType, setBookType] = useState('original');
  const [authorChips, setAuthorChips] = useState([]);
  const [translatorChips, setTranslatorChips] = useState([]);
  const [categoryChips, setCategoryChips] = useState([]);
  const [currentCoverUrl, setCurrentCoverUrl] = useState('');
  const [currentSamplePdfUrl, setCurrentSamplePdfUrl] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [sampleImages, setSampleImages] = useState([null, null, null, null, null]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [formData, setFormData] = useState({
    title: '', slug: '', category: '', publisher: '',
    price: '', original_price: '', pages: '', isbn: '', language: 'bangla',
    edition: '', weight: '', dimensions: '', stock: '',
    is_trending: false, is_new_release: true, is_preorder: false,
    description: '', author_bio: '', translator_bio: '', tags: '',
    meta_title: '', meta_description: '', meta_keywords: '',
    table_of_contents: '', why_read: '', target_audience: '',
    faq: '', key_takeaways: '', long_description: ''
  });
  const [files, setFiles] = useState({
    cover: null,
    sample_pdf: null
  });

  const duplicateBook = formData.title.trim() ? books.find(b => {
    if (editingSlug && b.slug === editingSlug) return false;
    return b.title.trim().toLowerCase() === formData.title.trim().toLowerCase();
  }) : null;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [booksData, catsData, authsData] = await Promise.all([
        getBooks(),
        getCategories(),
        getAuthors()
      ]);
      setBooks(booksData.results || booksData || []);
      setCategories(catsData.results || catsData || []);
      setAuthors(authsData.results || authsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList.length > 0) {
      setFiles(prev => ({ ...prev, [name]: fileList[0] }));
    }
  };

  const openAddForm = () => {
    setEditingSlug(null);
    setBookType('original');
    setAuthorChips([]);
    setTranslatorChips([]);
    setCategoryChips([]);
    setCurrentCoverUrl('');
    setCurrentSamplePdfUrl('');
    setExistingImages([]);
    setSampleImages([null, null, null, null, null]);
    setImagesToDelete([]);
    setFormData({
      title: '', slug: '', category: '', publisher: '',
      price: '', original_price: '', pages: '', isbn: '', language: 'bangla',
      edition: '', weight: '', dimensions: '', stock: '',
      is_trending: false, is_new_release: true, is_preorder: false,
      description: '', author_bio: '', translator_bio: '', tags: '',
      meta_title: '', meta_description: '', meta_keywords: '',
      table_of_contents: '', why_read: '', target_audience: '',
      faq: '', key_takeaways: '', long_description: ''
    });
    setFiles({ cover: null, sample_pdf: null });
    setUploadError(null);
    setShowForm(true);
  };

  const openEditForm = async (slug) => {
    try {
      setEditingSlug(slug);
      setShowForm(true);
      const bookData = await getBookBySlug(slug);
      
      // Set current cover and PDF urls
      setCurrentCoverUrl(bookData.cover_url || bookData.cover || '');
      setCurrentSamplePdfUrl(bookData.sample_pdf_url || bookData.sample_pdf || '');
      setExistingImages(bookData.images || []);
      setSampleImages([null, null, null, null, null]);
      setImagesToDelete([]);
      
      // Set book type
      setBookType(bookData.book_type === 'translated' ? 'translation' : (bookData.book_type || 'original'));
      
      // Set author chips from author_details
      if (bookData.author_details && bookData.author_details.length > 0) {
        setAuthorChips(bookData.author_details.map(a => ({ id: a.id, name: a.name })));
      } else {
        setAuthorChips([]);
      }
      
      // Set translator chips
      if (bookData.translator) {
        const transMapped = bookData.translator.split(',').map(name => ({ id: null, name: name.trim() }));
        setTranslatorChips(transMapped);
      } else {
        setTranslatorChips([]);
      }

      // Map categories Many-to-Many
      const catsMapped = (bookData.categories_details || []).map(c => ({ id: c.id, name: c.name }));
      if (catsMapped.length === 0 && bookData.category_details) {
        catsMapped.push({ id: bookData.category_details.id, name: bookData.category_details.name });
      }
      setCategoryChips(catsMapped);
      
      setFormData({
        title: bookData.title || '',
        slug: bookData.slug || '',
        category: bookData.category_details?.id 
          || bookData.category?.id 
          || bookData.category 
          || '',
        publisher: bookData.publisher || '',
        price: bookData.price || '',
        original_price: bookData.original_price || '',
        pages: bookData.pages || '',
        isbn: bookData.isbn || '',
        language: bookData.language || 'bangla',
        edition: bookData.edition || '',
        weight: bookData.weight || '',
        dimensions: bookData.dimensions || '',
        stock: bookData.stock || '',
        is_trending: bookData.is_trending || false,
        is_new_release: bookData.is_new_release || false,
        is_preorder: bookData.is_preorder || false,
        description: bookData.description || '',
        author_bio: bookData.author_bio || '',
        translator_bio: bookData.translator_bio || '',
        tags: bookData.tags || (bookData.tags_list ? bookData.tags_list.join(',') : ''),
        meta_title: bookData.meta_title || '',
        meta_description: bookData.meta_description || '',
        meta_keywords: bookData.meta_keywords || '',
        table_of_contents: bookData.table_of_contents || '',
        why_read: bookData.why_read || '',
        target_audience: bookData.target_audience || '',
        faq: bookData.faq || '',
        key_takeaways: bookData.key_takeaways || '',
        long_description: bookData.long_description || ''
      });
    } catch (error) {
      alert("বইয়ের তথ্য লোড করতে সমস্যা হয়েছে");
      setShowForm(false);
    }
  };

  const handleCreateCategory = async (name, callback) => {
    try {
      const data = new FormData();
      data.append('name', name);
      const newCat = await createCategory(data);
      const catsData = await getCategories();
      setCategories(catsData.results || catsData || []);
      if (callback) callback(newCat);
    } catch (error) {
      alert(error.message || 'ক্যাটাগরি তৈরি করতে সমস্যা হয়েছে।');
    }
  };

  const handleSubmit = async (e, force = false) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setUploadError(null);
    
    try {
      const data = new FormData();
      
      // Add all text fields
      Object.keys(formData).forEach(key => {
        const val = formData[key];
        if (val === null || val === undefined) return;
        if (val === '' && typeof val === 'string') return;
        data.append(key, val);
      });
      
      // Book type
      data.set('book_type', bookType === 'translation' ? 'translated' : bookType);
      
      // Authors (ManyToMany) — only IDs of existing authors
      authorChips.forEach(chip => {
        if (chip.id !== null) {
          data.append('authors', String(chip.id));
        }
      });

      // Categories (ManyToMany)
      categoryChips.forEach(chip => {
        if (chip.id !== null) {
          data.append('categories', String(chip.id));
        }
      });
      if (categoryChips.length > 0) {
        data.set('category', String(categoryChips[0].id));
      }
      
      // Translator (CharField) — combine names
      if (bookType === 'translation' && translatorChips.length > 0) {
        data.set('translator', translatorChips.map(c => c.name).join(', '));
      }
      
      if (force) {
        data.append('force_upload', 'true');
      }
      
      // Add files if selected
      if (files.cover) data.append('cover', files.cover);
      if (files.sample_pdf) data.append('sample_pdf', files.sample_pdf);

      let savedBook;
      if (editingSlug) {
        savedBook = await updateBook(editingSlug, data);
      } else {
        savedBook = await createBook(data);
      }

      // Delete queued images
      if (editingSlug && imagesToDelete.length > 0) {
        for (const imgId of imagesToDelete) {
          try {
            await deleteBookImage(imgId);
          } catch (delError) {
            console.error(`Failed to delete book image ${imgId}:`, delError);
          }
        }
      }

      // Upload new sample images sequentially
      const newFilesToUpload = sampleImages.filter(file => file !== null);
      if (newFilesToUpload.length > 0) {
        const startOrder = existingImages.length + 1;
        for (let i = 0; i < newFilesToUpload.length; i++) {
          const imgFormData = new FormData();
          imgFormData.append('book', String(savedBook.id));
          imgFormData.append('image', newFilesToUpload[i]);
          imgFormData.append('order', String(startOrder + i));
          
          await uploadBookImages(imgFormData);
        }
      }

      if (editingSlug) {
        alert('বইটি সফলভাবে আপডেট হয়েছে!');
      } else {
        alert('নতুন বই সফলভাবে যোগ হয়েছে!');
      }
      
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Book save error:', error);
      let errMsg = error.message || 'অজানা ত্রুটি দেখা দিয়েছে।';
      errMsg = errMsg.replace(/^\[\d+\]\s*(.*?:\s*)?/, '');
      setUploadError(errMsg);
      
      // Auto-scroll and focus validation error field
      setTimeout(() => {
        let scrolled = false;
        const segments = errMsg.split('|');
        for (const segment of segments) {
          const match = segment.trim().match(/^([a-zA-Z0-9_]+):\s*(.*)/);
          if (match) {
            const fieldName = match[1];
            const element = document.getElementsByName(fieldName)[0] || document.getElementById(fieldName);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              try { element.focus(); } catch (e) {}
              
              // Apply red validation border glow effect
              const originalBorder = element.style.borderColor;
              const originalShadow = element.style.boxShadow;
              const originalTransition = element.style.transition;
              
              element.style.transition = 'all 0.2s ease';
              element.style.borderColor = '#ef4444';
              element.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.3)';
              
              setTimeout(() => {
                element.style.borderColor = originalBorder;
                element.style.boxShadow = originalShadow;
                element.style.transition = originalTransition;
              }, 4000);
              
              scrolled = true;
              break;
            }
          }
        }
        
        // Fallback: scroll to error box at the bottom
        if (!scrolled) {
          const errorBox = document.getElementById('upload-error-box');
          if (errorBox) {
            errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatErrorForDisplay = (errText) => {
    if (!errText) return '';
    const FIELD_LABELS = {
      title: 'বইয়ের নাম',
      slug: 'ইউআরএল (Slug)',
      price: 'বিক্রয় মূল্য',
      original_price: 'আসল মূল্য',
      stock: 'স্টক সংখ্যা',
      weight: 'ওজন',
      pages: 'পৃষ্ঠা সংখ্যা',
      isbn: 'আইএসবিএন (ISBN)',
      language: 'ভাষা',
      edition: 'সংস্করণ',
      dimensions: 'মাপ',
      cover: 'কভার ইমেজ',
      sample_pdf: 'স্যাম্পল পিডিএফ',
      description: 'সারসংক্ষেপ',
      author_bio: 'লেখক পরিচিতি',
      translator_bio: 'অনুবাদক পরিচিতি',
      authors: 'লেখকগণ',
      categories: 'ক্যাটাগরি/বিষয়সমূহ',
      category: 'ক্যাটাগরি/বিষয়',
    };
    
    let formatted = errText;
    Object.keys(FIELD_LABELS).forEach(key => {
      const regex = new RegExp(`(^|\\|\\s*)${key}:`, 'g');
      formatted = formatted.replace(regex, `$1${FIELD_LABELS[key]}:`);
    });
    return formatted;
  };

  const handleDelete = async (slug) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই বইটি ডিলিট করতে চান?')) {
      try {
        await deleteBook(slug);
        setBooks(prev => prev.filter(b => b.slug !== slug));
        alert('বইটি সফলভাবে ডিলিট হয়েছে!');
      } catch (error) {
        alert('ডিলিট করতে সমস্যা হয়েছে।');
      }
    }
  };

  return (
    <>
        <div className={styles.topBar}>
          <h1>📖 বই ম্যানেজমেন্ট</h1>
          <button className="btn btn-primary" onClick={openAddForm}>
            + নতুন বই যোগ করুন
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📚</span>
            <div><span className={styles.statNum}>{books.length}</span><span>মোট বই</span></div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📦</span>
            <div><span className={styles.statNum}>{books.reduce((s, b) => s + (b.stock || 0), 0)}</span><span>মোট স্টক</span></div>
          </div>
        </div>

        {/* Books Table */}
        <div className={styles.tableCard}>
          {loading ? (
             <div style={{ padding: '20px', textAlign: 'center' }}>লোড হচ্ছে...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>বই</th>
                    <th>লেখক</th>
                    <th>মূল্য</th>
                    <th>স্টক</th>
                    <th>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(book => (
                    <tr key={book.id}>
                      <td>
                        <div className={styles.bookCell}>
                          {book.cover ? (
                            <img src={getImageUrl(book.cover)} alt="" style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />
                          ) : (
                            <span className={styles.bookThumb}>📖</span>
                          )}
                          <div>
                            <strong>{book.title}</strong>
                            <span className={styles.bookCat}>{book.category?.name || book.category_name}</span>
                          </div>
                        </div>
                      </td>
                      <td>{book.author?.name || book.author_name || 'অজানা'}</td>
                      <td>
                        <span className={styles.tablePrice}>৳{book.price}</span>
                      </td>
                      <td>
                        <span className={book.stock < 10 ? styles.lowStock : styles.goodStock}>
                          {book.stock}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button className={styles.editBtn} onClick={() => openEditForm(book.slug)} title="সম্পাদনা করুন">✏️</button>
                          <button className={styles.deleteBtn} onClick={() => handleDelete(book.slug)} title="ডিলিট করুন">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {books.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>কোনো বই পাওয়া যায়নি</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal Form */}
        {showForm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2>{editingSlug ? 'বই সম্পাদনা করুন' : 'নতুন বই যোগ করুন'}</h2>
                <button className={styles.modalClose} onClick={() => setShowForm(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit} className={styles.bookForm}>
                
                {/* Core Info */}
                <h3>মূল তথ্য</h3>
                <div className={styles.formGrid}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>শিরোনাম *</label>
                    <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="form-control" />
                    {duplicateBook && (
                      <div style={{ 
                        color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', 
                        borderRadius: '8px', padding: '10px 14px', fontSize: '13px', 
                        marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                        lineHeight: '1.4'
                      }}>
                        <span style={{ fontSize: '16px' }}>⚠️</span>
                        <div>
                          <strong>সতর্কতা:</strong> এই নামে ইতিমধ্যে একটি বই যুক্ত আছে: <strong>&ldquo;{duplicateBook.title}&rdquo;</strong> (লেখক: {duplicateBook.author_name || 'অজানা'})।
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label>স্লাগ (URL) - ঐচ্ছিক</label>
                    <input type="text" name="slug" value={formData.slug} onChange={handleInputChange} className="form-control" placeholder="ফাঁকা রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে" />
                  </div>
                  <div>
                    <label>বইয়ের ধরন *</label>
                    <select value={bookType} onChange={(e) => setBookType(e.target.value)} className="form-control">
                      <option value="original">মূল কিতাব</option>
                      <option value="translation">অনুবাদ</option>
                    </select>
                  </div>
                  
                  {/* মূল লেখক — Autocomplete */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <AuthorAutocomplete
                      id="authors"
                      label="মূল লেখক * (একাধিক নির্বাচন সম্ভব)"
                      allAuthors={authors}
                      selected={authorChips}
                      onChange={setAuthorChips}
                      placeholder="লেখকের নাম টাইপ করুন..."
                    />
                    {authorChips.length === 0 && (
                      <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>কমপক্ষে একজন লেখক নির্বাচন করুন</p>
                    )}
                    <div style={{ marginTop: '6px' }}>
                      <button type="button" onClick={() => setShowNewAuthor(!showNewAuthor)} style={{ padding: '6px 14px', background: 'var(--color-primary)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                        + নতুন লেখক যোগ করুন
                      </button>
                    </div>
                    {showNewAuthor && (
                      <div style={{ marginTop: '8px', padding: '12px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={newAuthorName}
                          onChange={(e) => setNewAuthorName(e.target.value)}
                          placeholder="নতুন লেখকের নাম লিখুন"
                          className="form-control"
                          style={{ flex: 1 }}
                        />
                        <button type="button" onClick={async () => {
                          if (!newAuthorName.trim()) return alert('লেখকের নাম দিন');
                          try {
                            const created = await createAuthor({ name: newAuthorName.trim() });
                            setAuthors(prev => [...prev, created]);
                            setAuthorChips(prev => [...prev, { id: created.id, name: created.name }]);
                            setNewAuthorName('');
                            setShowNewAuthor(false);
                          } catch (err) {
                            alert('সমস্যা: ' + err.message);
                          }
                        }} style={{ padding: '8px 16px', background: 'var(--color-primary)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                          সেভ
                        </button>
                      </div>
                    )}
                  </div>

                  {/* অনুবাদক — Autocomplete (শুধুমাত্র অনুবাদ বই হলে) */}
                  {bookType === 'translation' && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <AuthorAutocomplete
                        id="translator"
                        label="অনুবাদক (একাধিক নির্বাচন সম্ভব)"
                        allAuthors={authors}
                        selected={translatorChips}
                        onChange={setTranslatorChips}
                        placeholder="অনুবাদকের নাম টাইপ করুন..."
                      />
                    </div>
                  )}

                  <div style={{ gridColumn: '1 / -1' }}>
                    <CategoryAutocomplete
                      id="categories"
                      label="ক্যাটাগরি/বিষয়সমূহ (একাধিক নির্বাচন সম্ভব)"
                      allCategories={categories}
                      selected={categoryChips}
                      onChange={setCategoryChips}
                      placeholder="ক্যাটাগরি টাইপ করুন..."
                      onCreateNew={handleCreateCategory}
                    />
                  </div>
                  <div>
                    <label>প্রকাশক</label>
                    <input type="text" name="publisher" value={formData.publisher} onChange={handleInputChange} className="form-control" />
                  </div>
                </div>

                {/* Book Details */}
                <h3>বইয়ের বিস্তারিত</h3>
                <div className={styles.formGrid}>
                  <div>
                    <label>পৃষ্ঠা সংখ্যা</label>
                    <input type="number" name="pages" value={formData.pages} onChange={handleInputChange} className="form-control" />
                  </div>
                  <div>
                    <label>ওজন (গ্রাম)</label>
                    <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} className="form-control" />
                  </div>
                  <div>
                    <label>ISBN</label>
                    <input type="text" name="isbn" value={formData.isbn} onChange={handleInputChange} className="form-control" />
                  </div>
                  <div>
                    <label>ভাষা</label>
                    <select name="language" value={formData.language} onChange={handleInputChange} className="form-control">
                      <option value="bangla">বাংলা</option>
                      <option value="arabic">আরবি</option>
                      <option value="urdu">উর্দু</option>
                      <option value="farsi">ফার্সি</option>
                      <option value="english">English</option>
                      <option value="turkish">তুর্কি</option>
                      <option value="hindi">হিন্দি</option>
                      <option value="malay">মালয়/ইন্দোনেশীয়</option>
                    </select>
                  </div>
                  <div>
                    <label>সংস্করণ (Edition)</label>
                    <input type="text" name="edition" value={formData.edition} onChange={handleInputChange} className="form-control" />
                  </div>
                  <div>
                    <label>মাপ (Dimensions)</label>
                    <input type="text" name="dimensions" value={formData.dimensions} onChange={handleInputChange} className="form-control" placeholder="যেমন: 8.5 x 5.5 inch" />
                  </div>
                </div>

                {/* Media Uploads */}
                <h3>মিডিয়া</h3>
                <div className={styles.formGrid}>
                  <div>
                    <label>কভার ইমেজ</label>
                    <input type="file" name="cover" accept="image/*" onChange={handleFileChange} className="form-control" />
                    {currentCoverUrl && (
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>বর্তমান কভার:</span>
                        <img 
                          src={getImageUrl(currentCoverUrl)} 
                          alt="Current Cover" 
                          style={{ display: 'block', width: '70px', height: '95px', objectFit: 'cover', borderRadius: '6px', marginTop: '6px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                          onError={(e) => { e.target.src = currentCoverUrl; }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label>একটু পড়ে দেখুন (PDF)</label>
                    <input type="file" name="sample_pdf" accept=".pdf" onChange={handleFileChange} className="form-control" />
                    {currentSamplePdfUrl && (
                      <div style={{ marginTop: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#64748b', fontWeight: 500 }}>বর্তমান ফাইল: </span>
                        <a 
                          href={getImageUrl(currentSamplePdfUrl)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#0f766e', fontWeight: 'bold', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}
                          onError={(e) => { e.target.href = currentSamplePdfUrl; }}
                        >
                          📖 পিডিএফ স্যাম্পল দেখুন
                        </a>
                      </div>
                    )}
                  </div>

                  <div style={{ gridColumn: '1 / -1', marginTop: '15px' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#334155' }}>একটু পড়ে দেখুন (ছবিসমূহ) — PDF এর বিকল্প</span>
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b' }}>
                        (যে ছবি প্রথমে সিলেক্ট করবেন, তা প্রথমে পড়া হবে)
                      </span>
                    </label>
                    
                    {/* Select All Button */}
                    <div style={{ marginBottom: '12px' }}>
                      <input 
                        type="file" 
                        id="multi-image-uploader" 
                        multiple 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          const filesList = Array.from(e.target.files);
                          if (filesList.length > 0) {
                            setSampleImages(prev => {
                              const updated = [...prev];
                              let fileIdx = 0;
                              for (let i = 0; i < updated.length; i++) {
                                if (!updated[i] && fileIdx < filesList.length) {
                                  updated[i] = filesList[fileIdx++];
                                }
                              }
                              while (fileIdx < filesList.length) {
                                updated.push(filesList[fileIdx++]);
                              }
                              return updated;
                            });
                          }
                          // Clear input value to allow selecting the same files again
                          e.target.value = '';
                        }}
                      />
                      <button 
                        type="button" 
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '8px 14px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}
                        onClick={() => document.getElementById('multi-image-uploader').click()}
                      >
                        📷 একসাথে একাধিক ছবি সিলেক্ট করুন
                      </button>
                    </div>

                    {/* Previews / Slots Grid */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                      {/* Existing Images first */}
                      {existingImages.map((img, idx) => (
                        <div key={`existing-${img.id || idx}`} style={{ position: 'relative', width: '80px', height: '110px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                          <img 
                            src={getImageUrl(img.image_url || img.image)} 
                            alt={`Existing Page ${idx + 1}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(15, 23, 42, 0.75)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px 0' }}>
                            পৃষ্ঠা {idx + 1}
                          </div>
                          <button 
                            type="button" 
                            style={{ position: 'absolute', top: '4px', right: '4px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                            onClick={() => {
                              if (window.confirm('আপনি কি এই স্যাম্পল ছবিটি ডিলিট করতে চান? সংরক্ষণ করার পর এটি সম্পূর্ণ মুছে যাবে।')) {
                                setExistingImages(prev => prev.filter(item => item.id !== img.id));
                                setImagesToDelete(prev => [...prev, img.id]);
                              }
                            }}
                            title="মুছে ফেলুন"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {/* New Image Slots */}
                      {sampleImages.map((file, idx) => {
                        const previewUrl = file ? URL.createObjectURL(file) : null;
                        const slotNum = existingImages.length + idx + 1;
                        return (
                          <div key={`slot-${idx}`} style={{ position: 'relative', width: '80px', height: '110px', borderRadius: '8px', border: file ? '1px solid #bfdbfe' : '2px dashed #cbd5e1', background: file ? 'white' : '#f1f5f9', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            {file ? (
                              <>
                                <img 
                                  src={previewUrl} 
                                  alt={`Slot ${idx + 1}`} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(30, 64, 175, 0.85)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px 0' }}>
                                  পৃষ্ঠা {slotNum}
                                </div>
                                <button 
                                  type="button" 
                                  style={{ position: 'absolute', top: '4px', right: '4px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSampleImages(prev => {
                                      const updated = [...prev];
                                      if (idx < 5) {
                                        updated[idx] = null;
                                      } else {
                                        updated.splice(idx, 1);
                                      }
                                      return updated;
                                    });
                                  }}
                                  title="মুছে ফেলুন"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <div 
                                style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#64748b' }}
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = (e) => {
                                    const selectedFile = e.target.files[0];
                                    if (selectedFile) {
                                      setSampleImages(prev => {
                                        const updated = [...prev];
                                        updated[idx] = selectedFile;
                                        return updated;
                                      });
                                    }
                                  };
                                  input.click();
                                }}
                              >
                                <span style={{ fontSize: '18px' }}>➕</span>
                                <span style={{ fontSize: '10px', fontWeight: 600 }}>ছবি {idx + 1}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <h3>মূল্য ও স্টক</h3>
                <div className={styles.formGrid}>
                  <div>
                    <label>বিক্রয় মূল্য (৳) *</label>
                    <input type="number" name="price" required value={formData.price} onChange={handleInputChange} className="form-control" />
                  </div>
                  <div>
                    <label>আসল মূল্য (৳) *</label>
                    <input type="number" name="original_price" required value={formData.original_price} onChange={handleInputChange} className="form-control" />
                  </div>
                  <div>
                    <label>স্টক সংখ্যা *</label>
                    <input type="number" name="stock" required value={formData.stock} onChange={handleInputChange} className="form-control" />
                  </div>
                </div>

                {/* Status Toggles */}
                <div style={{ display: 'flex', gap: '20px', margin: '20px 0', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" name="is_trending" checked={formData.is_trending} onChange={handleInputChange} />
                    ট্রেন্ডিং বই
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" name="is_new_release" checked={formData.is_new_release} onChange={handleInputChange} />
                    নতুন প্রকাশিত
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" name="is_preorder" checked={formData.is_preorder} onChange={handleInputChange} />
                    প্রি-অর্ডার
                  </label>
                </div>



                {/* Descriptions */}
                <h3>বিবরণ</h3>
                <div style={{ marginBottom: '15px' }}>
                  <label>বইয়ের বিবরণ</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} className="form-control" rows="4"></textarea>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>লেখক পরিচিতি (কাস্টম বা ওভাররাইড)</label>
                  <textarea name="author_bio" value={formData.author_bio} onChange={handleInputChange} className="form-control" rows="3" placeholder="লেখকের পরিচিতি এখানে লিখুন (খালি রাখলে লেখকের মূল প্রোফাইল থেকে নেওয়া হবে)"></textarea>
                </div>
                {bookType === 'translation' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label>অনুবাদক পরিচিতি</label>
                    <textarea name="translator_bio" value={formData.translator_bio} onChange={handleInputChange} className="form-control" rows="3" placeholder="অনুবাদকের পরিচিতি এখানে লিখুন"></textarea>
                  </div>
                )}
                <div style={{ marginBottom: '15px' }}>
                  <label>ট্যাগ (কমা দিয়ে আলাদা করুন)</label>
                  <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} className="form-control" placeholder="যেমন: উপন্যাস, থ্রিলার" />
                </div>

                {/* SEO Fields */}
                <h3>SEO সেটিংস (Google)</h3>
                <div style={{ 
                  marginBottom: '16px', padding: '14px 18px', 
                  background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', 
                  borderRadius: '10px', border: '1px solid #bfdbfe',
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  fontSize: '13.5px', color: '#1e40af', lineHeight: '1.6'
                }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
                  <div>
                    <strong>অটো-জেনারেট:</strong> নিচের ফিল্ডগুলো ফাঁকা রাখলে সিস্টেম স্বয়ংক্রিয়ভাবে বইয়ের নাম, লেখক, প্রকাশক ও মূল্য থেকে SEO তথ্য তৈরি করবে। চাইলে নিজে কাস্টম লিখতে পারেন।
                  </div>
                </div>
                <div className={styles.formGrid}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Meta Title <span style={{ color: '#94a3b8', fontWeight: 400 }}>(ফাঁকা = অটো)</span></label>
                    <input type="text" name="meta_title" value={formData.meta_title} onChange={handleInputChange} className="form-control" placeholder="অটো: বইয়ের নাম - লেখক | অনলাইনে কিনুন" maxLength="200" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Meta Description <span style={{ color: '#94a3b8', fontWeight: 400 }}>(ফাঁকা = অটো)</span></label>
                    <textarea name="meta_description" value={formData.meta_description} onChange={handleInputChange} className="form-control" rows="2" placeholder="অটো: বইয়ের নাম বইটি লেখক রচিত। প্রকাশক: ...। মূল্য: ৳...।" maxLength="300"></textarea>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Meta Keywords <span style={{ color: '#94a3b8', fontWeight: 400 }}>(ফাঁকা = অটো)</span></label>
                    <input type="text" name="meta_keywords" value={formData.meta_keywords} onChange={handleInputChange} className="form-control" placeholder="অটো: বইয়ের নাম, লেখক, প্রকাশক, ক্যাটাগরি, ভাষা..." maxLength="500" />
                  </div>
                </div>

                {/* AI SEO Content Fields */}
                <h3>🤖 AI SEO কন্টেন্ট</h3>
                <div style={{ 
                  marginBottom: '16px', padding: '14px 18px', 
                  background: 'linear-gradient(135deg, #fdf4ff 0%, #fef3c7 100%)', 
                  borderRadius: '10px', border: '1px solid #e9d5ff',
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  fontSize: '13.5px', color: '#7c3aed', lineHeight: '1.6'
                }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>🚀</span>
                  <div>
                    <strong>Google র‍্যাংকিং বুস্টার:</strong> এই ফিল্ডগুলোতে AI (ChatGPT/Gemini) দিয়ে কন্টেন্ট তৈরি করে পেস্ট করুন। এগুলো Google এ আপনার বইকে রকমারির থেকে উপরে নিয়ে আসবে।
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label>📑 সূচিপত্র <span style={{ color: '#94a3b8', fontWeight: 400 }}>(প্রতি লাইনে একটি অধ্যায়)</span></label>
                  <textarea name="table_of_contents" value={formData.table_of_contents} onChange={handleInputChange} className="form-control" rows="5" placeholder="অধ্যায় ১: ভূমিকা&#10;অধ্যায় ২: তাওহীদের পরিচয়&#10;অধ্যায় ৩: শিরকের প্রকারভেদ&#10;..."></textarea>
                </div>

                <div className={styles.formGrid}>
                  <div>
                    <label>🎯 কাদের জন্য</label>
                    <textarea name="target_audience" value={formData.target_audience} onChange={handleInputChange} className="form-control" rows="3" placeholder="যেমন: তালিবুল ইলম, মাদরাসার ছাত্র, দ্বীন শিখতে আগ্রহী সাধারণ মানুষ..."></textarea>
                  </div>
                  <div>
                    <label>📖 কেন পড়বেন</label>
                    <textarea name="why_read" value={formData.why_read} onChange={handleInputChange} className="form-control" rows="3" placeholder="যেমন:&#10;• আক্বীদা সংশোধনে সহায়ক&#10;• সহজ ভাষায় লেখা&#10;• প্রামাণ্য দলীল সমৃদ্ধ"></textarea>
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label>💡 মূল শিক্ষা <span style={{ color: '#94a3b8', fontWeight: 400 }}>(প্রতি লাইনে একটি পয়েন্ট)</span></label>
                  <textarea name="key_takeaways" value={formData.key_takeaways} onChange={handleInputChange} className="form-control" rows="4" placeholder="• তাওহীদের সঠিক ধারণা পাবেন&#10;• শিরক থেকে বাঁচার উপায় জানবেন&#10;• ইবাদতের সঠিক পদ্ধতি শিখবেন"></textarea>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label>❓ প্রশ্ন-উত্তর / FAQ <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Google Featured Snippet এ দেখাবে)</span></label>
                  <textarea name="faq" value={formData.faq} onChange={handleInputChange} className="form-control" rows="5" placeholder='[{"q":"এই বইটি কাদের জন্য উপযোগী?","a":"এই বইটি মূলত তালিবুল ইলম ও সাধারণ মুসলিমদের জন্য লেখা।"},{"q":"বইটির মূল বিষয়বস্তু কি?","a":"তাওহীদের মৌলিক ধারণা ও শিরকের প্রকারভেদ।"}]'></textarea>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>JSON ফরম্যাট: [&#123;&quot;q&quot;:&quot;প্রশ্ন&quot;,&quot;a&quot;:&quot;উত্তর&quot;&#125;]</p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label>📝 বিস্তারিত SEO বিবরণ <span style={{ color: '#94a3b8', fontWeight: 400 }}>(৩০০-৫০০ শব্দ — Google র‍্যাংকিং এ সবচেয়ে বেশি প্রভাব ফেলে)</span></label>
                  <textarea name="long_description" value={formData.long_description} onChange={handleInputChange} className="form-control" rows="6" placeholder="AI দিয়ে বইয়ের বিস্তারিত keyword-rich বিবরণ লিখুন। এটি Google-এ content depth বাড়াবে এবং র‍্যাংকিং উন্নত করবে।"></textarea>
                </div>

                {uploadError && (
                  <div id="upload-error-box" style={{ marginTop: '20px', padding: '15px', border: '1px solid #f5c6cb', borderRadius: '8px', backgroundColor: '#f8d7da', color: '#721c24' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>⚠️ আপলোডে সমস্যা দেখা দিয়েছে!</h4>
                    <p style={{ margin: '0 0 15px 0', fontSize: '14px', lineHeight: '1.6' }}>{formatErrorForDisplay(uploadError)}</p>
                    
                    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '5px', border: '1px solid #f5c6cb' }}>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>তারপরও কি আপনি আপলোড করতে চান?</p>
                      <button 
                        type="button" 
                        onClick={() => handleSubmit(null, true)} 
                        className="btn btn-primary"
                        disabled={isSubmitting}
                        style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                      >
                        {isSubmitting ? 'আপলোড হচ্ছে...' : 'হ্যাঁ, আপলোড করুন'}
                      </button>
                    </div>
                  </div>
                )}

                <div className={styles.formActions}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>বাতিল</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting || authorChips.length === 0}>
                    {isSubmitting ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
}
