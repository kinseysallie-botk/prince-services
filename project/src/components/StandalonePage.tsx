import { ArrowLeft } from 'lucide-react';
import { navigate } from '../hooks/useHashRoute';

interface StandalonePageProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function StandalonePage({ title, subtitle, children }: StandalonePageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-gradient-to-r from-[#071524] to-[#0d2137] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate({ name: 'home' })}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">{title}</h1>
            {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </div>
    </div>
  );
}
