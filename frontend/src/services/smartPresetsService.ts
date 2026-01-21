// LuxScaler v28 - Smart Presets Service
// Frontend service for preset management

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export interface SmartPreset {
  id: string;
  name: string;
  slider_values: {
    photoscaler: Record<string, number>;
    stylescaler: Record<string, number>;
    lightscaler: Record<string, number>;
  };
  locked_pillars: string[];
  narrative_anchor?: string;
  smart_locks?: Record<string, string>;
  user_id?: string;
  is_system?: boolean;
  created_at?: string;
}

export interface SliderConfig {
  photoscaler: { sliders: Array<{ name: string; value: number }> };
  stylescaler: { sliders: Array<{ name: string; value: number }> };
  lightscaler: { sliders: Array<{ name: string; value: number }> };
}

// Convert preset slider_values to SliderConfig format
export const presetToSliderConfig = (preset: SmartPreset): SliderConfig => {
  return {
    photoscaler: {
      sliders: Object.entries(preset.slider_values.photoscaler || {}).map(([name, value]) => ({ name, value }))
    },
    stylescaler: {
      sliders: Object.entries(preset.slider_values.stylescaler || {}).map(([name, value]) => ({ name, value }))
    },
    lightscaler: {
      sliders: Object.entries(preset.slider_values.lightscaler || {}).map(([name, value]) => ({ name, value }))
    }
  };
};

// Get system presets
export const getSystemPresets = async (): Promise<SmartPreset[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/presets/system`);
    const data = await response.json();
    
    if (data.success) {
      return data.presets;
    }
    return [];
  } catch (error) {
    console.error('Error fetching system presets:', error);
    return [];
  }
};

// Get user presets
export const getUserPresets = async (userId: string): Promise<SmartPreset[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/presets/user/${userId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.presets;
    }
    return [];
  } catch (error) {
    console.error('Error fetching user presets:', error);
    return [];
  }
};

// Save user preset
export const saveUserPreset = async (
  userId: string,
  name: string,
  sliderValues: SmartPreset['slider_values'],
  lockedPillars: string[] = [],
  narrativeAnchor?: string
): Promise<SmartPreset | null> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/presets/user/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        slider_values: sliderValues,
        locked_pillars: lockedPillars,
        narrative_anchor: narrativeAnchor
      })
    });
    
    const data = await response.json();
    if (data.success) {
      return data.preset;
    }
    return null;
  } catch (error) {
    console.error('Error saving preset:', error);
    return null;
  }
};

// Delete user preset
export const deleteUserPreset = async (userId: string, presetId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/presets/user/${userId}/${presetId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error deleting preset:', error);
    return false;
  }
};

// Blend preset with auto settings
export const blendPresetWithAuto = async (
  presetId: string,
  autoSettings: Record<string, Record<string, number>>,
  blendFactor: number = 0.5
): Promise<SliderConfig | null> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/presets/blend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preset_id: presetId,
        auto_settings: autoSettings,
        blend_factor: blendFactor
      })
    });
    
    const data = await response.json();
    if (data.success) {
      return data.blended_config;
    }
    return null;
  } catch (error) {
    console.error('Error blending preset:', error);
    return null;
  }
};

export default {
  getSystemPresets,
  getUserPresets,
  saveUserPreset,
  deleteUserPreset,
  blendPresetWithAuto,
  presetToSliderConfig
};
