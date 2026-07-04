import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { UserDevice } from '../lib/supabase';

function generateFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() || '0',
    navigator.platform || 'unknown',
  ];
  const raw = components.join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `fp_${Math.abs(hash).toString(36)}_${raw.length.toString(36)}`;
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  let browser = 'Browser';
  if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';

  let os = 'Device';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  return `${browser} on ${os}${isMobile ? ' (Mobile)' : ''}`;
}

function getPlatform(): string {
  return navigator.platform || navigator.userAgentData?.platform || 'unknown';
}

export function useDevices() {
  const registerCurrentDevice = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fingerprint = generateFingerprint();
    const deviceName = getDeviceName();
    const platform = getPlatform();

    try {
      const { data: existing } = await supabase
        .from('user_devices')
        .select('id')
        .eq('user_id', user.id)
        .eq('device_fingerprint', fingerprint)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_devices')
          .update({ last_seen_at: new Date().toISOString(), device_name: deviceName, platform })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_devices')
          .insert({ user_id: user.id, device_fingerprint: fingerprint, device_name: deviceName, platform });
      }
    } catch {
      // Non-critical — device tracking is best-effort
    }
  }, []);

  const getDevices = useCallback(async (): Promise<UserDevice[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', user.id)
      .order('last_seen_at', { ascending: false });
    return (data as UserDevice[]) || [];
  }, []);

  const removeDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('id', deviceId);
    return !error;
  }, []);

  const toggleDeviceTrust = useCallback(async (deviceId: string, trusted: boolean): Promise<boolean> => {
    const { error } = await supabase
      .from('user_devices')
      .update({ is_trusted: trusted })
      .eq('id', deviceId);
    return !error;
  }, []);

  const generateRecoveryCode = useCallback(async (): Promise<string | null> => {
    const { data, error } = await supabase.rpc('generate_recovery_code');
    if (error || !data) return null;
    return data as string;
  }, []);

  const verifyRecoveryCode = useCallback(async (code: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('verify_recovery_code', { p_code: code.trim().toUpperCase() });
    if (error || !data) return false;
    return data as boolean;
  }, []);

  const getRecoveryCodes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('recovery_codes')
      .select('id, used, created_at, used_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return data || [];
  }, []);

  return {
    registerCurrentDevice,
    getDevices,
    removeDevice,
    toggleDeviceTrust,
    generateRecoveryCode,
    verifyRecoveryCode,
    getRecoveryCodes,
  };
}
