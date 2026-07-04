import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Admin API proxy - calls edge function instead of direct RPC for security
export async function adminApi(action: 'login', payload: { password: string }): Promise<{ token?: string; error?: string }>;
export async function adminApi(action: 'verify', payload: { token: string }): Promise<{ valid?: boolean; error?: string }>;
export async function adminApi(action: 'logout', payload: { token: string }): Promise<{ success?: boolean; error?: string }>;
export async function adminApi(action: 'get_bookings', payload: { token: string }): Promise<{ bookings?: Booking[]; error?: string }>;
export async function adminApi(action: 'update_booking', payload: { token: string; bookingId: string; status: string; notes?: string }): Promise<{ success?: boolean; error?: string }>;
export async function adminApi(action: 'delete_booking', payload: { token: string; bookingId: string }): Promise<{ success?: boolean; error?: string }>;
export async function adminApi(action: 'change_password', payload: { token: string; newPassword: string }): Promise<{ success?: boolean; error?: string }>;
export async function adminApi(action: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(`${supabaseUrl}/functions/v1/admin-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  return response.json();
}

export type BookingStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  service: string;
  message: string | null;
  status: BookingStatus;
  admin_notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  amount: number;
  mpesa_code: string | null;
  note: string | null;
  status: 'pending' | 'confirmed';
  created_at: string;
}

export interface LibraryResource {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  resource_url: string | null;
  cover_image: string | null;
  created_at: string;
}

export interface LibrarySave {
  id: string;
  user_id: string;
  resource_id: string;
  saved_at: string;
}

export interface UpdateBookmark {
  id: string;
  user_id: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  image_url: string | null;
  bookmarked_at: string;
}

export interface PrivateNote {
  id: string;
  user_id: string;
  scope: 'library' | 'updates' | 'general';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  platform: string | null;
  last_seen_at: string;
  is_trusted: boolean;
  created_at: string;
}

export interface RecoveryCode {
  id: string;
  user_id: string;
  used: boolean;
  created_at: string;
  used_at: string | null;
}

export interface LibrarySaveRecord {
  id: string;
  user_id: string;
  resource_id: string;
  title: string | null;
  author: string | null;
  category: string | null;
  cover_image: string | null;
  resource_url: string | null;
  created_at: string;
}

export interface NotificationLogRecord {
  id: string;
  user_id: string;
  offer_id: string;
  created_at: string;
}

export interface SubscriberOfferRecord {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  active: boolean;
  created_at: string;
}
