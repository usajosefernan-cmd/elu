import React, { useState } from 'react';
import { 
  Check, X, Sparkles, Wand2, Edit3, 
  Camera, Palette, Sun, ChevronRight, Zap,
  Eye, AlertTriangle, User, Layers, ChevronDown, ChevronUp
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
    exposure_issues?: string;
    has_person?: boolean;
    dominant_colors?: string[];
  };
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

// Mini bar component for showing values
const MiniBar: React.FC<{ value: number; max?: number; color: string }> = ({ value, max = 10, color }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} rounded-full transition-all`} 
        style={{ width: `${(value / max) * 100}%` }} 
      />
    </div>
    <span className="text-[9px] font-mono text-gray-400 w-4">{value}</span>
  </div>
);

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
  const [customIntent, setCustomIntent] = useState('');
  const [mode, setMode] = useState<'auto' | 'select' | 'custom'>('auto');
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  if (!isVisible) return null;

  const hasEnoughTokens = userTokens >= tokensRequired;
  
  const intents = analysis?.intents_detected || [
    "1. 🎬 Mejora Estándar - Calidad profesional",
    "2. 💎 Retrato Limpio - Look pulido",
    "3. 📸 Luz Natural - Mejora suave",
    "4. ✨ Colores Vibrantes - Pop y contraste",
    "5. 🎨 Edición Artística - Tratamiento creativo"
  ];

  const tech = analysis?.technical_diagnosis;
  const autoSettings = analysis?.auto_settings;

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onCancel} />
      
      <div className="relative bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-white/10 w-full max-w-md max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header con imagen */}
        <div className="relative h-24 flex-shrink-0">
          <img src={imageUrl} alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
          <button onClick={onCancel} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70">
            <X size={14} className="text-white/70" />
          </button>
          <div className="absolute bottom-2 left-3 flex items-center gap-2">
            <div className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center gap-1">
              <Eye size={10} className="text-emerald-400" />
              <span className="text-[9px] font-bold text-emerald-400">ANÁLISIS COMPLETO</span>
            </div>
          </div>
        </div>

        {/* Content scrollable */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          
          {/* Diagnóstico técnico completo */}
          <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
            <button 
              onClick={() => setShowFullAnalysis(!showFullAnalysis)}
              className="w-full flex items-center justify-between"
            >
              <span className="text-[10px] text-gray-400 uppercase font-bold">Diagnóstico Técnico</span>
              {showFullAnalysis ? <ChevronUp size={12} className="text-gray-500" /> : <ChevronDown size={12} className="text-gray-500" />}
            </button>
            
            {/* Siempre visible: resumen */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tech && (
                <>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    tech.noise_level > 6 ? 'bg-red-500/20 text-red-400' : 
                    tech.noise_level > 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    Ruido: {tech.noise_level}/10
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    tech.blur_level > 6 ? 'bg-red-500/20 text-red-400' : 
                    tech.blur_level > 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    Desenfoque: {tech.blur_level}/10
                  </span>
                  {tech.exposure_issues && tech.exposure_issues !== 'none' && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-orange-500/20 text-orange-400">
                      {tech.exposure_issues === 'underexposed' ? 'Subexpuesta' : 'Sobreexpuesta'}
                    </span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    tech.has_person ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {tech.has_person ? '👤 Persona' : '🖼️ Sin persona'}
                  </span>
                </>
              )}
            </div>

            {/* Expandido: configuración auto sugerida */}
            {showFullAnalysis && autoSettings && (
              <div className="mt-3 pt-2 border-t border-white/5 space-y-2">
                <p className="text-[9px] text-gray-500 uppercase">Configuración AUTO sugerida:</p>
                
                {/* PhotoScaler */}
                <div className="space-y-0.5">
                  <p className="text-[8px] text-cyan-400 font-bold">📷 PHOTO</p>
                  <div className="grid grid-cols-3 gap-x-2 gap-y-0.5">
                    {Object.entries(autoSettings.photoscaler || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <span className="text-[8px] text-gray-500 truncate">{k.replace(/_/g, ' ').slice(0, 8)}</span>
                        <MiniBar value={v as number} color="bg-cyan-500" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* StyleScaler */}
                <div className="space-y-0.5">
                  <p className="text-[8px] text-pink-400 font-bold">🎨 STYLE</p>
                  <div className="grid grid-cols-3 gap-x-2 gap-y-0.5">
                    {Object.entries(autoSettings.stylescaler || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <span className="text-[8px] text-gray-500 truncate">{k.replace(/_/g, ' ').slice(0, 8)}</span>
                        <MiniBar value={v as number} color="bg-pink-500" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* LightScaler */}
                <div className="space-y-0.5">
                  <p className="text-[8px] text-orange-400 font-bold">☀️ LIGHT</p>
                  <div className="grid grid-cols-3 gap-x-2 gap-y-0.5">
                    {Object.entries(autoSettings.lightscaler || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <span className="text-[8px] text-gray-500 truncate">{k.replace(/_/g, ' ').slice(0, 8)}</span>
                        <MiniBar value={v as number} color="bg-orange-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Director creativo */}
          {analysis?.production_analysis && (
            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1.5">Director Creativo</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                "{analysis.production_analysis.target_vision}"
              </p>
              {analysis.production_analysis.gaps_detected && analysis.production_analysis.gaps_detected.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {analysis.production_analysis.gaps_detected.map((gap, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[8px] rounded">
                      {gap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mode selector */}
          <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg">
            {[
              { key: 'auto', label: '⚡ AUTO', desc: 'IA decide' },
              { key: 'select', label: '🎯 ELEGIR', desc: 'Elige intent' },
              { key: 'custom', label: '✏️ CUSTOM', desc: 'Tu descripción' }
            ].map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key as any)}
                className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold transition-all ${
                  mode === m.key 
                    ? 'bg-amber-500 text-black' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* AUTO info */}
          {mode === 'auto' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400">AUTOMÁTICO</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Aplicará: <span className="text-white">{autoSettings?.primary_intent_used || intents[0]?.split(' - ')[0]}</span>
              </p>
            </div>
          )}

          {/* Intent selector */}
          {mode === 'select' && (
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {intents.map((intent, idx) => {
                const isSelected = selectedIntent === idx;
                const parts = intent.match(/^\d+\.\s*(.+?)\s*-\s*(.+)$/);
                const headline = parts ? parts[1] : intent;
                const desc = parts ? parts[2] : '';
                
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedIntent(idx)}
                    className={`w-full p-2 rounded-lg text-left transition-all ${
                      isSelected 
                        ? 'bg-amber-500/20 border border-amber-500/50' 
                        : 'bg-white/[0.02] border border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                          {headline}
                        </p>
                        {desc && <p className="text-[9px] text-gray-500 truncate">{desc}</p>}
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center ml-2">
                          <Check size={10} className="text-black" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom input */}
          {mode === 'custom' && (
            <textarea
              value={customIntent}
              onChange={(e) => setCustomIntent(e.target.value)}
              placeholder="Describe el look que quieres..."
              className="w-full h-20 px-2.5 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-black/40 flex-shrink-0 space-y-2">
          <button
            onClick={handleGenerate}
            disabled={!hasEnoughTokens || (mode === 'custom' && !customIntent.trim())}
            className={`w-full py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              hasEnoughTokens && (mode !== 'custom' || customIntent.trim())
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:opacity-90'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Wand2 size={16} />
            Generar · {tokensRequired} tokens
          </button>
          
          <button
            onClick={onCustomize}
            className="w-full py-1.5 text-[10px] text-gray-500 hover:text-amber-400 transition-colors flex items-center justify-center gap-1"
          >
            <Edit3 size={10} />
            Control avanzado (27 sliders)
            <ChevronRight size={10} />
          </button>

          {!hasEnoughTokens && (
            <p className="text-[10px] text-red-400 text-center">
              Tokens insuficientes ({userTokens} disponibles)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisionConfirmModal;
