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
    _v40_meta?: {
      locked_sliders?: string[];
      thumbnail_base64?: string;
    };
  };
  // V40 fields (new schema)
  sliders_config?: {
    photoscaler: Record<string, number>;
    stylescaler: Record<string, number>;
    lightscaler: Record<string, number>;
  };
  locked_sliders?: string[];
  thumbnail_base64?: string;
  thumbnail_url?: string;
  style_lock_prompt?: string;
  seed?: number;
  temperature?: number;
  // Legacy fields
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

// Get user presets V40 (with thumbnails and locked sliders)
export const getUserPresets = async (userId: string): Promise<SmartPreset[]> => {
  try {
    // Try v40 endpoint first
    const response = await fetch(`${BACKEND_URL}/api/presets/v40/user/${userId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.presets;
    }
    return [];
  } catch (error) {
    console.error('Error fetching user presets:', error);
    // Fallback to old endpoint
    try {
      const response = await fetch(`${BACKEND_URL}/api/presets/user/${userId}`);
      const data = await response.json();
      return data.success ? data.presets : [];
    } catch (e) {
      return [];
    }
  }
};

// Save user preset V40 with Dictator Prompt & Thumbnail
export const saveUserPreset = async (
  userId: string,
  name: string,
  sliderValues: SmartPreset['slider_values'],
  lockedPillars: string[] = [],
  narrativeAnchor?: string,
  sourceImage?: string // Base64 or URL of original image for thumbnail
): Promise<SmartPreset | null> => {
  try {
    // Flatten slider values to config format
    const sliders_config = {
      photoscaler: sliderValues.photoscaler || {},
      stylescaler: sliderValues.stylescaler || {},
      lightscaler: sliderValues.lightscaler || {}
    };
    
    // Use v40 endpoint with Dictator Prompt
    const response = await fetch(`${BACKEND_URL}/api/presets/v40/save-style`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        name,
        sliders_config,
        source_image: sourceImage,  // For thumbnail generation
        seed: Math.floor(Math.random() * 1000000000),
        temperature: 0.75
      })
    });
    
    const data = await response.json();
    if (data.success && data.preset) {
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
