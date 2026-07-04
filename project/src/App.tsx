import { useState, useEffect } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { useHashRoute } from './hooks/useHashRoute';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import WhyUs from './components/WhyUs';
import Process from './components/Process';
import Contact from './components/Contact';
import Donate from './components/Donate';
import Footer from './components/Footer';
import Admin from './components/Admin';
import AuthModal from './components/AuthModal';
import BookingModal from './components/BookingModal';
import UserDashboard from './components/UserDashboard';
import StandalonePage from './components/StandalonePage';
import Library from './components/Library';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import NotificationPrompt, { NotificationBell } from './components/NotificationPrompt';
import ForceUpdatePrompt from './components/ForceUpdatePrompt';
import { useNotifications } from './hooks/useNotifications';

function AppContent() {
  const route = useHashRoute();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingService, setBookingService] = useState<string | undefined>(undefined);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const { sendOffer } = useNotifications();

  useEffect(() => {
    const checkHash = () => setIsAdmin(window.location.hash === '#admin');
    checkHash();
    window.addEventListener('hashchange', checkHash);
    const onOpenBooking = () => openBooking();
    window.addEventListener('open-booking', onOpenBooking);
    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('open-booking', onOpenBooking);
    };
  }, []);

  // Register service worker and set up periodic quotes
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'DAILY_QUOTE') {
          sendOffer();
        }
      });
    }

    // Set up periodic offers/notifications (every 15 minutes when tab is visible)
    const offerInterval = setInterval(() => {
      if (!document.hidden) {
        // Check if user has enabled notifications
        const enabled = localStorage.getItem('ps_notifications_enabled');
        if (enabled === 'true') {
          sendOffer();
        }
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(offerInterval);
  }, [sendOffer]);

  const openAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const openBooking = (service?: string) => {
    setBookingService(service);
    setBookingOpen(true);
  };

  // Admin panel — full screen, no navbar
  if (isAdmin) return <Admin />;

  // Standalone pages
  if (route.name === 'library') {
    return (
      <AuthProvider>
        <StandalonePage title="Free World Library" subtitle="Powered by Project Gutenberg — millions of free books">
          <Library onOpenAuth={() => openAuth('signin')} />
        </StandalonePage>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
        <ForceUpdatePrompt />
      </AuthProvider>
    );
  }

  if (route.name === 'services') {
    return (
      <AuthProvider>
        <StandalonePage title="Our Services" subtitle="Professional solutions for students and professionals">
          <Services onBookNow={openBooking} />
        </StandalonePage>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
        <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} preselectedService={bookingService} />
        <ForceUpdatePrompt />
      </AuthProvider>
    );
  }

  if (route.name === 'why-us') {
    return (
      <AuthProvider>
        <StandalonePage title="Why Choose Us" subtitle="Trusted by thousands of Kenyan students">
          <WhyUs />
        </StandalonePage>
        <ForceUpdatePrompt />
      </AuthProvider>
    );
  }

  if (route.name === 'process') {
    return (
      <AuthProvider>
        <StandalonePage title="Our Process" subtitle="Simple, fast, and transparent">
          <Process />
        </StandalonePage>
        <ForceUpdatePrompt />
      </AuthProvider>
    );
  }

  if (route.name === 'contact') {
    return (
      <AuthProvider>
        <StandalonePage title="Contact Us" subtitle="Reach us on WhatsApp, phone, or email">
          <Contact />
        </StandalonePage>
        <ForceUpdatePrompt />
      </AuthProvider>
    );
  }

  if (route.name === 'donate') {
    return (
      <AuthProvider>
        <StandalonePage title="Donate" subtitle="Fuel a student's future">
          <Donate />
        </StandalonePage>
        <ForceUpdatePrompt />
      </AuthProvider>
    );
  }

  // Homepage
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <ForceUpdatePrompt />
        <Navbar
          onOpenAuth={() => openAuth('signin')}
          onOpenDashboard={() => setDashboardOpen(true)}
        />
        <Hero />
        <Services onBookNow={openBooking} />
        <WhyUs />
        <Process />
        <Donate />
        <Contact />
        <Footer />

        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
        <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} preselectedService={bookingService} />
        <UserDashboard open={dashboardOpen} onClose={() => setDashboardOpen(false)} onOpenAuth={() => openAuth('signin')} />
        <PWAInstallPrompt />
        <NotificationPrompt />
        <NotificationBell />
      </div>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
