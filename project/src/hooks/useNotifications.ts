import { useState, useEffect, useCallback } from 'react';
import { supabase, NotificationLogRecord, SubscriberOfferRecord } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  link?: string;
}

interface SubscriberOffer {
  id: string;
  type: 'offer' | 'importance' | 'why_us' | 'donation' | 'quote';
  title: string;
  body: string;
  link: string | null;
}

const FALLBACK_QUOTES: NotificationData[] = [
  { title: "Keep Going!", body: "Success is not final, failure is not fatal. It is the courage to continue that counts." },
  { title: "You've Got This!", body: "Believe you can and you're halfway there. Keep pushing forward!" },
  { title: "Stay Focused", body: "The only way to do great work is to love what you do. Stay passionate!" },
  { title: "Dream Big", body: "Your limitation—it's only your imagination. Push your limits!" },
  { title: "Be Unstoppable", body: "Don't stop when you're tired. Stop when you're done!" },
];

// Play notification sound
export function playNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.setValueAtTime(1320, audioContext.currentTime + 0.05);
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, audioContext.currentTime + 0.05);
    gain2.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    osc2.start(audioContext.currentTime + 0.05);
    osc2.stop(audioContext.currentTime + 0.5);
  } catch {
    console.log('Audio not available');
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function showNotification(data: NotificationData): Notification | null {
  if (Notification.permission !== 'granted') return null;
  playNotificationSound();
  const notification = new Notification(data.title, {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'prince-services',
    renotify: true,
  });
  notification.onclick = () => {
    window.focus();
    if (data.link) {
      if (data.link.startsWith('#')) window.location.hash = data.link.slice(1);
      else window.location.href = data.link;
    }
    notification.close();
  };
  return notification;
}

// Fetch the next un-sent offer for the user (rotating through types)
async function fetchNextOffer(userId?: string): Promise<SubscriberOffer | null> {
  try {
    // If user is logged in, fetch offers they haven't seen yet
    if (userId) {
      const { data: sentOfferIds } = await supabase
        .from('notification_log')
        .select('offer_id')
        .eq('user_id', userId);

      const sentIds = (sentOfferIds || []).map((r: NotificationLogRecord) => r.offer_id);

      const query = supabase
        .from('subscriber_offers')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true });

      const { data: offers } = await query;

      if (offers && offers.length > 0) {
        // Filter out already-sent offers
        const unsent = offers.filter((o: SubscriberOfferRecord) => !sentIds.includes(o.id));
        // If all have been sent, reset and start over
        const pool = unsent.length > 0 ? unsent : offers;
        // Pick a random one from the pool for variety
        const offer = pool[Math.floor(Math.random() * pool.length)] as SubscriberOffer;

        // Log that we sent this offer
        await supabase.from('notification_log').insert({ user_id: userId, offer_id: offer.id });
        return offer;
      }
    } else {
      // Anonymous user — just fetch a random active offer
      const { data: offers } = await supabase
        .from('subscriber_offers')
        .select('*')
        .eq('active', true);

      if (offers && offers.length > 0) {
        return offers[Math.floor(Math.random() * offers.length)] as SubscriberOffer;
      }
    }
  } catch { /* non-critical */ }
  return null;
}

export function useNotifications() {
  const { user } = useAuth();
  const [permissionGranted, setPermissionGranted] = useState(Notification.permission === 'granted');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ps_notifications_enabled');
    if (saved === 'true' && Notification.permission === 'granted') {
      setSubscribed(true);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted) {
      localStorage.setItem('ps_notifications_enabled', 'true');
      setSubscribed(true);
      showNotification({
        title: 'Notifications Enabled!',
        body: 'You will now receive exclusive offers, service updates, and reminders.',
      });
    }
    return granted;
  }, []);

  const disableNotifications = useCallback(() => {
    localStorage.setItem('ps_notifications_enabled', 'false');
    setSubscribed(false);
  }, []);

  // Send the next rotating offer to the subscriber
  const sendOffer = useCallback(async (): Promise<Notification | null> => {
    if (!subscribed || Notification.permission !== 'granted') return null;
    const offer = await fetchNextOffer(user?.id);
    if (offer) {
      return showNotification({
        title: offer.title,
        body: offer.body,
        link: offer.link || undefined,
      });
    }
    // Fallback to quotes if no offers in DB
    const quote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    return showNotification(quote);
  }, [subscribed, user]);

  // Legacy: send a random success quote
  const sendQuote = useCallback(() => {
    if (subscribed && Notification.permission === 'granted') {
      const quote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
      return showNotification(quote);
    }
    return null;
  }, [subscribed]);

  const notify = useCallback((data: NotificationData) => {
    if (subscribed && Notification.permission === 'granted') {
      return showNotification(data);
    }
    return null;
  }, [subscribed]);

  return {
    permissionGranted,
    subscribed,
    requestPermission,
    disableNotifications,
    notify,
    sendQuote,
    sendOffer,
    playSound: playNotificationSound,
  };
}

// Store notification preferences in Supabase for persistence
export async function saveNotificationPreferences(userId: string, enabled: boolean, fcmToken?: string) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    notifications_enabled: enabled,
    fcm_token: fcmToken,
  });
  return !error;
}
