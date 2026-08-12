"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, clearSession, restoreSession, storeSession } from "@/lib/api";
import type { AuthResponse, User } from "@/lib/types";

type AuthContextValue = {
  user?: User;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: true },
  },
});

function isRestaurantRole(user: User) {
  return (
    user.role === "ADMIN" || user.role === "MANAGER" || user.role === "STAFF"
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>();
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    void restoreSession()
      .then((restored) => {
        if (restored && isRestaurantRole(restored)) setUser(restored);
        else clearSession();
      })
      .finally(() => setInitialized(true));
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    if (!isRestaurantRole(response.user)) {
      clearSession();
      throw new Error(
        "Ce compte client ne peut pas accéder à l’espace restaurant.",
      );
    }
    storeSession(response);
    setUser(response.user);
  }, []);
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearSession();
      setUser(undefined);
      queryClient.clear();
    }
  }, []);
  const value = useMemo(
    () => ({ user, initialized, login, logout }),
    [user, initialized, login, logout],
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth doit être utilisé dans Providers.");
  return value;
}
