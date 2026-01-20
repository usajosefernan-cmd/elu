import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Save, X, Sparkles, Send } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';

export default function ResultOverlay({ open, onClose, resultData, onSave, onRefine }) {
  const [refineInput, setRefineInput] = useState('');
  
  // Parse result if it's a JSON string, otherwise use as raw text
  let parsedResult = null;
  let rawText = "";
  
  if (typeof resultData === 'string') {
      rawText = resultData;
      try {
          // Try to find JSON block
          if (resultData.includes('{')) {
             const jsonStr = resultData.substring(resultData.indexOf('{'), resultData.lastIndexOf('}') + 1);
             parsedResult = JSON.parse(jsonStr);
          }
      } catch (e) {
          console.log("Not JSON");
      }
  } else if (typeof resultData === 'object') {
      parsedResult = resultData;
  }

  // Placeholder "Generated Image" - In real app, this comes from the generation API
  const generatedImage = "https://images.pexels.com/photos/34840277/pexels-photo-34840277.jpeg"; 

  const handleRefine = () => {
      if (!refineInput) return;
      onRefine(refineInput);
      setRefineInput('');
      toast.info("Sending refinement request to Gemini 1.5...");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-8"
        >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                <X size={32} />
            </button>

            <div className="w-full max-w-7xl h-full grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
                
                {/* IMAGE AREA (8 Cols) */}
                <div className="lg:col-span-8 flex flex-col h-full relative group">
                    <div className="flex-1 relative rounded-sm overflow-hidden border border-white/10 bg-black">
                        <img 
                            src={generatedImage} 
                            alt="Generated Result" 
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-widest text-primary font-mono">
                                Gemini 3 Pro Output
                            </span>
                        </div>
                    </div>

                    <div className="h-20 flex items-center justify-between mt-6">
                        <div className="flex gap-4">
                            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white gap-2 uppercase tracking-widest text-xs h-12 px-6" onClick={() => toast.success("Downloaded 8K TIFF")}>
                                <Download size={16} /> Download
                            </Button>
                            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white gap-2 uppercase tracking-widest text-xs h-12 px-6" onClick={() => toast.success("Link copied")}>
                                <Share2 size={16} /> Share
                            </Button>
                        </div>
                        <Button className="bg-primary text-black hover:bg-primary/90 gap-2 uppercase tracking-widest text-xs h-12 px-8 font-bold" onClick={onSave}>
                            <Save size={16} /> Save to Gallery
                        </Button>
                    </div>
                </div>

                {/* DATA & REFINE (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col h-full bg-[#0D0D10] border border-white/10 rounded-sm overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-2xl font-serif text-white mb-1">Analysis & Forensics</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">System Report v27.0</p>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        {parsedResult ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-[10px] uppercase tracking-widest text-primary mb-2">Processing Steps</h3>
                                    <div className="space-y-1">
                                        {parsedResult.processing?.map((step, i) => (
                                            <div key={i} className="text-xs font-mono text-white/70 border-l border-white/10 pl-2">
                                                {step}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-[10px] uppercase tracking-widest text-primary mb-2">Reconstruction Prompt</h3>
                                    <p className="text-sm font-serif text-white/90 italic leading-relaxed">
                                        "{parsedResult.prompt}"
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs font-mono text-white/60 whitespace-pre-wrap leading-relaxed">
                                {rawText || "No data available."}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-6 border-t border-white/10 bg-white/5">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={14} className="text-primary" />
                            <span className="text-[10px] uppercase tracking-widest text-white font-bold">Refine / Inpaint</span>
                        </div>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={refineInput}
                                onChange={(e) => setRefineInput(e.target.value)}
                                placeholder="Ask Gemini 1.5 to refine..."
                                className="w-full bg-black/50 border border-white/10 rounded-sm py-3 pl-4 pr-10 text-sm text-white focus:border-primary outline-none placeholder:text-white/20"
                                onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                            />
                            <button 
                                onClick={handleRefine}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-primary transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
