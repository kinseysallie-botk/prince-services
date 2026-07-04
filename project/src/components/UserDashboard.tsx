import { useState, useEffect, useCallback } from 'react';
import {
  User, Phone, Mail, Camera, Loader2, CheckCircle, Clock,
  AlertCircle, Calendar, Heart, FileText, LogOut, Edit2, Save,
  TrendingUp, ChevronRight, ArrowLeft, Smartphone, Shield,
  Trash2, KeyRound, Monitor, Copy, Plus,
} from 'lucide-react';
import { supabase, Booking, Donation, Profile, UserDevice, RecoveryCode } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useDevices } from '../hooks/useDevices';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserDashboardProps {
  open: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

type Tab = 'overview' | 'bookings' | 'donations' | 'profile' | 'devices';

const STATUS_META: Record<string, { label: string; tw: string; dot: string }> = {
  pending:     { label: 'Pending',     tw: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-400' },
  in_progress: { label: 'In Progress', tw: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-500' },
  completed:   { label: 'Completed',   tw: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  cancelled:   { label: 'Cancelled',   tw: 'bg-red-50 text-red-700 border-red-200',       dot: 'bg-red-400' },
};

export default function UserDashboard({ open, onClose, onOpenAuth }: UserDashboardProps) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [bk, dn] = await Promise.all([
      supabase.from('bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('donations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setBookings((bk.data as Booking[]) || []);
    setDonations((dn.data as Donation[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (open && user) fetchData();
  }, [open, user, fetchData]);

  if (!open) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
          <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-cyan-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-2">Sign in required</h3>
          <p className="text-gray-500 text-sm mb-6">Sign in to view your dashboard, track bookings, and manage your profile.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 text-sm">Cancel</button>
            <button onClick={() => { onClose(); onOpenAuth(); }} className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-sm">Sign In</button>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    inProgress: bookings.filter((b) => b.status === 'in_progress').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    donations: donations.length,
    donated: donations.reduce((sum, d) => sum + Number(d.amount), 0),
  };

  const openAdmin = () => {
    onClose();
    window.location.hash = 'admin';
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'bookings', label: 'My Bookings', icon: FileText },
    { id: 'donations', label: 'My Donations', icon: Heart },
    { id: 'devices', label: 'Devices', icon: Smartphone },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center">
      <div className="absolute inset-0 bg-slate-100" />
      <div className="relative w-full max-w-5xl bg-slate-50 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#071524] to-[#0d2137] sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
              <div>
                <h2 className="text-white font-bold text-base">My Account</h2>
                <p className="text-gray-400 text-xs">{profile?.full_name || user.email}</p>
              </div>
            </div>
            <button
              onClick={async () => { await signOut(); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
          {/* Tabs */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  tab === id ? 'border-cyan-400 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin" /></div>
          ) : tab === 'overview' ? (
            <OverviewTab stats={stats} bookings={bookings} setTab={setTab} onOpenAdmin={openAdmin} />
          ) : tab === 'bookings' ? (
            <BookingsTab bookings={bookings} />
          ) : tab === 'donations' ? (
            <DonationsTab donations={donations} />
          ) : tab === 'devices' ? (
            <DevicesTab />
          ) : (
            <ProfileTab profile={profile} user={user} refreshProfile={refreshProfile} />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ stats, bookings, setTab, onOpenAdmin }: {
  stats: { total: number; pending: number; inProgress: number; completed: number; donations: number; donated: number };
  bookings: Booking[]; setTab: (t: Tab) => void; onOpenAdmin: () => void;
}) {
  const cards = [
    { label: 'Total Bookings', value: stats.total, icon: FileText, color: 'text-cyan-700 bg-cyan-50', tab: 'bookings' as Tab },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-700 bg-amber-50', tab: 'bookings' as Tab },
    { label: 'In Progress', value: stats.inProgress, icon: AlertCircle, color: 'text-blue-700 bg-blue-50', tab: 'bookings' as Tab },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-700 bg-emerald-50', tab: 'bookings' as Tab },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, tab }) => (
          <button key={label} onClick={() => setTab(tab)} className="bg-white rounded-2xl p-5 border border-gray-100 text-left hover:shadow-md transition-all">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold text-gray-900">{value}</div>
            <div className="text-gray-500 text-xs font-medium mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      <button onClick={onOpenAdmin} className="w-full bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 flex items-center justify-between hover:shadow-md transition-all text-left">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <div className="font-bold text-white">Admin Panel</div>
            <div className="text-slate-300 text-sm">Open the secure admin dashboard for bookings and reports</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300" />
      </button>

      {/* Donations summary */}
      <button onClick={() => setTab('donations')} className="w-full bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-6 flex items-center justify-between hover:shadow-md transition-all text-left">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <div className="font-bold text-gray-900">Your Donations</div>
            <div className="text-gray-500 text-sm">{stats.donations} donation{stats.donations !== 1 ? 's' : ''} logged</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-rose-600">KSH {stats.donated.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total contributed</div>
        </div>
      </button>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Recent Bookings</h3>
          <button onClick={() => setTab('bookings')} className="text-cyan-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No bookings yet</p>
            <p className="text-gray-400 text-sm mt-1">Book a service to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 3).map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{b.service}</div>
                  <div className="text-gray-400 text-xs flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3 h-3" />{new Date(b.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_META[b.status].tw}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[b.status].dot}`} />
                  {STATUS_META[b.status].label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingsTab({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
        <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">No bookings yet</p>
        <p className="text-gray-400 text-sm mt-1">When you book a service, it will appear here for tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-bold text-gray-900">{b.service}</div>
              <div className="text-gray-400 text-xs mt-0.5">Ref: PS-{b.id.slice(0, 8).toUpperCase()}</div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_META[b.status].tw}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[b.status].dot}`} />
              {STATUS_META[b.status].label}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-500"><Phone className="w-3.5 h-3.5" />{b.phone}</div>
            <div className="flex items-center gap-2 text-gray-500"><Calendar className="w-3.5 h-3.5" />{new Date(b.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</div>
          </div>
          {b.message && <p className="text-gray-500 text-sm mt-3 bg-gray-50 rounded-xl p-3">{b.message}</p>}
          {b.admin_notes && (
            <div className="mt-3 p-3 bg-cyan-50 border border-cyan-100 rounded-xl">
              <p className="text-xs font-semibold text-cyan-700 mb-1">Admin Update</p>
              <p className="text-gray-600 text-sm">{b.admin_notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DonationsTab({ donations }: { donations: Donation[] }) {
  if (donations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
        <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">No donations logged yet</p>
        <p className="text-gray-400 text-sm mt-1">Log a donation via the Donate section to track your contributions here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {donations.map((d) => (
        <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <div className="font-bold text-gray-900">KSH {Number(d.amount).toLocaleString()}</div>
            {d.mpesa_code && <div className="text-gray-400 text-xs mt-0.5">M-Pesa: {d.mpesa_code}</div>}
            {d.note && <div className="text-gray-500 text-sm mt-1">{d.note}</div>}
            <div className="text-gray-400 text-xs mt-1">{new Date(d.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${d.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {d.status === 'confirmed' ? 'Confirmed' : 'Pending'}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProfileTab({ profile, user, refreshProfile }: {
  profile: Profile | null; user: SupabaseUser | null; refreshProfile: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setPhone(profile?.phone || '');
  }, [profile]);

  const formatPhone = (raw: string) => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('254')) digits = digits.slice(3);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    digits = digits.slice(0, 9);
    return `+254 ${digits.slice(0, 3)}${digits.slice(3, 6) ? ' ' + digits.slice(3, 6) : ''}${digits.slice(6, 9) ? ' ' + digits.slice(6, 9) : ''}`.trim();
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName, phone: phone, updated_at: new Date().toISOString() }).eq('id', user.id);
    setSaving(false);
    setEditing(false);
    setSaved(true);
    await refreshProfile();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.webp`]);
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!upErr) {
      await supabase.from('profiles').update({ avatar_path: path, updated_at: new Date().toISOString() }).eq('id', user.id);
      await refreshProfile();
    }
    setUploading(false);
  };

  const avatarUrl = profile?.avatar_path
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_path).data.publicUrl
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      {saved && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <p className="text-green-600 text-sm font-medium">Profile updated successfully!</p>
        </div>
      )}

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-md">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100">
              {uploading ? <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-gray-600" />}
              <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
            </label>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{profile?.full_name || 'Your Name'}</h3>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <p className="text-gray-400 text-xs mt-1">Click the camera icon to change your profile picture</p>
          </div>
        </div>
      </div>

      {/* Profile fields */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Profile Details</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-cyan-600 text-sm font-semibold hover:gap-2 transition-all">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setFullName(profile?.full_name || ''); setPhone(profile?.phone || ''); }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-xs font-bold disabled:opacity-60">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
            {editing ? (
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700"><User className="w-4 h-4 text-gray-400" />{profile?.full_name || 'Not set'}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700"><Mail className="w-4 h-4 text-gray-400" />{user?.email}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone (+254)</label>
            {editing ? (
              <input type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono" />
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700 font-mono"><Phone className="w-4 h-4 text-gray-400" />{profile?.phone || 'Not set'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Devices Tab ────────────────────────────────────────────────────────────────
function DevicesTab() {
  const { getDevices, removeDevice, toggleDeviceTrust, generateRecoveryCode, getRecoveryCodes } = useDevices();
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [codes, setCodes] = useState<RecoveryCode[]>([]);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    const [devs, rc] = await Promise.all([getDevices(), getRecoveryCodes()]);
    setDevices(devs);
    setCodes(rc);
    setLoading(false);
  }, [getDevices, getRecoveryCodes]);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this device? You will need to verify your identity if you log in from it again.')) return;
    const ok = await removeDevice(id);
    if (ok) setDevices(devices.filter((d) => d.id !== id));
  };

  const handleToggleTrust = async (id: string, current: boolean) => {
    const ok = await toggleDeviceTrust(id, !current);
    if (ok) setDevices(devices.map((d) => d.id === id ? { ...d, is_trusted: !current } : d));
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    const code = await generateRecoveryCode();
    setRecoveryCode(code);
    setGenerating(false);
    loadDevices();
  };

  const copyCode = () => {
    if (recoveryCode) {
      navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recovery Code Section */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-cyan-600" /> Recovery Code
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Generate a recovery code to verify your identity when logging in from a new device. Save it somewhere safe — it can only be used once.
        </p>

        {recoveryCode ? (
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Your recovery code:</span>
              <button onClick={copyCode} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:border-cyan-300 transition-all">
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="font-mono text-2xl font-bold tracking-[0.3em] text-cyan-700 bg-white rounded-xl py-4 px-6 text-center border border-cyan-100">
              {recoveryCode}
            </div>
            <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Write this down — it will not be shown again.
            </p>
          </div>
        ) : (
          <button
            onClick={handleGenerateCode}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-60"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Generate Recovery Code
          </button>
        )}

        {codes.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">Recovery code history:</p>
            <div className="space-y-1.5">
              {codes.map((c: RecoveryCode) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-xs">
                  <span className="text-gray-500">{new Date(c.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</span>
                  <span className={c.used ? 'text-gray-400' : 'text-green-600 font-semibold'}>
                    {c.used ? 'Used' : 'Available'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Registered Devices */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-cyan-600" /> Registered Devices ({devices.length})
        </h3>

        {devices.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
            <Monitor className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No devices registered yet. Your current device will be registered on your next login.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((d) => (
              <div key={d.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${d.is_trusted ? 'bg-green-100' : 'bg-amber-100'}`}>
                  <Smartphone className={`w-5 h-5 ${d.is_trusted ? 'text-green-600' : 'text-amber-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{d.device_name || 'Unknown device'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {d.platform} &bull; Last seen {new Date(d.last_seen_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleTrust(d.id, d.is_trusted)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      d.is_trusted
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                  >
                    {d.is_trusted ? 'Trusted' : 'Untrusted'}
                  </button>
                  <button
                    onClick={() => handleRemove(d.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove device"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-600">
            Trusted devices can log in without a recovery code. Untrusted or new devices will require a recovery code to verify your identity.
          </p>
        </div>
      </div>
    </div>
  );
}
