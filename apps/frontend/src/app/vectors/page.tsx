"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Search, RefreshCw, Layers, FileText, Activity, Terminal, Trash2, ArrowRight, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function VectorPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

  const fetchCollections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/collections`);
      if (!res.ok) throw new Error("Connection failed");
      const data = await res.json();
      setCollections(data);
    } catch (err) {
      setError("Failed to synchronize with the Vector Lake node.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [API_URL]);

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-7xl mx-auto px-10 py-16 space-y-16">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <Database size={28} className="text-white text-glow" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] leading-none mb-1 italic opacity-60">
                  Storage Infrastructure
                </span>
                <h2 className="text-4xl font-black tracking-tight uppercase italic text-glow-white">Vector Index</h2>
              </div>
            </div>
            <p className="text-muted-foreground text-lg max-w-xl font-medium opacity-60 italic">
              Diagnostic interface for the ChromaDB intelligence lake. Monitor document embeddings, collection health, and metadata distribution.
            </p>
          </div>
          
          <Button 
            onClick={fetchCollections} 
            disabled={isLoading}
            className="h-16 px-8 rounded-2xl bg-white text-black font-black uppercase italic tracking-widest text-[11px] transition-all hover:bg-neutral-200"
          >
            {isLoading ? <RefreshCw className="animate-spin mr-3" size={16} /> : <RefreshCw className="mr-3" size={16} />}
            Sync Node Diagnostics
          </Button>
        </div>

        {/* Diagnostics Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Node Summary Sidecar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel p-10 rounded-[3rem] space-y-8 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]" />
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-3">
                  <Activity size={14} className="text-white opacity-40" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Node Vitals</span>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: "Active Nodes", value: "01", icon: Layers },
                    { label: "Storage Path", value: "./data/db", icon: FileText },
                    { label: "Engine Type", value: "Chroma v0.4", icon: Zap },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3">
                        <stat.icon size={12} className="text-white opacity-20" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase italic tracking-tight">{stat.label}</span>
                      </div>
                      <span className="text-[11px] font-black uppercase text-white italic">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative z-10">
                <div className="flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-widest italic">
                  <Info size={12} />
                  <span>Isolation Protocol</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground font-medium italic opacity-60">
                  Data in this lake is 100% air-gapped on your local filesystem. Periodic pruning is recommended for high-volume ingestion nodes.
                </p>
              </div>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/10 text-white/40 flex items-center gap-4"
              >
                <Terminal size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest italic">{error}</span>
              </motion.div>
            )}
          </div>

          {/* Collections Grid */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {collections.length > 0 ? (
                    collections.map((collection, i) => (
                      <motion.div 
                        key={collection.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel p-8 rounded-[2.5rem] border-white/5 group hover:border-white/20 transition-all duration-500 bg-white/[0.01]"
                      >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                              <Layers size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-black uppercase tracking-tighter italic">{collection.name}</h3>
                                <Badge variant="outline" className="border-white/10 text-white/40 text-[8px] font-black uppercase tracking-[0.2em] px-2 italic">
                                  Namespace
                                </Badge>
                              </div>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-40">
                                {collection.count} EMBEDDED DOCUMENTS
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <button className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                              View Segment
                              <ArrowRight size={12} />
                            </button>
                            <button className="h-12 w-12 rounded-xl bg-white/[0.03] border border-white/5 text-white/20 hover:text-white transition-all flex items-center justify-center">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01] opacity-20">
                      <Terminal size={40} className="mb-6 opacity-30" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] italic mb-2">No Signal in Matrix</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 italic">Awaiting Knowledge Ingestion</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
            
            <div className="p-10 rounded-[3rem] border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                  <RefreshCw size={24} className="text-white opacity-20" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase italic tracking-tight mb-1">Background Synchronization</h4>
                  <p className="text-[10px] text-muted-foreground font-medium italic opacity-40">
                    Neural agents are perpetually indexing documents in the /docs local path.
                  </p>
                </div>
              </div>
              <button className="w-full md:w-auto h-14 px-10 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                Sync /docs Segment
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
