import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface UpdateMessage {
  type: string;
  version: string;
  message: string;
}

export default function ForceUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateMessage | null>(null);

  useEffect(() => {
    // Listen for service worker messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data as UpdateMessage;
      if (data && data.type === 'FORCE_UPDATE') {
        setUpdateInfo(data);
        setShowPrompt(true);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    // Check for controller change (new SW activated)
    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      setShowPrompt(true);
      setUpdateInfo({
        type: 'FORCE_UPDATE',
        version: 'new',
        message: 'A new version is ready! Click refresh to apply updates.',
      });
    });

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const handleRefresh = () => {
    // Clear all caches and reload
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] animate-slide-in-down">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center animate-pulse">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm">Update Available</p>
              <p className="text-cyan-100 text-xs">{updateInfo?.message || 'New features are ready!'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white text-cyan-600 rounded-lg font-bold text-sm hover:bg-cyan-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Now
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
