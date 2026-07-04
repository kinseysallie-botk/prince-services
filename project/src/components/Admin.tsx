import { useState, useEffect, useCallback } from 'react';
import {
  Eye, Edit2, Trash2, CheckCircle, Clock, XCircle, AlertCircle,
  X, Save, ChevronDown, GraduationCap, BarChart3, RefreshCw,
  Search, Filter, MessageCircle, LogOut, Lock, TrendingUp,
  Phone, Mail, Calendar, Settings, Key, Shield, CalendarClock, Users, ArrowLeft,
} from 'lucide-react';
import { supabase, Booking, BookingStatus, adminApi } from '../lib/supabase';

// ─── Session Management ───────────────────────────────────────────────────────
const SESSION_KEY = 'ps_admin_token';
const getToken = () => sessionStorage.getItem(SESSION_KEY);
const setToken = (t: string) => sessionStorage.setItem(SESSION_KEY, t);
const clearToken = () => sessionStorage.removeItem(SESSION_KEY);

// ─── Status metadata ──────────────────────────────────────────────────────────
const STATUS_META: Record<BookingStatus, { label: string; tw: string; dot: string; icon: React.ElementType }> = {
  pending:     { label: 'Pending',     tw: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-400',  icon: Clock },
  in_progress: { label: 'In Progress', tw: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-500',   icon: AlertCircle },
  completed:   { label: 'Completed',   tw: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle },
  cancelled:   { label: 'Cancelled',   tw: 'bg-red-50 text-red-700 border-red-200',       dot: 'bg-red-400',    icon: XCircle },
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, tw, dot } = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${tw}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    const result = await adminApi('login', { password });
    setLoading(false);
    if (result.error || !result.token) {
      setError('Incorrect password. Please try again.');
      setPassword('');
    } else {
      setToken(result.token as string);
      onLogin(result.token as string);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060f1a] via-[#0d1f33] to-[#071524] flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #00d4c8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-extrabold text-base">Prince Services</div>
              <div className="text-gray-400 text-xs font-medium tracking-wide">ADMIN DASHBOARD</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h1 className="text-white font-extrabold text-2xl">Secure Login</h1>
            </div>
            <p className="text-gray-400 text-sm">Enter the admin password to access the dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">Admin Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-12 py-3.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/15 border border-red-500/25 rounded-xl">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
              ) : (
                <><Lock className="w-4 h-4" />Access Dashboard</>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => { window.location.hash = ''; }}
              className="text-gray-500 text-xs hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              ← Back to website
            </button>
            <span className="text-gray-700 text-xs">Password: cyberhub2024</span>
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs mt-4">
          Prince Services &copy; {new Date().getFullYear()} &bull; Secure Admin Access
        </p>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ booking, token, onClose, onSaved }: {
  booking: Booking; token: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [notes, setNotes] = useState(booking.admin_notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await adminApi('update_booking', {
      token, bookingId: booking.id, status, notes,
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#071524] to-[#0d2137] px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold">Edit Booking</h3>
            <p className="text-gray-400 text-xs mt-0.5">#{booking.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="p-6">
          {/* Client info summary */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { icon: GraduationCap, label: 'Client', value: booking.name },
              { icon: Phone, label: 'Phone', value: booking.phone },
              { icon: Settings, label: 'Service', value: booking.service },
              ...(booking.email ? [{ icon: Mail, label: 'Email', value: booking.email }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs font-medium">{label}</span>
                </div>
                <span className="text-gray-900 text-sm font-semibold">{value}</span>
              </div>
            ))}
          </div>

          {booking.message && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-5">
              <p className="text-gray-400 text-xs font-medium mb-1">Client Message</p>
              <p className="text-gray-700 text-sm">{booking.message}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BookingStatus)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white appearance-none pr-10"
                >
                  {Object.entries(STATUS_META).map(([val, { label }]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Admin Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes, action taken, follow-up needed..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-bold hover:shadow-md transition-all disabled:opacity-60"
            >
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ token, onClose }: { token: string; onClose: () => void }) {
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async () => {
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    if (newPw.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setSaving(true);
    const result = await adminApi('change_password', { token, newPassword: newPw });
    setSaving(false);
    if (result.success) setDone(true);
    else setError('Failed to update password. Please try again.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-600" />
            <h3 className="font-bold text-gray-900">Change Password</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        {done ? (
          <div className="text-center py-4">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="font-bold text-gray-900 mb-1">Password Updated!</p>
            <p className="text-gray-500 text-sm mb-4">Use your new password on next login.</p>
            <button onClick={onClose} className="px-6 py-2 bg-cyan-500 text-white rounded-xl font-semibold text-sm">Done</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 8 characters" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter password" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700">Cancel</button>
              <button onClick={handleChange} disabled={saving || !newPw || !confirmPw} className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-60">
                {saving ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function Admin() {
  const [token, setTokenState] = useState<string | null>(getToken);
  const [view, setView] = useState<'home' | 'bookings'>('home');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showChangePw, setShowChangePw] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');

  const fetchBookings = useCallback(async (tok: string) => {
    setLoading(true);
    const result = await adminApi('get_bookings', { token: tok });
    setLoading(false);
    if (result.error) {
      // session expired
      clearToken();
      setTokenState(null);
    } else {
      setBookings((result.bookings as Booking[]) || []);
    }
  }, []);

  useEffect(() => {
    if (token) fetchBookings(token);
  }, [token, fetchBookings]);

  const handleLogin = (tok: string) => setTokenState(tok);

  const handleLogout = async () => {
    if (token) await adminApi('logout', { token });
    clearToken();
    setTokenState(null);
    window.location.hash = '';
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    await adminApi('delete_booking', { token, bookingId: id });
    setDeleteConfirm(null);
    fetchBookings(token);
  };

  const handleQuickStatus = async (id: string, newStatus: BookingStatus) => {
    if (!token) return;
    await adminApi('update_booking', { token, bookingId: id, status: newStatus, notes: '' });
    fetchBookings(token);
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    in_progress: bookings.filter((b) => b.status === 'in_progress').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  // 4-square landing screen
  if (view === 'home') {
    const tiles = [
      { icon: CalendarClock, label: 'Bookings', desc: 'View & manage all customer bookings', color: 'from-cyan-400 to-blue-600', glow: 'shadow-cyan-200', count: stats.total, onClick: () => { setView('bookings'); fetchBookings(token); } },
      { icon: Users, label: 'Customers', desc: 'Manage user accounts & profiles', color: 'from-emerald-400 to-green-600', glow: 'shadow-emerald-200', count: 0, onClick: () => {} },
      { icon: BarChart3, label: 'Analytics', desc: 'Track performance & insights', color: 'from-amber-400 to-orange-600', glow: 'shadow-amber-200', count: stats.completed, onClick: () => {} },
      { icon: Settings, label: 'Settings', desc: 'Configure services & pricing', color: 'from-rose-400 to-pink-600', glow: 'shadow-rose-200', count: 0, onClick: () => {} },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 font-sans">
        {/* Top header */}
        <header className="bg-gradient-to-r from-[#060f1a] to-[#0d2137] border-b border-white/10 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-bold text-sm leading-none">Prince Services</div>
                <div className="text-gray-400 text-[10px] mt-0.5">ADMIN PANEL</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="#admin" onClick={() => setView('home')} className="text-gray-300 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Home</a>
              <button onClick={() => { clearToken(); setTokenState(null); }} className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <LogOut className="w-4 h-4" /> Exit
              </button>
            </div>
          </div>
        </header>

        {/* 4-square diamond layout */}
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] py-16 px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Admin Control Center</h1>
            <p className="text-gray-500 text-sm">Select a module to manage</p>
          </div>

          {/* Diamond: 2 squares top (offset), 2 squares bottom (offset) */}
          <div className="grid grid-cols-2 gap-x-20 gap-y-8">
            {tiles.map((tile) => (
              <button
                key={tile.label}
                onClick={tile.onClick}
                className="group relative w-44 h-44 sm:w-52 sm:h-52 bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-gray-100 hover:border-cyan-200 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center justify-center p-6"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tile.color} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                  <tile.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">{tile.label}</h3>
                <p className="text-gray-400 text-xs text-center leading-relaxed mb-2">{tile.desc}</p>
                {tile.count > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-bold">
                    {tile.count} active
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Bookings dashboard view

  const statusFiltered = activeTab === 'all' ? bookings : bookings.filter((b) => b.status === activeTab);

  const filtered = statusFiltered.filter((b) => {
    const q = search.toLowerCase();
    return !q || b.name.toLowerCase().includes(q) || b.phone.includes(q) ||
      b.service.toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q);
  });


  const fmt = (iso: string) => new Date(iso).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top header */}
      <header className="bg-gradient-to-r from-[#060f1a] to-[#0d2137] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-md">
              <GraduationCap className="w-4.5 h-4.5 text-white w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-extrabold text-sm">Prince Services</span>
              <span className="text-gray-500 text-xs ml-2">Admin Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-300 hover:text-white text-xs font-semibold transition-colors rounded-lg hover:bg-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={() => token && fetchBookings(token)}
              disabled={loading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : 'text-gray-400'}`} />
            </button>
            <button
              onClick={() => setShowChangePw(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Change Password"
            >
              <Key className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => window.location.hash = ''}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white text-xs transition-colors"
            >
              View Site
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Bookings Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage all client service bookings and enquiries</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Live &bull; Updated just now
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: BarChart3, gradient: 'from-slate-500 to-slate-700', text: 'text-slate-700', tab: 'all' as const },
            { label: 'Pending', value: stats.pending, icon: Clock, gradient: 'from-amber-400 to-orange-500', text: 'text-amber-700', tab: 'pending' as const },
            { label: 'In Progress', value: stats.in_progress, icon: TrendingUp, gradient: 'from-blue-400 to-cyan-500', text: 'text-blue-700', tab: 'in_progress' as const },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, gradient: 'from-emerald-400 to-green-500', text: 'text-emerald-700', tab: 'completed' as const },
            { label: 'Cancelled', value: stats.cancelled, icon: XCircle, gradient: 'from-rose-400 to-red-500', text: 'text-rose-700', tab: 'cancelled' as const },
          ].map(({ label, value, icon: Icon, gradient, text, tab }, i) => (
            <button
              key={label}
              onClick={() => setActiveTab(tab)}
              className={`group bg-white rounded-2xl p-5 border text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-count-up ${activeTab === tab ? 'border-cyan-300 ring-2 ring-cyan-100' : 'border-gray-100'}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 group-hover:scale-105 transition-transform origin-left">{value}</div>
              <div className={`text-xs font-semibold mt-0.5 ${text}`}>{label}</div>
            </button>
          ))}
        </div>

        {/* Search + filter bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, email or service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div className="relative flex-shrink-0">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white appearance-none"
              >
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_META).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
              {filtered.length} / {bookings.length} bookings
            </span>
          </div>
        </div>

        {/* Bookings list */}
        {loading && bookings.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No bookings found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="block lg:hidden space-y-3">
              {filtered.map((booking) => (
                <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-gray-900">{booking.name}</div>
                      <div className="text-gray-500 text-sm">{booking.phone}</div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="text-sm text-cyan-700 font-medium mb-1 bg-cyan-50 inline-block px-2 py-0.5 rounded-lg">{booking.service}</div>
                  <div className="text-xs text-gray-400 mb-3 flex items-center gap-1.5 mt-1.5">
                    <Calendar className="w-3 h-3" />{fmt(booking.created_at)}
                  </div>
                  <div className="flex gap-2">
                    <a href={`https://wa.me/${booking.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-bold text-center hover:bg-green-100 transition-colors flex items-center justify-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                    <button onClick={() => setEditBooking(booking)} className="flex-1 py-2 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-700 text-xs font-bold hover:bg-cyan-100 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => setDeleteConfirm(booking.id)} className="flex-1 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold hover:bg-red-100 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {['Date', 'Client', 'Service', 'Status', 'Notes', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                        <div>{new Date(booking.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</div>
                        <div>{new Date(booking.created_at).toLocaleTimeString('en-KE', { timeStyle: 'short' })}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">{booking.name}</div>
                        <div className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />{booking.phone}
                        </div>
                        {booking.email && <div className="text-gray-400 text-xs flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{booking.email}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="inline-block bg-cyan-50 text-cyan-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-cyan-100 max-w-[180px] truncate">
                          {booking.service}
                        </div>
                        {booking.message && <p className="text-gray-400 text-xs mt-1 line-clamp-1">{booking.message}</p>}
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={booking.status} /></td>
                      <td className="px-5 py-4 max-w-[160px]">
                        {booking.admin_notes
                          ? <p className="text-gray-500 text-xs line-clamp-2">{booking.admin_notes}</p>
                          : <span className="text-gray-300 text-xs italic">No notes</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          {/* Quick status: Complete */}
                          {booking.status !== 'completed' && (
                            <button
                              onClick={() => handleQuickStatus(booking.id, 'completed')}
                              className="p-1.5 hover:bg-emerald-50 rounded-lg transition-all hover:scale-110 group/quick"
                              title="Mark as Completed"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-500 group-hover/quick:scale-110" />
                            </button>
                          )}
                          {/* Quick status: In Progress */}
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleQuickStatus(booking.id, 'in_progress')}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-all hover:scale-110 group/quick"
                              title="Mark as In Progress"
                            >
                              <TrendingUp className="w-4 h-4 text-blue-500" />
                            </button>
                          )}
                          {/* Quick status: Cancel */}
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <button
                              onClick={() => handleQuickStatus(booking.id, 'cancelled')}
                              className="p-1.5 hover:bg-rose-50 rounded-lg transition-all hover:scale-110 group/quick"
                              title="Cancel Booking"
                            >
                              <XCircle className="w-4 h-4 text-rose-400" />
                            </button>
                          )}
                          <div className="w-px h-5 bg-gray-200 mx-0.5" />
                          <a
                            href={`https://wa.me/${booking.phone.replace(/\D/g,'')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="p-1.5 hover:bg-green-50 rounded-lg transition-all hover:scale-110" title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 text-green-600" />
                          </a>
                          <button onClick={() => setViewBooking(booking)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all hover:scale-110" title="View">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => setEditBooking(booking)} className="p-1.5 hover:bg-cyan-50 rounded-lg transition-all hover:scale-110" title="Edit">
                            <Edit2 className="w-4 h-4 text-cyan-600" />
                          </button>
                          <button onClick={() => setDeleteConfirm(booking.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-all hover:scale-110" title="Delete">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* View Modal */}
      {viewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewBooking(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-[#071524] to-[#0d2137] px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">Booking Details</h3>
                <p className="text-gray-400 text-xs">Ref: #{viewBooking.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button onClick={() => setViewBooking(null)} className="p-1.5 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-gray-300" /></button>
            </div>
            <div className="p-5 space-y-2.5">
              {[
                ['Client Name', viewBooking.name],
                ['Phone', viewBooking.phone],
                ['Email', viewBooking.email || 'Not provided'],
                ['Service', viewBooking.service],
                ['Message', viewBooking.message || 'None'],
                ['Admin Notes', viewBooking.admin_notes || 'None'],
                ['Submitted', fmt(viewBooking.created_at)],
              ].map(([k, v]) => (
                <div key={k as string} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-400 text-xs font-semibold w-28 flex-shrink-0 pt-0.5">{k}</span>
                  <span className="text-gray-800 text-sm">{v}</span>
                </div>
              ))}
              <div className="flex gap-3 py-2">
                <span className="text-gray-400 text-xs font-semibold w-28 flex-shrink-0 pt-1">Status</span>
                <StatusBadge status={viewBooking.status} />
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <a
                href={`https://wa.me/${viewBooking.phone.replace(/\D/g,'')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp Client
              </a>
              <button
                onClick={() => { setViewBooking(null); setEditBooking(viewBooking); }}
                className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-bold"
              >
                Edit Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editBooking && token && (
        <EditModal
          booking={editBooking}
          token={token}
          onClose={() => setEditBooking(null)}
          onSaved={() => fetchBookings(token)}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-2">Delete Booking?</h3>
            <p className="text-gray-500 text-sm mb-5">This action is permanent and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePw && token && (
        <ChangePasswordModal token={token} onClose={() => setShowChangePw(false)} />
      )}
    </div>
  );
}
