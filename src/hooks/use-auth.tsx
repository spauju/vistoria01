'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        const token = await fbUser.getIdToken(true);
        Cookies.set('idToken', token, { secure: true, sameSite: 'strict' });
        
        // Use a server action to fetch user data securely
        const appUser = await fetchUserAction(fbUser.uid);
        setUser(appUser || null);

        if (pathname === '/login' || pathname === '/rules') {
            router.push('/');
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        Cookies.remove('idToken');
        if (pathname !== '/login' && pathname !== '/rules') {
            router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, router]);

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
