import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

/**
 * URL + publishable key : valeurs PUBLIQUES par design (protégées par RLS côté base).
 * Le mot de passe PostgreSQL n'apparaît jamais dans l'app.
 */
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://cuwtknywzfyvhuuvvrpd.supabase.co';
const SUPABASE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_ioLgdpuM5pBMNITCcoo-5g_nKReSxBU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: Platform.OS !== 'web' || typeof window !== 'undefined',
    detectSessionInUrl: false,
  },
});

export { SUPABASE_URL, SUPABASE_KEY };
