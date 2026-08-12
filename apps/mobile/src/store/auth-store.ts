import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { api, configureApiAuth } from '@/api/client';
import { orderSocket } from '@/lib/order-socket';

export type User = { id: string; name: string; email: string; phone?: string; role: 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'ADMIN' };
type AuthResponse = { user: User; accessToken: string; refreshToken: string };
const REFRESH_KEY = 'terrasse_bleue_refresh_token';

async function readRefreshToken() {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(REFRESH_KEY) ?? null;
  return SecureStore.getItemAsync(REFRESH_KEY);
}

async function writeRefreshToken(token: string) {
  if (Platform.OS === 'web') globalThis.localStorage?.setItem(REFRESH_KEY, token);
  else await SecureStore.setItemAsync(REFRESH_KEY, token);
}

async function deleteRefreshToken() {
  if (Platform.OS === 'web') globalThis.localStorage?.removeItem(REFRESH_KEY);
  else await SecureStore.deleteItemAsync(REFRESH_KEY);
}

type AuthState = {
  user?: User;
  accessToken?: string;
  initialized: boolean;
  loading: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | undefined>;
};

async function persist(response: AuthResponse, set: (value: Partial<AuthState>) => void) {
  await writeRefreshToken(response.refreshToken);
  configureApiAuth(response.accessToken);
  orderSocket.configure(response.accessToken);
  set({ user: response.user, accessToken: response.accessToken });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  loading: false,
  bootstrap: async () => {
    configureApiAuth(undefined, get().refresh);
    await get().refresh();
    set({ initialized: true });
  },
  login: async (email, password) => {
    set({ loading: true });
    try { await persist(await api.post<AuthResponse>('/auth/login', { email, password }), set); }
    finally { set({ loading: false }); }
  },
  register: async (input) => {
    set({ loading: true });
    try { await persist(await api.post<AuthResponse>('/auth/register', input), set); }
    finally { set({ loading: false }); }
  },
  refresh: async () => {
    const refreshToken = await readRefreshToken();
    if (!refreshToken) return undefined;
    try {
      const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
      await persist(response, set);
      return response.accessToken;
    } catch {
      await deleteRefreshToken();
      orderSocket.disconnect();
      set({ user: undefined, accessToken: undefined });
      return undefined;
    }
  },
  logout: async () => {
    try { if (get().accessToken) await api.post('/auth/logout'); }
    finally {
      await deleteRefreshToken();
      configureApiAuth(undefined, get().refresh);
      orderSocket.disconnect();
      set({ user: undefined, accessToken: undefined });
    }
  },
}));
