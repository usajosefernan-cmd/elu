import React from 'react';
import { 
  Check, X, AlertTriangle, Camera, Palette, Sun, 
  Sparkles, Eye, Shield, Zap, ChevronRight 
} from 'lucide-react';

interface VisionAnalysis {
  technical_score: number;
  semantic_anchors: string[];
  suggested_settings: Record<string, number>;
  detected_issues: string[];
  recommended_profile: 'auto' | 'user' | 'pro' | 'prolux';
}

interface VisionConfirmModalProps {
  isVisible: boolean;
  imageUrl: string;
  analysis: VisionAnalysis | null;
  onConfirm: (useAuto: boolean) => void;
  onCustomize: () => void;
  onCancel: () => void;
  tokensRequired: number;
  userTokens: number;
}

const PROFILE_COLORS = {
  auto: 'emerald',
  user: 'blue',
  pro: 'purple',
  prolux: 'amber',
};

const PROFILE_NAMES = {
  auto: 'AUTO',
  user: 'USER',
  pro: 'PRO',
  prolux: 'PROLUX',
};

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
  if (!isVisible) return null;

  const hasEnoughTokens = userTokens >= tokensRequired;
  const recommendedProfile = analysis?.recommended_profile || 'auto';
  const color = PROFILE_COLORS[recommendedProfile];

  // Count active suggested sliders
  const activeSliders = Object.entries(analysis?.suggested_settings || {})
    .filter(([_, value]) => value > 0).length;

  // Categorize issues by severity
  const criticalIssues = analysis?.detected_issues?.filter(i => 
    i.toLowerCase().includes('blur') || 
    i.toLowerCase().includes('noise') || 
    i.toLowerCase().includes('distortion')
  ) || [];

  const minorIssues = analysis?.detected_issues?.filter(i => 
    !criticalIssues.includes(i)
  ) || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onCancel} />
      
      <div className="relative bg-gradient-to-b from-[#0d0d0d] to-[#080808] border border-white/10 w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl">
        
        {/* Header with Image Preview */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={imageUrl} 
            alt="Análisis" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent" />
          
          {/* Technical Score Badge */}
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="text-2xl font-bold text-white">{analysis?.technical_score || '?'}</span>
              <span className="text-[10px] text-gray-400 uppercase">/10</span>
            </div>
            <p className="text-[8px] text-gray-500 uppercase tracking-wider">Calidad Técnica</p>
          </div>

          {/* Status */}
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 rounded-full px-3 py-1">
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Análisis Completado</span>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="p-4 space-y-4">
          
          {/* Recommended Profile */}
          <div className={`bg-${color}-500/10 border border-${color}-500/30 rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Perfil Recomendado</p>
                <p className={`text-xl font-black text-${color}-400 tracking-widest`}>
                  {PROFILE_NAMES[recommendedProfile]}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full bg-${color}-500/20 flex items-center justify-center`}>
                {recommendedProfile === 'auto' && <Sparkles className={`w-6 h-6 text-${color}-400`} />}
                {recommendedProfile === 'user' && <Camera className={`w-6 h-6 text-${color}-400`} />}
                {recommendedProfile === 'pro' && <Palette className={`w-6 h-6 text-${color}-400`} />}
                {recommendedProfile === 'prolux' && <Zap className={`w-6 h-6 text-${color}-400`} />}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {activeSliders} ajustes sugeridos por la IA
            </p>
          </div>

          {/* Semantic Anchors (Identity Lock) */}
          {analysis?.semantic_anchors && analysis.semantic_anchors.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Identity Lock</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.semantic_anchors.map((anchor, i) => (
                  <span 
                    key={i}
                    className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-[10px] text-cyan-300"
                  >
                    {anchor}
                  </span>
                ))}
              </div>
              <p className="text-[9px] text-gray-600 mt-2">
                Estos elementos se preservarán durante el procesamiento
              </p>
            </div>
          )}

          {/* Detected Issues */}
          {(criticalIssues.length > 0 || minorIssues.length > 0) && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Problemas Detectados</span>
              </div>
              <div className="space-y-1">
                {criticalIssues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-xs text-red-300">{issue}</span>
                  </div>
                ))}
                {minorIssues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    <span className="text-xs text-yellow-300">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Token Cost */}
          <div className="flex items-center justify-between py-3 border-t border-white/10">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Costo</p>
              <p className="text-lg font-bold text-white">{tokensRequired} <span className="text-[10px] text-gray-400">TKN</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase">Tu Balance</p>
              <p className={`text-lg font-bold ${hasEnoughTokens ? 'text-emerald-400' : 'text-red-400'}`}>
                {userTokens.toLocaleString()} <span className="text-[10px] text-gray-400">TKN</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {hasEnoughTokens ? (
            <>
              <button
                onClick={() => onConfirm(true)}
                className={`w-full py-4 bg-${color}-500 text-black font-black rounded-xl hover:bg-${color}-400 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2`}
              >
                <Sparkles className="w-4 h-4" />
                Procesar con {PROFILE_NAMES[recommendedProfile]}
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onCustomize}
                className="w-full py-3 bg-white/5 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
              >
                Personalizar Configuración
              </button>
            </>
          ) : (
            <button
              onClick={() => window.location.href = '/pricing'}
              className="w-full py-4 bg-lumen-gold text-black font-black rounded-xl hover:bg-white transition-all text-sm uppercase tracking-widest"
            >
              Recargar Tokens
            </button>
          )}
          <button
            onClick={onCancel}
            className="w-full py-2 text-gray-500 hover:text-white text-xs uppercase tracking-wider transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisionConfirmModal;
