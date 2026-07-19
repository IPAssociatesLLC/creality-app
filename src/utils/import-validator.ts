export type ImportedFile = { name: string; content: string; language?: string };

export function validateImportedFiles(files: ImportedFile[]) {
  const skipNamePatterns: RegExp[] = [
    /^out\//i,
    /^dist\//i,
    /^build\//i,
    /^node_modules\//i,
    /^\.next\//i,
    /\.map$/i,
    /index-[a-z0-9]+\.js$/i,
  ];

  const filtered = files.filter((f) => {
    const name = f.name.replace(/^\/.*/, "");
    for (const p of skipNamePatterns) {
      if (p.test(name)) return false;
    }
    return true;
  });

  const warnings: string[] = [];

  if (filtered.length !== files.length) {
    warnings.push("Removed build artifacts or source maps (out/, dist/, build/, node_modules, .map files) from the import to keep the preview environment clean.");
  }

  // Content-based heuristics for things that likely won't work in the browser preview
  const suspectPatterns: { pattern: RegExp; message: string }[] = [
    { pattern: /createBrowserRouter\s*\(/i, message: "Detected React Router createBrowserRouter() calls which may require SSR or build-time hydration." },
    { pattern: /__reactRouterManifest|__reactRouterRouteModules/i, message: "Detected React Router manifest/SSR runtime which won't run in the simple sandbox." },
    { pattern: /require\(['\"]fs['\"]\)/i, message: "Detected Node 'fs' usage — server-side code cannot run in the browser." },
    { pattern: /process\.env\./i, message: "Detected process.env usage — environment variables may be missing in the sandbox." },
    { pattern: /import_meta_env|import\.meta\.env/i, message: "Detected import.meta.env usage — env replacements may be missing for preview." },
    { pattern: /module\.exports\s*=\s*/i, message: "Detected CommonJS exports — these files may be compiled output or server code." },
  ];

  for (const f of filtered) {
    const text = f.content || "";
    for (const s of suspectPatterns) {
      if (s.pattern.test(text)) {
        warnings.push(`${f.name}: ${s.message}`);
      }
    }
  }

  return { files: filtered, warnings };
}

export default validateImportedFiles;
