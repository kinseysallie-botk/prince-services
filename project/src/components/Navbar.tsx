import { useState, useEffect } from 'react';
import { GraduationCap, Heart, X, Menu, ExternalLink, Bell, LayoutGrid, Settings, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { navigate, type RouteName } from '../hooks/useHashRoute';

const navLinks: { label: string; route: RouteName }[] = [
  { label: 'Services', route: 'services' },
  { label: 'Why Us', route: 'why-us' },
  { label: 'Process', route: 'process' },
  { label: 'Contact', route: 'contact' },
  { label: 'Library', route: 'library' },
];

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenDashboard: () => void;
}

export default function Navbar({ onOpenAuth, onOpenDashboard }: NavbarProps) {
  const { user, profile } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showGroupBanner, setShowGroupBanner] = useState(true);
  const [accountMenu, setAccountMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (route: RouteName) => {
    setMobileOpen(false);
    setAccountMenu(false);
    navigate({ name: route });
  };

  const avatarUrl = profile?.avatar_path
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_path).data.publicUrl
    : null;

  const displayName = profile?.full_name
    ? profile.full_name.split(' ')[0]
    : user?.email?.split('@')[0] || 'Account';

  return (
    <>
      {/* WhatsApp Group Banner */}
      {showGroupBanner && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs py-2 px-4 flex items-center justify-center gap-3 relative">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0" />
          <span className="font-medium text-center">
            Join our KUCCPS &amp; HELB Updates Group 2026/2027 &mdash;{' '}
            <a
              href="https://chat.whatsapp.com/JdKso7FdIRG4rNGSAqyJ6c?s=cl&p=a&mlu=2"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold inline-flex items-center gap-1"
            >
              Join Now <ExternalLink className="w-3 h-3" />
            </a>
          </span>
          <button
            onClick={() => setShowGroupBanner(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <nav
        className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/98 backdrop-blur-md shadow-sm' : 'bg-white'
        } border-b border-slate-100`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-[68px] gap-4">

            {/* ── Logo ── */}
            <button
              onClick={() => go('home')}
              className="flex items-center gap-3 flex-shrink-0 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight text-left">
                <div className="font-extrabold text-gray-900 text-[15px] leading-none">Prince</div>
                <div className="font-extrabold text-gray-900 text-[15px] leading-none">Services</div>
                <div className="text-[8.5px] font-bold text-cyan-500 tracking-[0.15em] mt-0.5">PROFESSIONAL SOLUTIONS</div>
              </div>
            </button>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden lg:flex items-center flex-1 justify-center gap-1">
              {navLinks.map(({ label, route }) => (
                <button
                  key={label}
                  onClick={() => go(route)}
                  className="px-3.5 py-2 text-sm font-medium rounded-xl transition-all text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                >
                  {label}
                </button>
              ))}

              <button
                onClick={() => go('donate')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-500" /> Donate
              </button>
            </div>

            {/* ── Right Actions ── */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">

              {/* Bell with green dot */}
              <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white" />
              </button>

              {/* Dashboard or Sign In */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setAccountMenu(!accountMenu)}
                    className="flex items-center gap-2 pl-1.5 pr-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {displayName[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-bold truncate max-w-[90px]">Dashboard</span>
                  </button>

                  {accountMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setAccountMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20">
                        <div className="px-4 py-2 border-b border-gray-50 mb-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">{profile?.full_name || user.email}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <button onClick={() => { setAccountMenu(false); onOpenDashboard(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 transition-colors">
                          <LayoutGrid className="w-4 h-4 text-cyan-600" /> My Dashboard
                        </button>
                        <button onClick={() => { setAccountMenu(false); window.location.hash = 'admin'; }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 transition-colors">
                          <Settings className="w-4 h-4" /> Admin Panel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenDashboard}
                  className="flex items-center gap-2 pl-1.5 pr-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold">Dashboard</span>
                </button>
              )}

              <button
                onClick={() => { setAccountMenu(false); window.location.hash = 'admin'; }}
                className="flex items-center gap-2 pl-3 pr-4 py-2 bg-slate-900 text-white rounded-full shadow-md hover:bg-slate-800 hover:scale-[1.02] transition-all"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-bold">Admin Panel</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden ml-auto p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1 shadow-lg">
            {navLinks.map(({ label, route }) => (
              <button
                key={label}
                onClick={() => go(route)}
                className="block w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-colors text-gray-700 hover:text-cyan-600 hover:bg-cyan-50"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => go('donate')}
              className="block w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-colors text-rose-500 hover:bg-rose-50 flex items-center gap-2"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-400" /> Donate
            </button>
            <div className="pt-3 space-y-2 border-t border-gray-100">
              {user ? (
                <button onClick={() => { setMobileOpen(false); onOpenDashboard(); }} className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-full text-sm font-semibold">
                  My Dashboard
                </button>
              ) : (
                <button onClick={() => { setMobileOpen(false); onOpenAuth(); }} className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-full text-sm font-semibold">
                  Sign In
                </button>
              )}
              <button onClick={() => { setMobileOpen(false); window.location.hash = 'admin'; }}
                className="block w-full py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold text-center">
                Admin Panel
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
