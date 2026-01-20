
export enum AgentStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  CONFIGURING = 'CONFIGURING',
  GENERATING_PREVIEWS = 'GENERATING_PREVIEWS',
  SELECTING = 'SELECTING',
  SCULPTING = 'SCULPTING',
  UPSCALING = 'UPSCALING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface AgentMessage {
  text: string;
  type: 'info' | 'success' | 'error';
}

export type SubscriptionTier = 'free' | 'beta_founder' | 'pro_monthly';
export type SubscriptionStatus = 'active' | 'inactive' | 'past_due' | 'cancelled';

export type UserProfileType = 'auto' | 'user' | 'pro' | 'prolux';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  tokens: number;
  tokens_balance?: number; // DB Field match (optional fallback)
  is_admin: boolean;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  // v28 New Fields
  profile_type: UserProfileType;
  total_tokens_purchased: number;
  total_generations: number;
}

// --- DB SCHEMA TYPES ---

export interface ArchivedVariation {
  id: string;
  generation_id: string;
  type: string;
  style_id: string;
  styleName?: string;
  image_path: string;
  prompt_payload: any;
  seed: number;
  rating: number;
  is_selected: boolean;
  feedback?: string;
  created_at: string;
  engineering_report?: {
    opticalStack?: string;
    role?: string;
    [key: string]: any;
  };
}

export interface GenerationSession {
  id: string;
  user_id: string;
  status: string;
  original_image_path: string;
  original_image_thumbnail?: string;
  created_at: string;
  semantic_analysis?: SemanticAnalysis;
  variations: ArchivedVariation[];
}

// --- LUXSCALER CONFIG ---

// === FORMATOS DE SALIDA VFX PROFESIONAL ===
export type OutputFormat = 'WEBP' | 'PNG16' | 'TIFF32' | 'EXR';

export interface LuxMixer {
  // PHASE 5: PRODUCTION MIXER
  stylism: number;   // 0-10: Vibe/Color Grading Strength
  atrezzo: number;   // 0-10: Scenography & Decluttering
  skin_bio: number;  // 0-10: Biological Perfection / Retouch
  lighting: number;  // 0-10: Lighting Complexity / Drama
  restoration: number; // 0-10: Forensic Restoration Strength (SLC-R V2.0)

  // Technical Upscaler (Resolution)
  upScaler: number;  // 0-3: Density/Resolution mapping

  // VFX Export Format (PRO)
  outputFormat?: OutputFormat;  // WEBP=web, PNG16=high quality, TIFF32=HDR, EXR=VFX
}

export interface ForensicConfig {
  // PHASE 2 (CORRECTIVE) - "The First Filter"
  focus_strength: number; // 0-10. 10 = Clinical Sharpness.
  geometry_correction: boolean; // ON/OFF. Fixes Lens Distortion & Horizon. Warning: Shifts identity slightly.
  signal_balance: number; // 0-10. 10 = Neutral 5500K White Balance.
}

export type LuxShotType =
  | 'FOOD' | 'HUMAN_SOCIAL' | 'HUMAN_CORP' | 'HUMAN_MED' | 'ARCH' | 'PRODUCT' | 'PET' | 'LANDSCAPE' | 'SELFIE';

export type LuxControlMode = 'AUTO' | 'USER' | 'ADVANCED' | 'PRO';

export interface PhotoScalerConfig {
  noise_reduction: number; // 0-10
  definition: number; // 0-10
  lens_fix: number; // 0-10
  tone_recovery: number; // 0-10
  depth_of_field: number; // 0-10
  film_grain: number; // 0-10
  color_science: number; // 0-10
  // PRO EXTENSIONS
  fractality?: number; // 0-10: Micro-detail recurrence
  chromatism?: number; // 0-10: Lens dispersion/aberration
  focus_plane?: number; // 0-10: Sharpness depth control
  sensor_noise?: number; // 0-10: ISO grain structure
}

export interface StyleScalerConfig {
  skin_physics: number; // 0-10
  eye_hair_reconstruct: number; // 0-10
  fabric_topology: number; // 0-10
  virtual_ironing: boolean;
  declutter: number; // 0-10
  material_transmutation: number; // 0-10
  reality_inject: number; // 0-10
  damage_fill: number; // 0-10
  // PRO EXTENSIONS
  abstract_detail?: number; // 0-10: Conceptual density
  composition_weight?: number; // 0-10: Framing authority
}

export type LightArchetype = 'BUTTERFLY' | 'REMBRANDT' | 'SPLIT' | 'LOOP' | 'PARAMOUNT' | 'BROAD' | 'SHORT' | 'RIM' | 'FLAT' | 'NATURAL';

export interface LightScalerConfig {
  intensity: number; // 0-10
  volumetrics: number; // 0-10
  light_archetype: LightArchetype;
  relighting_strength: number; // 0-10
}

export interface LuxConfig {
  userPrompt: string;
  selectedPresetId?: string;
  aspectRatio?: number;
  shotType?: LuxShotType[];
  selectedTags?: string[];
  mode?: LuxControlMode; // NEW: Control Mode

  // NEW: Granular Phase 2 Controls (Legacy/Hybrid)
  forensic?: ForensicConfig;

  // NEW: Deep Physics Engines (PRO Mode)
  photoScaler?: PhotoScalerConfig;
  styleScaler?: StyleScalerConfig;
  lightScaler?: LightScalerConfig;

  // SLC-R V2.0 Specific Toggles
  slcr_controls?: {
    definition: boolean;
    tone: boolean;
    perspective: boolean;
    reframing: boolean;
    materiality: boolean;
    lighting: boolean;
  };

  // Phase 3 & 4 Controls
  mixer?: LuxMixer;

  // New Dynamic Batch Controls
  batchSize?: number; // 1-6
  variationsConfig?: any[]; // For PRO mode deep config per variation

  // Legacy mapping support
  correction_enabled?: boolean;
  luxScaler?: number;
  production_style?: number;
  lighting_complexity?: number;
}

// --- PHASE 1 FORENSIC DATA ---

export interface SemanticAnalysis {
  classification?: {
    master_category: "HUMAN" | "FOOD" | "ARCH" | "PET" | "PRODUCT" | "LANDSCAPE" | "ANTIQUE_RESTORE" | "UNIVERSAL" | "NOISE";
    sub_type: string;
    confidence_score: number;
    detected_subject: string;
    suggested_roles?: LuxShotType[];
  };

  technical_audit?: {
    optical_provenance?: {
      lens_emulation_target: string;
      focal_length_equiv: string;
      distortion: "BARREL" | "PINCUSHION" | "MUSTACHE" | "NONE";
    };
    integrity_analysis?: {
      frequency_status?: {
        low_frequency: string;
        high_frequency: string;
        acutance_score: number;
      };
      artifacts?: string;
      noise_type?: string;
    };
    // Legacy mapping (optional compatibility)
    exposure_bias?: string;
    white_balance_cast?: string;
    lens_distortion?: boolean;
    focus_integrity?: string;
    noise_profile?: string;
  };

  materiality_map?: {
    semantic_segments: {
      label: string;
      hallucination_directives: string;
      negative_constraints?: string;
      focus_priority?: string;
    }[];
  };

  restoration_forensics?: {
    is_damaged: boolean;
    damage_types: ("SCRATCHES" | "TEARS" | "FADING" | "MOLD_SPOTS" | "DUST" | "MISSING_SEGMENTS" | "CREASES")[];
    integrity_score?: number;
    structural_anchor_needed?: boolean;
    inpainting_priority?: string;
    restoration_priority?: string;
  };

  reasoning_blueprint?: {
    lighting_strategy: string;
    volumetric_injection: string;
    deep_think_logic: string;
  };

  slcr_forensic_tags?: string[];

  quality_check?: {
    is_usable: boolean;
    usability_score: number;
    rejection_reason?: string;
  };

  composition_audit?: {
    horizon_tilt: boolean;
    keystoning: boolean;
    framing_quality: number;
  };

  safety_check?: {
    is_nsfw: boolean;
  };

  telemetry?: {
    input_settings?: LuxConfig;
    engine?: string;
    [key: string]: any;
  };
}
