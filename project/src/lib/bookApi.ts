export interface UnifiedBook {
  id: string;
  title: string;
  author: string;
  cover: string | null;
  subjects: string[];
  readUrl: string | null;
  downloadUrl: string | null;
  htmlUrl: string | null;
  popularity: number;
  source: 'gutenberg' | 'openlibrary';
  description?: string;
  publishYear?: number;
  language?: string;
}

interface GutenbergBook {
  id: number;
  title: string;
  authors: { name: string; birth_year?: number; death_year?: number }[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  download_count: number;
  formats: { [key: string]: string };
  media_type: string;
}

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  subject?: string[];
  ia?: string[];
  cover_i?: number;
  cover_edition_key?: string;
  first_publish_year?: number;
  language?: string[];
  ebook_access?: string;
  ia_count?: number;
  editions?: { key: string }[];
}

// Proxy URL for bypassing CORS restrictions
const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-book?url=`;

function proxyFetch(url: string): Promise<Response> {
  return fetch(PROXY_URL + encodeURIComponent(url));
}

function mapGutenberg(b: GutenbergBook): UnifiedBook {
  return {
    id: `g-${b.id}`,
    title: b.title,
    author: b.authors.map((a) => a.name).join(', ') || 'Unknown',
    cover: b.formats['image/jpeg'] || null,
    subjects: b.subjects.slice(0, 4),
    readUrl: b.formats['text/html'] || b.formats['text/html; charset=utf-8'] || null,
    downloadUrl: b.formats['application/epub+zip'] || b.formats['application/pdf'] || null,
    htmlUrl: b.formats['text/html'] || null,
    popularity: b.download_count,
    source: 'gutenberg',
    language: b.languages[0]?.toUpperCase(),
  };
}

function mapOpenLibrary(b: OpenLibraryBook): UnifiedBook {
  const olId = b.key.replace('/works/', '');
  const cover = b.cover_i
    ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`
    : b.cover_edition_key
    ? `https://covers.openlibrary.org/b/olid/${b.cover_edition_key}-M.jpg`
    : null;

  const readUrl = b.ia?.[0]
    ? `https://archive.org/embed/${b.ia[0]}`
    : null;

  return {
    id: `ol-${olId}`,
    title: b.title,
    author: b.author_name?.join(', ') || 'Unknown',
    cover,
    subjects: (b.subject || []).slice(0, 4),
    readUrl,
    downloadUrl: b.ia?.[0] ? `https://archive.org/download/${b.ia[0]}/${b.ia[0]}_text.pdf` : null,
    htmlUrl: readUrl,
    popularity: b.ia_count || 0,
    source: 'openlibrary',
    publishYear: b.first_publish_year,
    language: b.language?.[0]?.toUpperCase(),
  };
}

export interface FetchResult {
  books: UnifiedBook[];
  totalCount: number;
  hasMore: boolean;
}

export async function fetchGutenbergBooks(
  page: number,
  search: string,
  category: string
): Promise<FetchResult> {
  let url = `https://gutendex.com/books?page=${page}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  } else if (category && category !== 'All') {
    url += `&topic=${encodeURIComponent(category)}`;
  }

  const res = await proxyFetch(url);
  if (!res.ok) throw new Error('Gutenberg fetch failed');
  const data = await res.json();

  return {
    books: (data.results as GutenbergBook[]).map(mapGutenberg),
    totalCount: data.count || 0,
    hasMore: Boolean(data.next),
  };
}

export async function fetchOpenLibraryBooks(
  page: number,
  search: string,
  category: string
): Promise<FetchResult> {
  const limit = 32;
  const offset = (page - 1) * limit;
  let url: string;

  if (search) {
    url = `https://openlibrary.org/search.json?q=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}&fields=key,title,author_name,subject,cover_i,cover_edition_key,first_publish_year,language,ia,ia_count,ebook_access`;
  } else if (category && category !== 'All') {
    url = `https://openlibrary.org/subjects/${encodeURIComponent(category.toLowerCase())}.json?limit=${limit}&offset=${offset}`;
  } else {
    url = `https://openlibrary.org/search.json?q=*&limit=${limit}&offset=${offset}&sort=editions&fields=key,title,author_name,subject,cover_i,cover_edition_key,first_publish_year,language,ia,ia_count,ebook_access`;
  }

  const res = await proxyFetch(url);
  if (!res.ok) throw new Error('Open Library fetch failed');
  const data = await res.json();

  let books: OpenLibraryBook[];
  let totalCount: number;

  if (category && category !== 'All' && !search) {
    books = (data.works || []).map((w: { key: string; title: string; authors?: { name: string }[]; cover_id?: number; cover_edition_key?: string; first_publish_year?: number; ia?: string[]; ia_count?: number }) => ({
      key: w.key,
      title: w.title,
      author_name: w.authors?.map((a) => a.name),
      subject: [category],
      cover_i: w.cover_id,
      cover_edition_key: w.cover_edition_key,
      first_publish_year: w.first_publish_year,
      ia: w.ia,
      ia_count: w.ia_count,
    }));
    totalCount = data.work_count || 0;
  } else {
    books = data.docs || [];
    totalCount = data.numFound || 0;
  }

  return {
    books: books.map(mapOpenLibrary),
    totalCount,
    hasMore: offset + limit < totalCount,
  };
}

export async function fetchAllBooks(
  page: number,
  search: string,
  category: string,
  source: 'gutenberg' | 'openlibrary' | 'both'
): Promise<FetchResult> {
  if (source === 'gutenberg') {
    return fetchGutenbergBooks(page, search, category);
  }
  if (source === 'openlibrary') {
    return fetchOpenLibraryBooks(page, search, category);
  }

  // 'both' — fetch from both APIs in parallel and merge
  const [gutenbergResult, openLibraryResult] = await Promise.allSettled([
    fetchGutenbergBooks(page, search, category),
    fetchOpenLibraryBooks(page, search, category),
  ]);

  const gBooks = gutenbergResult.status === 'fulfilled' ? gutenbergResult.value.books : [];
  const olBooks = openLibraryResult.status === 'fulfilled' ? openLibraryResult.value.books : [];

  // Interleave: alternate between sources for variety
  const merged: UnifiedBook[] = [];
  const maxLen = Math.max(gBooks.length, olBooks.length);
  for (let i = 0; i < maxLen; i++) {
    if (gBooks[i]) merged.push(gBooks[i]);
    if (olBooks[i]) merged.push(olBooks[i]);
  }

  const totalCount =
    (gutenbergResult.status === 'fulfilled' ? gutenbergResult.value.totalCount : 0) +
    (openLibraryResult.status === 'fulfilled' ? openLibraryResult.value.totalCount : 0);

  const hasMore =
    (gutenbergResult.status === 'fulfilled' ? gutenbergResult.value.hasMore : false) ||
    (openLibraryResult.status === 'fulfilled' ? openLibraryResult.value.hasMore : false);

  return { books: merged, totalCount, hasMore };
}

// Export proxy URL for book reader component
export const BOOK_PROXY_URL = PROXY_URL;
