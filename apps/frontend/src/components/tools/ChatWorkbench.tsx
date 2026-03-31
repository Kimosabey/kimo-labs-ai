"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Send, Bot, User, Loader2, Database, Brain, Sparkles, MessageSquare,
  Mic, Square, Volume2, VolumeX, Play, RotateCcw, Trash2
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isSpeaking?: boolean;
}

const SAMPLE_QUESTIONS = [
  "What is Kimo Labs v2?",
  "Initialize deep research mode.",
  "Analyze current cluster status.",
  "How does multimodal ASR work?",
];

export default function ChatWorkbench() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
        // Automatically send after voice processing if desired, but letting user review is safer
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
                  if (data.session_id && !activeSessionId) setActiveSessionId(data.session_id);
                }
              } catch (e) {}
            }
          }
        }
      }

      // Auto-speak if enabled
      if (isTtsEnabled) speakMessage(fullContent, assistantId);

    } catch (err) {
      setMessages((p) => p.map((m) => m.id === assistantId ? { ...m, content: "⚠️ System offline or inference error." } : m));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative selection:bg-blue-500/30">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

      {/* Chat Feed */}
      <main className="flex-1 overflow-y-auto px-6 py-12 flex flex-col gap-12 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-24">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 rounded-[2rem] glass-card flex items-center justify-center mb-10 shadow-2xl shadow-blue-500/10"
            >
              <Sparkles size={48} className="text-blue-400" />
            </motion.div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-6 uppercase italic underline decoration-blue-500/20 underline-offset-8">Intelligence Agent</h1>
            <p className="text-accent text-lg leading-relaxed mb-12 opacity-60">
              Kimo Labs' local reasoning node is online. Ask about documents, research status, or multimodal processing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {SAMPLE_QUESTIONS.map((q) => (
                <button 
                  key={q} 
                  onClick={() => sendMessage(q)}
                  className="p-5 glass-card rounded-2xl text-left group hover:border-blue-500/30 transition-all font-bold"
                >
                  <span className="text-xs text-accent group-hover:text-white uppercase tracking-widest leading-none">{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-6 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                msg.role === "user" ? "bg-blue-500/10 border-blue-500/20" : "bg-white/5 border-white/10"
              }`}>
                {msg.role === "user" ? <User size={20} className="text-blue-400" /> : <Bot size={20} className="text-emerald-400" />}
              </div>
              <div className={`max-w-[85%] sm:max-w-[70%] group flex flex-col gap-3 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-8 py-5 rounded-[2rem] text-[15px] font-medium leading-[1.6] tracking-tight shadow-xl ${
                  msg.role === "user" 
                    ? "bg-blue-600 border border-blue-500/50 text-white rounded-tr-sm" 
                    : "glass-card text-[#F8F8FA] rounded-tl-sm lg:max-w-prose"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "assistant" && msg.content && (
                  <button 
                    onClick={() => speakMessage(msg.content, msg.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-[9px] font-black uppercase tracking-widest transition-all ${
                      msg.isSpeaking ? "text-blue-400 border-blue-500/30" : "text-accent opacity-0 group-hover:opacity-100 hover:text-white"
                    }`}
                  >
                    {msg.isSpeaking ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
                    {msg.isSpeaking ? "Speaking..." : "Read Aloud"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Bot size={20} className="text-emerald-400" />
            </div>
            <div className="px-10 py-6 rounded-[2.5rem] rounded-tl-sm glass-card flex items-center gap-6">
              <div className="flex gap-1.5">
                {[0, 0.2, 0.4].map((d) => (
                  <motion.div key={d} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: d }} className="w-2 h-2 rounded-full bg-emerald-400" />
                ))}
              </div>
              <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Neural Synthesis</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-10 w-full" />
      </main>

      {/* Input Footer */}
      <footer className="p-8 pt-0 bg-gradient-to-t from-[#0A0C10] via-[#0A0C10] to-transparent relative z-10 shrink-0">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-end gap-3 glass-panel rounded-[2rem] p-3 pl-6 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-2xl">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Query local cluster..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-base py-5 max-h-[160px] resize-none overflow-y-auto scrollbar-hide text-white font-semibold placeholder:opacity-40"
            />
            <div className="flex items-center gap-2 mb-2 mr-2">
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-accent hover:bg-white/10 hover:text-white"
                }`}
              >
                {isRecording ? <Square size={18} /> : <Mic size={18} />}
              </button>
              <button 
                onClick={() => sendMessage()} 
                disabled={!input.trim() || isLoading}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  input.trim() && !isLoading ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white/5 text-accent opacity-50"
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  isTtsEnabled ? "text-blue-400" : "text-accent opacity-40"
                }`}
              >
                {isTtsEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                Auto-Voice: {isTtsEnabled ? "ON" : "OFF"}
              </button>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent opacity-40 hover:opacity-100 transition-all">
                <RotateCcw size={12} /> Clear Cache
              </button>
            </div>
            <p className="text-[10px] text-accent font-black uppercase tracking-[0.2em] opacity-30">
              Active Node: Llama-3-8B-v2
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
