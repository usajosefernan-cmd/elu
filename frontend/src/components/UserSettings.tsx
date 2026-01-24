import React, { useState, useEffect } from 'react';
import { User, Wallet, Settings, Zap, Crown, Save, X } from 'lucide-react';
import { getSupabaseClient } from '../services/authService';

const supabase = getSupabaseClient();

interface UserSettingsProps {
  userId: string;
  onClose: () => void;
}

/**
 * Página de Settings/Profile completa
 * Controla: tier, tokens, presets, previews, modo auto
 */
export const UserSettings: React.FC<UserSettingsProps> = ({ userId, onClose }) => {
  const [profile, setProfile] = useState<any>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [selectedTier, setSelectedTier] = useState('AUTO');
  const [isAsyncEnabled, setIsAsyncEnabled] = useState(true);
  const [maxPreviews, setMaxPreviews] = useState(3);
  const [batchSlot1, setBatchSlot1] = useState({ type: 'AUTO', variant: 'FORENSIC' });
  const [batchSlot2, setBatchSlot2] = useState({ type: 'AUTO', variant: 'CREATIVE' });
  const [batchSlot3, setBatchSlot3] = useState({ type: 'AUTO', variant: 'BALANCED' });
  
  const [presets, setPresets] = useState<any[]>([]);
  
  // Cargar datos
  useEffect(() => {
    loadUserData();
  }, [userId]);
  
  const loadUserData = async () => {
    setIsLoading(true);
    
    try {
      // Cargar profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        // Si no existe, crear profile por defecto
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            tier: 'AUTO',
            token_balance: 100
          })
          .select()
          .single();
        
        setProfile(newProfile);
        setSelectedTier('AUTO');
      } else {
        setProfile(profileData);
        setSelectedTier(profileData.tier || 'AUTO');
      }
      
      // Cargar workflow
      const { data: workflowData, error: workflowError } = await supabase
        .from('user_upload_workflows')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (workflowError) {
        // Crear workflow por defecto
        const defaultWorkflow = {
          user_id: userId,
          is_async_enabled: true,
          max_previews: 3,
          batch_config: [
            { type: 'AUTO', variant: 'FORENSIC' },
            { type: 'AUTO', variant: 'CREATIVE' }
          ]
        };
        
        const { data: newWorkflow } = await supabase
          .from('user_upload_workflows')
          .insert(defaultWorkflow)
          .select()
          .single();
        
        setWorkflow(newWorkflow);
      } else {
        setWorkflow(workflowData);
        setIsAsyncEnabled(workflowData.is_async_enabled);
        setMaxPreviews(workflowData.max_previews || 3);
        
        const config = workflowData.batch_config || [];
        if (config[0]) setBatchSlot1(config[0]);
        if (config[1]) setBatchSlot2(config[1]);
        if (config[2]) setBatchSlot3(config[2]);
      }
      
      // Cargar presets
      const presetsResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v41/presets/${userId}`
      );
      const presetsData = await presetsResponse.json();
      
      if (presetsData.success) {
        setPresets(presetsData.presets);
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Actualizar profile
      await supabase
        .from('profiles')
        .update({
          tier: selectedTier
        })
        .eq('id', userId);
      
      // Actualizar workflow
      const batch_config = [];
      if (batchSlot1.type) batch_config.push(batchSlot1);
      if (batchSlot2.type) batch_config.push(batchSlot2);
      if (batchSlot3.type) batch_config.push(batchSlot3);
      
      await supabase
        .from('user_upload_workflows')
        .upsert({
          user_id: userId,
          is_async_enabled: isAsyncEnabled,
          max_previews: maxPreviews,
          batch_config: batch_config
        });
      
      alert('✅ Configuración guardada exitosamente');
      
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Error guardando configuración');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center">
        <div className="text-white">Cargando configuración...</div>
      </n      </div>
    );
  }
  
  const tiers = [
    { code: 'AUTO', name: 'AUTO', icon: Zap, previews: 1, price: 'Gratis' },
    { code: 'USER', name: 'USER', icon: User, previews: 1, price: '$2.99/unlock' },
    { code: 'PRO', name: 'PRO', icon: Settings, previews: 6, price: '$1.99/unlock' },
    { code: 'PRO_LUX', name: 'PRO_LUX', icon: Crown, previews: 12, price: '$0.99/unlock' }
  ];
  
  return (
    <div className="fixed inset-0 z-[300] bg-black/95 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Configuración</h1>
            <p className="text-sm text-neutral-400 mt-1">Controla tu perfil, tokens y presets</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>
        
        {/* Token Balance */}
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-400 uppercase font-semibold">Balance de Tokens</p>
              <p className="text-4xl font-bold text-white mt-1">
                {profile?.token_balance || 0}
              </p>
            </div>
            <Wallet size={48} className="text-green-400/30" />
          </div>
          <button className="mt-4 px-4 py-2 bg-green-500 text-black rounded-lg font-semibold hover:bg-green-400 transition-colors">
            Comprar Tokens
          </button>
        </div>
        
        {/* Tier Selection */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Plan de Suscripción</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {tiers.map(tier => {
              const Icon = tier.icon;
              const isActive = selectedTier === tier.code;
              
              return (
                <button
                  key={tier.code}
                  onClick={() => setSelectedTier(tier.code)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Icon size={24} className={isActive ? 'text-blue-400' : 'text-neutral-400'} />
                    <span className={`font-bold text-lg ${
                      isActive ? 'text-white' : 'text-neutral-300'
                    }`}>
                      {tier.name}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400">
                    {tier.previews} preview{tier.previews > 1 ? 's' : ''} • {tier.price}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Pocket Mode */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Modo Pocket</h2>
              <p className="text-sm text-neutral-400 mt-1">
                Procesa imágenes en segundo plano mientras guardas el móvil
              </p>
            </div>
            <button
              onClick={() => setIsAsyncEnabled(!isAsyncEnabled)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isAsyncEnabled ? 'bg-green-500' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isAsyncEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {isAsyncEnabled && (
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <div>
                <label className="text-sm font-medium text-neutral-300">Máximo de Previews</label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={maxPreviews}
                  onChange={(e) => setMaxPreviews(Number(e.target.value))}
                  className="w-full mt-2"
                />
                <p className="text-xs text-neutral-500 mt-1">{maxPreviews} variantes por imagen</p>
              </div>
              
              {/* Batch Config Slots */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-neutral-300">Configuración de Variantes</p>
                
                {[1, 2, 3].slice(0, maxPreviews).map((slot, idx) => {
                  const slotData = idx === 0 ? batchSlot1 : idx === 1 ? batchSlot2 : batchSlot3;
                  const setSlotData = idx === 0 ? setBatchSlot1 : idx === 1 ? setBatchSlot2 : setBatchSlot3;
                  
                  return (
                    <div key={slot} className="bg-neutral-800/50 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-semibold text-neutral-400">Slot {slot}</p>
                      
                      <div className="flex gap-2">
                        <select
                          value={slotData.type}
                          onChange={(e) => {
                            const type = e.target.value;
                            if (type === 'AUTO') {
                              setSlotData({ type: 'AUTO', variant: 'FORENSIC' });
                            } else {
                              setSlotData({ type: 'PRESET', preset_id: presets[0]?.id || '' });
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm"
                        >
                          <option value="AUTO">Auto</option>
                          <option value="PRESET">Preset</option>
                        </select>
                        
                        {slotData.type === 'AUTO' ? (
                          <select
                            value={slotData.variant}
                            onChange={(e) => setSlotData({ ...slotData, variant: e.target.value })}
                            className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm"
                          >
                            <option value="FORENSIC">Forense (Limpiar)</option>
                            <option value="BALANCED">Balanceado</option>
                            <option value="CREATIVE">Creativo (Sorprender)</option>
                          </select>
                        ) : (
                          <select
                            value={slotData.preset_id || ''}
                            onChange={(e) => setSlotData({ ...slotData, preset_id: e.target.value })}
                            className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm"
                          >
                            <option value="">Selecciona preset...</option>
                            {presets.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Tier Info */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Capacidades de tu Plan</h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-neutral-400">Previews mensuales:</p>
              <p className="text-neutral-400">Puede refinar:</p>
              <p className="text-neutral-400">Upscale 8K:</p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-white font-semibold">Ilimitado</p>
              <p className="text-white font-semibold">
                {selectedTier === 'PRO' || selectedTier === 'PRO_LUX' ? 'Sí' : 'No'}
              </p>
              <p className="text-white font-semibold">
                {selectedTier === 'PRO_LUX' ? 'Sí' : 'No'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Mis Presets */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Mis Presets ({presets.length})</h2>
          
          {presets.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {presets.map(preset => (
                <div key={preset.id} className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
                  {preset.thumbnail_base64 && (
                    <img
                      src={`data:image/webp;base64,${preset.thumbnail_base64}`}
                      alt={preset.name}
                      className="w-full aspect-square object-cover rounded-lg mb-2"
                    />
                  )}
                  <p className="text-sm font-medium text-white truncate">{preset.name}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    {preset.description || 'Sin descripción'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">No tienes presets guardados aún</p>
          )}
        </div>
        
        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-neutral-800 text-neutral-300 rounded-lg font-semibold hover:bg-neutral-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? 'Guardando...' : (
              <>
                <Save size={18} />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;