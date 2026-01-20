import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

export default function VisionAnalysisModal({ open, analysis, onConfirm, onCancel, generating }) {
  if (!analysis) return null;

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="bg-[#0D0D10] border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif text-primary">Análisis de Visión (v18.1)</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-8 my-6">
            <div>
                <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Narrative Anchors</h4>
                <div className="flex flex-wrap gap-2">
                    {analysis.semantic_anchors?.map((anchor, i) => (
                        <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-sm text-xs text-white/80">
                            {anchor}
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Technical Specs</h4>
                <div className="space-y-2">
                    {Object.entries(analysis.technical_assessment || {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                            <span className="text-muted-foreground capitalize">{k.replace('_', ' ')}</span>
                            <span className="font-mono text-primary">{v}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="bg-white/5 p-4 rounded-sm border border-white/10 mb-6">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Pillar Suggestions</h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                {Object.entries(analysis.suggested_pillar_settings || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                         <span className="text-white/60 font-mono">{k}</span>
                         <span className="text-primary">{v}</span>
                    </div>
                ))}
            </div>
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={onCancel} className="border-white/10 hover:bg-white/5 text-white">
                Cancelar
            </Button>
            <Button onClick={onConfirm} disabled={generating} className="bg-primary text-black hover:bg-primary/90">
                {generating ? 'Generando...' : 'Confirmar y Generar'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
