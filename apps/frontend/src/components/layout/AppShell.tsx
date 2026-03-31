"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Database, Brain, PanelLeft,
  Settings, MessageSquare, History, Menu, User, Mic, Volume2, LayoutGrid, Terminal
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [models, setModels] = useState<{ name: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState("llama3");
  const pathname = usePathname();

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // -- Layout Check --
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

  // -- Fetch Models --
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(`${API_URL}/models`);
        const data = await res.json();
        setModels(data.models || []);
      } catch (err) {
        console.error("Failed to fetch models:", err);
      }
    };
    fetchModels();
  }, [API_URL]);

  const navItems = [
    { icon: LayoutGrid, label: "Tools Library", href: "/" },
    { icon: MessageSquare, label: "Agentic Hub", href: "/chat" },
    { icon: Mic, label: "Speech (ASR)", href: "/asr" },
    { icon: Volume2, label: "Voice (TTS)", href: "/tts" },
    { icon: Database, label: "Vector Lab", href: "/vectors" },
  ];

  return (
    <div className="flex w-full h-screen bg-[#0A0C10] text-[#F8F8FA] font-['Outfit'] overflow-hidden selection:bg-blue-500/30">
      
      {/* ── SIDEBAR OVERLAY ── */}
      {isMobile && sidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-30" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* ── SIDEBAR ── */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={isMobile ? { x: -300 } : { width: 0, opacity: 0 }}
            animate={isMobile ? { x: 0 } : { width: 300, opacity: 1 }}
            exit={isMobile ? { x: -300 } : { width: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`h-full border-r border-white/5 bg-[#0D0F14]/80 backdrop-blur-2xl flex flex-col shrink-0 overflow-hidden relative z-40 ${isMobile ? "fixed left-0 top-0 shadow-2xl" : ""}`}
          >
            {/* Logo Section */}
            <div className="p-8 flex items-center gap-4 h-[100px] shrink-0 border-b border-white/5">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <Brain size={22} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-black tracking-tight leading-none mb-1">KIMO LABS</h2>
                <div className="flex items-center gap-1.5 opacity-50">
                  <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                  <p className="text-[9px] font-bold tracking-[0.25em] uppercase">Intelligence Node</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-all text-accent"
              >
                <PanelLeft size={16} />
              </button>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-10 scrollbar-hide">
              <div>
                <p className="px-3 text-[10px] font-bold text-accent font-mono uppercase tracking-[0.2em] mb-6 opacity-40">Core Workbenches</p>
                <div className="space-y-1.5">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group relative w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                          isActive 
                            ? "bg-blue-500/10 text-white border border-blue-500/20" 
                            : "text-accent border border-transparent hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <item.icon size={18} className={isActive ? "text-blue-400" : "group-hover:text-white transition-colors"} />
                        <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                        {isActive && (
                          <motion.div 
                            layoutId="active-pill"
                            className="absolute left-0 w-1 h-6 bg-blue-500 rounded-full"
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-accent font-mono uppercase tracking-[0.2em] mb-6 opacity-40">System Resources</p>
                <div className="space-y-1.5">
                  <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-accent hover:bg-white/5 hover:text-white border border-transparent transition-all">
                    <History size={18} />
                    <span className="text-sm font-semibold tracking-tight">Active Threads</span>
                  </button>
                  <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-accent hover:bg-white/5 hover:text-white border border-transparent transition-all">
                    <Terminal size={18} />
                    <span className="text-sm font-semibold tracking-tight">System Logs</span>
                  </button>
                  <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-accent hover:bg-white/5 hover:text-white border border-transparent transition-all">
                    <Settings size={18} />
                    <span className="text-sm font-semibold tracking-tight">Settings</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Status Footer */}
            <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-md shrink-0">
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-glow" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#F8F8FA] opacity-90">Local Cluster Online</p>
                  </div>
                  <Database size={14} className="text-blue-400 opacity-50" />
                </div>
                
                <div className="relative group">
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-[#0A0C10] border border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-bold text-white outline-none appearance-none cursor-pointer hover:border-blue-500/50 transition-all shadow-inner"
                  >
                    {models.length > 0 ? (
                      models.map((m) => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))
                    ) : (
                      <option value="llama3">Llama-3-8B-v2</option>
                    )}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400 group-hover:scale-110 transition-transform">
                    <Zap size={10} />
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-[100px] px-10 flex items-center justify-between border-b border-white/5 bg-[#0A0C10]/60 backdrop-blur-xl shrink-0 relative z-10">
          <div className="flex items-center gap-6">
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-accent"
              >
                {isMobile ? <Menu size={18} /> : <PanelLeft size={18} />}
              </button>
            )}
            <div>
              <p className="text-[10px] text-accent font-bold uppercase tracking-[0.3em] leading-none mb-2 opacity-50">Local Research Node</p>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <h1 className="text-xl font-black tracking-tight text-white uppercase italic">
                  {navItems.find(i => i.href === pathname)?.label || "Platform Hub"}
                </h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex text-right flex-col mr-2">
              <p className="text-[9px] text-accent font-bold uppercase tracking-widest opacity-40">System Architecture</p>
              <p className="text-[12px] font-bold text-white tracking-tight">Kimo Core · v2.1</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/10 border border-white/10 select-none">
              <User size={20} className="text-white" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden relative bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.08),transparent_50%)]">
          {children}
        </main>
      </div>
    </div>
  );
}
