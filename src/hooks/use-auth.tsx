'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { fetchUserAction } from '@/app/actions';


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
  const pathname = usePathname();

  const handleAuthStateChange = useCallback(async (fbUser: FirebaseUser | null) => {
    setLoading(true);
    if (fbUser) {
        // Always set firebaseUser and cookie first
        setFirebaseUser(fbUser);
        const token = await fbUser.getIdToken();
        Cookies.set('token', token, { secure: true, sameSite: 'strict' });
        Cookies.set('uid', fbUser.uid, { secure: true, sameSite: 'strict' });

        // Then, fetch the app user profile from our backend
        const appUser = await fetchUserAction(fbUser.uid, fbUser.email, fbUser.displayName);
        setUser(appUser);
        
        // Redirect if on a public page
        if (pathname === '/login' || pathname === '/rules') {
            router.push('/');
        }
    } else {
        // Clear all user state and cookies
        setFirebaseUser(null);
        setUser(null);
        Cookies.remove('token');
        Cookies.remove('uid');
        
        // Redirect to login if not on a public page
        if (pathname !== '/login' && pathname !== '/rules') {
            router.push('/login');
        }
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, router, pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
    return () => unsubscribe();
  }, [handleAuthStateChange]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    // onAuthStateChanged will handle the redirect and state cleanup
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
