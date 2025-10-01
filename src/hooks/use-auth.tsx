'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getUserById, dbCreateUser } from '@/lib/data';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Force refresh the token to get custom claims.
        const token = await fbUser.getIdToken(true);
        Cookies.set('idToken', token);

        let appUser = await getUserById(fbUser.uid);
        if (!appUser) {
            console.log(`Creating user document for ${fbUser.uid}`);
            const role = fbUser.email === 'admin@canacontrol.com' ? 'admin' : 'technician';
            const name = fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuário';
            if (fbUser.email) {
              appUser = await dbCreateUser(fbUser.uid, fbUser.email, name, role);
            }
        }
        setUser(appUser || null);

      } else {
        Cookies.remove('idToken');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    Cookies.remove('idToken');
    setUser(null);
    setFirebaseUser(null);
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
