'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getBooks, deleteBook, createBook, updateBook, getCategories, getAuthors, getBookBySlug, createAuthor, getImageUrl } from '@/lib/api';
import styles from './page.module.css';


/* ─────────────────────────────────────────────────────────────
   AuthorAutocomplete — reusable autocomplete with chip tags
   ───────────────────────────────────────────────────────────── */
function AuthorAutocomplete({ label, allAuthors, selected, onChange, placeholder = 'টাইপ করুন...' }) {
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
  const [formData, setFormData] = useState({
    title: '', slug: '', category: '', publisher: '',
    price: '', original_price: '', pages: '', isbn: '', language: 'bangla',
    edition: '', weight: '', dimensions: '', stock: '',
    is_trending: false, is_new_release: true, is_preorder: false,
    description: '', author_bio: '', tags: '',
    meta_title: '', meta_description: '', meta_keywords: ''
  });
  const [files, setFiles] = useState({
    cover: null,
    sample_pdf: null
  });

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
    setFormData({
      title: '', slug: '', category: '', publisher: '',
      price: '', original_price: '', pages: '', isbn: '', language: 'bangla',
      edition: '', weight: '', dimensions: '', stock: '',
      is_trending: false, is_new_release: true, is_preorder: false,
      description: '', author_bio: '', tags: '',
      meta_title: '', meta_description: '', meta_keywords: ''
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
      
      // Set book type
      setBookType(bookData.book_type === 'translated' ? 'translation' : (bookData.book_type || 'original'));
      
      // Set author chips from author_details
      if (bookData.author_details && bookData.author_details.length > 0) {
        setAuthorChips(bookData.author_details.map(a => ({ id: a.id, name: a.name })));
      } else {
        setAuthorChips([]);
      }
      
      // Set translator chips from translator string
      if (bookData.translator) {
        const translatorNames = bookData.translator.split(',').map(n => n.trim()).filter(Boolean);
        setTranslatorChips(translatorNames.map(name => {
          const matchingAuthor = (authors || []).find(a => a.name.trim().toLowerCase() === name.toLowerCase());
          return { id: matchingAuthor ? matchingAuthor.id : null, name };
        }));
      } else {
        setTranslatorChips([]);
      }
      
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
        tags: bookData.tags || (bookData.tags_list ? bookData.tags_list.join(',') : ''),
        meta_title: bookData.meta_title || '',
        meta_description: bookData.meta_description || '',
        meta_keywords: bookData.meta_keywords || ''
      });
    } catch (error) {
      alert("বইয়ের তথ্য লোড করতে সমস্যা হয়েছে");
      setShowForm(false);
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

      if (editingSlug) {
        await updateBook(editingSlug, data);
        alert('বইটি সফলভাবে আপডেট হয়েছে!');
      } else {
        await createBook(data);
        alert('নতুন বই সফলভাবে যোগ হয়েছে!');
      }
      
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Book save error:', error);
      let errMsg = error.message || 'অজানা ত্রুটি দেখা দিয়েছে।';
      errMsg = errMsg.replace(/^\[\d+\]\s*(.*?:\s*)?/, '');
      setUploadError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
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
                  <div>
                    <label>শিরোনাম *</label>
                    <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="form-control" />
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
                        label="অনুবাদক (একাধিক নির্বাচন সম্ভব)"
                        allAuthors={authors}
                        selected={translatorChips}
                        onChange={setTranslatorChips}
                        placeholder="অনুবাদকের নাম টাইপ করুন..."
                      />
                    </div>
                  )}

                  <div>
                    <label>ক্যাটাগরি</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} className="form-control">
                      <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
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
                    <input type="text" name="language" value={formData.language} onChange={handleInputChange} className="form-control" />
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

                {/* Media Uploads */}
                <h3>মিডিয়া</h3>
                <div className={styles.formGrid}>
                  <div>
                    <label>কভার ইমেজ</label>
                    <input type="file" name="cover" accept="image/*" onChange={handleFileChange} className="form-control" />
                  </div>
                  <div>
                    <label>একটু পড়ে দেখুন (PDF)</label>
                    <input type="file" name="sample_pdf" accept=".pdf" onChange={handleFileChange} className="form-control" />
                  </div>
                </div>

                {/* Descriptions */}
                <h3>বিবরণ</h3>
                <div style={{ marginBottom: '15px' }}>
                  <label>বইয়ের বিবরণ</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} className="form-control" rows="4"></textarea>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>ট্যাগ (কমা দিয়ে আলাদা করুন)</label>
                  <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} className="form-control" placeholder="যেমন: উপন্যাস, থ্রিলার" />
                </div>

                {/* SEO Fields */}
                <h3>SEO সেটিংস (Google)</h3>
                <div className={styles.formGrid}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Meta Title</label>
                    <input type="text" name="meta_title" value={formData.meta_title} onChange={handleInputChange} className="form-control" placeholder="SEO টাইটেল..." maxLength="200" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Meta Description</label>
                    <textarea name="meta_description" value={formData.meta_description} onChange={handleInputChange} className="form-control" rows="2" placeholder="১৬০ অক্ষরের মধ্যে বইয়ের সারসংক্ষেপ..." maxLength="300"></textarea>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Meta Keywords</label>
                    <input type="text" name="meta_keywords" value={formData.meta_keywords} onChange={handleInputChange} className="form-control" placeholder="কমা দিয়ে কিওয়ার্ড দিন..." maxLength="500" />
                  </div>
                </div>
                
                {uploadError && (
                  <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #f5c6cb', borderRadius: '8px', backgroundColor: '#f8d7da', color: '#721c24' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>⚠️ আপলোডে সমস্যা দেখা দিয়েছে!</h4>
                    <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>{uploadError}</p>
                    
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
