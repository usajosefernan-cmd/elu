import React, { useState } from 'react';
import { 
  Check, X, Sparkles, Wand2, Edit3, 
  Camera, Palette, Sun, ChevronRight, Zap
} from 'lucide-react';

interface VisionAnalysis {
  production_analysis?: {
    current_quality: string;
    target_vision: string;
    gaps_detected?: string[];
  };
  intents_detected?: string[];
  auto_settings?: {
    primary_intent_used: string;
    photoscaler: Record<string, number>;
    stylescaler: Record<string, number>;
    lightscaler: Record<string, number>;
  };
  technical_diagnosis?: {
    noise_level: number;
    blur_level: number;
    has_person?: boolean;
  };
  // Legacy support
  semantic_anchors?: string[];
  suggested_settings?: Record<string, number>;
  _defaultMixer?: any;
}

interface VisionConfirmModalProps {
  isVisible: boolean;
  imageUrl: string;
  analysis: VisionAnalysis | null;
  onConfirm: (config: { mode: 'auto' | 'intent' | 'custom'; intentIndex?: number; customIntent?: string; settings?: any }) => void;
  onCustomize: () => void;
  onCancel: () => void;
  tokensRequired: number;
  userTokens: number;
}

export const VisionConfirmModal: React.FC<VisionConfirmModalProps> = ({
  isVisible,
  imageUrl,
  analysis,
  onConfirm,
  onCustomize,
  onCancel,
  tokensRequired,
  userTokens,
}) => {
  const [selectedIntent, setSelectedIntent] = useState<number>(0);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customIntent, setCustomIntent] = useState('');
  const [mode, setMode] = useState<'auto' | 'select' | 'custom'>('auto');

  if (!isVisible) return null;

  const hasEnoughTokens = userTokens >= tokensRequired;
  
  // Get intents from new or legacy format
  const intents = analysis?.intents_detected || [
    "1. 🎬 Mejora Estándar - Calidad profesional",
    "2. 💎 Retrato Limpio - Look pulido",
    "3. 📸 Luz Natural - Mejora suave",
    "4. ✨ Colores Vibrantes - Pop y contraste",
    "5. 🎨 Edición Artística - Tratamiento creativo"
  ];

  const productionAnalysis = analysis?.production_analysis || {
    current_quality: "Imagen analizada",
    target_vision: "Mejora profesional"
  };

  const handleGenerate = () => {
    if (mode === 'auto') {
      onConfirm({ mode: 'auto', settings: analysis?.auto_settings });
    } else if (mode === 'custom' && customIntent.trim()) {
      onConfirm({ mode: 'custom', customIntent: customIntent.trim() });
    } else {
      onConfirm({ mode: 'intent', intentIndex: selectedIntent, settings: analysis?.auto_settings });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onCancel} />
      
      <div className="relative bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header compacto con preview */}
        <div className="relative">
          {/* Image preview pequeño */}
          <div className="h-32 overflow-hidden relative">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
            
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-3 right-3 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={16} className="text-white/70" />
            </button>
          </div>

          {/* Analysis badge */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-lumen-gold/20 border border-lumen-gold/30 rounded-full">
                <Sparkles size={14} className="text-lumen-gold" />
                <span className="text-xs font-bold text-lumen-gold">ANÁLISIS COMPLETADO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          
          {/* Technical Diagnosis - Compact badges */}
          {analysis?.technical_diagnosis && (
            <div className="flex flex-wrap gap-1.5">
              <div className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase flex items-center gap-1 ${
                analysis.technical_diagnosis.noise_level > 5 ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
              }`}>
                <span>Ruido: {analysis.technical_diagnosis.noise_level}/10</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase flex items-center gap-1 ${
                analysis.technical_diagnosis.blur_level > 5 ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
              }`}>
                <span>Desenfoque: {analysis.technical_diagnosis.blur_level}/10</span>
              </div>
              {analysis.technical_diagnosis.has_person !== undefined && (
                <div className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
                  analysis.technical_diagnosis.has_person ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {analysis.technical_diagnosis.has_person ? '👤 Persona detectada' : '🖼️ Sin persona'}
                </div>
              )}
            </div>
          )}

          {/* Production Analysis - Compacto */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-lumen-gold/10 flex items-center justify-center flex-shrink-0">
                <Camera size={16} className="text-lumen-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Director Creativo dice:</p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  "{productionAnalysis.target_vision}"
                </p>
              </div>
            </div>
          </div>

          {/* Mode selector - Tabs compactos */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
            <button
              onClick={() => { setMode('auto'); setShowCustomInput(false); }}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                mode === 'auto' 
                  ? 'bg-lumen-gold text-black' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              ⚡ AUTO
            </button>
            <button
              onClick={() => { setMode('select'); setShowCustomInput(false); }}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                mode === 'select' 
                  ? 'bg-lumen-gold text-black' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🎯 ELEGIR
            </button>
            <button
              onClick={() => { setMode('custom'); setShowCustomInput(true); }}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                mode === 'custom' 
                  ? 'bg-lumen-gold text-black' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              ✏️ MANUAL
            </button>
          </div>

          {/* AUTO Mode info */}
          {mode === 'auto' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">MODO AUTOMÁTICO</span>
              </div>
              <p className="text-xs text-gray-400">
                La IA aplicará la mejor configuración detectada: 
                <span className="text-white font-medium block mt-1">
                  {analysis?.auto_settings?.primary_intent_used || intents[0]?.split(' - ')[0]?.substring(3)}
                </span>
              </p>
            </div>
          )}

          {/* Intent selector - Lista compacta */}
          {mode === 'select' && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {intents.map((intent, idx) => {
                const isSelected = selectedIntent === idx;
                // Parse intent: "1. 🎬 Headline - Description"
                const parts = intent.match(/^\d+\.\s*(.+?)\s*-\s*(.+)$/);
                const headline = parts ? parts[1] : intent;
                const desc = parts ? parts[2] : '';
                
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedIntent(idx)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      isSelected 
                        ? 'bg-lumen-gold/20 border-2 border-lumen-gold/50' 
                        : 'bg-white/5 border border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-lumen-gold' : 'text-white'}`}>
                          {headline}
                        </p>
                        {desc && (
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">{desc}</p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-lumen-gold flex items-center justify-center flex-shrink-0 ml-2">
                          <Check size={12} className="text-black" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom intent input */}
          {mode === 'custom' && (
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">
                Describe el look que quieres:
              </label>
              <textarea
                value={customIntent}
                onChange={(e) => setCustomIntent(e.target.value)}
                placeholder="Ej: Retrato editorial estilo Vanity Fair con iluminación dramática..."
                className="w-full h-24 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lumen-gold/50 resize-none"
              />
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!hasEnoughTokens || (mode === 'custom' && !customIntent.trim())}
            className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              hasEnoughTokens && (mode !== 'custom' || customIntent.trim())
                ? 'bg-gradient-to-r from-lumen-gold to-yellow-500 text-black hover:opacity-90 shadow-lg shadow-lumen-gold/20'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Wand2 size={18} />
            <span>GENERAR IMAGEN</span>
            <span className="text-xs opacity-70">({tokensRequired} tokens)</span>
          </button>

          {/* Advanced options link */}
          <button
            onClick={onCustomize}
            className="w-full py-2 text-xs text-gray-500 hover:text-lumen-gold transition-colors flex items-center justify-center gap-1"
          >
            <Edit3 size={12} />
            Control avanzado (27 sliders)
            <ChevronRight size={12} />
          </button>

          {/* Token warning */}
          {!hasEnoughTokens && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
              <p className="text-xs text-red-400">
                Tokens insuficientes. Necesitas {tokensRequired}, tienes {userTokens}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
