'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getUserById } from '@/lib/data';
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const router = useRouter();

  const handleUserAuth = useCallback(async (fbUser: FirebaseUser | null) => {
    setFirebaseUser(fbUser);
    if (fbUser) {
      // Force refresh the token to get custom claims set by the server.
      // This is crucial for the security rules to work correctly.
      const token = await fbUser.getIdToken(true);
      Cookies.set('idToken', token);

      // The getUserById function (which runs on the server)
      // can now create the user document if it's missing.
      const appUser = await getUserById(fbUser.uid);
      setUser(appUser || null);

    } else {
      // Clear user data and token on sign out
      Cookies.remove('idToken');
      setUser(null);
    }
    setLoading(false);
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUserAuth);
    return () => unsubscribe();
  }, [auth, handleUserAuth]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    // State will be cleared by the onAuthStateChanged listener
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
