
// LUXSCALER EDGE ENGINE (v19 - OMNIBUS MODULAR)
// Updated: 2026-01-09
// Architecture: Modular "Builder" Pattern (Forensic -> Style -> Light)

export const PRICE_GEMINI_PRO_INPUT_1M = 2.00;
export const PRICE_GEMINI_PRO_OUTPUT_1M = 120.00;
export const PRICE_FLASH_INPUT_1M = 0.50;
export const PRICE_FLASH_OUTPUT_1M = 3.00;
export const PRICE_IMAGEN_STD = 0.04;
export const PRICE_IMAGEN_ULTRA = 0.06;

export const calculateGeminiCost = (usage: any, modelType: 'GEMINI_PRO' | 'GEMINI_FLASH' | 'IMAGEN_STD' | 'IMAGEN_ULTRA' | 'GEMINI_PRO_IMAGE' | 'GEMINI_3_PRO' = 'GEMINI_PRO') => {
    let cost = 0;
    if (modelType === 'IMAGEN_STD') return PRICE_IMAGEN_STD;
    if (modelType === 'IMAGEN_ULTRA') return PRICE_IMAGEN_ULTRA;
    if (usage) {
        const inTokens = (usage.promptTokenCount || 0) / 1_000_000;
        const outTokens = (usage.candidatesTokenCount || 0) / 1_000_000;
        if (modelType === 'GEMINI_FLASH') {
            cost += (inTokens * PRICE_FLASH_INPUT_1M) + (outTokens * PRICE_FLASH_OUTPUT_1M);
        } else {
            cost += (inTokens * PRICE_GEMINI_PRO_INPUT_1M) + (outTokens * PRICE_GEMINI_PRO_OUTPUT_1M);
        }
    }
    return parseFloat(cost.toFixed(6));
};

// --- DATA LOADING (MODULAR SOURCING) ---

export const fetchV19Modules = async (supabase: any) => {
    try {
        const [forensic, style, light] = await Promise.all([
            supabase.from('lux_module_forensic').select('*'),
            supabase.from('lux_module_style').select('*'),
            supabase.from('lux_module_light').select('*')
        ]);

        return {
            forensic: forensic.data || [],
            style: style.data || [],
            light: light.data || []
        };
    } catch (e) {
        console.error("Failed to load v19 modules", e);
        return { forensic: [], style: [], light: [] };
    }
};

// --- LOGIC: HALLUCINATION MATRIX ---

// --- LOGIC: HALLUCINATION MATRIX (THE RAILS) ---

const getHallucinationSettings = (category: string, settings: any) => {
    const userMode = settings.mode || 'AUTO';

    // RIGID PROGRAMMATIC RAILS - NO AI INTERPRETATION
    let fractality = 5;
    let creativity = 5;
    let resemblance = 'MEDIUM';

    // MATRIX RULES (LuxScaler v31.0)
    if (category === 'TEXT' || category === 'DOCUMENT') {
        creativity = 0; // OCR LOCK
        fractality = 2; // Sharp edges only
        resemblance = 'MAX';
    } else if (category === 'HUMAN' || category === 'SELFIE') {
        creativity = 2; // IDENTITY LOCK
        fractality = 4; // Skin pores ok, no warping
        resemblance = 'HIGH';
    } else if (category === 'CGI' || category === 'RENDER') {
        creativity = 9; // REALITY INJECTION
        fractality = 9; // Add dust, imperfections
        resemblance = 'LOW';
    } else if (category === 'JEWELRY' || category === 'WATCH') {
        creativity = 5;
        fractality = 9; // DIAMOND FIRE / CAUSTICS
        resemblance = 'HIGH';
    } else if (category === 'LANDSCAPE') {
        creativity = 6;
        fractality = 9; // INFINITE DETAIL
    }

    // Pro Override based on Granular Controls
    if (userMode === 'PRO') {
        // StyleScaler overrides
        if (settings.styleScaler) {
            // Reality Inject increases creativity (hallucination allowed)
            if (settings.styleScaler.reality_inject > 0) {
                creativity = Math.max(creativity, settings.styleScaler.reality_inject);
                resemblance = settings.styleScaler.reality_inject > 7 ? 'LOW' : resemblance;
            }
            // Material Transmutation basically means generating new stuff
            if (settings.styleScaler.material_transmutation > 0) {
                creativity = Math.max(creativity, settings.styleScaler.material_transmutation);
            }
        }
    }

    return { fractality, creativity, resemblance };
};

// --- BUILDER: OPTICAL STACK RESOLVER ---
// Falls back to "Standard" if specific rig isn't found
const getOpticalStack = (category: string, analysis: any) => {
    // Edge Vision 2.5 Override (Forensic Provenance)
    if (analysis?.technical_audit?.optical_provenance) {
        const prov = analysis.technical_audit.optical_provenance;
        return {
            sensor: prov.lens_emulation_target || "Phase One IQ4 150MP",
            lens: prov.focal_length_equiv || "85mm Prime",
            lighting: analysis.reasoning_blueprint?.lighting_strategy || "Cinematic Mixed",
            detail: "Forensic Reconstruction",
            physics: "Linear 32-bit Float"
        };
    }

    const isNight = analysis.tags?.includes('night') || analysis.brightness_avg < 0.4;

    // Smart Defaults (V31.0)
    if (category === 'LANDSCAPE') {
        return { sensor: "Phase One IQ4 150MP", lens: "Rodenstock 55mm (Infinite Depth)", lighting: isNight ? "Blue Hour Ambience" : "Natural Daylight", detail: "High", physics: "Zone System" };
    }
    if (category === 'HUMAN') {
        return { sensor: "8x10 Large Format Film", lens: "300mm Portrait Prime", lighting: "Studio Butterfly", detail: "Biometric", physics: "Subsurface Scattering" };
    }
    if (category === 'ARCH') {
        return { sensor: "Arri Alexa LF", lens: "24mm Tilt-Shift (Rectilinear)", lighting: "Mixed Temp", detail: "Structural", physics: "Hard Shadows" };
    }
    if (category === 'PRODUCT' || category === 'FOOD') {
        return { sensor: "Hasselblad X2D", lens: "100mm Macro f/2.8", lighting: "Commercial Softbox", detail: "Micro-Texture", physics: "Caustics" };
    }

    return { sensor: "Full Frame Mirrorless", lens: "50mm Prime f/1.4", lighting: "Balanced", detail: "High", physics: "Standard" };
};

// --- CORE: DEEP THINK BUILDER ---

export const buildDeepThinkPrompt = (
    analysis: any,         // From Vision 2.0 / 2.5
    styleId: string,       // User selection
    settings: any,         // User sliders/toggles
    mode: 'PREVIEW' | 'MASTER' | 'UPSCALE',
    modules: any           // Loaded v19 DB Modules
) => {
    const { master_category = 'UNIVERSAL', sub_type = 'General', defects = [], tags = [] } = analysis.classification || analysis;
    const userPrompt = settings.userPrompt || '';

    // 1. HALLUCINATION MATRIX
    const matrix = getHallucinationSettings(master_category, settings);

    // 2. FORENSIC BLOCK (Technical Repair)
    let forensicPrompt = [`PROTOCOL: FORENSIC RECOVERY.`];

    // Edge Vision 2.5: Deep Forensics
    if (analysis.restoration_forensics?.is_damaged) {
        forensicPrompt.push(`CRITICAL STATUS: DAMAGE DETECTED.`);
        const damageTypes = analysis.restoration_forensics.damage_types?.join(', ') || 'General Decay';
        forensicPrompt.push(`- TARGET DAMAGE: ${damageTypes}`);
        forensicPrompt.push(`- ACTION: INITIATE RESTORATION PROTOCOL. INPAINT MISSING DATA.`);
        if (analysis.restoration_forensics.restoration_priority) {
            forensicPrompt.push(`- PRIORITY: ${analysis.restoration_forensics.restoration_priority}`);
        }
    }

    // Auto-Routing: Defects -> Modules (Legacy + V2.5 Compat)
    if (defects.includes('underexposed') || (analysis.technical_audit?.exposure_bias && analysis.technical_audit.exposure_bias !== 'Correct')) {
        const mod = modules.forensic.find((m: any) => m.id === 'fix_exposure_zone');
        if (mod) forensicPrompt.push(`- EXPOSURE: ${mod.prompt_text}`);
    }
    if (defects.includes('motion_blur') || (analysis.technical_audit?.integrity_analysis?.frequency_status?.high_frequency === 'Degraded')) {
        const mod = modules.forensic.find((m: any) => m.id === 'fix_blur_shutter');
        if (mod) forensicPrompt.push(`- SHARPNESS: ${mod.prompt_text}`);
    }
    if (defects.includes('low_res') || (analysis.technical_audit?.integrity_analysis?.acutance_score < 50)) {
        const mod = modules.forensic.find((m: any) => m.id === 'fix_res_fractal');
        if (mod) forensicPrompt.push(`- RESOLUTION: ${mod.prompt_text}`);
    }

    // Universal Geometry
    const geomMod = modules.forensic.find((m: any) => m.id === 'fix_optics_geom');
    if (geomMod) forensicPrompt.push(`- GEOMETRY: ${geomMod.prompt_text}`);

    // DEEP PHYSICS (PRO): PhotoScaler
    if (settings.photoScaler) {
        const ps = settings.photoScaler;
        forensicPrompt.push(`- NOISE REDUCTION: ${ps.noise_reduction}/10`);
        forensicPrompt.push(`- DEFINITION (SHARPNESS): ${ps.definition}/10`);
        if (ps.lens_fix > 5) forensicPrompt.push(`- LENS CORRECTION: RECTILINEAR REPROJECTION`);
        if (ps.tone_recovery > 0) forensicPrompt.push(`- TONE MAPPING: ANSEL ADAMS ZONE SYSTEM (Strength: ${ps.tone_recovery})`);
        if (ps.film_grain > 0) forensicPrompt.push(`- TEXTURE: ORGANIC FILM GRAIN (${ps.film_grain}/10)`);
    }

    // 3. STYLE & PHYSICS BLOCK
    let stylePrompt = [`PROTOCOL: MATERIAL PHYSICS & STYLE.`];

    // Edge Vision 2.5: Materiality Map
    if (analysis.materiality_map?.semantic_segments) {
        analysis.materiality_map.semantic_segments.forEach((seg: any) => {
            stylePrompt.push(`- MATERIAL [${seg.label.toUpperCase()}]: ${seg.hallucination_directives}`);
            if (seg.negative_constraints) {
                stylePrompt.push(`  (Avoid: ${seg.negative_constraints})`);
            }
        });
    }

    // Category Routing
    if (master_category === 'HUMAN') {
        ['skin_forensic', 'eye_reconstruct', 'hair_follicle'].forEach(id => {
            const mod = modules.style.find((m: any) => m.id === id);
            if (mod) stylePrompt.push(`- ${id.toUpperCase()}: ${mod.prompt_text}`);
        });
    } else if (master_category === 'ARCH') {
        const mod = modules.style.find((m: any) => m.id === 'arch_concrete');
        if (mod) stylePrompt.push(`- SURFACE: ${mod.prompt_text}`);
    } else if (master_category === 'FASHION') {
        const mod = modules.style.find((m: any) => m.id === 'fabric_weave');
        if (mod) stylePrompt.push(`- TEXTILE: ${mod.prompt_text}`);
    }

    // DEEP PHYSICS (PRO): StyleScaler
    if (settings.styleScaler) {
        const ss = settings.styleScaler;
        if (ss.skin_physics > 0) stylePrompt.push(`- SKIN PHYSICS: SUBSURFACE SCATTERING LEVEL ${ss.skin_physics}`);
        if (ss.eye_hair_reconstruct > 0) stylePrompt.push(`- BIOMETRIC RESTORATION: EYES & HAIR (${ss.eye_hair_reconstruct}/10)`);
        if (ss.fabric_topology > 0) stylePrompt.push(`- CLOTHING: ENHANCE WEAVE TOPOLOGY`);
        if (ss.virtual_ironing) stylePrompt.push(`- CLOTHING: STEAM/IRON CREASES`);
        if (ss.declutter > 0) stylePrompt.push(`- COMPOSITION: DECLUTTER BACKGROUND (${ss.declutter}/10)`);
        if (ss.damage_fill > 0) stylePrompt.push(`- RESTORATION: INPAINT DAMAGED AREAS (${ss.damage_fill}/10)`);
    }

    // Trend Injection (User Selected Style)
    // Note: styleId might map to a Trend Module or a Legacy Vibe
    const trendMod = modules.style.find((m: any) => m.id === styleId);
    if (trendMod) {
        stylePrompt.push(`- AESTHETIC OVERRIDE: ${trendMod.prompt_text}`);
    } else if (!styleId.startsWith('user_') && !styleId.startsWith('pro_')) {
        // Fallback to legacy behavior if ID not in DB (only if not a reserved user/pro ID)
        stylePrompt.push(`- VIBE: Infuse '${styleId}' aesthetic.`);
    }

    // 4. LIGHT BLOCK
    let lightPrompt = [`PROTOCOL: LIGHTING RIG.`];

    // Edge Vision 2.5: Reasoning Blueprint Override
    if (analysis.reasoning_blueprint?.lighting_strategy) {
        lightPrompt.push(`- BLUEPRINT: ${analysis.reasoning_blueprint.lighting_strategy}`);
        if (analysis.reasoning_blueprint.volumetric_injection) {
            lightPrompt.push(`- VOLUMETRICS: ${analysis.reasoning_blueprint.volumetric_injection}`);
        }
    }

    // Auto-Select Rig or Default
    const lightingRigId = settings.lighting_rig || `light_${master_category.toLowerCase()}_std`; // e.g. light_human_std
    // Try to find specific or fallback
    let lightMod = modules.light.find((m: any) => m.id === lightingRigId);

    // Smart Defaults if no specific rig selected
    if (!lightMod) {
        if (master_category === 'LANDSCAPE') lightMod = modules.light.find((m: any) => m.id === 'land_golden');
        if (master_category === 'HUMAN') lightMod = modules.light.find((m: any) => m.id === 'light_human_studio_glam');
        if (master_category === 'PRODUCT') lightMod = modules.light.find((m: any) => m.id === 'lux_watch');
    }

    if (lightMod) {
        lightPrompt.push(`- SETUP: ${lightMod.prompt_text}`);
    } else if (!analysis.reasoning_blueprint?.lighting_strategy) {
        lightPrompt.push(`- SETUP: Balanced commercial lighting. High dynamic range.`);
    }

    // DEEP PHYSICS (PRO): LightScaler
    if (settings.lightScaler) {
        const ls = settings.lightScaler;
        lightPrompt.push(`- OVERRIDE SETUP: ${ls.light_archetype}`);
        lightPrompt.push(`- VOLUMETRICS: ${ls.volumetrics}/10`);
        lightPrompt.push(`- RELIGHTING INTENSITY: ${ls.intensity}/10`);
        if (ls.relighting_strength > 0) lightPrompt.push(`- SHADOWS: RAYTRACED SOFT SHADOWS`);
    }

    // 5. OPTICAL STACK
    const stock = getOpticalStack(master_category, analysis);

    // 6. PRO EXPORT MODE
    let outputFormat = "OUTPUT: PHOTOREALISTIC 4K ULTRA-HD. MAX SHARPNESS.";
    if (mode === 'PREVIEW') {
        outputFormat = "OUTPUT: 4K PREVIEW. INJECT SUB-PIXEL DETAIL AND PERIMETER SHARPNESS.";
    }
    if (settings.export_format_mode === 'true_hdr_linear') {

        const hdrMod = modules.forensic.find((m: any) => m.id === 'mode_true_hdr');
        if (hdrMod) outputFormat = hdrMod.prompt_text;
    }


    // 7. GEOMETRY LOCK (Pixel Perfect for Master/Upscale)
    let geometryLock = "";
    if (mode === 'MASTER' || mode === 'UPSCALE') {
        geometryLock = `
<GEOMETRY_LOCK>
    STATUS: ACTIVE (CRITICAL)
    INSTRUCTION: DO NOT CHANGE POSE, EXPRESSION, OR COMPOSITION.
    OUTPUT MUST ALIGN PIXEL-PERFECTLY WITH THE ORIGINAL IMAGE.
    FOCUS ONLY ON TEXTURE, LIGHTING, AND RESOLUTION ENHANCEMENT.
    ANY STRUCTURAL HALLUCINATION = FAILURE.
</GEOMETRY_LOCK>`;
    }

    return `
${geometryLock}
<SYSTEM_DIRECTIVE>
    ACTIVATE LUXIFIER v19 (OMNIBUS).
    TARGET: ${master_category} / ${sub_type}.
    ACTIVATE LUXIFIER v31.0 (DEEP PHYSICS).
    TARGET: ${master_category} / ${sub_type}.
    MODE: ${settings.mode || 'AUTO'}.
    DEEP THINK: ${analysis.reasoning_blueprint?.deep_think_logic || 'Standard Inference'}
</SYSTEM_DIRECTIVE>

<FORENSIC_LAYER>
    ${forensicPrompt.join('\n    ')}
</FORENSIC_LAYER>

<STYLE_LAYER>
    ${stylePrompt.join('\n    ')}
</STYLE_LAYER>

<LIGHT_LAYER>
    ${lightPrompt.join('\n    ')}
</LIGHT_LAYER>

<PHYSICS_LAYER>
    BLACK POINT: (0,0,0) ANCHORED [Zone 0]
    DYNAMIC RANGE: ${stock.physics || "Standard"}
    WORKFLOW: Linear 32-bit Float
</PHYSICS_LAYER>

<OPTICAL_STACK>
    SENSOR: ${stock.sensor}
    LENS: ${stock.lens}
    LIGHTING: ${stock.lighting}
    DETAIL: ${stock.detail}
</OPTICAL_STACK>

<HALLUCINATION_MATRIX>
    CREATIVITY: ${matrix.creativity}/10
    FRACTALITY: ${matrix.fractality}/10
    RESEMBLANCE: ${matrix.resemblance}
    IDENTITY LOCK: ${matrix.creativity < 3 ? 'ACTIVE (Zero Tolerance)' : 'RELAXED'}
</HALLUCINATION_MATRIX>

<USER_INTENT>
    ${userPrompt}
</USER_INTENT>

<NEGATIVE_CONSTRAINTS>
    text, watermark, ugly, deformed, noise, low res, bad anatomy, different face.
</NEGATIVE_CONSTRAINTS>

${outputFormat}
    `;
};
