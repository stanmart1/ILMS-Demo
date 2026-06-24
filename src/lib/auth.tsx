import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { staffUsers, type StaffUser } from "./mock-data";

// Mock credentials: email = username, password = "library123" for all staff
const MOCK_PASSWORD = "library123";
const STORAGE_KEY = "athenaeum_user_id";

type AuthContextValue = {
  user: StaffUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (staffUsers.find((u) => u.id === stored) ?? null) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, user.id);
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login = (email: string, password: string): boolean => {
    if (password !== MOCK_PASSWORD) return false;
    const found = staffUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return false;
    setUser(found);
    return true;
  };

  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
