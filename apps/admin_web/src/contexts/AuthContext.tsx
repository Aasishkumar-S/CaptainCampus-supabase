import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '@captain-campus/shared_types';

export interface AuthContextValue {
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();

      const role = profileRow?.role || supabaseUser.user_metadata?.role || 'admin';

      const profile: UserProfile = {
        userId: supabaseUser.id,
        name: profileRow?.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Admin User',
        email: supabaseUser.email || '',
        role: role as any,
        studentId: profileRow?.student_id,
        preferredStopId: profileRow?.preferred_stop_id,
      };

      setUser(supabaseUser);
      setUserProfile(profile);
    } catch (err) {
      console.warn('Error fetching profile from Supabase:', err);
      // Fallback profile from user metadata
      setUser(supabaseUser);
      setUserProfile({
        userId: supabaseUser.id,
        name: supabaseUser.email?.split('@')[0] || 'Admin User',
        email: supabaseUser.email || '',
        role: 'admin',
      });
    }
  };

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user).finally(() => setIsLoading(false));
      } else {
        setUser(null);
        setUserProfile(null);
        setIsLoading(false);
      }
    });

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }
    } catch (err: any) {
      setIsLoading(false);
      const message = err?.message || 'Failed to sign in. Please check your credentials.';
      setError(message);
      throw new Error(message);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setError(null);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = useMemo(() => {
    return userProfile?.role === 'admin' || userProfile?.role === ('super_admin' as any);
  }, [userProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userProfile,
      isLoading,
      isAdmin,
      signIn,
      signOut,
      error,
    }),
    [user, userProfile, isLoading, isAdmin, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
