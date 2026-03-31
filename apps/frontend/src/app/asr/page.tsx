"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Upload, Play, CheckCircle, AlertCircle, Loader2, Music, Trash2, Download, Activity } from "lucide-react";

export default function ASRPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // -- Recording Logic --
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
      console.error("Error accessing mic:", err);
      setError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // -- Upload Logic --
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  // -- Transcription Logic --
  const runTranscription = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    setTranscription(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");

    try {
      const res = await fetch(`${API_URL}/asr`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Transcription failed");
      
      const data = await res.json();
      setTranscription(data);
    } catch (err) {
      setError("Failed to transcribe audio. Ensure backend is running.");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-10 py-12 scrollbar-hide">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Mic size={20} className="text-blue-400" />
              </div>
              <h2 className="text-3xl font-black tracking-tight uppercase italic underline decoration-blue-500/30">Speech Lab</h2>
            </div>
            <p className="text-accent opacity-60 text-lg max-w-xl">
              Research workbench for high-performance Whisper transcription. Process local audio streams with near-zero latency.
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F8F8FA]">Whisper v3 Active</span>
          </div>
        </div>

        {/* Recording Zone */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-10 rounded-[2.5rem] flex flex-col items-center justify-center gap-8 relative overflow-hidden group">
            {/* Visualizer Mock */}
            <div className="flex items-end gap-1.5 h-16 w-full justify-center opacity-20 group-hover:opacity-40 transition-opacity">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={isRecording ? { height: [10, Math.random() * 60 + 10, 10] } : { height: 10 }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                  className="w-1.5 bg-blue-500 rounded-full"
                />
              ))}
            </div>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                isRecording 
                ? "bg-red-500/20 border-2 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-pulse" 
                : "bg-blue-500 border-2 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:scale-105"
              }`}
            >
              {isRecording ? <Square size={32} className="text-red-500" /> : <Mic size={32} className="text-white" />}
            </button>

            <div className="text-center space-y-2">
              <p className="font-black text-lg uppercase tracking-tight">
                {isRecording ? "Listening..." : "Initialize Mic"}
              </p>
              <p className="text-xs text-accent opacity-50 uppercase tracking-widest">
                {isRecording ? "Capturing Local Stream" : "Ready to process"}
              </p>
            </div>

            <div className="absolute top-6 right-6">
              <label className="cursor-pointer group/label">
                <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                <Upload size={18} className="text-accent opacity-40 group-hover/label:opacity-100 group-hover/label:text-blue-400 transition-all" />
              </label>
            </div>
          </div>

          <div className="glass-panel p-10 rounded-[2.5rem] flex flex-col justify-between overflow-hidden">
            <div className="space-y-6">
              <div className="flex items-center gap-3 opacity-40">
                <Music size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Buffer Status</span>
              </div>
              
              {audioUrl ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Play size={18} className="text-blue-400" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <audio controls src={audioUrl} className="w-full h-8 opacity-60" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={runTranscription}
                      disabled={isTranscribing}
                      className="flex-1 py-4 rounded-2xl bg-white text-[#0A0C10] font-black text-xs uppercase tracking-widest hover:bg-blue-400 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isTranscribing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      {isTranscribing ? "Processing..." : "Run Analysis"}
                    </button>
                    <button 
                      onClick={() => { setAudioBlob(null); setAudioUrl(null); setTranscription(null); }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 text-accent hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl opacity-20">
                  <Activity size={32} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none">Awaiting Capture</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle size={16} />
                <span className="text-[10px] font-black uppercase">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Results Console */}
        <AnimatePresence>
          {transcription && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="glass-panel p-10 rounded-[3rem] space-y-8"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-accent opacity-40 uppercase tracking-widest">Transcription Result</p>
                  <h3 className="text-xl font-black uppercase tracking-tight">Analysis Complete</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-accent opacity-40 uppercase tracking-widest">Language</p>
                    <p className="text-sm font-black uppercase tracking-tight text-blue-400">{transcription.language} ({(transcription.language_probability * 100).toFixed(1)}%)</p>
                  </div>
                </div>
              </div>

              <div className="min-h-[200px] p-8 rounded-2xl bg-black/40 border border-white/5 font-medium text-lg leading-relaxed text-white/80">
                {transcription.text}
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-accent opacity-40 uppercase tracking-widest">Segments</p>
                    <p className="text-xs font-black uppercase tracking-tight">{transcription.segments.length} BLOCKS</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const blob = new Blob([transcription.text], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "transcript.txt";
                    a.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  <Download size={14} />
                  Export Data
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
