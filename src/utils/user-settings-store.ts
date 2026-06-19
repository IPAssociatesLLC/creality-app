import { supabase } from "@/lib/supabase";

export interface UserSettings {
  display_name?: string;
  font_scale?: string;
  selected_model?: Record<string, unknown>;
  deploy_config?: Record<string, unknown>;
}

export async function loadUserSettings(): Promise<UserSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return {};

  return {
    display_name: (data as Record<string, unknown>).display_name as string | undefined,
    font_scale: (data as Record<string, unknown>).font_scale as string | undefined,
    selected_model: (data as Record<string, unknown>).selected_model as Record<string, unknown> | undefined,
    deploy_config: (data as Record<string, unknown>).deploy_config as Record<string, unknown> | undefined,
  };
}

export async function saveUserSetting(key: string, value: unknown): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const update: Record<string, unknown> = { [key]: value, updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, ...update }, { onConflict: "user_id" });

  if (error) console.warn("CreAIlity: failed to save user setting", error);
}