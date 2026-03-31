"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, RefreshCcw, Box, ArrowRight,
  Shield, Activity, Layers, Trash2, Info, CheckCircle
} from "lucide-react";

export default function VectorLab() {
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/collections`);
      if (!res.ok) throw new Error("Connection failed");
      const data = await res.json();
      setCollections(data);
    } catch (err) {
      setError("Unable to connect to ChromaDB Cluster.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <div className="h-full overflow-y-auto px-10 py-12 scrollbar-hide">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Database size={20} />
              </div>
              <h2 className="text-3xl font-black tracking-tight uppercase italic underline decoration-orange-500/30">Vector Lab</h2>
            </div>
            <p className="text-accent opacity-60 text-lg max-w-xl">
              Virtual observability console for local embeddings and collections. Manage vector density and cluster health.
            </p>
          </div>
          
          <button 
            onClick={fetchCollections}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""} />
            Sync Cluster
          </button>
        </div>

        {/* Status Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-[2rem] space-y-3">
            <div className="flex items-center gap-3 opacity-40">
              <Activity size={14} />
              <p className="text-[9px] font-black uppercase tracking-widest">Cluster Status</p>
            </div>
            <p className="text-2xl font-black uppercase tracking-tight text-emerald-400">Online</p>
          </div>
          <div className="glass-panel p-6 rounded-[2rem] space-y-3">
            <div className="flex items-center gap-3 opacity-40">
              <Layers size={14} />
              <p className="text-[9px] font-black uppercase tracking-widest">Active Collections</p>
            </div>
            <p className="text-2xl font-black uppercase tracking-tight">{collections.length}</p>
          </div>
          <div className="glass-panel p-6 rounded-[2rem] space-y-3">
            <div className="flex items-center gap-3 opacity-40">
              <Shield size={14} />
              <p className="text-[9px] font-black uppercase tracking-widest">Isolated Storage</p>
            </div>
            <p className="text-2xl font-black uppercase tracking-tight">Active</p>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-accent opacity-40 uppercase tracking-[0.3em]">Namespace Management</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {collections.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-10 rounded-[3rem] group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[80px] rounded-full" />
                  
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-accent group-hover:text-orange-400 transition-colors">
                        <Box size={24} />
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black opacity-30 uppercase tracking-widest">Records</p>
                        <p className="text-xl font-black">{c.count}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-2xl font-black uppercase tracking-tight">{c.name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(c.metadata || {}).map(([k, v]: [any, any]) => (
                          <div key={k} className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-bold uppercase text-accent/60 tracking-tight">
                            {k}: {String(v)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <button className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        Inspect Node <ArrowRight size={14} />
                      </button>
                      <button className="p-4 rounded-2xl bg-white/5 border border-white/5 text-accent hover:text-red-400 hover:bg-red-500/5 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {collections.length === 0 && !isLoading && (
              <div className="lg:col-span-2 py-32 flex flex-col items-center justify-center glass-panel rounded-[3rem] opacity-20 space-y-6">
                <Box size={64} />
                <p className="text-xs font-black uppercase tracking-[0.3em]">No Active Collections Found</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-8 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-4">
            <Info size={20} />
            <p className="font-black uppercase text-xs tracking-widest">{error}</p>
          </div>
        )}

      </div>
    </div>
  );
}
