'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { getUserById, ensureUserExists } from '@/lib/data';


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
        setFirebaseUser(fbUser);
        
        // Fetch user profile from Firestore using UID to get the role.
        // The source of truth for the user's role is the Firestore document.
        let appUser = await getUserById(fbUser.uid);

        // If user doesn't exist in Firestore, they can log in, but they won't have any roles.
        // The admin must create the user document in the database via the app's UI.
        // We can create a temporary user object so the app doesn't crash.
        if (!appUser) {
          // ensureUserExists will create the user if they don't exist, with a default role.
          // This is useful for the first user (admin) to be able to log in and create others.
           appUser = await ensureUserExists(fbUser.uid, fbUser.email, fbUser.displayName);
        }

        setUser(appUser);
        
        if (pathname === '/login' || pathname === '/rules') {
            router.push('/');
        }
    } else {
        setFirebaseUser(null);
        setUser(null);
        
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
