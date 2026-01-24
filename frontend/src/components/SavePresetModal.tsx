import React, { useState } from 'react';
import { Save, Lock, X } from 'lucide-react';

interface SavePresetModalProps {
  isVisible: boolean;
  uploadId: string;
  userId: string;
  currentSliders: Record<string, number>;
  generatedImageBase64?: string;
  onSave: (presetData: any) => Promise<void>;
  onCancel: () => void;
}

export const SavePresetModal: React.FC<SavePresetModalProps> = ({
  isVisible,
  uploadId,
  userId,
  currentSliders,
  generatedImageBase64,
  onSave,
  onCancel
}) => {
  const [presetName, setPresetName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Smart Anchors state
  const [anchors, setAnchors] = useState({
    background: false,
    lighting: false,
    clothes: false,
    pose: false,
    style: false
  });
  
  if (!isVisible) return null;
  
  const handleSave = async () => {
    if (!presetName.trim()) return;
    
    setIsSaving(true);
    
    try {
      const presetData = {
        userId,
        uploadId,
        presetName: presetName.trim(),
        description: description.trim(),
        userAnchors: anchors,
        currentSliders,
        thumbnailBase64: generatedImageBase64
      };
      
      await onSave(presetData);
      
      // Reset
      setPresetName('');
      setDescription('');
      setAnchors({
        background: false,
        lighting: false,
        clothes: false,
        pose: false,
        style: false
      });
      
    } catch (error) {
      console.error('Error saving preset:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const toggleAnchor = (key: keyof typeof anchors) => {
    setAnchors(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const hasAnyAnchor = Object.values(anchors).some(v => v);
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90">
      <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            <Save size={20} className="text-green-400" />
            <h3 className="text-lg font-bold text-white">Guardar Receta Visual</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X size={18} className="text-neutral-400" />
          </button>
        </div>
        
        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Preview de la imagen */}
          {generatedImageBase64 && (
            <div className="aspect-video rounded-lg overflow-hidden bg-neutral-950">
              <img
                src={`data:image/jpeg;base64,${generatedImageBase64}`}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          
          <p className="text-sm text-neutral-400">
            ¡Esta generación ha quedado genial! ¿Qué aspectos quieres guardar para futuras fotos?
          </p>
          
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Nombre del Preset
            </label>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Ej: Restaurante Lujoso"
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-green-500"
              autoFocus
            />
          </div>
          
          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe este estilo..."
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 resize-none"
              rows={2}
            />
          </div>
          
          {/* Smart Anchors */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-3">
              🔗 ¿Qué quieres anclar para futuras fotos?
            </label>
            
            <div className="space-y-2">
              {/* Background Anchor */}
              <button
                onClick={() => toggleAnchor('background')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                  anchors.background
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  anchors.background ? 'border-blue-500 bg-blue-500' : 'border-neutral-600'
                }`}>
                  {anchors.background && <span className="text-white text-xs">✓</span>}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">Ambiente / Fondo</div>
                  <div className="text-xs opacity-70">Guardará esta imagen como referencia del local/escena</div>
                </div>
              </button>
              
              {/* Lighting Anchor */}
              <button
                onClick={() => toggleAnchor('lighting')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                  anchors.lighting
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  anchors.lighting ? 'border-amber-500 bg-amber-500' : 'border-neutral-600'
                }`}>
                  {anchors.lighting && <span className="text-white text-xs">✓</span>}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">Iluminación</div>
                  <div className="text-xs opacity-70">Guardará la configuración de luz dramática</div>
                </div>
              </button>
              
              {/* Style Anchor */}
              <button
                onClick={() => toggleAnchor('style')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                  anchors.style
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  anchors.style ? 'border-purple-500 bg-purple-500' : 'border-neutral-600'
                }`}>
                  {anchors.style && <span className="text-white text-xs">✓</span>}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">Estilo Artístico</div>
                  <div className="text-xs opacity-70">Color grading, atmósfera, mood</div>
                </div>
              </button>
              
              {/* Clothes Anchor */}
              <button
                onClick={() => toggleAnchor('clothes')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                  anchors.clothes
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  anchors.clothes ? 'border-pink-500 bg-pink-500' : 'border-neutral-600'
                }`}>
                  {anchors.clothes && <span className="text-white text-xs">✓</span>}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">Ropa / Vestuario</div>
                  <div className="text-xs opacity-70">Mantener estilo de vestimenta (desmarca para usar tu ropa actual)</div>
                </div>
              </button>
            </div>
            
            {hasAnyAnchor && (
              <p className="text-xs text-green-400 mt-3 flex items-center gap-1">
                <Lock size={12} />
                Los elementos anclados se mantendrán en futuras fotos
              </p>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-700 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-neutral-800 text-neutral-300 rounded-lg font-medium hover:bg-neutral-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!presetName.trim() || isSaving}
            className="flex-1 px-4 py-3 bg-green-500 text-black rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <span>Guardando...</span>
            ) : (
              <>
                <Save size={18} />
                Guardar Preset
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavePresetModal;
