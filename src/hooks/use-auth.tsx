'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { ensureUserExists } from '@/lib/data';


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
        // Force refresh to get custom claims if any.
        await fbUser.getIdToken(true);
        const idTokenResult = await fbUser.getIdTokenResult();
        // The role is stored in the custom claims. Default to 'technician' if not present.
        const userRole = (idTokenResult.claims.role || 'technician') as User['role'];
        
        setFirebaseUser(fbUser);
        
        // This function creates the user in firestore if it does not exist.
        // We pass the role from the token to be stored.
        const appUser = await ensureUserExists(fbUser.uid, fbUser.email, fbUser.displayName, userRole);
        
        // We set the final user object with the role from the token, which is the source of truth,
        // overriding whatever may be in the database document.
        setUser({ ...appUser, role: userRole });
        
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
