"use client";

import { motion } from "framer-motion";
import { MessageSquare, Mic, Volume2, ArrowRight, Sparkles, Activity, ShieldCheck, Cpu } from "lucide-react";
import Link from "next/link";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    >
      <Link href={href} className="block group h-full">
        <div className="relative h-full glass-card p-8 rounded-[2.5rem] overflow-hidden flex flex-col hover:border-blue-500/40 transition-all duration-500">
          
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
              <Icon size={28} className="text-white group-hover:text-blue-400 transition-colors" />
            </div>
            {badge && (
              <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${statusColor} bg-white/5`}>
                {badge}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <h3 className="text-2xl font-black mb-4 tracking-tight group-hover:text-glow transition-all">{title}</h3>
            <p className="text-accent text-sm leading-relaxed mb-10 opacity-60 group-hover:opacity-100 transition-opacity">
              {description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-white/50 group-hover:text-blue-400 transition-all">
              <span>INITIALIZE WORKBENCH</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-white/10 group-hover:bg-blue-500/50 transition-colors" />
              ))}
            </div>
          </div>

          {/* Background Highlight */}
          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full group-hover:bg-blue-500/10 transition-all duration-700" />
        </div>
      </Link>
    </motion.div>
  );
}

export default function Home() {
  const tools = [
    {
      title: "Agentic Hub",
      description: "Advanced RAG-powered chat interface with persistent memory and tool-use orchestrator for local LLMs.",
      icon: MessageSquare,
      href: "/chat",
      badge: "Operational",
      statusColor: "text-emerald-400 border-emerald-500/20",
      delay: 0.1
    },
    {
      title: "Speech Lab",
      description: "High-precision Whisper ASR for transcribing local audio streams into structured text data.",
      icon: Mic,
      href: "/asr",
      badge: "Local v2",
      statusColor: "text-blue-400 border-blue-500/20",
      delay: 0.2
    },
    {
      title: "Voice Studio",
      description: "Neural voice synthesis workbench using Piper for high-quality, local text-to-speech generation.",
      icon: Volume2,
      href: "/tts",
      badge: "In-Garage",
      statusColor: "text-purple-400 border-purple-500/20",
      delay: 0.3
    }
  ];

  return (
    <div className="h-full overflow-y-auto px-10 py-20 scrollbar-hide">
      <div className="max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="mb-24 flex flex-col md:flex-row items-end justify-between gap-12">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-400 text-[10px] font-black mb-8 tracking-[0.25em] uppercase"
            >
              <Sparkles size={14} />
              <span>ORCHESTRATING LOCAL INTELLIGENCE</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black tracking-[-0.04em] mb-8 leading-[0.9] uppercase italic"
            >
              The Next <span className="text-blue-500">Multimodal</span> <br /> Frontier.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-accent text-xl leading-relaxed opacity-60 font-medium"
            >
              A unified research environment for testing, comparing, and deploying cutting-edge local AI models across text, speech, and vision.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex-shrink-0 grid grid-cols-2 gap-4 p-8 glass-panel rounded-[2rem] border-white/5"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-black text-accent opacity-40 uppercase tracking-widest">Active Core</p>
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-blue-400" />
                <span className="text-sm font-bold">Ollama Node 1</span>
              </div>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-black text-accent opacity-40 uppercase tracking-widest">Latency</p>
              <div className="flex items-center justify-end gap-2">
                <Activity size={14} className="text-emerald-400" />
                <span className="text-sm font-bold">12ms</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {tools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>

        {/* System Stats Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-32 p-10 glass-panel rounded-[3rem] border-white/5 flex flex-col lg:flex-row items-center justify-between gap-12"
        >
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-accent opacity-40 uppercase tracking-widest leading-none">Security Protocol</span>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span className="text-sm font-black uppercase tracking-tight">Isolated Environment</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/5 hidden lg:block" />
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-accent opacity-40 uppercase tracking-widest leading-none">Vector Index</span>
              <div className="flex items-center gap-2">
                <Database size={16} className="text-blue-400" />
                <span className="text-sm font-black uppercase tracking-tight">ChromaDB v4.0 (Alpha)</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-[11px] font-bold text-accent italic opacity-40">
              Kimo Labs Research Hub · 2026 Revision · Multimodal v2.0
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
import { Database } from "lucide-react";
