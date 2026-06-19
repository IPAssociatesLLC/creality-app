import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth", { replace: true }); return; }

      const { data } = await supabase
        .from("user_plans")
        .select("is_admin")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (data?.is_admin) {
        setIsAdmin(true);
      } else {
        navigate("/workspace", { replace: true });
      }
    }
    check();
    return () => { cancelled = true; };
  }, [navigate]);

  if (isAdmin === null) {
    return (
      <div className="h-screen bg-background-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}	