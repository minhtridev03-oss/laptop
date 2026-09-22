import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getStaffMembership } from '../services/adminService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staffMembership, setStaffMembership] = useState(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshStaffMembership = useCallback(async () => {
    if (!user?.id) {
      setStaffMembership(null);
      setStaffError(null);
      setStaffLoading(false);
      return null;
    }

    setStaffLoading(true);
    setStaffError(null);
    try {
      const membership = await getStaffMembership(user.id);
      setStaffMembership(membership);
      return membership;
    } catch (error) {
      setStaffMembership(null);
      setStaffError(error);
      return null;
    } finally {
      setStaffLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshStaffMembership();
  }, [refreshStaffMembership]);

  const value = useMemo(() => ({
    user,
    loading,
    staffMembership,
    staffLoading,
    staffError,
    isStaff: Boolean(staffMembership?.is_active && ['admin', 'staff'].includes(staffMembership.role)),
    refreshStaffMembership,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (fullName, email, password) => supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    }),
    sendPasswordReset: (email) => supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account?reset=1`,
    }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
    signOut: () => supabase.auth.signOut(),
  }), [loading, refreshStaffMembership, staffError, staffLoading, staffMembership, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
