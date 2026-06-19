import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { ImportedFile } from "@/utils/projects-store";
import { listProjects, deleteProject, deleteVersion, formatRelativeTime, formatVersionTime, getVersions, type Project, type ProjectVersion } from "@/utils/projects-store";

interface SidebarProps {
  onGitHubImport: () => void;
  onUpload: () => void;
  currentProjectId: string | null;
  onNewProject: () => void;
  projectVersions: ProjectVersion[];
  activeVersionId: string | null;
  onRestoreVersion: (versionId: string) => void;
  onPreviewVersion: (versionId: string) => void;
  generatedCode: string | null;
  importedFiles: ImportedFile[];
  onFileSelect: (file: ImportedFile) => void;
  onShowGenerated: () => void;
  activeViewingFile: string | null;
}

interface TreeNode { name: string; type: "file" | "folder"; depth: number; children: TreeNode[]; file?: ImportedFile; }

function buildFileTree(files: ImportedFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    const parts = file.name.split("/");
    let currentLevel = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      if (isLast) { currentLevel.push({ name: part, type: "file", depth: i, children: [], file }); }
      else {
        let folder = currentLevel.find((n) => n.type === "folder" && n.name === part) as TreeNode | undefined;
        if (!folder) { folder = { name: part, type: "folder", depth: i, children: [] }; currentLevel.push(folder); }
        currentLevel = folder.children;
      }
    }
  }
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => { if (a.type !== b.type) return a.type === "folder" ? -1 : 1; return a.name.localeCompare(b.name); });
    for (const node of nodes) if (node.type === "folder") sortNodes(node.children);
  };
  sortNodes(root);
  return root;
}

function TreeNodeItem({ node, activeFile, onFileSelect }: { node: TreeNode; activeFile: string | null; onFileSelect: (file: ImportedFile) => void }) {
  const [open, setOpen] = useState(node.depth < 3);
  if (node.type === "file") {
    const isActive = activeFile === node.file?.name;
    return <button onClick={() => node.file && onFileSelect(node.file)} className={`w-full flex items-center gap-1.5 py-1 rounded-lg text-xs transition-colors cursor-pointer text-left ${isActive ? "bg-background-200/60 text-foreground-800 font-medium" : "text-foreground-600 hover:bg-background-200/40 hover:text-foreground-800"}`} style={{ paddingLeft: `${8 + node.depth * 12}px`, paddingRight: "8px" }}>
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0"><i className="ri-file-code-line text-xs text-foreground-500" /></div>
      <span className="truncate">{node.name}</span>
    </button>;
  }
  return <div>
    <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-1.5 py-1 rounded-lg text-xs text-foreground-600 hover:bg-background-200/60 hover:text-foreground-800 transition-colors cursor-pointer text-left" style={{ paddingLeft: `${8 + node.depth * 12}px`, paddingRight: "8px" }}>
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0"><i className={`${open ? "ri-folder-open-line text-accent-500" : "ri-folder-line text-foreground-500"} text-xs`} /></div>
      <span className="truncate">{node.name}</span>
      <div className="w-3 h-3 flex items-center justify-center ml-auto flex-shrink-0"><i className={`ri-arrow-right-s-line text-foreground-500 text-xs transition-transform ${open ? "rotate-90" : ""}`} /></div>
    </button>
    {open && <div>{node.children.map((child) => <TreeNodeItem key={child.type === "file" ? child.file?.name : child.name + child.depth} node={child} activeFile={activeFile} onFileSelect={onFileSelect} />)}</div>}
  </div>;
}

function FileTreeView({ generatedCode, importedFiles, onFileSelect, onShowGenerated, activeFile }: { generatedCode: string | null; importedFiles: ImportedFile[]; onFileSelect: (file: ImportedFile) => void; onShowGenerated: () => void; activeFile: string | null }) {
  const tree = useMemo(() => buildFileTree(importedFiles), [importedFiles]);
  if (!generatedCode && importedFiles.length === 0) return <div className="flex flex-col items-center justify-center py-10 px-4 text-center"><div className="w-10 h-10 flex items-center justify-center rounded-xl bg-background-200/60 mb-3"><i className="ri-file-code-line text-foreground-500 text-lg" /></div><p className="text-xs text-foreground-600 mb-1 leading-relaxed">No files yet</p><p className="text-[10px] text-foreground-600 leading-relaxed">Describe an app in the chat, import from GitHub, or upload a ZIP to populate files.</p></div>;
  return <div className="flex flex-col gap-0.5 px-1">
    {generatedCode && <button onClick={onShowGenerated} className={`w-full flex items-center gap-1.5 py-1 rounded-lg text-xs transition-colors cursor-pointer text-left ${activeFile === "generated" ? "bg-background-200/60 text-foreground-800 font-medium" : "text-foreground-600 hover:bg-background-200/40 hover:text-foreground-800"}`} style={{ paddingLeft: "8px", paddingRight: "8px" }}><div className="w-4 h-4 flex items-center justify-center flex-shrink-0"><i className="ri-file-code-line text-xs text-foreground-500" /></div><span className="truncate">index.html</span></button>}
    {importedFiles.length > 0 && <div className="mb-2 px-1"><span className="text-[10px] font-medium text-foreground-500 uppercase tracking-widest">{importedFiles.length} file{importedFiles.length !== 1 ? "s" : ""}</span></div>}
    {tree.map((node) => <TreeNodeItem key={node.type === "file" ? node.file?.name : node.name} node={node} activeFile={activeFile} onFileSelect={onFileSelect} />)}
  </div>;
}

type SidebarTab = "files" | "projects" | "versions";

function ProjectsList({ currentProjectId, onNewProject }: { currentProjectId: string | null; onNewProject: () => void }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    const list = await listProjects();
    setProjects(list);
    setLoading(false);
  };

  useEffect(() => { loadProjects(); }, [currentProjectId]);

  const handleOpen = (project: Project) => { navigate(`/workspace?id=${project.id}`); };
  const isEmptyProject = (project: Project): boolean => {
    return !project.generatedCode && (!project.conversationHistory || project.conversationHistory.length === 0) && (!project.importedFiles || project.importedFiles.length === 0);
  };
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      await deleteProject(id);
      // If the deleted project was the current one, navigate to workspace
      if (id === currentProjectId) {
        navigate("/workspace");
      }
      // Reload the project list
      await loadProjects();
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      // Auto-clear confirm after 5 seconds
      setTimeout(() => setDeleteConfirm(null), 5000);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-10"><div className="w-5 h-5 border-2 border-background-400 border-t-foreground-300 rounded-full animate-spin" /></div>;

  if (projects.length === 0) return <div className="flex flex-col items-center justify-center py-10 px-4 text-center"><div className="w-10 h-10 flex items-center justify-center rounded-xl bg-background-200/60 mb-3"><i className="ri-folder-open-line text-foreground-500 text-lg" /></div><p className="text-xs text-foreground-600 mb-3 leading-relaxed">No saved projects yet. Build something to save it automatically.</p><button onClick={onNewProject} className="text-xs text-accent-400 border border-accent-500/30 rounded-lg px-3 py-1.5 hover:bg-accent-500/10 transition-colors cursor-pointer whitespace-nowrap">Start new project</button></div>;

  return <div className="flex flex-col gap-1 px-1 py-1">
    <button onClick={onNewProject} className="w-full flex items-center gap-2 text-xs text-foreground-600 border border-dashed border-foreground-400/40 hover:border-foreground-500 hover:text-foreground-800 rounded-xl px-3 py-2 mb-1 transition-colors cursor-pointer"><div className="w-4 h-4 flex items-center justify-center"><i className="ri-add-line text-sm" /></div>New project</button>
    {projects.map((project) => {
      const isActive = project.id === currentProjectId;
      return <button key={project.id} onClick={() => handleOpen(project)} className={`w-full text-left group rounded-xl px-3 py-2.5 transition-colors cursor-pointer relative ${isActive ? "bg-background-200/70" : "hover:bg-background-200/30"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {project.generatedCode ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-foreground-600 flex-shrink-0" />}
              <span className={`text-xs font-medium truncate ${isActive ? "text-foreground-950" : "text-foreground-700"}`}>{project.name}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-foreground-600">
              <span>{formatRelativeTime(project.updatedAt)}</span>
              {project.conversationHistory.length > 0 && <><span>·</span><span>{Math.floor(project.conversationHistory.length / 2)} turns</span></>}
              {project.versions.length > 0 && <><span>·</span><span>{project.versions.length}v</span></>}
            </div>
          </div>
          <button onClick={(e) => handleDelete(e, project.id)} className={`flex-shrink-0 flex items-center gap-1 rounded-md transition-all cursor-pointer opacity-0 group-hover:opacity-100 ${deleteConfirm === project.id ? "bg-red-500 text-background-50 px-2 py-1 text-[10px] font-medium opacity-100" : "w-5 h-5 justify-center hover:bg-background-300/60 text-foreground-500"}`}>
            {deleteConfirm === project.id ? (
              <><i className="ri-alert-line text-[10px]" /> Confirm</>
            ) : (
              <i className="ri-delete-bin-line text-[10px]" />
            )}
          </button>
        </div>
      </button>;
    })}
  </div>;
}

function VersionsList({ versions, activeVersionId, onRestore, onPreview }: { versions: ProjectVersion[]; activeVersionId: string | null; onRestore: (id: string) => void; onPreview: (id: string) => void }) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  if (versions.length === 0) return <div className="flex flex-col items-center justify-center py-10 px-4 text-center"><div className="w-10 h-10 flex items-center justify-center rounded-xl bg-background-200/60 mb-3"><i className="ri-git-branch-line text-foreground-500 text-lg" /></div><p className="text-xs text-foreground-600 mb-1 leading-relaxed">No versions yet</p><p className="text-[10px] text-foreground-600 leading-relaxed">Each time the AI builds or updates your app, a restore point is saved automatically.</p></div>;
  const handleDelete = async (e: React.MouseEvent, vId: string) => {
    e.stopPropagation();
    if (deleteConfirm === vId) {
      await deleteVersion(versions[0]?.projectId || "", vId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(vId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };
  const handleRestore = (e: React.MouseEvent, version: ProjectVersion) => { e.stopPropagation(); if (restoreConfirm === version.id) { onRestore(version.id); setRestoreConfirm(null); } else { setRestoreConfirm(version.id); setTimeout(() => setRestoreConfirm(null), 4000); } };
  const handlePreview = (e: React.MouseEvent, version: ProjectVersion) => { e.stopPropagation(); if (previewingId === version.id) { setPreviewingId(null); onRestore(activeVersionId || ""); } else { setPreviewingId(version.id); onPreview(version.id); } };
  const currentVersionId = activeVersionId || versions[0]?.id;

  return <div className="flex flex-col gap-1.5 px-1 py-1">
    <div className="flex items-center gap-2 px-1 mb-0.5"><span className="text-[10px] font-medium text-foreground-600 uppercase tracking-widest">{versions.length} snapshot{versions.length !== 1 ? "s" : ""}</span><div className="flex-1 h-px bg-background-300/30" /></div>
    {versions.map((version, index) => {
      const isCurrent = version.id === currentVersionId;
      const isPreviewing = previewingId === version.id;
      return <div key={version.id} className={`group rounded-xl px-3 py-2.5 transition-colors relative ${isCurrent ? "bg-background-200/60" : "hover:bg-background-200/30"} ${isPreviewing ? "ring-1 ring-accent-500/40" : ""}`}>
        {index < versions.length - 1 && <div className="absolute left-[18px] top-9 bottom-0 w-px bg-background-300/30" />}
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 mt-1 relative"><span className={`w-2 h-2 rounded-full block ${isCurrent ? "bg-accent-500" : isPreviewing ? "bg-accent-400 ring-2 ring-accent-500/20" : "bg-foreground-600"}`} /></div>
          <div className="flex-1 min-w-0">
            {version.versionNumber && <span className="text-[9px] font-mono text-foreground-500 bg-background-200/60 border border-background-300/40 rounded px-1 py-0.5 mr-1.5">v{version.versionNumber}</span>}
            <p className={`text-xs leading-snug mb-0.5 line-clamp-2 inline ${isCurrent ? "text-foreground-800 font-medium" : "text-foreground-500"}`} title={version.label}>{version.label}</p>
            <div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] text-foreground-500">{formatVersionTime(version.timestamp)}</span></div>
          </div>
          {isCurrent && <span className="flex-shrink-0 text-[9px] bg-accent-500/15 text-accent-400 border border-accent-500/20 rounded-full px-1.5 py-0.5">active</span>}
          {isPreviewing && !isCurrent && <span className="flex-shrink-0 text-[9px] bg-accent-500/15 text-accent-400 border border-accent-500/20 rounded-full px-1.5 py-0.5">preview</span>}
        </div>
        <div className="flex items-center gap-1 mt-2 ml-[22px] opacity-0 group-hover:opacity-100 transition-opacity">
          {!isCurrent && <><button onClick={(e) => handlePreview(e, version)} className={`text-[10px] px-2 py-0.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${isPreviewing ? "bg-accent-500/20 text-accent-400" : "text-foreground-500 hover:text-foreground-800 hover:bg-background-200/60"}`}>{isPreviewing ? <span className="flex items-center gap-1"><i className="ri-eye-off-line text-[9px]" />Close</span> : <span className="flex items-center gap-1"><i className="ri-eye-line text-[9px]" />Preview</span>}</button><button onClick={(e) => handleRestore(e, version)} className={`text-[10px] px-2 py-0.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${restoreConfirm === version.id ? "bg-accent-500/20 text-accent-400" : "text-foreground-500 hover:text-accent-400 hover:bg-accent-500/10"}`}>{restoreConfirm === version.id ? <span className="flex items-center gap-1"><i className="ri-alert-line text-[9px]" />Confirm restore</span> : <span className="flex items-center gap-1"><i className="ri-arrow-go-back-line text-[9px]" />Restore</span>}</button></>}
          <button onClick={(e) => handleDelete(e, version.id)} className={`text-[10px] px-2 py-0.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ml-auto ${deleteConfirm === version.id ? "bg-red-500/20 text-red-400" : "text-foreground-500 hover:text-red-400 hover:bg-red-500/10"}`}>{deleteConfirm === version.id ? <span className="flex items-center gap-1"><i className="ri-alert-line text-[9px]" />Confirm</span> : <span className="flex items-center gap-1"><i className="ri-delete-bin-line text-[9px]" /></span>}</button>
        </div>
      </div>;
    })}
  </div>;
}

export default function Sidebar({ onGitHubImport, onUpload, currentProjectId, onNewProject, projectVersions, activeVersionId, onRestoreVersion, onPreviewVersion, generatedCode, importedFiles, onFileSelect, onShowGenerated, activeViewingFile }: SidebarProps) {
  const [tab, setTab] = useState<SidebarTab>("projects");
  return <aside className="flex flex-col h-full bg-background-50 overflow-hidden">
    <div className="flex-shrink-0 p-3 border-b border-background-200 flex flex-col gap-2">
      <button onClick={onGitHubImport} className="w-full flex items-center gap-2 text-xs text-foreground-600 bg-background-100 border border-foreground-400/40 rounded-lg px-3 py-2 hover:border-foreground-500 hover:text-foreground-800 hover:bg-background-200/60 transition-colors cursor-pointer"><div className="w-4 h-4 flex items-center justify-center flex-shrink-0"><i className="ri-github-line text-sm" /></div>Import from GitHub</button>
      <button onClick={onUpload} className="w-full flex items-center gap-2 text-xs text-foreground-600 bg-background-100 border border-foreground-400/40 rounded-lg px-3 py-2 hover:border-foreground-500 hover:text-foreground-800 hover:bg-background-200/60 transition-colors cursor-pointer"><div className="w-4 h-4 flex items-center justify-center flex-shrink-0"><i className="ri-upload-cloud-line text-sm" /></div>Upload project files</button>
    </div>
    <div className="flex-shrink-0 flex border-b border-background-200 px-2 pt-2 pb-0 gap-0.5">
      {(["projects", "files", "versions"] as SidebarTab[]).map((t) => <button key={t} onClick={() => setTab(t)} className={`flex-1 text-xs py-1.5 rounded-t-lg capitalize transition-colors cursor-pointer font-medium ${tab === t ? "text-foreground-800 border-b-2 border-foreground-400" : "text-foreground-600 hover:text-foreground-800"}`}>{t}{t === "versions" && projectVersions.length > 0 && <span className="ml-1 text-[9px] bg-accent-500/15 text-accent-400 rounded-full px-1 py-0.5">{projectVersions.length}</span>}</button>)}
    </div>
    <div className="flex-1 overflow-y-auto py-2 px-1">
      {tab === "projects" && <ProjectsList currentProjectId={currentProjectId} onNewProject={onNewProject} />}
      {tab === "files" && <FileTreeView generatedCode={generatedCode} importedFiles={importedFiles} onFileSelect={onFileSelect} onShowGenerated={onShowGenerated} activeFile={activeViewingFile} />}
      {tab === "versions" && <VersionsList versions={projectVersions} activeVersionId={activeVersionId} onRestore={onRestoreVersion} onPreview={onPreviewVersion} />}
    </div>
  </aside>;
}