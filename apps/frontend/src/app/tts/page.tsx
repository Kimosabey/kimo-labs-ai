"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Volume2, Play, Download, Trash2, 
  Settings2, Sparkles, Loader2, Music, 
  MessageCircle, Info, ChevronDown 
} from "lucide-react";

export default function TTSPage() {
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("en_US-lessac-medium");
  const [error, setError] = useState<string | null>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
      setError("Failed to generate voice. Ensure Piper is configured on the backend.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-10 py-12 scrollbar-hide">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Volume2 size={20} />
              </div>
              <h2 className="text-3xl font-black tracking-tight uppercase italic underline decoration-purple-500/30">Voice Studio</h2>
            </div>
            <p className="text-accent opacity-60 text-lg max-w-xl">
              Neural Speech Synthesis (TTS) workbench. Generate human-like vocal performances using optimized Piper models.
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F8F8FA]">Piper Node Online</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls Column */}
          <div className="lg:col-span-1 space-y-8">
            <div className="glass-panel p-8 rounded-[2.5rem] space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 opacity-40">
                  <Settings2 size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Synthesis Parameters</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-accent opacity-40 uppercase tracking-widest mb-2 block">Voice Profile</label>
                    <div className="relative group/select">
                      <select 
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold appearance-none cursor-pointer group-hover/select:border-purple-500/30 transition-all outline-none"
                      >
                        {voices.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[8px] font-black opacity-30 uppercase mb-1">Speaker ID</p>
                      <p className="text-[10px] font-black">#001_LOCAL</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[8px] font-black opacity-30 uppercase mb-1">Rate</p>
                      <p className="text-[10px] font-black">1.0X_STD</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 text-purple-400">
                  <Sparkles size={16} />
                  <p className="text-[9px] font-black uppercase tracking-tight">Neural High-Fidelity Active</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-[2.5rem] opacity-30 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-3">
                <Info size={16} />
                <p className="text-[9px] font-black uppercase tracking-widest">Model Info</p>
              </div>
              <p className="mt-4 text-[10px] font-medium leading-relaxed">
                Piper uses decentralized ONNX runtimes for efficient local synthesis without GPU dependency.
              </p>
            </div>
          </div>

          {/* Input/Output Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-panel p-10 rounded-[3rem] space-y-10 relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-3 opacity-40">
                  <MessageCircle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Synthesis Input</span>
                </div>
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter script for neural processing..."
                  className="w-full h-[240px] bg-black/40 border border-white/5 rounded-2xl p-8 text-lg font-medium resize-none outline-none focus:border-purple-500/30 transition-all placeholder:opacity-20"
                />
                <div className="flex justify-between items-center px-4">
                  <span className="text-[9px] font-black text-accent opacity-40 uppercase tracking-widest">{text.length} Characters</span>
                  <button 
                    onClick={() => setText("")}
                    className="text-[9px] font-black text-accent hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={10} /> Clear Buffer
                  </button>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
                className="w-full py-6 rounded-2xl bg-white text-[#0A0C10] font-black text-sm uppercase tracking-[0.2em] hover:bg-purple-400 transition-all shadow-xl disabled:opacity-30 disabled:cursor-not-allowed group flex items-center justify-center gap-4"
              >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} />}
                {isGenerating ? "Synthesizing Vocal Node..." : "Initiate Synthesis"}
              </button>

              {/* Shimmer overlay */}
              {isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent -translate-x-full animate-shimmer" />
              )}
            </div>

            <AnimatePresence>
              {audioUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="glass-panel p-10 rounded-[3rem] border-purple-500/20"
                >
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Music size={24} />
                      </div>
                      <div className="flex-1">
                        <audio controls src={audioUrl} className="w-full h-10 opacity-60" />
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[9px] font-black uppercase tracking-tight text-white/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> 22.05kHz
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[9px] font-black uppercase tracking-tight text-white/50">
                            PCM_S16LE
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <a 
                      href={audioUrl} 
                      download="kimo_speech.wav"
                      className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 hover:bg-purple-500/20 hover:border-purple-500/30 flex items-center justify-center transition-all text-accent hover:text-purple-400"
                    >
                      <Download size={24} />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {error && (
              <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-4">
                <Info size={20} />
                <p className="text-sm font-black uppercase tracking-widest">{error}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
