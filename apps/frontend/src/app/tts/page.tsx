"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Volume2, Play, Download, Trash2, 
  Settings2, Sparkles, Loader2, Music, 
  MessageCircle, Info, ChevronDown, Zap, Cpu, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function TTSPage() {
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("en_US-lessac-medium");
  const [error, setError] = useState<string | null>(null);
  
  const API_URL = getApiBaseUrl();

  const voices = [
    { id: "en_US-lessac-medium", name: "Lessac (Medium)", lang: "EN-US", gender: "Neutral" },
    { id: "en_US-amy-medium", name: "Amy (Medium)", lang: "EN-US", gender: "Female" },
    { id: "en_US-ryan-medium", name: "Ryan (Medium)", lang: "EN-US", gender: "Male" },
  ];

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const res = await fetch(`${API_URL}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("TTS generation failed");
      
      const blob = await res.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError("Failed to generate voice. Verify local core connectivity.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto px-10 py-16 space-y-16">
        
        {/* Header Configuration */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <Volume2 size={28} className="text-primary text-glow" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] leading-none mb-1 italic opacity-60">
                  Neural Audio Workbench
                </span>
                <h2 className="text-4xl font-black tracking-tight uppercase italic text-glow-white">Voice Studio</h2>
              </div>
            </div>
            <p className="text-muted-foreground text-lg max-w-xl font-medium opacity-60">
              High-fidelity neural text-to-speech synthesis using optimized Piper models. Transform system data into natural human-like vocal nodes.
            </p>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-[2rem] glass-panel bg-white/[0.01]">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Activity size={18} className="text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic leading-none mb-1">Piper Node</span>
              <span className="text-sm font-black uppercase tracking-tight text-white italic leading-none">Status: Optimized</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Controls Column */}
          <div className="lg:col-span-4 space-y-10">
            <div className="glass-panel p-10 rounded-[3.5rem] space-y-10 bg-white/[0.01]">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Settings2 size={14} className="text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Model Config</span>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3 block opacity-60 italic">Voice Profile Node</label>
                    <div className="relative group/select">
                      <select 
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full bg-background/50 border border-border rounded-2xl px-5 py-4 text-xs font-black appearance-none cursor-pointer group-hover/select:border-primary/50 transition-all outline-none italic tracking-tight shadow-inner uppercase"
                      >
                        {voices.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Frequency Cluster</span>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-[11px] font-black uppercase italic tracking-widest">22.05kHz (STD)</span>
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Neural Protocol</span>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[11px] font-black uppercase italic tracking-widest">ONNX_INFERENCE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/20 text-primary">
                  <Sparkles size={18} className="text-glow animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">High-Fidelity Mode</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] bg-white/[0.01] opacity-30 hover:opacity-100 transition-opacity duration-700">
              <div className="flex items-center gap-3 mb-4">
                <Info size={16} className="text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest italic">Research Note</p>
              </div>
              <p className="text-[11px] font-medium leading-relaxed italic">
                Piper leverages sub-surface ONNX acceleration for efficient local synthesis without dedicated hardware dependency.
              </p>
            </div>
          </div>

          {/* Input/Output Column */}
          <div className="lg:col-span-8 space-y-10">
            <div className="glass-panel p-12 rounded-[3.5rem] bg-white/[0.01] relative overflow-hidden group">
              <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:25px_25px]" />
              </div>

              <div className="space-y-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MessageCircle size={14} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Synthesis Script Buffer</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest italic">{text.length} Octets / 500 Limit</span>
                  </div>
                </div>

                <div className="relative">
                  <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 500))}
                    placeholder="Enter vocal directive for neural processing cluster..."
                    className="w-full h-[280px] bg-black/40 border border-white/5 rounded-[2.5rem] p-10 text-xl font-bold italic resize-none outline-none focus:border-primary/40 transition-all duration-700 placeholder:opacity-10 placeholder:italic shadow-inner"
                  />
                  <button 
                    onClick={() => setText("")}
                    className="absolute bottom-6 right-8 text-[10px] font-black text-muted-foreground hover:text-red-500 uppercase tracking-widest transition-all italic flex items-center gap-2"
                  >
                    <Trash2 size={12} /> Purge Buffer
                  </button>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim()}
                  className="w-full h-20 rounded-[1.8rem] bg-white text-[#040507] hover:bg-primary hover:text-white transition-all duration-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] disabled:opacity-20 disabled:cursor-not-allowed group flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.3em] italic"
                >
                  {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} className="group-hover:animate-pulse" />}
                  {isGenerating ? "[ Initializing Synthesis Node ]" : "[ Initiate Vocal Execution ]"}
                </Button>
              </div>

              {/* Shimmer overlay */}
              {isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-shimmer" />
              )}
            </div>

            <AnimatePresence mode="wait">
              {audioUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel p-10 rounded-[3.5rem] bg-white/[0.01] border-primary/20 shadow-2xl"
                >
                  <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-8 flex-1 w-full">
                      <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                        <Music size={32} className="text-primary text-glow" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">Vocal Output Ready</p>
                          <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                        </div>
                        <audio controls src={audioUrl} className="w-full h-10 opacity-60 brightness-200" />
                        <div className="flex items-center gap-4">
                          <Badge className="bg-primary/5 border-primary/20 text-primary text-[8px] italic uppercase tracking-widest">
                            Node_Sync_Ready
                          </Badge>
                          <Badge className="bg-white/5 border-white/10 text-white/40 text-[8px] italic uppercase tracking-widest font-bold">
                            PCM_S16_22K
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <a 
                      href={audioUrl} 
                      download="kimo-neural-vocal.wav"
                      className="w-20 h-20 rounded-[2.2rem] bg-white text-[#040507] hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-700 shadow-xl group"
                    >
                      <Download size={28} className="group-hover:-translate-y-1 transition-transform" />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 rounded-[2.5rem] bg-red-500/5 border border-red-500/20 text-red-400 flex items-center gap-6"
              >
                <AlertCircle size={24} />
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Critical Synthesis Error</p>
                  <p className="text-sm font-black italic tracking-widest">{error}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function AlertCircle({ size, className }: any) {
  return (
    <div className={cn("flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 w-12 h-12", className)}>
      <Info size={size} className="text-red-500" />
    </div>
  );
}
