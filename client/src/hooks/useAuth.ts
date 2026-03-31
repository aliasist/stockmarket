import { useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: number;
  email: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_seed: string | null;
  created_at: string;
  last_seen: string | null;
}

const TOKEN_KEY = "aliasist-token";
const USER_KEY = "aliasist-user";

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function storeAuth(token: string, user: AuthUser) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // storage unavailable
  }
}

function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // storage unavailable
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [loading, setLoading] = useState(true);

  // On mount: validate token against /api/auth/me
  useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setLoading(false);
      return;
    }
    fetch("./api/auth/me", {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (res.ok) {
          return res.json() as Promise<{ user: AuthUser }>;
        }
        throw new Error("Invalid token");
      })
      .then((data) => {
        setUser(data.user);
        setToken(storedToken);
        storeAuth(storedToken, data.user);
      })
      .catch(() => {
        clearAuth();
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const res = await fetch("./api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      throw new Error(data.error ?? "Login failed");
    }
    const data = await res.json() as { token: string; user: AuthUser };
    storeAuth(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (email: string, handle: string, password: string): Promise<void> => {
      const res = await fetch("./api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, handle, password }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Registration failed");
      }
      const data = await res.json() as { token: string; user: AuthUser };
      storeAuth(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    const storedToken = getStoredToken();
    if (storedToken) {
      try {
        await fetch("./api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${storedToken}` },
        });
      } catch {
        // silent
      }
    }
    clearAuth();
    setUser(null);
    setToken(null);
  }, []);

  return { user, token, loading, login, register, logout };
}
