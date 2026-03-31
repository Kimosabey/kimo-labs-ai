"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, Square, Upload, Play, CheckCircle, AlertCircle, 
  Loader2, Music, Trash2, Download, Activity, Zap, Cpu, Waves, Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ASRPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [provider, setProvider] = useState<"whisper" | "deepgram">("whisper");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const runTranscription = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    setTranscription(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");
    formData.append("provider", provider);

    try {
      const res = await fetch(`${API_URL}/asr`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Transcription failed");
      const data = await res.json();
      setTranscription(data);
    } catch (err) {
      setError("Failed to transcribe audio. Verify local core connectivity.");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto px-10 py-16 space-y-16">
        
        {/* Header Configuration */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <Mic size={28} className="text-white text-glow" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] leading-none mb-1 italic opacity-60">
                  Multimodal Pipeline
                </span>
                <h2 className="text-4xl font-black tracking-tight uppercase italic text-glow-white">Speech Lab</h2>
              </div>
            </div>
            <p className="text-muted-foreground text-lg max-w-xl font-medium opacity-60 italic">
              High-precision ASR orchestration. Toggle between local Whisper and cloud Deepgram for ultra-low latency transcription.
            </p>
          </div>
          
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button 
              onClick={() => setProvider("whisper")}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                provider === "whisper" ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              Whisper (Local)
            </button>
            <button 
              onClick={() => setProvider("deepgram")}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                provider === "deepgram" ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              Deepgram (Cloud)
            </button>
          </div>
        </div>

        {/* Interaction Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Waveform & Capture Zone */}
          <div className="lg:col-span-12 glass-panel p-12 rounded-[3.5rem] relative overflow-hidden group">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:30px_30px]" />
            </div>

            <div className="flex flex-col items-center justify-center gap-12 relative z-10">
              <div className="flex items-end gap-2.5 h-32 w-full max-w-3xl justify-center">
                {[...Array(40)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={isRecording ? { 
                      height: [10, Math.random() * 120 + 20, 10],
                      opacity: [0.3, 1, 0.3]
                    } : { 
                      height: 12,
                      opacity: 0.1 
                    }}
                    transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.02 }}
                    className="w-2 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  />
                ))}
              </div>

              <div className="flex flex-col items-center gap-10">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={cn(
                    "relative w-32 h-32 rounded-[2.5rem] flex items-center justify-center transition-all duration-700 group",
                    isRecording 
                    ? "bg-white/10 border-2 border-white/50 shadow-[0_0_60px_rgba(255,255,255,0.2)] animate-pulse-glow" 
                    : "bg-white border-2 border-white/50 shadow-[0_0_60px_rgba(255,255,255,0.1)] hover:scale-105 hover:rotate-1"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isRecording ? (
                      <motion.div key="stop" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                        <Square size={40} className="text-white fill-white/20" />
                      </motion.div>
                    ) : (
                      <motion.div key="mic" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                        <Mic size={40} className="text-black" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                <div className="text-center">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-2 transition-all">
                    {isRecording ? "Neural Stream Capturing" : "Initialize Audio Interface"}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground opacity-40">
                    <Zap size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
                      {isRecording ? "Transmitting Direct Link" : "Standby for Signal Processing"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-10 right-10 flex gap-4">
              <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  className={cn(
                    "cursor-pointer w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                    "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/30"
                  )}
                >
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                    <Upload size={20} className="text-muted-foreground hover:text-white transition-colors" />
                  </label>
                </TooltipTrigger>
                <TooltipContent className="bg-popover border-border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest italic">
                  Import Signal Node
                </TooltipContent>
              </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Buffer Console */}
          <div className="lg:col-span-5 glass-panel p-10 rounded-[3.5rem] flex flex-col justify-between">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Music size={14} className="text-white opacity-60" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Buffer Matrix</span>
                </div>
                {audioUrl && (
                  <Badge variant="outline" className="border-white/30 text-white bg-white/5 px-2 py-0 text-[8px] italic">
                    Buffered
                  </Badge>
                )}
              </div>
              
              {audioUrl ? (
                <div className="space-y-10">
                  <div className="p-6 rounded-3xl bg-black/40 border border-white/5 flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                        <Play size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 italic opacity-40">Raw Signal Stream</p>
                        <audio controls src={audioUrl} className="w-full h-8 opacity-40 brightness-200" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button 
                      onClick={runTranscription}
                      disabled={isTranscribing}
                      className="flex-1 h-16 rounded-2xl bg-white text-black hover:bg-neutral-200 transition-all duration-500 font-black text-xs uppercase tracking-[0.2em] italic group"
                    >
                      {isTranscribing ? <Loader2 size={18} className="animate-spin mr-3" /> : <Zap size={18} className="mr-3 group-hover:animate-pulse" />}
                      {isTranscribing ? "Processing..." : "Execute Inference"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => { setAudioBlob(null); setAudioUrl(null); setTranscription(null); }}
                      className="h-16 w-16 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-500"
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01] opacity-20">
                  <Waves size={40} className="mb-6 opacity-30" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] leading-none italic">Awaiting Signal Input</p>
                </div>
              )}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-10 p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 text-white opacity-60"
              >
                <AlertCircle size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest italic">{error}</span>
              </motion.div>
            )}
          </div>

          {/* Results Display */}
          <div className="lg:col-span-7 glass-panel p-10 rounded-[3.5rem]">
            <div className="h-full flex flex-col">
              <AnimatePresence mode="wait">
                {transcription ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    className="flex-1 flex flex-col gap-10"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] italic">Synthesis Output</p>
                        <h3 className="text-2xl font-black uppercase tracking-tight italic">Processed Data</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[9px] font-black text-muted-foreground uppercase opacity-40 italic">Confidence</p>
                          <p className="text-sm font-black uppercase tracking-tight text-white">{(transcription.language_probability * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>

                    <ScrollArea className="flex-1 p-8 rounded-[2rem] bg-black/40 border border-white/10 shadow-inner">
                      <div className="text-lg font-medium leading-[1.8] text-neutral-300 italic selection:bg-white/10">
                        {transcription.text}
                      </div>
                    </ScrollArea>

                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-8 text-center">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 leading-none mb-1">Source</span>
                          <span className="text-xs font-black uppercase tracking-tight text-white italic">{transcription.provider || "Whisper"}</span>
                        </div>
                        <div className="w-px h-6 bg-white/5" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 leading-none mb-1">Lang</span>
                          <span className="text-xs font-black uppercase tracking-tight text-white italic">{transcription.language}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const blob = new Blob([transcription.text], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url; a.download = "kimo-signal.txt"; a.click();
                        }}
                        className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[11px] font-black uppercase tracking-[0.2em] italic"
                      >
                        <Download size={16} />
                        Export Log
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    className="flex-1 flex flex-col items-center justify-center text-center py-20 grayscale brightness-75"
                  >
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-10 shadow-[0_0_30px_rgba(255,255,255,0.02)]">
                      <Terminal size={32} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.5em] text-muted-foreground mb-4 italic">Neural Core Standby</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed max-w-xs italic">
                      Awaiting Multimodal Signal Stream. <br /> Initialize Mic or Import Data to synchronize.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

