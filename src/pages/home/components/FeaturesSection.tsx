import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: "ri-magic-line",
    title: "Describe your idea",
    description: "Just type what you want to build in plain English. No technical jargon, no wireframes. CreAIlity understands your vision instantly.",
    tag: "Natural Language",
    tagColor: "bg-accent-500/20 text-accent-400 border border-accent-500/30",
    accentColor: "text-accent-500",
  },
  {
    icon: "ri-code-s-slash-line",
    title: "Watch AI build it live",
    description: "See your app come to life in real time. CreAIlity writes clean, production-ready code right before your eyes — complete with components, routing, and data.",
    tag: "Live Coding",
    tagColor: "bg-secondary-500/20 text-secondary-400 border border-secondary-500/30",
    accentColor: "text-secondary-500",
  },
  {
    icon: "ri-refresh-line",
    title: "Iterate in seconds",
    description: "Ask for changes the same way you described the app. \"Make the nav sticky\", \"Add dark mode\", \"Show a loading skeleton\" — done instantly.",
    tag: "Instant Edits",
    tagColor: "bg-accent-500/20 text-accent-400 border border-accent-500/30",
    accentColor: "text-accent-500",
  },
];

function FeatureCard({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const isReversed = index % 2 === 1;

  return (
    <div ref={ref} className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${isReversed ? "lg:flex-row-reverse" : ""}`} style={{ transitionDelay: `${index * 80}ms` }}>
      <div className="flex-1 flex flex-col gap-5">
        <div className={`inline-flex items-center gap-2 text-xs font-medium rounded-full px-3 py-1.5 w-fit ${feature.tagColor}`}>
          <div className="w-4 h-4 flex items-center justify-center">
            <i className={`${feature.icon} text-sm`} />
          </div>
          {feature.tag}
        </div>
        <h3 className="font-heading text-3xl md:text-4xl font-bold leading-tight text-foreground-800">
          {feature.title}
        </h3>
        <p className="text-base text-foreground-500 leading-relaxed max-w-sm">
          {feature.description}
        </p>
        <a href="#hero" className="inline-flex items-center gap-2 text-sm font-medium text-foreground-800 border border-foreground-600/50 rounded-full px-4 py-2 w-fit hover:border-accent-400 hover:text-accent-500 hover:bg-accent-500/5 transition-colors cursor-pointer whitespace-nowrap mt-2">
          Try it now
          <div className="w-4 h-4 flex items-center justify-center">
            <i className="ri-arrow-right-line text-xs" />
          </div>
        </a>
      </div>
      <div className="flex-1 w-full">
        <div className="rounded-2xl border border-background-300/60 overflow-hidden bg-background-200/30 w-full h-[280px] md:h-[340px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-foreground-500">
            <div className="w-14 h-14 flex items-center justify-center">
              <i className={`${feature.icon} text-5xl ${feature.accentColor}/30`} />
            </div>
            <span className="text-xs text-foreground-600">{feature.tag} preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-xs font-medium text-accent-500 uppercase tracking-widest mb-4">How CreAIlity works</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">
              From your first prompt to a live app.
            </span>
          </h2>
        </div>
        <div className="flex flex-col gap-24 md:gap-32">
          {features.map((feature, i) => <FeatureCard key={feature.title} feature={feature} index={i} />)}
        </div>
      </div>
    </section>
  );
}