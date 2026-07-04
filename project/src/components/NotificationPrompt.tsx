import { useState, useEffect } from 'react';
import { Bell, X, Check, Volume2 } from 'lucide-react';
import { useNotifications, playNotificationSound } from '../hooks/useNotifications';

export default function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { subscribed, requestPermission } = useNotifications();

  useEffect(() => {
    // Show prompt after 5 seconds if not already subscribed and not dismissed
    const timer = setTimeout(() => {
      const wasDismissed = localStorage.getItem('ps_notification_prompt_dismissed');
      if (!subscribed && !wasDismissed && Notification.permission === 'default') {
        setShowPrompt(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [subscribed]);

  const handleEnable = async () => {
    await requestPermission();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ps_notification_prompt_dismissed', 'true');
  };

  const handleTestSound = () => {
    playNotificationSound();
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-in-up">
      <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">Stay Updated</span>
          </div>
          <button onClick={handleDismiss} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-300 text-sm mb-3">
            Enable notifications to receive exclusive offers, service updates, reminders, and success quotes!
          </p>

          {/* Test sound button */}
          <button
            onClick={handleTestSound}
            className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 mb-4 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" /> Test notification sound
          </button>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 border border-gray-600 text-gray-400 rounded-xl text-sm font-semibold hover:bg-gray-700/50 transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleEnable}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
            >
              <Check className="w-4 h-4" /> Enable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating notification bell for subscribed users
export function NotificationBell() {
  const { subscribed, sendQuote, disableNotifications } = useNotifications();
  const [open, setOpen] = useState(false);

  if (!subscribed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="absolute bottom-14 right-0 w-56 bg-[#1e293b] rounded-xl border border-cyan-500/30 shadow-xl p-3 animate-fade-in">
          <p className="text-gray-400 text-xs mb-3">Notification Settings</p>
          <div className="space-y-2">
            <button
              onClick={() => { sendQuote(); setOpen(false); }}
              className="w-full py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-semibold hover:bg-cyan-500/30 transition-colors"
            >
              Test Notification
            </button>
            <button
              onClick={() => { disableNotifications(); setOpen(false); }}
              className="w-full py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors"
            >
              Disable Notifications
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="relative w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:scale-110 transition-transform"
      >
        <Bell className="w-5 h-5 text-white" />
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0f172a] animate-pulse" />
      </button>
    </div>
  );
}
