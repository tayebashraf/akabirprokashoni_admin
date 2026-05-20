'use client';
import { useState, useEffect } from 'react';
import { getBooks, deleteBook, createBook, updateBook, getCategories, getAuthors, getBookBySlug, createAuthor, getImageUrl } from '@/lib/api';
import styles from './page.module.css';

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSlug, setEditingSlug] = useState(null);
  const [showNewAuthor, setShowNewAuthor] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState('');
  const [formData, setFormData] = useState({
    title: '', slug: '', author: '', category: '', publisher: '',
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
    setFormData({
      title: '', slug: '', author: '', category: '', publisher: '',
      price: '', original_price: '', pages: '', isbn: '', language: 'bangla',
      edition: '', weight: '', dimensions: '', stock: '',
      is_trending: false, is_new_release: true, is_preorder: false,
      description: '', author_bio: '', tags: '',
      meta_title: '', meta_description: '', meta_keywords: ''
    });
    setFiles({ cover: null, sample_pdf: null });
    setShowForm(true);
  };

  const openEditForm = async (slug) => {
    try {
      setEditingSlug(slug);
      setShowForm(true); // Open early, will populate when loaded
      const bookData = await getBookBySlug(slug);
      
      setFormData({
        title: bookData.title || '',
        slug: bookData.slug || '',
        author: bookData.author?.id || bookData.author || '',
        category: bookData.category?.id || bookData.category || '',
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
      // Existing files can't be populated into input type="file" for security reasons
      // We just leave files empty, and only send if user selects new ones
    } catch (error) {
      alert("বইয়ের তথ্য লোড করতে সমস্যা হয়েছে");
      setShowForm(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = new FormData();
      
      // Add all text fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
           if (key === 'author') {
             data.append('authors', formData[key]);
           } else {
             data.append(key, formData[key]);
           }
        }
      });
      
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
      fetchData(); // Refresh list
    } catch (error) {
      console.error(error);
      alert(`সমস্যা হয়েছে: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (slug) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই বইটি ডিলিট করতে চান?')) {
      try {
        await deleteBook(slug);
        setBooks(prev => prev.filter(b => b.slug !== slug));
        alert('বইটি সফলভাবে ডিলিট হয়েছে!');
      } catch (error) {
        alert('ডিলিট করতে সমস্যা হয়েছে।');
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
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>কোনো বই পাওয়া যায়নি</td></tr>
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
                    <label>লেখক *</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select name="author" required value={formData.author} onChange={handleInputChange} className="form-control" style={{ flex: 1 }}>
                        <option value="">লেখক নির্বাচন করুন</option>
                        {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <button type="button" onClick={() => setShowNewAuthor(!showNewAuthor)} style={{ padding: '8px 14px', background: 'var(--color-primary)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: 'none' }}>
                        + নতুন
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
                            setFormData(prev => ({ ...prev, author: created.id }));
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

                <div className={styles.formActions}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>বাতিল</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
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
