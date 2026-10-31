"use client";

/**
 * Backend contract (any stack that follows it works):
 *   POST /register  {name,email,password,password_confirmation} -> 201 {user, token}
 *   POST /login     {email,password}                              -> 200 {user, token}
 *   GET  /me        (Bearer token)                                -> 200 {user}
 *   POST /logout    (Bearer token)                                -> 204
 *   Errors: 422 {message, errors:{field:[msg]}}  |  401 {message}  |  429 {message}
 */
import * as React from "react";

export type User = { id: number; name: string; email: string };
export type RegisterInput = { name: string; email: string; password: string; password_confirmation: string };

export class AuthError extends Error {
  fields: Record<string, string[]>;
  status: number;
  constructor(message: string, fields: Record<string, string[]> = {}, status = 0) {
    super(message);
    this.fields = fields;
    this.status = status;
  }
}

const TOKEN_KEY = "auth_token";

export function createAuthClient(baseUrl: string) {
  const read = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
  const write = (token: string | null) => {
    try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
  };

  async function call<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    const token = read();
    let res: Response;
    try {
      res = await fetch(baseUrl.replace(/\/$/, "") + path, {
        method,
        headers: {
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new AuthError("Can't reach the server. Check your connection and try again.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new AuthError(data.message ?? "Something went wrong. Try again.", data.errors ?? {}, res.status);
    return data as T;
  }

  return {
    hasToken: () => read() !== null,
    clear: () => write(null),
    async register(input: RegisterInput) {
      const r = await call<{ user: User; token: string }>("/register", "POST", input);
      write(r.token);
      return r.user;
    },
    async login(email: string, password: string) {
      const r = await call<{ user: User; token: string }>("/login", "POST", { email, password });
      write(r.token);
      return r.user;
    },
    async me() { return (await call<{ user: User }>("/me")).user; },
    async logout() { try { await call("/logout", "POST"); } finally { write(null); } },
  };
}

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ baseUrl, children }: { baseUrl: string; children: React.ReactNode }) {
  const client = React.useMemo(() => createAuthClient(baseUrl), [baseUrl]);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Restore the session on first load; an expired token is cleared silently.
  React.useEffect(() => {
    if (!client.hasToken()) { setLoading(false); return; }
    client.me().then(setUser).catch(() => client.clear()).finally(() => setLoading(false));
  }, [client]);

  const value = React.useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (email, password) => { const u = await client.login(email, password); setUser(u); return u; },
    register: async (input) => { const u = await client.register(input); setUser(u); return u; },
    logout: async () => { try { await client.logout(); } finally { setUser(null); } },
  }), [client, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
