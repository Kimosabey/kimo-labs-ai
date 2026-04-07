"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, PhoneOff, Settings, Activity, 
  Cpu, Zap, AudioLines, Sparkles, Loader2, ShieldCheck,
  Volume2, VolumeX, Radio
} from "lucide-react";
import { 
  LiveKitRoom, 
  VideoConference, 
  useTracks, 
  useVoiceAssistant, 
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/api";
import { gsap } from "gsap";
import "@livekit/components-styles";

export default function VoiceWorkbench() {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [roomName, setRoomName] = useState("kimo-research-node");
  
  const visualizerRef = useRef<HTMLDivElement>(null);

  const API_URL = getApiBaseUrl();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const identity = `researcher-${Math.floor(Math.random() * 10000)}`;
      const response = await fetch(`${API_URL}/token?room=${roomName}&identity=${identity}`);
      const data = await response.json();
      setToken(data.token);
      setUrl(process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://kimo-zg71lj4i.livekit.cloud");
    } catch (err) {
      console.error("Failed to get token:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex w-full h-full overflow-hidden bg-background/20 relative">
      <AnimatePresence mode="wait">
        {!token ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex flex-col items-center justify-center p-12"
          >
            <div className="max-w-2xl w-full text-center space-y-12">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
                  <div className="relative w-32 h-32 rounded-[3rem] glass-card flex items-center justify-center border-primary/20 bg-primary/5">
                    <Radio size={56} className="text-primary text-glow" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">
                  Voice <span className="text-primary">Agent</span> Lab
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed opacity-60 font-medium max-w-xl mx-auto italic">
                  Initialize a real-time neural link with the Kimo intelligence matrix via LiveKit & Deepgram.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Zap, label: "Latency", value: "< 150ms" },
                  { icon: AudioLines, label: "ASR Engine", value: "Deepgram v3" },
                  { icon: ShieldCheck, label: "Protocol", value: "E2E Secure" },
                ].map((feature) => (
                  <div key={feature.label} className="glass-card p-6 rounded-3xl border-white/5 bg-white/[0.01]">
                    <feature.icon size={20} className="text-primary/40 mb-3 mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{feature.label}</p>
                    <p className="text-sm font-black italic">{feature.value}</p>
                  </div>
                ))}
              </div>

              <div className="pt-8">
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className={cn(
                    "group relative px-12 py-6 rounded-full bg-primary text-white font-black uppercase italic tracking-[0.2em] transition-all duration-700 shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 disabled:opacity-50",
                    isConnecting && "animate-pulse"
                  )}
                >
                  <span className="flex items-center gap-4 relative z-10">
                    {isConnecting ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
                    {isConnecting ? "Negotiating Link..." : "Initialize Neural Link"}
                  </span>
                  <div className="absolute inset-0 rounded-full bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col h-full bg-black/40"
          >
            <LiveKitRoom
              video={false}
              audio={true}
              token={token}
              serverUrl={url!}
              onDisconnected={() => setToken(null)}
              className="flex-1 flex flex-col p-8 gap-8"
            >
              <div className="flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                      <h2 className="text-xl font-black uppercase tracking-tighter italic">V-Agent Connection: Stable</h2>
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Matrix Node ID: {roomName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="glass-card px-6 py-3 rounded-2xl border-white/5 flex items-center gap-4">
                    <Activity size={14} className="text-primary" />
                    <span className="text-xs font-black italic tracking-widest text-primary/80">LIVE</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center relative">
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full animate-pulse" />
                </div>
                
                <div className="relative z-10 flex flex-col items-center gap-16">
                  {/* Volumetric Visualizer Component */}
                  <div className="relative w-[300px] h-[300px] flex items-center justify-center">
                     <AgentVisualizer />
                  </div>
                  
                  <div className="text-center space-y-4">
                    <p className="text-[12px] font-black text-white/40 uppercase tracking-[0.5em] italic">Intelligence Matrix Active</p>
                    <h3 className="text-2xl font-black tracking-tight italic uppercase opacity-80">Listening for research commands...</h3>
                  </div>
                </div>
              </div>

              <footer className="shrink-0 flex justify-center pb-12">
                <div className="glass-panel p-4 rounded-[3rem] border-white/5 flex items-center gap-4 bg-white/[0.02]">
                  <VoiceAssistantControlBar 
                    controls={{ leave: true }}
                    className="!bg-transparent !border-none !gap-4"
                  />
                </div>
              </footer>
              
              <RoomAudioRenderer />
            </LiveKitRoom>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AgentVisualizer() {
  const { state } = useVoiceAssistant();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Using GSAP to animate scale based on state
    if (state === "speaking") {
      gsap.to(".vis-core", { scale: 1.2, duration: 0.3, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".vis-outer", { scale: 1.5, opacity: 0.4, duration: 1, repeat: -1, ease: "circ.out" });
    } else {
      gsap.to(".vis-core", { scale: 1, duration: 1, ease: "elastic.out(1, 0.3)" });
      gsap.to(".vis-outer", { scale: 1.1, opacity: 0.1, duration: 1 });
    }
  }, [state]);

  return (
    <div className="relative w-full h-full flex items-center justify-center" ref={canvasRef}>
      <div className={cn(
        "vis-outer absolute w-full h-full rounded-full border-2 border-primary/20 transition-all duration-1000",
        state === "speaking" ? "border-primary/60 scale-125" : "scale-100"
      )} />
      <div className={cn(
        "vis-core relative w-48 h-48 rounded-full shadow-[0_0_80px_rgba(255,255,255,0.1)] flex items-center justify-center transition-colors duration-1000",
        state === "speaking" ? "bg-primary/20 border-2 border-primary" : "bg-white/5 border border-white/10"
      )}>
        <BarVisualizer className="!h-24 !w-32 !gap-1.5 opacity-80" />
      </div>
      
      {state === "speaking" && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -bottom-8 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-[10px] font-black uppercase italic tracking-widest text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
        >
          Transmitting
        </motion.div>
      )}
    </div>
  );
}
