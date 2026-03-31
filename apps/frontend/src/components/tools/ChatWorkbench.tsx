"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Send, Bot, User, Loader2, Sparkles,
  Mic, Square, Volume2, VolumeX, RotateCcw, Activity, Cpu, Command
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isSpeaking?: boolean;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
}

const SAMPLE_QUESTIONS = [
  "Execute system diagnostic on Kimo v2",
  "Summarize active research documents",
  "Initialize multimodal pipeline",
  "Query local vector store status",
];

export default function ChatWorkbench() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/sessions`);
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [API_URL]);

  const loadSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/sessions/${sessionId}/messages`);
      const msgs = await res.json();
      setMessages(msgs.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content
      })));
      setActiveSessionId(sessionId);
    } catch (err) {
      console.error("Failed to load session", err);
    } finally {
      setIsLoading(false);
    }
  };

  const purgeContext = () => {
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
  };

  // -- ASR Logic --
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        await handleVoiceToText(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceToText = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("file", blob, "voice.wav");
    try {
      const res = await fetch(`${API_URL}/asr`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.text) {
        setInput(data.text);
      }
    } catch (err) {
      console.error("ASR error:", err);
    }
  };

  // -- TTS Logic --
  const speakMessage = async (text: string, msgId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      setMessages(msgs => msgs.map(m => ({ ...m, isSpeaking: false })));
    }

    try {
      const res = await fetch(`${API_URL}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      
      setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, isSpeaking: true } : m));
      audio.onended = () => {
        setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, isSpeaking: false } : m));
      };
      audio.play();
    } catch (err) {
      console.error("TTS error:", err);
    }
  };

  const sendMessage = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query) return;
    setInput("");
    setIsLoading(true);
    
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: query };
    setMessages((p) => [...p, userMsg]);

    const assistantId = `a-${Date.now()}`;
    setMessages((p) => [...p, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const response = await fetch(`${API_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query, 
          model: "llama3",
          session_id: activeSessionId 
        }),
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr !== "[DONE]") {
              try {
                const data = JSON.parse(dataStr);
                if (data.type === "answer") {
                  fullContent += data.content;
                  setMessages((p) => p.map((m) => m.id === assistantId ? { ...m, content: fullContent } : m));
                  if (data.session_id && !activeSessionId) {
                    setActiveSessionId(data.session_id);
                    fetchSessions();
                  }
                }
              } catch (e) {}
            }
          }
        }
      }

      if (isTtsEnabled) speakMessage(fullContent, assistantId);

    } catch (err) {
      setMessages((p) => p.map((m) => m.id === assistantId ? { ...m, content: "⚠️ CORE_OFFLINE: Inference failed." } : m));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full h-full overflow-hidden bg-background/20 relative">
      
      {/* Perspective Sidebar */}
      <div className="hidden xl:flex w-[300px] border-r border-white/5 flex-col p-8 gap-10 glass-panel">
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-6 italic">Session Metadata</p>
          <div className="space-y-4">
            {[
              { icon: Activity, label: "Latency", value: "0.24ms" },
              { icon: Cpu, label: "Neural Node", value: "Llama-3-Elite" },
              { icon: Command, label: "Protocol", value: "Agentic-V2" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <stat.icon size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-widest leading-none">{stat.label}</span>
                </div>
                <span className="text-sm font-black text-white italic tracking-tight">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-white/5" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-6 italic shrink-0">History Buffer</p>
          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
            {sessions.length === 0 ? (
              <div className="flex items-center justify-center h-32 border border-dashed border-white/10 rounded-3xl opacity-40">
                <span className="text-[10px] font-bold uppercase tracking-widest">Buffer Empty</span>
              </div>
            ) : (
              sessions.map(s => (
                <button 
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all duration-300 group",
                    activeSessionId === s.id ? "bg-primary/20 border border-primary/30 text-primary" : "bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04]"
                  )}
                >
                  <p className={cn(
                    "text-xs font-black truncate uppercase tracking-tight italic",
                    activeSessionId === s.id ? "text-primary text-glow" : "text-white/70 group-hover:text-white"
                  )}>{s.title}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Primary Interaction Layer */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto px-10 py-16 flex flex-col gap-16">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 rounded-[2.5rem] glass-card flex items-center justify-center mb-10 shadow-2xl shadow-primary/20 bg-primary/5 border-primary/20"
                >
                  <Sparkles size={40} className="text-primary text-glow" />
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 uppercase italic leading-none">
                  Core <span className="text-primary">Intelligence</span>
                </h1>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 italic opacity-60 font-medium">
                      Kimo Labs&apos; local reasoning node is online. Support for document analysis and multimodal orchestration.
                    </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-4">
                  {SAMPLE_QUESTIONS.map((q) => (
                    <button 
                      key={q} 
                      onClick={() => sendMessage(q)}
                      className="p-6 glass-card rounded-3xl text-left group hover:border-primary/40 transition-all font-bold bg-white/[0.01]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.03] flex items-center justify-center group-hover:bg-primary/10 transition-all shadow-inner">
                          <Zap size={14} className="text-primary/40 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-white uppercase tracking-widest italic">{q}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 30, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-6 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm",
                      msg.role === "user" ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/10 text-emerald-400"
                    )}>
                      {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] italic">
                        {msg.role === "user" ? "[SYSTEM-USER]" : "[AGENT-NODE]"}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">
                        Timestamp: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className={cn(
                    "relative px-10 py-8 rounded-[3rem] border shadow-2xl transition-all duration-500",
                    msg.role === "user" 
                      ? "bg-primary/5 border-primary/10 rounded-tr-md ml-auto max-w-[85%]" 
                      : "glass-card rounded-tl-md max-w-[95%] lg:max-w-prose"
                  )}>
                    <div className={cn(
                      "text-[16px] leading-[1.8] tracking-tight font-medium",
                      msg.role === "assistant" ? "text-slate-100" : "text-white"
                    )}>
                      {msg.content}
                    </div>
                    
                    {msg.role === "assistant" && msg.content && (
                      <div className="mt-8 flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <button 
                          onClick={() => speakMessage(msg.content, msg.id)}
                          className={cn(
                            "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all italic",
                            msg.isSpeaking ? "text-primary text-glow" : "text-muted-foreground hover:text-white"
                          )}
                        >
                          {msg.isSpeaking ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
                          {msg.isSpeaking ? "[Speaking]" : "Execute Synthesis"}
                        </button>
                        <div className="h-1 w-1 rounded-full bg-white/10" />
                        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] italic">Node: Llama-3-8B</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Bot size={18} className="text-emerald-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1.5">
                      {[0, 0.2, 0.4].map((d) => (
                        <motion.div key={d} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: d }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      ))}
                    </div>
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] italic leading-none">Neural Processing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-20 w-full" />
          </div>
        </ScrollArea>

        {/* HUD Control Layer */}
        <footer className="p-10 pt-0 relative z-10 shrink-0">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="relative glass-panel rounded-[2.5rem] p-4 pl-10 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5 bg-white/[0.01]">
              <div className="flex items-end gap-6">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Query local cluster matrix..."
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none text-base py-6 max-h-[200px] resize-none overflow-y-auto scrollbar-hide text-white font-bold placeholder:opacity-20 placeholder:italic italic"
                />
                <div className="flex items-center gap-3 mb-3 mr-3">
                  <Tooltip>
                    <TooltipTrigger
                      onClick={isRecording ? stopRecording : startRecording}
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                        isRecording ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse" : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/5"
                      )}
                    >
                      {isRecording ? <Square size={20} /> : <Mic size={20} />}
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-popover border-border px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-widest italic">{isRecording ? "Stop Capture" : "Audio Capture"}</p>
                    </TooltipContent>
                  </Tooltip>

                  <button 
                    onClick={() => sendMessage()} 
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-xl",
                      input.trim() && !isLoading ? "bg-primary text-white shadow-primary/30" : "bg-white/5 text-muted-foreground opacity-50 border border-white/5"
                    )}
                  >
                    <Send size={20} className={cn("transition-transform duration-500", input.trim() && !isLoading && "translate-x-0.5 -translate-y-0.5 rotate-[-12deg]")} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between px-8">
              <div className="flex items-center gap-10">
                <button 
                  onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                  className={cn(
                    "flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 italic",
                    isTtsEnabled ? "text-primary text-glow" : "text-muted-foreground opacity-40 hover:opacity-100"
                  )}
                >
                  {isTtsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  <span>Auto-Synthesis: {isTtsEnabled ? "ACTIVE" : "STANDBY"}</span>
                </button>
                <button onClick={purgeContext} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40 hover:opacity-100 hover:text-primary transition-all duration-500 italic">
                  <RotateCcw size={14} /> 
                  <span>Purge Context</span>
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
