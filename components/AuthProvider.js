import { createContext, useContext, useEffect, useState, useCallback } from 'react';

/**
 * Auth context shared across the client.
 *
 * On protected pages `initialUser` is provided by getServerSideProps (server
 * lookup), so no client fetch is needed there. On public pages we fetch
 * /api/auth/me in the background so the navbar can reflect login state.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children, initialUser }) {
  const [user, setUser] = useState(initialUser || null);
  const [loading, setLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    if (initialUser) return; // already hydrated from SSR
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      setUser(data.user || null);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [initialUser]);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      /* ignore */
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
