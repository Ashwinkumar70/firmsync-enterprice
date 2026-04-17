import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile, UserRole } from '../lib/types';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*, department:departments(*), company:companies(*)')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[AuthContext] Error fetching user profile:', error);
      return null;
    }
    console.log('[AuthContext] Fetched user profile:', data);
    return data as UserProfile;
  };

  const refreshUser = async () => {
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id);
      setUser(profile);
    }
  };

  useEffect(() => {
    let mounted = true;

    const syncUser = async (session: Session | null) => {
      if (!session?.user) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // If we already have this user profile, don't refetch
      if (user?.id === session.user.id) {
        if (mounted) setLoading(false);
        return;
      }

      const profile = await fetchUserProfile(session.user.id);
      if (mounted) {
        if (!profile) {
          console.warn('[AuthContext] Profile fetch returned null for user:', session.user.id);
        }
        setUser(profile);
        setLoading(false);
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        syncUser(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        syncUser(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      role: user?.role ?? null,
      loading,
      signIn,
      signOut,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
