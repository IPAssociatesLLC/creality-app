import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface HeroSectionProps {
  onImport?: () => void;
}

const tabs = [
  {
    id: "website",
    label: "Website",
    icon: "ri-global-line",
    placeholder: "Describe the website you want to build...",
    suggestions: [
      "A portfolio site for a freelance photographer",
      "A landing page for a SaaS product launch",
      "A restaurant website with online menu",
      "A real estate listing site with search",
    ],
  },
  {
    id: "webapp",
    label: "Web App",
    icon: "ri-dashboard-line",
    placeholder: "Describe the web app you want to build...",
    suggestions: [
      "A SaaS dashboard for tracking user metrics",
      "A project management tool like Linear",
      "An e-commerce store with Stripe payments",
      "A CRM for managing client relationships",
    ],
  },
  {
    id: "extension",
    label: "Extension",
    icon: "ri-puzzle-line",
    placeholder: "Describe the browser extension you want...",
    suggestions: [
      "A tab manager that groups tabs by topic",
      "A password manager with auto-fill",
      "A screenshot tool with annotation",
      "A dark mode toggle for any website",
    ],
  },
  {
    id: "import",
    label: "Import & Edit",
    icon: "ri-git-branch-line",
    placeholder: "Paste a GitHub URL or upload your project...",
    suggestions: [
      "Import from GitHub and add authentication",
      "Upload a React project and add a dashboard",
      "Clone a website and make it responsive",
      "Add a payment system to my existing code",
    ],
  },
];

function ScrollingSuggestion({ suggestions, onSelect }: { suggestions: string[]; onSelect: (s: string) => void }) {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % suggestions.length);
        setIsVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(timer);
  }, [suggestions.length]);

  return (
    <div className="flex items-center gap-2 px-5 pt-2 pb-1">
      <span className="text-[11px] text-white/20 font-medium shrink-0">Try:</span>
      <div className="relative overflow-hidden h-4 flex-1">
        <button
          onClick={() => onSelect(suggestions[index])}
          className={`text-[11px] text-white/30 hover:text-white/60 transition-all duration-300 text-left truncate cursor-pointer absolute inset-0 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}
        >
          {suggestions[index]}
        </button>
      </div>
    </div>
  );
}

export default function HeroSection({ onImport }: HeroSectionProps) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("website");
  const [focused, setFocused] = useState(false);

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  const handleBuild = useCallback(() => {
    if (!prompt.trim()) return;
    if (activeTab === "import" && onImport) {
      onImport();
      return;
    }
    navigate("/workspace");
  }, [prompt, activeTab, onImport, navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBuild();
    }
  }, [handleBuild]);

  const handleSuggestionClick = useCallback((s: string) => {
    setPrompt(s);
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setPrompt("");
  }, []);

  return (
    <section id="hero" className="relative bg-black min-h-[750px] md:min-h-[850px] lg:min-h-[900px] flex flex-col items-center justify-center pt-28 pb-20 px-4 overflow-hidden">

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center text-center">
        {/* Beta badge */}
        <div className="animate-fade-up opacity-0-initial mb-8 inline-flex items-center gap-2 border border-white/10 rounded-full px-4 py-2">
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-500 opacity-75" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-accent-500" />
          </span>
          <span className="text-xs text-white/60 font-medium">Now in public beta</span>
          <span className="text-xs text-white/40">—</span>
          <span className="text-xs text-white/80 font-semibold">Build your first app free</span>
        </div>

        {/* Headline */}
        <div className="animate-fade-up opacity-0-initial animate-delay-100 mb-5">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-none tracking-tight">
            Create anything...<br />
            with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/80">
              Cre
            </span>
            <span className="italic font-display text-cyan-400 font-black" style={{ fontStyle: "italic" }}>
              AI
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/80 to-white">
              lity!
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <p className="animate-fade-up opacity-0-initial animate-delay-200 text-base md:text-lg text-white/50 max-w-lg mx-auto mb-12 leading-relaxed">
          Describe your app in plain English. CreAIlity builds everything — fully functional, beautifully designed, ready to ship.
        </p>

        {/* Chat Box */}
        <div className={`animate-fade-up opacity-0-initial animate-delay-300 w-full max-w-2xl transition-all duration-300 ${focused ? "scale-[1.01]" : ""}`}>
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                  activeTab === tab.id
                    ? "bg-white/10 text-white border-white/20"
                    : "text-white/40 border-transparent hover:text-white/70 hover:bg-white/5 hover:border-white/10"
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className={tab.icon} />
                </div>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Card */}
          <div className={`rounded-2xl border border-white/10 bg-[#111] overflow-hidden transition-all duration-300 ${focused ? "ring-1 ring-white/20 border-white/20" : ""}`}>
            {/* Scrolling suggestion text */}
            <ScrollingSuggestion suggestions={currentTab.suggestions} onSelect={handleSuggestionClick} />

            {/* Input area */}
            <div className="flex items-start gap-3 px-5 pt-3 pb-4">
              <div className="w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                <i className="ri-sparkling-2-line text-white/40 text-sm" />
              </div>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={currentTab.placeholder}
                className="flex-1 resize-none bg-transparent text-sm text-white placeholder-white/30 outline-none leading-relaxed"
              />
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-5 pb-4 border-t border-white/10 pt-3">
              <div className="flex items-center gap-2">
                {["React", "Supabase", "Tailwind", "TypeScript"].map(tech => (
                  <span key={tech} className="hidden sm:inline-flex items-center gap-1 text-[11px] text-white/30 border border-white/10 px-2 py-0.5 rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {activeTab === "import" && (
                  <span className="text-[11px] text-white/30 hidden sm:inline">Import from GitHub</span>
                )}
                <button
                  onClick={handleBuild}
                  disabled={!prompt.trim()}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap bg-white text-black hover:bg-white/90 active:scale-95"
                >
                  {activeTab === "import" ? "Import" : "Build now"}
                  <i className="ri-send-plane-fill text-xs" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="animate-fade-up opacity-0-initial animate-delay-400 mt-5 flex flex-wrap justify-center gap-2">
          {currentTab.suggestions.map(s => (
            <button
              key={s}
              onClick={() => handleSuggestionClick(s)}
              className="text-xs text-white/40 border border-white/10 rounded-full px-3.5 py-1.5 hover:border-white/30 hover:text-white/70 transition-colors cursor-pointer whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="animate-fade-up opacity-0-initial animate-delay-500 mt-12 flex items-center gap-8 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-check-line text-accent-500 text-sm" />
            </div>
            No credit card
          </span>
          <span className="w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1.5">
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-check-line text-accent-500 text-sm" />
            </div>
            Ship in minutes
          </span>
          <span className="w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1.5">
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-check-line text-accent-500 text-sm" />
            </div>
            You own the code
          </span>
        </div>
      </div>
    </section>
  );
}