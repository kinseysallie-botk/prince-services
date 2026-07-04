import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Loader2, Lock, Plus, Trash2, StickyNote, ExternalLink, BookOpen,
  Bookmark, BookmarkCheck, Library as LibIcon, Sparkles, Filter,
  Grid3x3, List, Globe, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase, PrivateNote, LibrarySaveRecord } from '../lib/supabase';
import { fetchAllBooks, UnifiedBook } from '../lib/bookApi';
import BookReader from './BookReader';

const CATEGORIES = [
  { label: 'All', query: '' },
  { label: 'Fiction', query: 'fiction' },
  { label: 'History', query: 'history' },
  { label: 'Science', query: 'science' },
  { label: 'Philosophy', query: 'philosophy' },
  { label: 'Poetry', query: 'poetry' },
  { label: 'Drama', query: 'drama' },
  { label: 'Adventure', query: 'adventure' },
  { label: 'Biography', query: 'biography' },
  { label: 'Children', query: 'children' },
  { label: 'Mystery', query: 'detective' },
  { label: 'Romance', query: 'romance' },
  { label: 'Fantasy', query: 'fantasy' },
  { label: 'Technology', query: 'technology' },
];

type Source = 'gutenberg' | 'openlibrary' | 'both';
type ViewMode = 'grid' | 'list';

interface LibraryProps {
  onOpenAuth: () => void;
}

export default function Library({ onOpenAuth }: LibraryProps) {
  const { user } = useAuth();
  const [books, setBooks] = useState<UnifiedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [readerBook, setReaderBook] = useState<UnifiedBook | null>(null);
  const [savedBookIds, setSavedBookIds] = useState<Set<string>>(new Set());
  const [savedBooks, setSavedBooks] = useState<UnifiedBook[]>([]);
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const [showPrivate, setShowPrivate] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [source, setSource] = useState<Source>('both');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<'popularity' | 'title' | 'author'>('popularity');
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Load saved books & notes ──
  const loadUserData = useCallback(async () => {
    if (!user) return;
    const [sv, nt] = await Promise.all([
      supabase.from('library_saves').select('*').eq('user_id', user.id),
      supabase.from('private_notes').select('*').eq('user_id', user.id).eq('scope', 'library').order('created_at', { ascending: false }),
    ]);
    const saves = (sv.data as LibrarySaveRecord[]) || [];
    setSavedBookIds(new Set(saves.map((s) => s.resource_id)));
    setSavedBooks(saves.map((s) => ({
      id: s.resource_id,
      title: s.title || 'Unknown',
      author: s.author || 'Unknown',
      cover: s.cover_image || null,
      subjects: [s.category || 'Book'],
      readUrl: s.resource_url || null,
      downloadUrl: null,
      htmlUrl: s.resource_url || null,
      popularity: 0,
      source: 'gutenberg' as const,
    })));
    setNotes((nt.data as PrivateNote[]) || []);
  }, [user]);

  useEffect(() => { if (user) loadUserData(); }, [user, loadUserData]);

  // ── Fetch books ──
  const fetchBooks = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const pageNum = reset ? 1 : page;
      const result = await fetchAllBooks(pageNum, search, activeCategory, source);

      let finalBooks = result.books;
      if (sortBy === 'title') {
        finalBooks = [...finalBooks].sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'author') {
        finalBooks = [...finalBooks].sort((a, b) => a.author.localeCompare(b.author));
      } else {
        finalBooks = [...finalBooks].sort((a, b) => b.popularity - a.popularity);
      }

      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      setBooks(reset ? finalBooks : [...books, ...finalBooks]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load books');
      if (reset) setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, page, books, source, sortBy]);

  // Initial load + on filter change
  useEffect(() => {
    fetchBooks(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeCategory, source, sortBy]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || loading || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  useEffect(() => {
    if (page > 1) fetchBooks(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const setCategory = (cat: string) => {
    setActiveCategory(cat);
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  // ── Save / unsave book ──
  const toggleSave = async (book: UnifiedBook) => {
    if (!user) { onOpenAuth(); return; }
    if (savedBookIds.has(book.id)) {
      await supabase.from('library_saves').delete().eq('user_id', user.id).eq('resource_id', book.id);
      setSavedBookIds(new Set([...savedBookIds].filter((id) => id !== book.id)));
      setSavedBooks(savedBooks.filter((b) => b.id !== book.id));
    } else {
      await supabase.from('library_saves').insert({
        user_id: user.id,
        resource_id: book.id,
        title: book.title,
        author: book.author,
        cover_image: book.cover,
        resource_url: book.readUrl || book.htmlUrl || '#',
        category: book.subjects[0] || 'Book',
      });
      setSavedBookIds(new Set([...savedBookIds, book.id]));
      setSavedBooks([book, ...savedBooks]);
    }
  };

  // ── Notes ──
  const addNote = async () => {
    if (!user || !newNote.trim()) return;
    setSavingNote(true);
    const { data } = await supabase.from('private_notes').insert({ user_id: user.id, scope: 'library', content: newNote.trim() }).select('*').maybeSingle();
    if (data) setNotes([data as PrivateNote, ...notes]);
    setNewNote('');
    setSavingNote(false);
  };

  const deleteNote = async (id: string) => {
    await supabase.from('private_notes').delete().eq('id', id).eq('user_id', user!.id);
    setNotes(notes.filter((n) => n.id !== id));
  };

  const openReader = (book: UnifiedBook) => {
    if (!book.readUrl && !book.htmlUrl) return;
    setReaderBook(book);
  };

  const sourceBadge = (s: string) => {
    const isGutenberg = s === 'gutenberg';
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isGutenberg ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
        {isGutenberg ? 'Gutenberg' : 'Open Library'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero header ── */}
      <div className="bg-gradient-to-br from-[#071524] via-[#0d2137] to-[#102a45] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Powered by Project Gutenberg + Open Library</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Free World Library</h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl">
            Access millions of free books from Project Gutenberg and Open Library — classic literature, modern works, historical texts, poetry, and more. Read online, download, or bookmark for later.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, author, or keyword..."
                className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur border border-white/20 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/15 transition-all"
              />
            </div>
            <button type="submit" className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]">
              Search
            </button>
          </form>

          {totalCount > 0 && (
            <p className="text-gray-500 text-xs mt-3">
              {totalCount.toLocaleString()} books available {search && `for "${search}"`}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Private space toggle ── */}
        {user && (
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowPrivate(!showPrivate)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                showPrivate ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'border border-gray-200 text-gray-600 hover:border-cyan-300 hover:text-cyan-600 bg-white'
              }`}
            >
              <Lock className="w-4 h-4" /> {showPrivate ? 'Back to Library' : 'My Private Space'}
            </button>
          </div>
        )}

        {showPrivate && user ? (
          /* ── Private Space ── */
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Saved Books */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-cyan-600" /> Saved Books ({savedBookIds.size})
              </h3>
              {savedBookIds.size === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
                  <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No saved books yet. Bookmark books from the library to save them here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {savedBooks.map((b) => (
                    <div key={b.id} className="flex gap-3 bg-gray-50 rounded-2xl border border-gray-100 p-3 hover:shadow-md transition-all">
                      {b.cover ? (
                        <img src={b.cover} alt="" className="w-12 h-16 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-16 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-cyan-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{b.title}</div>
                        <div className="text-gray-400 text-xs mt-0.5 truncate">{b.author}</div>
                        <div className="flex gap-2 mt-1">
                          {b.readUrl && (
                            <button onClick={() => openReader(b)} className="text-xs text-cyan-600 font-semibold hover:underline">Read</button>
                          )}
                          <button onClick={() => toggleSave(b)} className="text-xs text-red-500 font-semibold hover:underline flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Private Notes */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-amber-500" /> My Notes ({notes.length})
              </h3>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
                <textarea
                  rows={3} value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write a private note for yourself..."
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
                <button
                  onClick={addNote} disabled={savingNote || !newNote.trim()}
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-400 transition-all disabled:opacity-60"
                >
                  {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Note
                </button>
              </div>
              {notes.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
                  <StickyNote className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No notes yet. Add your first private note above.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {notes.map((n) => (
                    <div key={n.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 group">
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{n.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</span>
                        <button onClick={() => deleteNote(n.id)} className="text-xs text-red-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Public Library ── */
          <>
            {/* Sign-in prompt */}
            {!user && (
              <div className="mb-6 p-4 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center justify-between">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-600" /> Sign in to bookmark books and access your private notes space.
                </p>
                <button onClick={() => onOpenAuth()} className="px-4 py-2 bg-cyan-500 text-white rounded-full text-sm font-semibold hover:bg-cyan-400 transition-colors">
                  Sign In
                </button>
              </div>
            )}

            {/* Source toggle + view mode + sort */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <div className="flex bg-white border border-gray-200 rounded-full p-1">
                  {([
                    { id: 'both', label: 'All Sources' },
                    { id: 'gutenberg', label: 'Gutenberg' },
                    { id: 'openlibrary', label: 'Open Library' },
                  ] as { id: Source; label: string }[]).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSource(s.id); setPage(1); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        source === s.id ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'popularity' | 'title' | 'author')}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="popularity">Most Popular</option>
                  <option value="title">Title A-Z</option>
                  <option value="author">Author A-Z</option>
                </select>

                {/* View mode toggle */}
                <div className="flex bg-white border border-gray-200 rounded-full p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setCategory(cat.label)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat.label
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-cyan-300 hover:text-cyan-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm text-center">
                {error}. The book APIs may be temporarily unavailable.
              </div>
            )}

            {/* Loading skeleton */}
            {loading && books.length === 0 ? (
              <div className={viewMode === 'grid' ? "grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5" : "space-y-3"}>
                {Array.from({ length: 15 }).map((_, i) => (
                  viewMode === 'grid' ? (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                      <div className="h-56 bg-gray-200" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse flex gap-4">
                      <div className="w-16 h-20 bg-gray-200 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : viewMode === 'grid' ? (
              /* ── Grid View ── */
              <>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {books.map((book) => {
                    const saved = savedBookIds.has(book.id);
                    return (
                      <div key={book.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                        <div className="h-56 overflow-hidden relative bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center">
                          {book.cover ? (
                            <img
                              src={book.cover}
                              alt={book.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <BookOpen className="w-12 h-12 text-cyan-300" />
                          )}
                          <div className="absolute top-3 left-3">{sourceBadge(book.source)}</div>
                          <button
                            onClick={() => toggleSave(book)}
                            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                              saved ? 'bg-cyan-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
                            }`}
                            title={saved ? 'Remove from saved' : 'Save to my space'}
                          >
                            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-cyan-600 transition-colors mb-1">
                            {book.title}
                          </h3>
                          <p className="text-gray-400 text-xs mb-2 line-clamp-1">{book.author}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {book.subjects.slice(0, 2).map((s, i) => (
                              <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 truncate max-w-[120px]">
                                {s.split(' -- ')[0]}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-auto">
                            {book.readUrl && (
                              <button
                                onClick={() => openReader(book)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-xs font-bold hover:shadow-md transition-all"
                              >
                                <BookOpen className="w-3.5 h-3.5" /> Read
                              </button>
                            )}
                            {book.downloadUrl && (
                              <a
                                href={book.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:border-cyan-300 hover:text-cyan-600 transition-all"
                                title="Download"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* ── List View ── */
              <div className="space-y-3">
                {books.map((book) => {
                  const saved = savedBookIds.has(book.id);
                  return (
                    <div key={book.id} className="group bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all flex gap-4">
                      <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center">
                        {book.cover ? (
                          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <BookOpen className="w-6 h-6 text-cyan-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-cyan-600 transition-colors">{book.title}</h3>
                            <p className="text-gray-400 text-xs mt-0.5">{book.author}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {sourceBadge(book.source)}
                            <button
                              onClick={() => toggleSave(book)}
                              className={`p-1.5 rounded-full transition-all ${saved ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-cyan-500 hover:bg-cyan-50'}`}
                            >
                              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {book.subjects.slice(0, 3).map((s, i) => (
                            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600">
                              {s.split(' -- ')[0].slice(0, 25)}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          {book.readUrl && (
                            <button onClick={() => openReader(book)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-xs font-bold hover:shadow-md transition-all">
                              <BookOpen className="w-3.5 h-3.5" /> Read
                            </button>
                          )}
                          {book.downloadUrl && (
                            <a href={book.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:border-cyan-300 hover:text-cyan-600 transition-all">
                              <ExternalLink className="w-3.5 h-3.5" /> Download
                            </a>
                          )}
                          {book.popularity > 0 && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> {book.popularity.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Infinite scroll sentinel + loading */}
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-10">
                {loading && <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />}
              </div>
            )}

            {!loading && books.length === 0 && !error && (
              <div className="text-center py-20">
                <LibIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No books found. Try a different search or category.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Book Reader ── */}
      {readerBook && (
        <BookReader
          book={{
            id: readerBook.source === 'gutenberg' ? parseInt(readerBook.id.replace('g-', '')) : 0,
            title: readerBook.title,
            authors: [{ name: readerBook.author }],
            subjects: readerBook.subjects,
            bookshelves: [],
            languages: readerBook.language ? [readerBook.language.toLowerCase()] : ['en'],
            download_count: readerBook.popularity,
            formats: readerBook.source === 'gutenberg'
              ? {
                  'text/html': readerBook.htmlUrl || readerBook.readUrl || '',
                  'image/jpeg': readerBook.cover || '',
                  'application/epub+zip': readerBook.downloadUrl || '',
                }
              : {},
          }}
          onClose={() => setReaderBook(null)}
        />
      )}
    </div>
  );
}
