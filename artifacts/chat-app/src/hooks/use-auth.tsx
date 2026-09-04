import { createContext, useContext, useEffect } from "react";
import { useGetMe, AuthUser, getGetMeQueryKey } from "@workspace/api-client-react";

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AVATAR_CURRENT_KEY = "pulse-my-avatar-current";
const AVATAR_HISTORY_KEY = "pulse-my-avatar-history";

function syncCurrentAvatar(avatarUrl?: string | null) {
  if (typeof window === "undefined" || !avatarUrl?.trim()) return;
  try {
    const current = avatarUrl.trim();
    const previous = localStorage.getItem(AVATAR_CURRENT_KEY);
    const raw = localStorage.getItem(AVATAR_HISTORY_KEY);
    const history: string[] = raw ? JSON.parse(raw) : [];
    if (previous && previous !== current) {
      const nextHistory = [previous, ...history]
        .filter((value, index, values) => Boolean(value) && values.indexOf(value) === index && value !== current)
        .slice(0, 5);
      localStorage.setItem(AVATAR_HISTORY_KEY, JSON.stringify(nextHistory));
    }
    localStorage.setItem(AVATAR_CURRENT_KEY, current);
    window.dispatchEvent(new CustomEvent("pulse-avatar-updated", { detail: { avatarUrl: current } }));
  } catch {
    // Avatar syncing is best-effort and must never block authentication.
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetMe({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      queryKey: getGetMeQueryKey(),
    },
  });

  useEffect(() => {
    if (user?.avatarUrl) syncCurrentAvatar(user.avatarUrl);
  }, [user?.avatarUrl]);

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
