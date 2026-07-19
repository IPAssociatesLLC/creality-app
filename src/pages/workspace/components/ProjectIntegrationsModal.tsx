import { useState, useEffect } from "react";
import { getProjectIntegrations, saveProjectIntegrations } from "@/utils/projects-store";

export default function ProjectIntegrationsModal({ projectId, onClose }: { projectId: string | null; onClose: () => void }) {
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    getProjectIntegrations(projectId).then((i) => {
      if (!i) return;
      if (i.supabase) {
        setSupabaseUrl(i.supabase.url || "");
        setSupabaseKey(i.supabase.anonKey || "");
      }
    }).catch(() => {});
  }, [projectId]);

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    setMessage(null);
    const integrations = { supabase: { url: supabaseUrl.trim(), anonKey: supabaseKey.trim() } };
    const ok = await saveProjectIntegrations(projectId, integrations);
    setSaving(false);
    if (ok) {
      setMessage("Saved integrations.");
      setTimeout(() => onClose(), 800);
    } else {
      setMessage("Failed to save integrations.");
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background-100 rounded-2xl border border-background-300/60 p-6 w-full max-w-md z-70">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground-900">Project Integrations</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background-200/60"><i className="ri-close-line text-foreground-500 text-sm" /></button>
        </div>
        <p className="text-xs text-foreground-500 mb-3">Connect external services used by this project for preview and deployments.</p>

        <div className="mb-3">
          <label className="text-[10px] text-foreground-500 uppercase">Supabase URL</label>
          <input value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} placeholder="https://xxxx.supabase.co" className="mt-1 w-full text-sm px-3 py-2 border border-background-300/60 rounded-md bg-background-50" />
        </div>
        <div className="mb-3">
          <label className="text-[10px] text-foreground-500 uppercase">Supabase anon key</label>
          <input value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} placeholder="public-anon-key" className="mt-1 w-full text-sm px-3 py-2 border border-background-300/60 rounded-md bg-background-50" />
        </div>

        {message && <p className="text-[11px] text-foreground-600 mb-3">{message}</p>}

        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-foreground-400/15 text-foreground-800 rounded-xl px-4 py-2.5 hover:bg-foreground-400/25">{saving ? "Saving…" : "Save Integrations"}</button>
          <button onClick={onClose} className="flex-1 border border-background-300/60 rounded-xl px-4 py-2.5">Cancel</button>
        </div>
      </div>
    </div>
  );
}
