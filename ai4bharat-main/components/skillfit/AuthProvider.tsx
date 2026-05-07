"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import { auth } from "@/firebase/client";
import { getAdminProfile } from "@/lib/skillfit";
import type { AdminProfile, AdminRole } from "@/types/skillfit";

type AuthCtx = {
  user: User | null;
  profile: AdminProfile | null;
  loading: boolean;
  login: (email: string, password: string, expectedRole: AdminRole) => Promise<AdminProfile>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

function setRoleCookie(profile: AdminProfile | null) {
  if (!profile) {
    document.cookie = "skillfit_role=; path=/; max-age=0";
    document.cookie = "skillfit_uid=; path=/; max-age=0";
    return;
  }
  document.cookie = `skillfit_role=${profile.role}; path=/; max-age=604800`;
  document.cookie = `skillfit_uid=${profile.uid}; path=/; max-age=604800`;
}

export function SkillfitAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser?.uid || !firebaseUser.email) {
        setProfile(null);
        setRoleCookie(null);
        setLoading(false);
        return;
      }
      const admin = await getAdminProfile(firebaseUser.uid);
      setProfile(admin);
      setRoleCookie(admin);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = useCallback(async (email: string, password: string, expectedRole: AdminRole) => {
    const creds = await signInWithEmailAndPassword(auth, email, password);
    const admin = await getAdminProfile(creds.user.uid);
    if (!admin) {
      await signOut(auth);
      throw new Error(
        "Admin profile not found in Firestore. Create an admins/{uid} document for this user with role 'ngo' or 'govt'."
      );
    }
    if (admin.role !== expectedRole) {
      await signOut(auth);
      throw new Error("This account does not have access for the selected role.");
    }
    setProfile(admin);
    setRoleCookie(admin);
    return admin;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
    setRoleCookie(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      login,
      logout,
    }),
    [user, profile, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSkillfitAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useSkillfitAuth must be used inside SkillfitAuthProvider");
  return ctx;
}
