import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { UserPlan } from "@/utils/projects-store";
import { getUserPlan } from "@/utils/projects-store";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        setPlanLoading(true);
        getUserPlan().then(setPlan).finally(() => setPlanLoading(false));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        setPlanLoading(true);
        getUserPlan().then(setPlan).finally(() => setPlanLoading(false));
      } else {
        setPlan(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data?.user) {
      setPlanLoading(true);
      getUserPlan().then(setPlan).finally(() => setPlanLoading(false));
    }
    return { data, error };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPlan(null);
  }, []);

  return { user, session, loading, plan, planLoading, signIn, signUp, signOut };
}