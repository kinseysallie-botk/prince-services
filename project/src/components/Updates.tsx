import { useState, useEffect, useCallback } from 'react';
import { Calendar, ArrowRight, Tag, Bookmark, BookmarkCheck, Lock, Trash2, Loader2, StickyNote, Plus } from 'lucide-react';
import { useInView } from '../hooks/useInView';
import { useAuth } from '../hooks/useAuth';
import { supabase, UpdateBookmark, PrivateNote } from '../lib/supabase';

const updates = [
  {
    id: 1, category: 'KUCCPS', categoryColor: 'bg-blue-100 text-blue-600',
    title: 'KUCCPS 2025/2026 Application Deadline & How to Apply',
    excerpt: 'Everything you need to know about the KUCCPS application cycle this year — deadlines, required documents, revision window, and how we can help.',
    date: 'June 28, 2025', readTime: '5 min read',
    image: 'https://images.pexels.com/photos/1205651/pexels-photo-1205651.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 2, category: 'HELB', categoryColor: 'bg-green-100 text-green-600',
    title: 'HELB Loan Application Guide 2025: Step-by-Step for New Students',
    excerpt: 'New to HELB? Here is the complete guide to applying for your student loan — from portal access to account activation and disbursement.',
    date: 'June 15, 2025', readTime: '6 min read',
    image: 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 3, category: 'KRA', categoryColor: 'bg-orange-100 text-orange-600',
    title: 'KRA iTax 2025 Update: New Changes Every Kenyan Must Know',
    excerpt: 'KRA has updated the iTax portal. Here is what changed, how to file your returns, and how to avoid common penalties.',
    date: 'June 5, 2025', readTime: '4 min read',
    image: 'https://images.pexels.com/photos/6863332/pexels-photo-6863332.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 4, category: 'Cybersecurity', categoryColor: 'bg-rose-100 text-rose-600',
    title: 'How to Stay Safe Online as a Kenyan Student in 2025',
    excerpt: 'Cybercriminals are targeting students. Learn the most critical digital hygiene practices and how to protect yourself online.',
    date: 'May 22, 2025', readTime: '5 min read',
    image: 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 5, category: 'Career', categoryColor: 'bg-purple-100 text-purple-600',
    title: 'The ATS-Optimized CV That Gets You Shortlisted in 2025',
    excerpt: 'Most CVs are rejected before a human reads them. Learn how to write one that beats ATS filters and lands interviews.',
    date: 'May 10, 2025', readTime: '5 min read',
    image: 'https://images.pexels.com/photos/3760072/pexels-photo-3760072.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 6, category: 'Compliance', categoryColor: 'bg-teal-100 text-teal-600',
    title: 'How to Apply for a Certificate of Good Conduct via eCitizen',
    excerpt: 'A step-by-step guide to applying for your Certificate of Good Conduct on the eCitizen platform — requirements, fees, and timeline.',
    date: 'April 28, 2025', readTime: '4 min read',
    image: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

interface UpdatesProps {
  onOpenAuth: () => void;
}

export default function Updates({ onOpenAuth }: UpdatesProps) {
  const { ref, inView } = useInView();
  const { user } = useAuth();
  const [showPrivate, setShowPrivate] = useState(false);
  const [bookmarks, setBookmarks] = useState<UpdateBookmark[]>([]);
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [bm, nt] = await Promise.all([
      supabase.from('update_bookmarks').select('*').eq('user_id', user.id).order('bookmarked_at', { ascending: false }),
      supabase.from('private_notes').select('*').eq('user_id', user.id).eq('scope', 'updates').order('created_at', { ascending: false }),
    ]);
    setBookmarks((bm.data as UpdateBookmark[]) || []);
    setNotes((nt.data as PrivateNote[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const toggleBookmark = async (post: typeof updates[0]) => {
    if (!user) { onOpenAuth(); return; }
    const existing = bookmarks.find((b) => b.title === post.title);
    if (existing) {
      await supabase.from('update_bookmarks').delete().eq('id', existing.id).eq('user_id', user.id);
      setBookmarks(bookmarks.filter((b) => b.id !== existing.id));
    } else {
      const { data } = await supabase.from('update_bookmarks').insert({
        user_id: user.id, title: post.title, excerpt: post.excerpt, category: post.category, image_url: post.image,
      }).select('*').maybeSingle();
      if (data) setBookmarks([data as UpdateBookmark, ...bookmarks]);
    }
  };

  const isBookmarked = (title: string) => bookmarks.some((b) => b.title === title);

  const addNote = async () => {
    if (!user || !newNote.trim()) return;
    setSavingNote(true);
    const { data } = await supabase.from('private_notes').insert({ user_id: user.id, scope: 'updates', content: newNote.trim() }).select('*').maybeSingle();
    if (data) setNotes([data as PrivateNote, ...notes]);
    setNewNote('');
    setSavingNote(false);
  };

  const deleteNote = async (id: string) => {
    await supabase.from('private_notes').delete().eq('id', id).eq('user_id', user!.id);
    setNotes(notes.filter((n) => n.id !== id));
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from('update_bookmarks').delete().eq('id', id).eq('user_id', user!.id);
    setBookmarks(bookmarks.filter((b) => b.id !== id));
  };

  return (
    <section id="updates" className="py-24 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div>
            <span className="inline-block px-4 py-1.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Latest Updates
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900">Insights &amp; News</h2>
            <p className="text-gray-500 mt-2">KUCCPS/HELB updates, compliance guides, and career tips from our team.</p>
          </div>
          {user && (
            <button
              onClick={() => setShowPrivate(!showPrivate)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${
                showPrivate ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'border border-gray-200 text-gray-600 hover:border-cyan-300 hover:text-cyan-600'
              }`}
            >
              <Lock className="w-4 h-4" /> {showPrivate ? 'Public Feed' : 'My Private Space'}
            </button>
          )}
        </div>

        {showPrivate && user ? (
          /* ── Private Space ── */
          <div className={`transition-all duration-700 delay-100 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin" /></div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Bookmarks */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookmarkCheck className="w-5 h-5 text-cyan-600" /> Bookmarked Articles ({bookmarks.length})
                  </h3>
                  {bookmarks.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                      <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No bookmarks yet. Bookmark articles from the public feed to save them here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookmarks.map((b) => (
                        <div key={b.id} className="flex gap-3 bg-white rounded-2xl border border-gray-100 p-3 group hover:shadow-md transition-all">
                          {b.image_url && <img src={b.image_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.category === 'KUCCPS' ? 'bg-blue-100 text-blue-600' : b.category === 'HELB' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{b.category}</span>
                            <h4 className="font-semibold text-gray-900 text-sm mt-1 line-clamp-2">{b.title}</h4>
                            <button onClick={() => deleteBookmark(b.id)} className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Private Notes */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-amber-500" /> My Notes ({notes.length})
                  </h3>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
                    <textarea
                      rows={3} value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write a private note about an article or update..."
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
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                      <StickyNote className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No notes yet. Add your first private note above.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((n) => (
                        <div key={n.id} className="bg-white rounded-2xl border border-gray-100 p-4 group">
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
            )}
          </div>
        ) : (
          /* ── Public Feed ── */
          <>
            {!user && (
              <div className={`mb-6 p-4 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center justify-between transition-all duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-600" /> Sign in to bookmark articles and access your private notes space.
                </p>
                <button onClick={() => onOpenAuth()} className="px-4 py-2 bg-cyan-500 text-white rounded-full text-sm font-semibold hover:bg-cyan-400 transition-colors">
                  Sign In
                </button>
              </div>
            )}

            {/* Featured Post */}
            <div className={`grid lg:grid-cols-2 gap-6 mb-6 transition-all duration-700 delay-100 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="group relative rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer lg:row-span-2">
                <div className="h-64 lg:h-80 overflow-hidden relative">
                  <img src={updates[0].image} alt={updates[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <button
                    onClick={() => toggleBookmark(updates[0])}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${isBookmarked(updates[0].title) ? 'bg-cyan-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
                  >
                    {isBookmarked(updates[0].title) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${updates[0].categoryColor}`}>
                      <Tag className="inline w-3 h-3 mr-1" />{updates[0].category}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{updates[0].date}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-cyan-600 transition-colors">{updates[0].title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{updates[0].excerpt}</p>
                  <button className="flex items-center gap-2 text-cyan-600 font-semibold text-sm group-hover:gap-3 transition-all">
                    Read More <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {updates.slice(1, 3).map((post) => (
                  <div key={post.id} className="group flex gap-4 bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer relative">
                    <div className="w-28 h-28 flex-shrink-0 overflow-hidden relative">
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(post); }}
                        className={`absolute top-1.5 right-1.5 p-1.5 rounded-full backdrop-blur-md transition-all ${isBookmarked(post.title) ? 'bg-cyan-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
                      >
                        {isBookmarked(post.title) ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="p-4 flex-1 min-w-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${post.categoryColor}`}>{post.category}</span>
                      <h3 className="text-sm font-bold text-gray-900 mt-2 mb-1 line-clamp-2 group-hover:text-cyan-600 transition-colors">{post.title}</h3>
                      <span className="text-xs text-gray-400">{post.date} &bull; {post.readTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {updates.slice(3).map((post) => (
                <div key={post.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="h-44 overflow-hidden relative">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(post); }}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${isBookmarked(post.title) ? 'bg-cyan-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
                    >
                      {isBookmarked(post.title) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${post.categoryColor}`}>{post.category}</span>
                      <span className="text-xs text-gray-400">{post.readTime}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-sm leading-snug group-hover:text-cyan-600 transition-colors">{post.title}</h3>
                    <p className="text-gray-400 text-xs line-clamp-2 mb-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{post.date}</span>
                      <button className="text-xs font-semibold text-cyan-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
