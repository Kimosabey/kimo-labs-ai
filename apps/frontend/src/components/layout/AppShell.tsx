"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Database, Brain, PanelLeft,
  Settings, MessageSquare, History, Menu, User, Mic, Volume2, LayoutGrid, Terminal, Activity, ShieldCheck, Cpu
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [models, setModels] = useState<{ name: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState("llama3");
  const [health, setHealth] = useState<any>(null);
  const pathname = usePathname();

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/health`);
        if (res.ok) setHealth(await res.json());
      } catch (err) {
        setHealth({ nodes: { backend: "offline", ollama: "offline", chromadb: "offline", sqlite: "offline" } });
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, [API_URL]);

  useEffect(() => {
    const checkSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(`${API_URL}/models`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setModels(data.models || []);
      } catch (err) {
        setModels([{ name: "Llama-3-Offline" }]);
      }
    };
    fetchModels();
  }, [API_URL]);

  const navItems = [
    { icon: LayoutGrid, label: "Mission Control", href: "/" },
    { icon: MessageSquare, label: "Agentic Hub", href: "/chat" },
    { icon: Mic, label: "Speech Lab", href: "/asr" },
    { icon: Volume2, label: "Voice Studio", href: "/tts" },
    { icon: Database, label: "Vector Index", href: "/vectors" },
  ];

  return (
    <div className="flex w-full h-screen bg-background text-foreground font-sans overflow-hidden selection:bg-primary/30">
      
      {/* HUD Background Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
      </div>

      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={isMobile ? { x: -300 } : { width: 0, opacity: 0 }}
            animate={isMobile ? { x: 0 } : { width: 320, opacity: 1 }}
            exit={isMobile ? { x: -300 } : { width: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "h-full border-r border-border glass-panel flex flex-col shrink-0 overflow-hidden relative z-40",
              isMobile && "fixed left-0 top-0 shadow-2xl"
            )}
          >
            {/* Logo Section */}
            <div className="p-8 flex items-center gap-4 h-[100px] shrink-0">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] group cursor-pointer hover:rotate-6 transition-transform">
                <Brain size={24} className="text-white text-glow" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-black tracking-tight leading-none mb-1 uppercase italic">KIMO LABS</h2>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40 animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  <p className="text-[10px] font-black tracking-[0.25em] uppercase text-muted-foreground italic">Research Node v3.0</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-all text-muted-foreground"
              >
                <PanelLeft size={16} />
              </button>
            </div>

            <Separator className="bg-white/5" />

            <ScrollArea className="flex-1 px-4 py-8">
              <div className="space-y-12">
                <div>
                  <p className="px-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-6 italic">Strategic Operations</p>
                  <div className="space-y-1.5 px-1">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "group relative w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-500",
                            isActive 
                              ? "bg-white/10 text-white border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                              : "text-muted-foreground border border-transparent hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <item.icon size={20} className={cn(
                            "transition-all duration-500",
                            isActive ? "text-white text-glow scale-110" : "group-hover:text-white"
                          )} />
                          <span className={cn(
                            "text-sm font-bold tracking-tight uppercase italic",
                            isActive ? "text-glow-white" : ""
                          )}>{item.label}</span>
                          {isActive && (
                            <motion.div 
                              layoutId="nav-pill"
                              className="absolute left-0 w-1 h-6 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="px-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-6 italic">System Diagnostics</p>
                  <div className="space-y-1.5 px-1">
                    {[
                      { icon: History, label: "Neural Threads" },
                      { icon: Terminal, label: "Core Logs" },
                      { icon: Settings, label: "Node Config" },
                    ].map((item) => (
                      <button key={item.label} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent transition-all group">
                        <item.icon size={20} className="group-hover:text-white transition-colors" />
                        <span className="text-sm font-bold tracking-tight uppercase italic">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Status Integration */}
            <div className="p-6 mt-auto">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity size={14} className="text-white opacity-40" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white opacity-40">Node Matrix</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "backend", label: "Api", icon: ShieldCheck },
                      { key: "ollama", label: "Core", icon: Cpu },
                      { key: "chromadb", label: "Lake", icon: Database },
                      { key: "sqlite", label: "Mem", icon: Zap },
                    ].map((node) => {
                      const isOnline = health?.nodes?.[node.key] === "online";
                      return (
                        <div key={node.key} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-1000",
                            isOnline ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)] animate-pulse" : "bg-white/10"
                          )} />
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest italic leading-none",
                            isOnline ? "text-white" : "text-white/20"
                          )}>{node.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="relative group">
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-2.5 text-[11px] font-black text-white outline-none appearance-none cursor-pointer hover:border-white/30 transition-all uppercase italic tracking-tight shadow-inner"
                  >
                    {models.length > 0 ? (
                      models.map((m) => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))
                    ) : (
                      <option value="llama3">Llama-3-8B-v2</option>
                    )}
                  </select>
                  <Zap size={10} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white opacity-40 animate-pulse" />
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Perspective */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-[100px] px-10 flex items-center justify-between border-b border-border bg-background/40 backdrop-blur-3xl shrink-0 z-10 transition-all duration-500">
          <div className="flex items-center gap-8">
            {!sidebarOpen && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSidebarOpen(true)} 
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
              >
                {isMobile ? <Menu size={20} /> : <PanelLeft size={20} />}
              </motion.button>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] leading-none mb-2 italic opacity-60">
                Sub-Surface Node Matrix
              </span>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse" />
                <h1 className="text-2xl font-black tracking-[-0.02em] text-white uppercase italic text-glow-white">
                  {navItems.find(i => i.href === pathname)?.label || "Mission Control"}
                </h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="hidden lg:grid grid-cols-2 gap-x-8 gap-y-1 text-right">
              <div className="flex items-center gap-2 justify-end">
                <Cpu size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Compute</span>
                <span className="text-[10px] font-black text-white uppercase leading-none italic">Optimal</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <ShieldCheck size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Access</span>
                <span className="text-[10px] font-black text-white uppercase leading-none italic">Secure</span>
              </div>
            </div>

            <Avatar className="w-12 h-12 border-2 border-white/10 shadow-xl shadow-white/5 hover:scale-110 transition-transform cursor-pointer grayscale opacity-80 hover:grayscale-0 hover:opacity-100">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>K</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.06),transparent_60%)]" />
          <div className="h-full relative z-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
