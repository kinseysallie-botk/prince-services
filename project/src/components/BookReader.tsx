import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, ChevronLeft, ChevronRight, BookOpen,
  ExternalLink, Download, Loader2, AlertCircle, Maximize2, CheckCircle, RefreshCw,
  Sun, Moon, Coffee, Bookmark, BookmarkCheck, Keyboard, List,
  Type, Minimize2, Clock,
} from 'lucide-react';

export interface GutenbergBook {
  id: number;
  title: string;
  authors: { name: string; birth_year?: number; death_year?: number }[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  download_count: number;
  formats: Record<string, string>;
  copyright?: boolean;
}

interface BookReaderProps {
  book: GutenbergBook;
  onClose: () => void;
}

function getFormatUrl(formats: Record<string, string>, mimeTypes: string[]): string | null {
  for (const mime of mimeTypes) {
    const found = Object.entries(formats).find(([key]) => key.toLowerCase().includes(mime.toLowerCase()));
    if (found) return found[1];
  }
  return null;
}

function getCoverUrl(formats: Record<string, string>): string | null {
  return getFormatUrl(formats, ['image/jpeg', 'image/png']);
}

const CORS_PROXIES = [
  (url: string) => url,
  (url: string) => `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

function processText(raw: string): string {
  let text = raw;
  const startMarkers = [
    '*** START OF THE PROJECT GUTENBERG',
    '*** START OF THIS PROJECT GUTENBERG',
    '*END*THE SMALL PRINT',
    '***START OF THE PROJECT GUTENBERG',
  ];
  const endMarkers = [
    '*** END OF THE PROJECT GUTENBERG',
    '*** END OF THIS PROJECT GUTENBERG',
    'End of the Project Gutenberg',
    'End of Project Gutenberg',
    '***END OF THE PROJECT GUTENBERG',
  ];

  for (const marker of startMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      const lineEnd = text.indexOf('\n', idx);
      if (lineEnd !== -1) text = text.slice(lineEnd + 1);
      break;
    }
  }
  for (const marker of endMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) { text = text.slice(0, idx); break; }
  }

  return text.trim();
}

type Theme = 'light' | 'sepia' | 'dark';

export default function BookReader({ book, onClose }: BookReaderProps) {
  const [content, setContent] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large' | 'xlarge'>('normal');
  const [page, setPage] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'reader' | 'iframe'>('reader');
  const [theme, setTheme] = useState<Theme>('dark');
  const [toc, setToc] = useState<{ label: string; href: string }[]>([]);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTocMobile, setShowTocMobile] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const CHARS_PER_PAGE = 6000;
  const fontSizeMap = { small: '90%', normal: '100%', large: '115%', xlarge: '130%' };

  const textUrl = getFormatUrl(book.formats, ['text/plain']);
  const htmlUrl = getFormatUrl(book.formats, ['text/html']);
  const epubUrl = getFormatUrl(book.formats, ['application/epub+zip', 'epub']);
  const coverUrl = getCoverUrl(book.formats);
  const gutenbergUrl = `https://www.gutenberg.org/ebooks/${book.id}`;
  const gutenbergHtmlUrl = `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.html`;

  // Load saved reading position and bookmarks from localStorage
  const storageKey = `book-progress-${book.id}`;
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const { page: savedPage, bookmarks: savedBm, theme: savedTheme, fontSize: savedFs } = JSON.parse(saved);
        if (typeof savedPage === 'number') setPage(savedPage);
        if (Array.isArray(savedBm)) setBookmarks(savedBm);
        if (savedTheme) setTheme(savedTheme);
        if (savedFs) setFontSize(savedFs);
      } catch { /* ignore */ }
    }
  }, [storageKey]);

  // Save progress to localStorage
  useEffect(() => {
    if (content) {
      localStorage.setItem(storageKey, JSON.stringify({ page, bookmarks, theme, fontSize }));
    }
  }, [page, bookmarks, theme, fontSize, content, storageKey]);

  // Reading time tracker
  useEffect(() => {
    if (!content || loadingText) return;
    const interval = setInterval(() => setReadingTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [content, loadingText]);

  const themeStyles = {
    light: {
      bg: 'bg-gray-50', surface: 'bg-white', text: 'text-gray-900', textMuted: 'text-gray-500',
      border: 'border-gray-200', accent: 'text-blue-600', accentBg: 'bg-blue-600',
    },
    sepia: {
      bg: 'bg-[#f4ecd8]', surface: 'bg-[#fdf6e3]', text: 'text-[#5b4636]', textMuted: 'text-[#8b7355]',
      border: 'border-[#e4d9c4]', accent: 'text-[#8b5a2b]', accentBg: 'bg-[#8b5a2b]',
    },
    dark: {
      bg: 'bg-[#0f172a]', surface: 'bg-[#1e293b]', text: 'text-gray-100', textMuted: 'text-gray-400',
      border: 'border-gray-700', accent: 'text-cyan-400', accentBg: 'bg-cyan-500',
    },
  };

  const currentTheme = themeStyles[theme];

  useEffect(() => {
    const fetchContent = async () => {
      setLoadingText(true);
      setFetchError(false);
      setViewMode('reader');
      setPage(0);

      // Try text mode first (via proxy) — this is the most reliable path
      if (textUrl) {
        const tryProxy = async (proxyIndex: number): Promise<boolean> => {
          if (proxyIndex >= CORS_PROXIES.length) return false;
          const proxyUrl = CORS_PROXIES[proxyIndex](textUrl);
          try {
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error('Proxy failed');
            const raw = await res.text();
            const processed = processText(raw);
            if (processed.length > 500) {
              setContent(processed);
              setHtmlContent(null);
              setLoadingText(false);
              const chapterRegex = /^(chapter|part|book|volume|section|prologue|epilogue)\s*[IVXLCDMivxlcdm0-9]*\.?\s*$/gim;
              const matches = [...processed.matchAll(chapterRegex)];
              const tocItems = matches.slice(0, 30).map(m => ({
                label: m[0].trim(),
                href: m.index?.toString() || '0',
              }));
              setToc(tocItems);
              return true;
            }
          } catch { /* Try next proxy */ }
          return tryProxy(proxyIndex + 1);
        };

        const success = await tryProxy(0);
        if (success) return;
      }

      // Fall back to HTML mode via proxy (not direct — gutenberg.org blocks CORS)
      const htmlToTry = htmlUrl || gutenbergHtmlUrl;
      if (htmlToTry) {
        const tryHtmlProxy = async (proxyIndex: number): Promise<boolean> => {
          if (proxyIndex >= CORS_PROXIES.length) return false;
          const proxyUrl = CORS_PROXIES[proxyIndex](htmlToTry);
          try {
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error('HTML proxy failed');
            const html = await res.text();
            if (html.length > 500) {
              setHtmlContent(html);
              setContent(null);
              setLoadingText(false);
              setViewMode('iframe');
              return true;
            }
          } catch { /* Try next proxy */ }
          return tryHtmlProxy(proxyIndex + 1);
        };

        const htmlSuccess = await tryHtmlProxy(0);
        if (htmlSuccess) return;
      }

      setFetchError(true);
      setLoadingText(false);
    };

    fetchContent();
  }, [textUrl, htmlUrl, gutenbergHtmlUrl]);

  const retryFetch = () => {
    setContent(null);
    setHtmlContent(null);
    setFetchError(false);
    setLoadingText(true);
    setPage(0);
  };

  const pages = content ? Math.ceil(content.length / CHARS_PER_PAGE) : 0;
  const currentChunk = content ? content.slice(page * CHARS_PER_PAGE, (page + 1) * CHARS_PER_PAGE) : '';
  const paragraphs = currentChunk.split(/\n{2,}/).filter(Boolean);

  const authorNames = book.authors.map((a) => {
    const parts = a.name.split(', ');
    return parts.length > 1 ? `${parts[1]} ${parts[0]}` : a.name;
  }).join(', ');

  const jumpToPosition = (indexStr: string) => {
    const index = parseInt(indexStr, 10);
    if (!isNaN(index) && content) {
      const targetPage = Math.floor(index / CHARS_PER_PAGE);
      setPage(Math.min(targetPage, pages - 1));
    }
    setShowTocMobile(false);
  };

  const toggleBookmark = useCallback(() => {
    if (!content) return;
    setBookmarks((prev) => prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page].sort((a, b) => a - b));
  }, [content, page]);

  const isBookmarked = bookmarks.includes(page);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setPage((p) => Math.max(0, p - 1));
    else if (e.key === 'ArrowRight') setPage((p) => Math.min((content ? Math.ceil(content.length / CHARS_PER_PAGE) : 1) - 1, p + 1));
    else if (e.key === 'Escape') { if (showTocMobile) setShowTocMobile(false); else if (showShortcuts) setShowShortcuts(false); else onClose(); }
    else if (e.key === 'f') setFullscreen((f) => !f);
    else if (e.key === 'b') toggleBookmark();
    else if (e.key === '?') setShowShortcuts((s) => !s);
  }, [content, showTocMobile, showShortcuts, onClose, toggleBookmark]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (delta > 50 && page > 0) {
      setPage((p) => Math.max(0, p - 1));
    } else if (delta < -50 && page < pages - 1) {
      setPage((p) => Math.min(pages - 1, p + 1));
    }
    touchStartX.current = null;
  };

  const progressPercent = pages > 0 ? Math.round(((page + 1) / pages) * 100) : 0;

  return (
    <div className={`fixed inset-0 z-50 flex ${currentTheme.bg} ${fullscreen ? '' : 'p-1 sm:p-3 md:p-4'}`}>
      <div className={`relative w-full grid grid-cols-1 md:grid-cols-[240px_1fr_220px] max-w-[1800px] mx-auto gap-0 ${fullscreen ? 'h-full' : 'h-full max-h-[92vh]'} rounded-3xl overflow-hidden shadow-2xl ${currentTheme.surface} border ${currentTheme.border}`}>

        {/* Left Sidebar - Book Info & TOC */}
        <div className={`${currentTheme.surface} border-r ${currentTheme.border} flex-col overflow-hidden hidden md:flex`}>
          <div className={`p-4 border-b ${currentTheme.border}`}>
            <div className="flex items-start gap-3">
              {coverUrl && <img src={coverUrl} alt={book.title} className="w-14 h-20 object-cover rounded-lg shadow-md flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-sm leading-tight line-clamp-2 ${currentTheme.text}`}>{book.title}</h3>
                <p className={`${currentTheme.textMuted} text-xs mt-1`}>by {authorNames}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              {epubUrl && (
                <a href={epubUrl} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
                  <Download className="w-3 h-3" /> EPUB
                </a>
              )}
              <a href={gutenbergUrl} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${theme === 'dark' ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <ExternalLink className="w-3 h-3" /> Source
              </a>
            </div>
          </div>

          {/* Reading progress */}
          {content && pages > 0 && (
            <div className={`px-4 py-3 border-b ${currentTheme.border}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-semibold ${currentTheme.textMuted}`}>Progress</span>
                <span className={`text-xs font-bold ${currentTheme.accent}`}>{progressPercent}%</span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}>
                <div className={`h-full rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-600'}`} style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${currentTheme.textMuted} flex items-center gap-1`}>
                  <Clock className="w-3 h-3" /> {formatTime(readingTime)}
                </span>
                <span className={`text-xs ${currentTheme.textMuted}`}>Page {page + 1}/{pages}</span>
              </div>
            </div>
          )}

          {/* Bookmarks list */}
          {bookmarks.length > 0 && (
            <div className={`px-4 py-2 border-b ${currentTheme.border}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${currentTheme.textMuted}`}>Bookmarks ({bookmarks.length})</p>
              <div className="flex flex-wrap gap-1">
                {bookmarks.map((bm) => (
                  <button key={bm} onClick={() => setPage(bm)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${bm === page ? (theme === 'dark' ? 'bg-cyan-500 text-white' : 'bg-blue-600 text-white') : (theme === 'dark' ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}>
                    p.{bm + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Table of Contents */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 pb-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>Table of Contents</h4>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {toc.length > 0 ? (
                <ul className="space-y-0.5">
                  {toc.map((item, i) => (
                    <li key={i} onClick={() => jumpToPosition(item.href)}
                      className={`px-3 py-2 rounded-lg cursor-pointer text-sm truncate transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                      {item.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`px-3 text-sm ${currentTheme.textMuted}`}>No chapters detected</p>
              )}
            </div>
          </div>
        </div>

        {/* Center - Reading Area */}
        <div className="flex flex-col relative overflow-hidden">
          {/* Toolbar */}
          <div className={`h-14 flex-shrink-0 ${currentTheme.surface} border-b ${currentTheme.border} flex items-center justify-between px-4`}>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="w-5 h-5" />
              </button>
              <div className={`h-5 w-px ${currentTheme.border}`} />
              {/* Mobile TOC toggle */}
              <button onClick={() => setShowTocMobile(!showTocMobile)} className={`md:hidden p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <List className="w-5 h-5" />
              </button>
              <span className={`text-sm font-semibold truncate max-w-[200px] ${currentTheme.text}`}>{book.title}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Bookmark current page */}
              {content && viewMode === 'reader' && (
                <button onClick={toggleBookmark} className={`p-2 rounded-lg transition-colors ${isBookmarked ? (theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600') : (theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}`} title="Bookmark page (B)">
                  {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
              )}
              {/* Keyboard shortcuts */}
              <button onClick={() => setShowShortcuts(!showShortcuts)} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} title="Keyboard shortcuts (?)">
                <Keyboard className="w-4 h-4" />
              </button>
              {content && !fetchError && (
                <select value={viewMode} onChange={(e) => setViewMode(e.target.value as 'reader' | 'iframe')}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${theme === 'dark' ? 'bg-white/10 text-gray-300 border border-white/10' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                  <option value="reader">Text Reader</option>
                  <option value="iframe">HTML View</option>
                </select>
              )}
              <button onClick={() => setFullscreen(!fullscreen)} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} title="Fullscreen (F)">
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile TOC drawer */}
          {showTocMobile && (
            <div className="absolute inset-0 z-20 md:hidden" onClick={() => setShowTocMobile(false)}>
              <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/50' : 'bg-black/30'}`} />
              <div className={`absolute left-0 top-0 bottom-0 w-72 ${currentTheme.surface} border-r ${currentTheme.border} overflow-y-auto p-4`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-sm font-bold ${currentTheme.text}`}>Contents</h4>
                  <button onClick={() => setShowTocMobile(false)} className={`p-1 rounded ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}><X className="w-4 h-4" /></button>
                </div>
                {toc.length > 0 ? (
                  <ul className="space-y-0.5">
                    {toc.map((item, i) => (
                      <li key={i} onClick={() => jumpToPosition(item.href)} className={`px-3 py-2 rounded-lg cursor-pointer text-sm truncate ${theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>{item.label}</li>
                    ))}
                  </ul>
                ) : <p className={`text-sm ${currentTheme.textMuted}`}>No chapters detected</p>}
              </div>
            </div>
          )}

          {/* Reading Viewport */}
          <div className="flex-1 relative overflow-hidden">
            {/* Page hotspots */}
            {content && viewMode === 'reader' && pages > 1 && page > 0 && (
              <button onClick={() => setPage(Math.max(0, page - 1))}
                className={`absolute left-0 top-0 bottom-0 w-20 z-10 flex items-center justify-center transition-opacity opacity-0 hover:opacity-100 ${theme === 'dark' ? 'bg-gradient-to-r from-black/10 to-transparent' : 'bg-gradient-to-r from-black/5 to-transparent'}`}>
                <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80 shadow'} transition-transform hover:scale-110`}>
                  <ChevronLeft className={`w-5 h-5 ${currentTheme.text}`} />
                </div>
              </button>
            )}
            {content && viewMode === 'reader' && pages > 1 && page < pages - 1 && (
              <button onClick={() => setPage(Math.min(pages - 1, page + 1))}
                className={`absolute right-0 top-0 bottom-0 w-20 z-10 flex items-center justify-center transition-opacity opacity-0 hover:opacity-100 ${theme === 'dark' ? 'bg-gradient-to-l from-black/10 to-transparent' : 'bg-gradient-to-l from-black/5 to-transparent'}`}>
                <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-white/80 shadow'} transition-transform hover:scale-110`}>
                  <ChevronRight className={`w-5 h-5 ${currentTheme.text}`} />
                </div>
              </button>
            )}

            <div className="absolute inset-0 overflow-y-auto" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              {loadingText && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <Loader2 className={`w-8 h-8 animate-spin ${currentTheme.accent}`} />
                  </div>
                  <p className={`text-sm font-medium ${currentTheme.text}`}>Loading book content...</p>
                  <p className={`text-xs mt-1 ${currentTheme.textMuted}`}>Trying multiple sources...</p>
                </div>
              )}

              {!loadingText && fetchError && (
                <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                    <AlertCircle className={`w-8 h-8 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${currentTheme.text}`}>Unable to Load In-App</h3>
                  <p className={`text-sm mb-6 max-w-md ${currentTheme.textMuted}`}>This book couldn&apos;t be loaded directly due to browser restrictions.</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <a href={gutenbergHtmlUrl || gutenbergUrl} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}>
                      <BookOpen className="w-4 h-4" /> Read Online
                    </a>
                    {epubUrl && (
                      <a href={epubUrl} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border transition-all ${theme === 'dark' ? 'bg-white/10 border-white/15 text-gray-300 hover:bg-white/15' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <Download className="w-4 h-4" /> Download EPUB
                      </a>
                    )}
                    <button onClick={retryFetch}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border transition-all ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-gray-500' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                      <RefreshCw className="w-4 h-4" /> Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Text Reader Mode */}
              {!loadingText && !fetchError && content && viewMode === 'reader' && (
                <div className="max-w-3xl mx-auto px-4 sm:px-8 md:px-12 py-6 sm:py-10 md:py-12" style={{ fontSize: fontSizeMap[fontSize] }}>
                  <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                    {paragraphs.map((para, i) => {
                      const trimmed = para.trim();
                      const isChapterHeading = /^(chapter|part|book|volume|section|prologue|epilogue|introduction|preface)\s*[IVXLCDMivxlcdm0-9]*\.?\s*$/i.test(trimmed) ||
                        (trimmed.length < 60 && trimmed === trimmed.toUpperCase() && !trimmed.includes('.'));
                      return isChapterHeading ? (
                        <h2 key={i} className={`font-bold text-center my-10 tracking-widest text-sm uppercase ${currentTheme.accent}`}>{trimmed}</h2>
                      ) : (
                        <p key={i} className={`leading-relaxed mb-6 indent-8 ${currentTheme.text}`}>{trimmed}</p>
                      );
                    })}
                    {page === pages - 1 && (
                      <div className="text-center mt-12 pb-8">
                        <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold ${theme === 'dark' ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'bg-green-100 text-green-700'}`}>
                          <CheckCircle className="w-4 h-4" /> End of Book
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* HTML/IFrame Mode */}
              {!loadingText && !fetchError && (htmlContent || viewMode === 'iframe') && viewMode === 'iframe' && (
                <iframe
                  src={htmlContent ? `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}` : gutenbergHtmlUrl}
                  title={book.title}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts allow-popups"
                />
              )}
            </div>
          </div>

          {/* Pagination Footer */}
          {!loadingText && !fetchError && content && viewMode === 'reader' && pages > 1 && (
            <div className={`flex-shrink-0 ${currentTheme.surface} border-t ${currentTheme.border} px-3 py-2 sm:px-4 sm:py-3`}>
              <div className="flex items-center justify-between gap-2">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${theme === 'dark' ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Prev</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className={`text-xs sm:text-sm ${currentTheme.textMuted}`}>Page {page + 1}/{pages}</span>
                  <div className="hidden sm:flex gap-1">
                    {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                      const p = pages <= 7 ? i : page <= 3 ? i : page >= pages - 4 ? pages - 7 + i : page - 3 + i;
                      return (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === page ? (theme === 'dark' ? 'bg-cyan-500 text-white' : 'bg-blue-600 text-white') : (theme === 'dark' ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}>
                          {p + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button onClick={() => setPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${theme === 'dark' ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Controls */}
        <div className={`${currentTheme.surface} border-l ${currentTheme.border} flex-col gap-6 p-4 overflow-y-auto hidden md:flex`}>
          {!fullscreen && (
            <div className="flex justify-end">
              <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-white/10 text-gray-400 hover:bg-white/15' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Text Scaling */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${currentTheme.textMuted}`}>
              <Type className="w-3.5 h-3.5" /> Text Size
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {(['small', 'normal', 'large', 'xlarge'] as const).map((size) => (
                <button key={size} onClick={() => setFontSize(size)}
                  className={`py-2.5 rounded-lg text-xs font-semibold transition-all capitalize ${fontSize === size ? (theme === 'dark' ? 'bg-cyan-500 text-white' : 'bg-blue-600 text-white') : (theme === 'dark' ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}>
                  {size === 'xlarge' ? 'X-Large' : size}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Theme */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${currentTheme.textMuted}`}>Theme</h4>
            <div className="flex gap-2">
              <button onClick={() => setTheme('light')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <Sun className="w-3.5 h-3.5" /> Light
              </button>
              <button onClick={() => setTheme('sepia')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${theme === 'sepia' ? 'bg-[#8b5a2b] text-white' : 'bg-[#f4ecd8] text-[#5b4636] hover:bg-[#e4d9c4]'}`}>
                <Coffee className="w-3.5 h-3.5" /> Sepia
              </button>
              <button onClick={() => setTheme('dark')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${theme === 'dark' ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                <Moon className="w-3.5 h-3.5" /> Dark
              </button>
            </div>
          </div>

          {/* Book Details */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${currentTheme.textMuted}`}>Book Details</h4>
            <div className="space-y-2">
              <div className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-xs ${currentTheme.textMuted}`}>Downloads</p>
                <p className={`text-sm font-bold ${currentTheme.text}`}>{book.download_count.toLocaleString()}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-xs ${currentTheme.textMuted}`}>Language</p>
                <p className={`text-sm font-bold ${currentTheme.text}`}>{book.languages[0]?.toUpperCase() || 'EN'}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-xs ${currentTheme.textMuted}`}>Gutenberg ID</p>
                <p className={`text-sm font-bold ${currentTheme.text}`}>#{book.id}</p>
              </div>
            </div>
          </div>

          {/* Subjects */}
          {book.subjects.length > 0 && (
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${currentTheme.textMuted}`}>Subjects</h4>
              <div className="flex flex-wrap gap-1.5">
                {book.subjects.slice(0, 6).map((s) => (
                  <span key={s} className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-blue-50 text-blue-600'}`}>
                    {s.split(' -- ')[0].slice(0, 20)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && (
        <div className="absolute inset-0 z-30 flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
          <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/60' : 'bg-black/40'}`} />
          <div className={`relative ${currentTheme.surface} rounded-2xl border ${currentTheme.border} p-6 max-w-sm w-full mx-4`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold ${currentTheme.text} flex items-center gap-2`}>
                <Keyboard className="w-5 h-5" /> Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowShortcuts(false)} className={`p-1 rounded ${currentTheme.textMuted}`}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {[
                { key: '← / →', label: 'Previous / Next page' },
                { key: 'F', label: 'Toggle fullscreen' },
                { key: 'B', label: 'Bookmark current page' },
                { key: '?', label: 'Show this help' },
                { key: 'Esc', label: 'Close reader' },
              ].map((s) => (
                <div key={s.key} className="flex items-center justify-between">
                  <span className={`text-sm ${currentTheme.textMuted}`}>{s.label}</span>
                  <kbd className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${theme === 'dark' ? 'bg-white/10 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
