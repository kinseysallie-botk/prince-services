import type { Session, User } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));
export const ADMIN_PASSWORD = 'cyberhub2024';
export const LEGACY_ADMIN_PASSWORD = 'kimpetra04';

interface StoredRecord {
  [key: string]: unknown;
}

const FALLBACK_STATE_KEY = 'ps_fallback_state_v1';
const FALLBACK_STORAGE_PREFIX = 'ps_fallback_table_v1:';

function safeStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function readState() {
  const storage = safeStorage();
  if (!storage) return { currentUserId: null as string | null };
  try {
    const raw = storage.getItem(FALLBACK_STATE_KEY);
    return raw ? JSON.parse(raw) : { currentUserId: null };
  } catch {
    return { currentUserId: null };
  }
}

function writeState(state: Record<string, unknown>) {
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem(FALLBACK_STATE_KEY, JSON.stringify(state));
}

function getTableRows(table: string): StoredRecord[] {
  const storage = safeStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(`${FALLBACK_STORAGE_PREFIX}${table}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setTableRows(table: string, rows: StoredRecord[]) {
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem(`${FALLBACK_STORAGE_PREFIX}${table}`, JSON.stringify(rows));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSession(user: User) {
  return {
    access_token: `local-${user.id}`,
    token_type: 'bearer',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  } as Session;
}

class FallbackQuery {
  private filters: Array<{ column: string; value: unknown }> = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private selectedColumns: string | null = null;

  constructor(private table: string, private client: FallbackSupabaseClient) {}

  select(columns: string) {
    this.selectedColumns = columns;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false };
    return this;
  }

  async maybeSingle() {
    const rows = await this.execute();
    return { data: rows[0] ?? null, error: null };
  }

  async single() {
    const rows = await this.execute();
    return { data: rows[0] ?? null, error: null };
  }

  async insert(values: StoredRecord) {
    const rows = getTableRows(this.table);
    const item = {
      ...values,
      id: (values.id as string | undefined) || createId(this.table),
      created_at: (values.created_at as string | undefined) || new Date().toISOString(),
      updated_at: (values.updated_at as string | undefined) || new Date().toISOString(),
    };
    rows.push(item);
    setTableRows(this.table, rows);
    return { data: item, error: null };
  }

  async update(values: StoredRecord) {
    const rows = getTableRows(this.table);
    const updatedRows = rows.map((row) => {
      if (this.matches(row)) {
        return { ...row, ...values, updated_at: new Date().toISOString() };
      }
      return row;
    });
    setTableRows(this.table, updatedRows);
    return { data: updatedRows.filter((row) => this.matches(row)), error: null };
  }

  async delete() {
    const rows = getTableRows(this.table);
    const remainingRows = rows.filter((row) => !this.matches(row));
    setTableRows(this.table, remainingRows);
    return { data: null, error: null };
  }

  private async execute() {
    const rows = getTableRows(this.table);
    const filtered = rows.filter((row) => this.matches(row));
    const sorted = this.orderBy ? [...filtered].sort((a, b) => {
      const left = a[this.orderBy!.column];
      const right = b[this.orderBy!.column];
      if (left === right) return 0;
      const result = left > right ? 1 : -1;
      return this.orderBy!.ascending ? result : -result;
    }) : filtered;
    return sorted.map((row) => (this.selectedColumns ? row : row));
  }

  private matches(row: StoredRecord) {
    return this.filters.every(({ column, value }) => row[column] === value);
  }
}

class FallbackSupabaseClient {
  private listeners: Array<(event: string, session: Session | null) => void> = [];

  private emitAuthState(event: string, session: Session | null) {
    this.listeners.forEach((listener) => listener(event, session));
  }

  public auth = {
    getSession: async () => {
      const state = readState();
      const user = state.user ? (state.user as User) : null;
      return { data: { session: user ? createSession(user) : null } };
    },
    getUser: async () => {
      const state = readState();
      const user = state.user ? (state.user as User) : null;
      return { data: { user } };
    },
    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
      this.listeners.push(callback);
      const state = readState();
      if (state.user) callback('SIGNED_IN', createSession(state.user as User));
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.listeners = this.listeners.filter((listener) => listener !== callback);
            },
          },
        },
      };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const users = getTableRows('profiles');
      const match = users.find((row) => row.email === email && row.password === password);
      if (!match) return { data: { user: null }, error: { message: 'Invalid email or password' } };
      const user = {
        id: String(match.id),
        email: String(match.email),
        user_metadata: { full_name: match.full_name },
        app_metadata: {},
      } as User;
      const state = readState();
      state.currentUserId = user.id;
      state.user = user;
      writeState(state);
      this.emitAuthState('SIGNED_IN', createSession(user));
      return { data: { user }, error: null };
    },
    signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, unknown> } }) => {
      const users = getTableRows('profiles');
      if (users.some((row) => row.email === email)) {
        return { data: { user: null }, error: { message: 'An account with this email already exists.' } };
      }
      const user = {
        id: createId('user'),
        email,
        user_metadata: options?.data || {},
        app_metadata: {},
      } as User;
      const profile = {
        id: user.id,
        email,
        password,
        full_name: (options?.data?.full_name as string | undefined) || null,
        phone: (options?.data?.phone as string | undefined) || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTableRows('profiles', [...users, profile]);
      const state = readState();
      state.currentUserId = user.id;
      state.user = user;
      writeState(state);
      this.emitAuthState('SIGNED_IN', createSession(user));
      return { data: { user }, error: null };
    },
    signOut: async () => {
      const state = readState();
      state.currentUserId = null;
      state.user = null;
      writeState(state);
      this.emitAuthState('SIGNED_OUT', null);
      return { error: null };
    },
  };

  public storage = {
    from: (bucket: string) => ({
      getPublicUrl: (path: string) => ({ data: { publicUrl: path ? `https://example.com/${bucket}/${path}` : `https://example.com/${bucket}/avatar.png` } }),
      upload: async () => ({ data: { path: 'fallback' }, error: null }),
      remove: async () => ({ data: null, error: null }),
    }),
  };

  from(table: string) {
    return new FallbackQuery(table, this);
  }
}

export const supabase = new FallbackSupabaseClient();

function getStoredAdminPassword() {
  const storage = safeStorage();
  if (!storage) return null;
  return storage.getItem('ps_admin_password');
}

function setStoredAdminPassword(password: string) {
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem('ps_admin_password', password);
}

function isValidAdminToken(token: unknown) {
  return typeof token === 'string' && token.startsWith('local-admin-');
}

function getCurrentAdminPasswords() {
  const stored = getStoredAdminPassword();
  const passwords = [ADMIN_PASSWORD, LEGACY_ADMIN_PASSWORD];
  if (stored) passwords.unshift(stored);
  return new Set(passwords);
}

export async function adminApi(action: string, payload: Record<string, unknown>) {
  if (action === 'login') {
    const password = String(payload.password || '');
    const passwords = getCurrentAdminPasswords();
    const isValidAdminPassword = passwords.has(password);
    return isValidAdminPassword
      ? { token: `local-admin-${Date.now().toString(36)}` }
      : { error: 'Incorrect password. Please try again.' };
  }

  if (action === 'verify') {
    return { valid: isValidAdminToken(payload.token) };
  }

  if (action === 'logout') {
    return { success: true };
  }

  const requiresAdmin = ['get_bookings', 'update_booking', 'delete_booking', 'change_password', 'get_reports', 'update_report_status'];
  if (requiresAdmin.includes(action)) {
    if (!isValidAdminToken(payload.token)) {
      return { error: 'Invalid or expired admin session.' };
    }
  }

  if (action === 'get_bookings') {
    return { bookings: getTableRows('bookings') };
  }

  if (action === 'update_booking') {
    const rows = getTableRows('bookings');
    const updated = rows.map((row) => row.id === payload.bookingId ? { ...row, ...payload, updated_at: new Date().toISOString() } : row);
    setTableRows('bookings', updated);
    return { success: true };
  }

  if (action === 'delete_booking') {
    const rows = getTableRows('bookings');
    setTableRows('bookings', rows.filter((row) => row.id !== payload.bookingId));
    return { success: true };
  }

  if (action === 'change_password') {
    const newPassword = String(payload.newPassword || '').trim();
    if (!newPassword) return { error: 'Password must not be empty.' };
    setStoredAdminPassword(newPassword);
    return { success: true };
  }

  if (action === 'get_reports') {
    return { reports: getTableRows('issue_reports') };
  }

  if (action === 'submit_report') {
    const report = {
      id: createId('report'),
      name: payload.name || 'Anonymous',
      email: payload.email || null,
      subject: payload.subject || 'General issue',
      details: payload.details || '',
      created_at: new Date().toISOString(),
      status: 'new',
    };
    const rows = getTableRows('issue_reports');
    rows.push(report);
    setTableRows('issue_reports', rows);
    return { success: true, report };
  }

  if (action === 'update_report_status') {
    const rows = getTableRows('issue_reports');
    const updated = rows.map((row) => row.id === payload.reportId ? { ...row, status: payload.status, updated_at: new Date().toISOString() } : row);
    setTableRows('issue_reports', updated);
    return { success: true };
  }

  if (!isSupabaseConfigured) {
    return { error: 'Supabase is not configured for this deployment.' };
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/admin-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
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
