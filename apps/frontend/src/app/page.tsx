"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Mic, Volume2, ArrowRight, Sparkles, Activity, Cpu, Database, Zap, Radio } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { MissionControlHUD } from "@/components/MissionControlHUD";

interface ToolCardProps {
  title: string;
  description: string;
  icon: any;
  href: string;
  badge?: string;
  statusColor: string;
  delay: number;
}

function ToolCard({ title, description, icon: Icon, href, badge, statusColor, delay }: ToolCardProps) {
  return (
    <div className="tool-card-reveal">
      <Link href={href} className="block group h-full">
        <div className="relative h-full glass-card p-10 rounded-[3rem] overflow-hidden flex flex-col hover:border-primary/40 transition-all duration-700 bg-white/[0.01]">
          
          {/* Decorative Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-[80px] rounded-full group-hover:bg-primary/20 transition-all duration-1000" />
          
          {/* Header */}
          <div className="flex items-start justify-between mb-10 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 group-hover:border-primary/30 group-hover:bg-primary/5">
              <Icon size={32} className="text-white/80 group-hover:text-primary transition-colors duration-500 text-glow" />
            </div>
            {badge && (
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border bg-background/50 backdrop-blur-md italic shadow-sm",
                statusColor
              )}>
                {badge}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 relative z-10">
            <h3 className="text-3xl font-black mb-6 tracking-tighter group-hover:text-glow-white transition-all duration-500 uppercase italic">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-12 opacity-60 group-hover:opacity-100 transition-opacity duration-700 font-medium">
              {description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-8 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-3 text-[11px] font-black text-muted-foreground group-hover:text-primary transition-all duration-500 uppercase tracking-widest italic leading-none">
              <span>Initialize Workbench</span>
              <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-500" />
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/5 group-hover:bg-primary/40 transition-all duration-700" />
              ))}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".tool-card-reveal", {
        y: 60,
        opacity: 0,
        stagger: 0.15,
        duration: 1.2,
        ease: "expo.out",
        delay: 0.5
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const tools = [
    {
      title: "Voice Agent Lab",
      description: "Real-time neural link with Kimo using LiveKit and Deepgram for low-latency multimodal research.",
      icon: Radio,
      href: "/voice",
      badge: "Operational",
      statusColor: "text-white border-white/20 bg-white/5",
      delay: 0.1
    },
    {
      title: "Agentic Hub",
      description: "Advanced RAG-powered chat interface with sub-surface memory and local tool-use orchestrator.",
      icon: MessageSquare,
      href: "/chat",
      badge: "Operational",
      statusColor: "text-emerald-400/80 border-emerald-500/20 bg-emerald-500/5",
      delay: 0.2
    },
    {
      title: "Speech Lab",
      description: "High-precision ASR orchestration. Choose between local Whisper and cloud Deepgram engines.",
      icon: Mic,
      href: "/asr",
      badge: "Scale 1:1",
      statusColor: "text-white border-white/20",
      delay: 0.2
    },
    {
      title: "Voice Studio",
      description: "Neural voice synthesis studio using Piper for high-fidelity local text-to-speech generation.",
      icon: Volume2,
      href: "/tts",
      badge: "Ready",
      statusColor: "text-white opacity-40 border-white/5 bg-white/5",
      delay: 0.3
    },
    {
      title: "Vector Index",
      description: "Diagnostic explorer for the ChromaDB intelligence lake. Monitor collections and metadata health.",
      icon: Database,
      href: "/vectors",
      badge: "Online",
      statusColor: "text-white border-white/20",
      delay: 0.4
    }
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-hide" ref={containerRef}>
      
      {/* Background Animated Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            opacity: [0.03, 0.06, 0.03],
            scale: [1, 1.05, 1] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-white/10 blur-[150px] rounded-full"
        />
      </div>

      <div className="max-w-7xl mx-auto px-12 py-24 relative z-10">
        
        {/* Hero Section */}
        <div className="mb-32 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-16">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white text-[11px] font-black mb-10 tracking-[0.3em] uppercase italic shadow-sm"
            >
              <Activity size={16} className="opacity-40" />
              <span className="opacity-60">Architecting Neural Independence</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-8xl font-black tracking-[-0.05em] mb-10 leading-[0.85] uppercase italic"
            >
              The Monolith <br /> <span className="text-white text-glow opacity-20">Intelligence</span> <br /> Node.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-muted-foreground text-xl leading-relaxed opacity-60 font-medium max-w-2xl italic"
            >
              A high-precision research environment for consolidating local AI pipelines across text, speech, and vector space.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1.2, ease: "circOut" }}
            className="flex-shrink-0 w-full lg:w-[400px] h-[400px] relative"
          >
            <div className="absolute inset-0 bg-white/5 blur-[100px] rounded-full opacity-20 animate-pulse" />
            <MissionControlHUD />
            
            {/* Overlay Status */}
            <div className="absolute bottom-4 left-4 right-4 p-6 glass rounded-2xl border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-[0.25em] italic">Neural Core</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-sm font-black uppercase tracking-tight italic">Synced</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-[0.25em] italic text-right">Health</p>
                <span className="text-sm font-black uppercase tracking-tight italic text-white opacity-80">STABLE</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>

        {/* HUD Elements Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-40 p-12 glass-panel rounded-[4rem] border-white/5 flex flex-col lg:flex-row items-center justify-between gap-16 relative overflow-hidden bg-white/[0.01]"
        >
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-12 relative z-10">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-[0.3em] leading-none italic">Environment</span>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                <span className="text-sm font-black uppercase tracking-tight italic">Zero-Cloud Isolation</span>
              </div>
            </div>
            <div className="w-px h-10 bg-white/5 hidden lg:block" />
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-[0.3em] leading-none italic">Intelligence Lake</span>
              <div className="flex items-center gap-3">
                <Database size={18} className="text-white opacity-40" />
                <span className="text-sm font-black uppercase tracking-tight italic">ChromaDB Node Active</span>
              </div>
            </div>
          </div>
          
          <div className="text-right relative z-10">
            <div className="flex items-center justify-end gap-3 mb-2">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic opacity-60">System Synced</span>
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
            <p className="text-[11px] font-bold text-muted-foreground italic opacity-40 uppercase tracking-widest">
              Kimo Labs &middot; 2026 Node Matrix &middot; Monolith v3.0
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

import { ShieldCheck } from "lucide-react";
