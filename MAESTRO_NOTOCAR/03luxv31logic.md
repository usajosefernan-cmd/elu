# LUXSCALER: ARQUITECTURA DATA-DRIVEN COMPLETA

## PARTE 3: LÓGICA DE APP Y OPERACIONES (El Sistema Nervioso)

---

## ÍNDICE

1. [LÓGICA DEL CLIENTE: BIOPSY ENGINE](#1-lógica-del-cliente-biopsy-engine)
2. [LÓGICA DE INTERFAZ DE USUARIO: UI STATE MACHINE](#2-lógica-de-interfaz-de-usuario-ui-state-machine)
3. [API REFERENCE & CONTRACTS](#3-api-reference--contracts)
4. [INFRAESTRUCTURA Y DESPLIEGUE](#4-infraestructura-y-despliegue)
5. [FLUJO DE ERRORES Y TROUBLESHOOTING](#5-flujo-de-errores-y-troubleshooting)

---

## 1. LÓGICA DEL CLIENTE: BIOPSY ENGINE

### 1.1 ¿Qué es la Biopsia?

**Concepto Core:** No subir la imagen completa (potencialmente 19.5 MP = ~50-200MB con PNG/WebP). En su lugar, generar una **biopsia quirúrgica**: 4 vistas comprimidas que dan al backend toda la información necesaria para diagnosticar y procesar.

**Payload Final:**

- **Thumbnail** (1024px @ JPEG 85%): Contexto completo, composición, sujeto
- **Center Crop** (512x512 @ JPEG 85%): Zona central (típicamente la más importante)
- **Shadow Crop** (512x512 @ JPEG 85%): Región más oscura (prueba de recuperación de sombras)
- **Detail Crop** (512x512 @ JPEG 85%): Región de alta entropía (prueba de detalles finos)

**Tamaño Total:** ~200-400 KB (vs. 50-200 MB original)

---

### 1.2 Algoritmo de Generación de Biopsia (Frontend)

**File:** `frontend/utils/biopsy-engine.ts`

```typescript
export interface BiopsyPayload {
  thumbnail_base64: string;        // Thumbnail como base64 para Gemini
  center_base64: string;           // Center crop para generación
  shadow_base64: string;           // Shadow para debugging
  detail_base64: string;           // Detail para análisis de textura
  originalWidth: number;
  originalHeight: number;
}

export async function generateBiopsyPayload(file: File): Promise<BiopsyPayload> {
  // PASO 1: Crear bitmap desde File
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  // VALIDACIÓN: Límite lógico (no hardcodeado)
  if (width * height > 19.5e6) {
    throw new Error('Image exceeds 19.5MP limit');
  }

  // PASO 2: THUMBNAIL (Downscale al contexto)
  // Proposito: Darle a Gemini la composición completa sin perder aspecto
  const thumbCanvas = new OffscreenCanvas(1024, 1024 * (height / width));
  const thumbCtx = thumbCanvas.getContext('2d')!;
  thumbCtx.drawImage(bitmap, 0, 0, 1024, 1024 * (height / width));
  const thumbBlob = await thumbCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 });
  const thumbnail_base64 = await blobToBase64(thumbBlob);

  // PASO 3: CENTER CROP (512x512 desde el centro)
  // Proposito: La zona "más importante" típicamente es el centro
  const centerX = Math.max(0, width / 2 - 256);
  const centerY = Math.max(0, height / 2 - 256);
  const centerCrop = await cropAt(bitmap, centerX, centerY, 512, 0.85);
  const center_base64 = await blobToBase64(centerCrop);

  // PASO 4: SHADOW CROP (512x512 desde la región más oscura)
  // Proposito: Descubrir si el motor puede recuperar detalles en sombras
  // Algoritmo: Barrer la imagen en bloques, encontrar el que tenga menor promedio de luminancia
  const shadowCoords = await findDarkestRegion(bitmap, 512);
  const shadowCrop = await cropAt(bitmap, shadowCoords.x, shadowCoords.y, 512, 0.85);
  const shadow_base64 = await blobToBase64(shadowCrop);

  // PASO 5: DETAIL CROP (512x512 desde la región de mayor entropía)
  // Proposito: Descubrir si el motor preserva texturas finas (poros, telas, detalles)
  // Algoritmo: Calcular entropía Shannon en bloques (varianza de píxeles)
  const detailCoords = await findHighEntropyRegion(bitmap, 512);
  const detailCrop = await cropAt(bitmap, detailCoords.x, detailCoords.y, 512, 0.85);
  const detail_base64 = await blobToBase64(detailCrop);

  // Retornar payload comprimido
  return {
    thumbnail_base64,
    center_base64,
    shadow_base64,
    detail_base64,
    originalWidth: width,
    originalHeight: height
  };
}
```

#### Helper 1: Encontrar Región Más Oscura

```typescript
async function findDarkestRegion(
  bitmap: ImageBitmap,
  regionSize: number
): Promise<{ x: number; y: number }> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const data = imageData.data;

  let minBrightness = Infinity;
  let bestX = 0, bestY = 0;

  // Barrer en bloques de regionSize para eficiencia
  for (let y = 0; y < bitmap.height - regionSize; y += regionSize) {
    for (let x = 0; x < bitmap.width - regionSize; x += regionSize) {

      // Sample 100 píxeles aleatorios en este bloque
      let totalBrightness = 0;
      for (let sample = 0; sample < 100; sample++) {
        const px = x + Math.random() * regionSize;
        const py = y + Math.random() * regionSize;
        const idx = (Math.floor(py) * bitmap.width + Math.floor(px)) * 4;

        // Luminancia = (R + G + B) / 3
        totalBrightness += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      }
      const avgBrightness = totalBrightness / 100;

      if (avgBrightness < minBrightness) {
        minBrightness = avgBrightness;
        bestX = x;
        bestY = y;
      }
    }
  }

  return { x: bestX, y: bestY };
}
```

#### Helper 2: Encontrar Región de Alta Entropía

```typescript
async function findHighEntropyRegion(
  bitmap: ImageBitmap,
  regionSize: number
): Promise<{ x: number; y: number }> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const data = imageData.data;

  let maxEntropy = -Infinity;
  let bestX = 0, bestY = 0;

  for (let y = 0; y < bitmap.height - regionSize; y += regionSize) {
    for (let x = 0; x < bitmap.width - regionSize; x += regionSize) {

      // Construir histograma de luminancia (10 bins)
      const histogram = new Map<number, number>();

      for (let sample = 0; sample < 100; sample++) {
        const px = x + Math.random() * regionSize;
        const py = y + Math.random() * regionSize;
        const idx = (Math.floor(py) * bitmap.width + Math.floor(px)) * 4;

        const gray = Math.round((data[idx] + data[idx + 1] + data[idx + 2]) / 3 / 25);
        histogram.set(gray, (histogram.get(gray) ?? 0) + 1);
      }

      // Calcular entropía Shannon: -Σ(p * log2(p))
      let entropy = 0;
      for (const count of histogram.values()) {
        const p = count / 100;
        entropy -= p * Math.log2(p + 1e-10);
      }

      if (entropy > maxEntropy) {
        maxEntropy = entropy;
        bestX = x;
        bestY = y;
      }
    }
  }

  return { x: bestX, y: bestY };
}
```

---

### 1.3 Flujo de Upload

**Frontend Component:** `<ImageUploadForm />`

```typescript
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [biopsyPayload, setBiopsyPayload] = useState<BiopsyPayload | null>(null);
const [uploading, setUploading] = useState(false);

const handleFileSelect = async (file: File) => {
  setSelectedFile(file);
  setUploading(true);

  try {
    // Generar biopsia localmente
    const biopsy = await generateBiopsyPayload(file);
    setBiopsyPayload(biopsy);

    // Mostrar preview de thumbnail y crops al usuario
    // (Pseudocódigo: mostrar 4 imágenes previsualizadas)

  } catch (error) {
    console.error('Biopsy generation failed:', error);
    alert('Image processing failed. Try a different image.');
  } finally {
    setUploading(false);
  }
};

const handleUpload = async () => {
  if (!biopsyPayload) return;

  try {
    // Enviar payload a backend
    const response = await fetch('/api/vision-orchestrator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        biopsyUrls: {
          thumbnail_base64: biopsyPayload.thumbnail_base64,
          center_base64: biopsyPayload.center_base64,
          shadow_base64: biopsyPayload.shadow_base64,
          detail_base64: biopsyPayload.detail_base64,
          originalWidth: biopsyPayload.originalWidth,
          originalHeight: biopsyPayload.originalHeight
        }
      })
    });

    const result = await response.json();

    if (result.status === 'BATCH_PROCESSING') {
      // AUTO: Mostrar loading y esperar previews
      navigate(`/processing/${result.uploadId}`);
    } else if (result.status === 'REVIEW_REQUIRED') {
      // USER/PRO/PRO_LUX: Mostrar sliders para que usuario ajuste
      navigate(`/editor/${result.uploadId}`, { state: { analysis: result.analysis } });
    }
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Upload failed. Try again.');
  }
};
```

---

## 2. LÓGICA DE INTERFAZ DE USUARIO: UI STATE MACHINE

### 2.1 Los 4 Perfiles y sus Componentes

| **Perfil**  | **Tier en DB** | **Componente Principal**  | **Control de Sliders**                    | **Estado en DB**          |
|:----------- |:-------------- |:------------------------- |:----------------------------------------- |:------------------------- |
| **AUTO**    | `AUTO`         | Ninguno (autopilot)       | Vision lo decide automáticamente          | Pausa: `BATCH_PROCESSING` |
| **USER**    | `USER`         | `<SimplePillarControl />` | 3 Macros (cada uno 9 sliders)             | Pausa: `REVIEW_REQUIRED`  |
| **PRO**     | `PRO`          | `<MacroSliderGallery />`  | 9 Macros temáticos (cada uno 3-4 sliders) | Pausa: `REVIEW_REQUIRED`  |
| **PRO_LUX** | `PRO_LUX`      | `<MicroSliderGrid />`     | 27 Sliders individuales                   | Pausa: `REVIEW_REQUIRED`  |

---

### 2.2 PERFIL USER: `<SimplePillarControl />`

**Concepto:** El usuario tiene 3 controles simples: uno para cada pilar (PHOTOSCALER, STYLESCALER, LIGHTSCALER). Cada control es un slider 0-10 que mueve internamente 9 sliders al unísono.

**Archivo:** `frontend/components/SimplePillarControl.tsx`

```typescript
interface SimplePillarControlProps {
  analysisResult: AnalysisResult;  // Resultado de vision-orchestrator
  onSubmit: (sliderConfig: SliderConfig) => Promise<void>;
}

export const SimplePillarControl: React.FC<SimplePillarControlProps> = ({
  analysisResult,
  onSubmit
}) => {

  // Estado local: un slider por pilar
  const [photoscalerValue, setPhotoscalerValue] = useState(5);
  const [stylescalerValue, setStylescalerValue] = useState(5);
  const [lightscalerValue, setLightscalerValue] = useState(5);

  // Mapeo: USER profile mapea cada pillar a 9 sliders esclavos
  // (Estos valores vienen de macro_definitions tabla en la BD)
  const USER_PILLAR_SLAVES: Record<string, string[]> = {
    photoscaler: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'],
    stylescaler: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'],
    lightscaler: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9']
  };

  const handleSubmit = async () => {
    // Traducir 3 valores macro a 27 valores de slider
    const sliderConfig: SliderConfig = {};

    // Cada slider esclavo recibe el valor del pillar maestro
    USER_PILLAR_SLAVES.photoscaler.forEach(sliderKey => {
      sliderConfig[sliderKey] = photoscalerValue;
    });
    USER_PILLAR_SLAVES.stylescaler.forEach(sliderKey => {
      sliderConfig[sliderKey] = stylescalerValue;
    });
    USER_PILLAR_SLAVES.lightscaler.forEach(sliderKey => {
      sliderConfig[sliderKey] = lightscalerValue;
    });

    // Enviar configuración a backend
    await onSubmit(sliderConfig);
  };

  return (
    <div className="pillar-control">
      <h2>Ajusta los 3 Pilares Principales</h2>

      {/* PHOTOSCALER Slider */}
      <div className="pillar-group">
        <label>💎 Calidad de Imagen</label>
        <input
          type="range"
          min="0"
          max="10"
          value={photoscalerValue}
          onChange={(e) => setPhotoscalerValue(Number(e.target.value))}
        />
        <span>{photoscalerValue}/10</span>
        <p className="help-text">Mejora ruido, nitidez, y definición técnica</p>
      </div>

      {/* STYLESCALER Slider */}
      <div className="pillar-group">
        <label>✨ Estética IA</label>
        <input
          type="range"
          min="0"
          max="10"
          value={stylescalerValue}
          onChange={(e) => setStylescalerValue(Number(e.target.value))}
        />
        <span>{stylescalerValue}/10</span>
        <p className="help-text">Retoque de piel, colores vibrantes, efecto cinematográfico</p>
      </div>

      {/* LIGHTSCALER Slider */}
      <div className="pillar-group">
        <label>💡 Iluminación Pro</label>
        <input
          type="range"
          min="0"
          max="10"
          value={lightscalerValue}
          onChange={(e) => setLightscalerValue(Number(e.target.value))}
        />
        <span>{lightscalerValue}/10</span>
        <p className="help-text">Exposición, contraste, drama y atmósfera</p>
      </div>

      <button onClick={handleSubmit}>Generar Imagen</button>
    </div>
  );
};
```

**Mapeo Interno (JSON generado por backend desde `macro_definitions` tabla):**

```json
{
  "USER": {
    "calidad_imagen": ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"],
    "estetica_ia": ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"],
    "iluminacion_pro": ["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8", "l9"]
  }
}
```

---

### 2.3 PERFIL PRO: `<MacroSliderGallery />`

**Concepto:** 9 sliders independientes agrupados por pillar. Cada slider macro controla un subset de 3-4 sliders crudos.

**Archivo:** `frontend/components/MacroSliderGallery.tsx`

```typescript
interface MacroSliderGalleryProps {
  analysisResult: AnalysisResult;
  onSubmit: (sliderConfig: SliderConfig) => Promise<void>;
}

export const MacroSliderGallery: React.FC<MacroSliderGalleryProps> = ({
  analysisResult,
  onSubmit
}) => {

  // Estado: 9 macros independientes
  const [macroValues, setMacroValues] = useState({
    restauracion: 5,      // PHOTOSCALER
    fidelidad: 5,         // PHOTOSCALER
    caracter: 5,          // PHOTOSCALER
    presencia: 5,         // STYLESCALER
    pulido: 5,            // STYLESCALER
    cinematica: 5,        // STYLESCALER
    volumen: 5,           // LIGHTSCALER
    drama: 5,             // LIGHTSCALER
    atmosfera: 5          // LIGHTSCALER
  });

  // Mapeo PRO: Cada macro controla 3-4 sliders
  const PRO_MACRO_DEFINITIONS: Record<string, string[]> = {
    // PHOTOSCALER
    'restauracion': ['p1', 'p2', 'p8', 'p9'],
    'fidelidad': ['p3', 'p4', 'p6'],
    'caracter': ['p5', 'p7'],
    // STYLESCALER
    'presencia': ['s1', 's2', 's3'],
    'pulido': ['s4', 's5', 's6'],
    'cinematica': ['s7', 's8', 's9'],
    // LIGHTSCALER
    'volumen': ['l1', 'l2', 'l3'],
    'drama': ['l4', 'l5', 'l6'],
    'atmosfera': ['l7', 'l8', 'l9']
  };

  const handleSubmit = async () => {
    // Traducir 9 valores macro a 27 valores de slider
    const sliderConfig: SliderConfig = {};

    Object.entries(macroValues).forEach(([macroKey, macroValue]) => {
      const slaveSliders = PRO_MACRO_DEFINITIONS[macroKey] || [];
      slaveSliders.forEach(sliderKey => {
        sliderConfig[sliderKey] = macroValue;
      });
    });

    await onSubmit(sliderConfig);
  };

  const macroGroups = [
    {
      pillar: 'PHOTOSCALER',
      icon: '🛠️',
      items: [
        { key: 'restauracion', label: 'Restauración', desc: 'Corrige defectos y geometría' },
        { key: 'fidelidad', label: 'Fidelidad', desc: 'Maximiza nitidez y texturas' },
        { key: 'caracter', label: 'Carácter', desc: 'Grano fílmico y movimiento' }
      ]
    },
    {
      pillar: 'STYLESCALER',
      icon: '✨',
      items: [
        { key: 'presencia', label: 'Presencia', desc: 'Piel y color vibrante' },
        { key: 'pulido', label: 'Pulido', desc: 'Contraste y suavidad' },
        { key: 'cinematica', label: 'Cinemática', desc: 'Look de película' }
      ]
    },
    {
      pillar: 'LIGHTSCALER',
      icon: '💡',
      items: [
        { key: 'volumen', label: 'Volumen', desc: 'Luces altas y relleno' },
        { key: 'drama', label: 'Drama', desc: 'Sombras y dramatismo' },
        { key: 'atmosfera', label: 'Atmósfera', desc: 'Temperatura y ambiente' }
      ]
    }
  ];

  return (
    <div className="macro-gallery">
      <h2>Mesa de Mezclas Pro</h2>

      {macroGroups.map(group => (
        <div key={group.pillar} className="pillar-section">
          <h3>{group.icon} {group.pillar}</h3>

          <div className="macro-row">
            {group.items.map(item => (
              <div key={item.key} className="macro-slider">
                <label>{item.label}</label>
                <p className="desc">{item.desc}</p>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={macroValues[item.key]}
                  onChange={(e) =>
                    setMacroValues({
                      ...macroValues,
                      [item.key]: Number(e.target.value)
                    })
                  }
                />
                <span>{macroValues[item.key]}/10</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleSubmit}>Generar Imagen</button>
    </div>
  );
};
```

**Mapeo en la BD (tabla `macro_definitions`):**

```sql
-- PRO Profile, 9 macros
INSERT INTO macro_definitions (macro_key, profile_tier, pillar, ui_title, slave_sliders) VALUES
('restauracion', 'PRO', 'PHOTOSCALER', 'Restauración', ARRAY['p1', 'p2', 'p8', 'p9']),
('fidelidad', 'PRO', 'PHOTOSCALER', 'Fidelidad', ARRAY['p3', 'p4', 'p6']),
('caracter', 'PRO', 'PHOTOSCALER', 'Carácter', ARRAY['p5', 'p7']),
('presencia', 'PRO', 'STYLESCALER', 'Presencia', ARRAY['s1', 's2', 's3']),
('pulido', 'PRO', 'STYLESCALER', 'Pulido', ARRAY['s4', 's5', 's6']),
('cinematica', 'PRO', 'STYLESCALER', 'Cinemática', ARRAY['s7', 's8', 's9']),
('volumen', 'PRO', 'LIGHTSCALER', 'Volumen', ARRAY['l1', 'l2', 'l3']),
('drama', 'PRO', 'LIGHTSCALER', 'Drama', ARRAY['l4', 'l5', 'l6']),
('atmosfera', 'PRO', 'LIGHTSCALER', 'Atmósfera', ARRAY['l7', 'l8', 'l9']);
```

---

### 2.4 PERFIL PRO_LUX: `<MicroSliderGrid />`

**Concepto:** 27 sliders crudos, sin abstracción. El usuario tiene control total sobre cada dimensión.

**Archivo:** `frontend/components/MicroSliderGrid.tsx`

```typescript
interface MicroSliderGridProps {
  analysisResult: AnalysisResult;
  onSubmit: (sliderConfig: SliderConfig) => Promise<void>;
}

export const MicroSliderGrid: React.FC<MicroSliderGridProps> = ({
  analysisResult,
  onSubmit
}) => {

  // 27 sliders independientes
  const [sliderConfig, setSliderConfig] = useState<SliderConfig>(() => {
    // Inicializar desde auto_settings si existen
    const autoSettings = analysisResult?.auto_settings || {};
    const defaults: SliderConfig = {};

    // p1-p9: PHOTOSCALER
    for (let i = 1; i <= 9; i++) defaults[`p${i}`] = autoSettings[`p${i}`] ?? 5;
    // s1-s9: STYLESCALER
    for (let i = 1; i <= 9; i++) defaults[`s${i}`] = autoSettings[`s${i}`] ?? 5;
    // l1-l9: LIGHTSCALER
    for (let i = 1; i <= 9; i++) defaults[`l${i}`] = autoSettings[`l${i}`] ?? 5;

    return defaults;
  });

  // Definiciones de sliders desde BD (socket/API call al cargar)
  const [sliderDefinitions, setSliderDefinitions] = useState<SliderDefinition[]>([]);

  useEffect(() => {
    // Cargar definiciones de sliders desde backend
    fetch('/api/slider-definitions')
      .then(r => r.json())
      .then(data => setSliderDefinitions(data));
  }, []);

  const handleSliderChange = (sliderKey: string, value: number) => {
    setSliderConfig(prev => ({ ...prev, [sliderKey]: value }));
  };

  const handleSubmit = async () => {
    await onSubmit(sliderConfig);
  };

  const pillars = ['PHOTOSCALER', 'STYLESCALER', 'LIGHTSCALER'];
  const prefixes = { PHOTOSCALER: 'p', STYLESCALER: 's', LIGHTSCALER: 'l' };

  return (
    <div className="micro-slider-grid">
      <h2>Ingeniería Forense: 27 Sliders Crudos</h2>

      {pillars.map(pillar => (
        <div key={pillar} className="pillar-section">
          <h3>{pillar}</h3>

          <div className="slider-grid">
            {Array.from({ length: 9 }).map((_, i) => {
              const sliderKey = `${prefixes[pillar]}${i + 1}`;
              const def = sliderDefinitions.find(d => d.slider_key === sliderKey);

              return (
                <div key={sliderKey} className="slider-card">
                  <label>{def?.ui_title || sliderKey}</label>
                  <p className="hint">{def?.ui_description?.substring(0, 50)}...</p>

                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={sliderConfig[sliderKey] ?? 5}
                    onChange={(e) => handleSliderChange(sliderKey, Number(e.target.value))}
                  />

                  <div className="level-indicator">
                    {sliderConfig[sliderKey] ?? 5}/10
                    {sliderConfig[sliderKey] === 0 && ' (OFF)'}
                    {sliderConfig[sliderKey] > 0 && sliderConfig[sliderKey] <= 3 && ' (LOW)'}
                    {sliderConfig[sliderKey] > 3 && sliderConfig[sliderKey] <= 6 && ' (MED)'}
                    {sliderConfig[sliderKey] > 6 && sliderConfig[sliderKey] <= 9 && ' (HIGH)'}
                    {sliderConfig[sliderKey] === 10 && ' (FORCE)'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button onClick={handleSubmit}>Generar Imagen</button>
    </div>
  );
};
```

---

### 2.5 Lógica de Estado Global (Redux/Zustand)

**Archivo:** `frontend/store/imageStore.ts`

```typescript
interface ImageState {
  // Upload state
  uploadId: string | null;
  biopsyPayload: BiopsyPayload | null;

  // Analysis state
  analysisResult: AnalysisResult | null;
  status: 'IDLE' | 'UPLOADING' | 'ANALYZING' | 'REVIEW_REQUIRED' | 'GENERATING' | 'DONE';

  // UI state
  currentProfile: 'AUTO' | 'USER' | 'PRO' | 'PRO_LUX';
  sliderConfig: SliderConfig;

  // Generation state
  generations: Generation[];
  selectedGenerationId: string | null;
}

export const useImageStore = create<ImageState>((set) => ({
  uploadId: null,
  biopsyPayload: null,
  analysisResult: null,
  status: 'IDLE',
  currentProfile: 'USER',
  sliderConfig: {},
  generations: [],
  selectedGenerationId: null,

  // Actions
  setBiopsyPayload: (payload) => set({ biopsyPayload: payload }),
  setAnalysisResult: (result, profile) => set({
    analysisResult: result,
    currentProfile: profile,
    status: 'REVIEW_REQUIRED'
  }),
  setSliderConfig: (config) => set({ sliderConfig: config }),
  addGeneration: (gen) => set(state => ({
    generations: [...state.generations, gen]
  }))
}));
```

---

### 2.6 Gestión de Presets y Workflows ("Pocket Mode")

Esta sección define cómo el usuario crea sus herramientas (Presets) y cómo automatiza su uso (Workflows).

#### A. Modal de Guardado: `<SavePresetModal />` (Smart Anchors)

**Trigger:** Botón "Guardar Estilo" en una imagen generada que gustó al usuario.
**Concepto:** No solo guarda sliders, sino "intenciones" (Fondo, Luz, Estilo).

**Lógica de UI:**

1. Mostrar formulario con nombre.
2. Mostrar Checkboxes de **"Smart Anchors"**:
   - `[ ] Anclar Fondo/Ambiente` (Usa la imagen como referencia estructural).
   - `[ ] Anclar Iluminación` (Usa la imagen como referencia de luz).
   - `[ ] Anclar Estilo` (Usa la imagen como referencia de vibe).
3. Al guardar, enviar a `/api/save-preset`.

#### B. Configurador de Flujo: `<WorkflowConfigurator />`

**Concepto:** Panel donde el usuario define qué sucede automáticamente al subir una foto (Flujo "Shoot & Pocket").
**Ubicación:** Perfil de Usuario / Configuración.

**Estado Local (Ejemplo):**

```typescript

```

## 3. API REFERENCE & CONTRACTS

### 3.1 POST /vision-orchestrator

**Purpose:** Frontend envía biopsia → Backend ejecuta Gemini Vision → Retorna análisis + prescripción de sliders

**Request:**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "biopsyUrls": {
    "thumbnail_base64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
    "center_base64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
    "shadow_base64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
    "detail_base64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
    "originalWidth": 4000,
    "originalHeight": 3000
  }
}
```

**Response (AUTO Profile - BATCH_PROCESSING):**

```json
{
  "status": "BATCH_PROCESSING",
  "uploadId": "upload-uuid-123",
  "count": 3,
  "analysis": {
    "cat_code": "CAT02",
    "detected_defects": ["IN02", "IN03"],
    "severity_score": 6,
    "visual_summary": "Professional headshot with mobile processing artifacts and soft focus on eyes",
    "reasoning": "Detected smartphone photo with waxy skin (IN02) and optical softness (IN03). Recommending forensic detail recovery."
  }
}
```

**Response (USER/PRO/PRO_LUX Profile - REVIEW_REQUIRED):**

```json
{
  "status": "REVIEW_REQUIRED",
  "uploadId": "upload-uuid-123",
  "analysis": {
    "cat_code": "CAT02",
    "cat_name": "PRO_HEADSHOT",
    "detected_defects": ["IN02", "IN03"],
    "severity_score": 6,
    "visual_summary": "Professional headshot with mobile processing artifacts and soft focus",
    "reasoning": "Detected defects IN02 (mobile processing) and IN03 (soft focus). Auto-settings prescribe detail recovery.",
    "ocr_data": null
  },
  "final_prescription": {
    "p1": 7,
    "p3": 10,
    "p6": 8,
    "s1": 5,
    "l6": 6,
    "l1": 4
  },
  "can_refine": false,
  "can_upscale_8k": false,
  "tier": "USER"
}
```

---

### 3.2 POST /prompt-compiler

**Purpose:** Traducir slider config a instrucciones semánticas para el generador

**Request:**

```json
{
  "visionResult": {
    "cat_code": "CAT02",
    "detected_defects": ["IN02", "IN03"],
    "severity_score": 6,
    "visual_summary": "Professional headshot with mobile artifacts",
    "reasoning": "..."
  },
  "sliderConfig": {
    "p1": 7,
    "p3": 10,
    "p6": 8,
    "s1": 5,
    "l6": 6,
    "l1": 4
  },
  "savedPreset": {
    "seed": 12345,
    "temperature": 0.4
  },
  "userMode": "user"
}
```

**Response:**

```json
{
  "compiled_prompt": "You are an advanced image generation engine for LuxScaler.\n\nSUBJECT SUMMARY:\nProfessional headshot with mobile processing artifacts.\n\nTECHNICAL DIAGNOSTICS:\nDetected smartphone photo with waxy skin (IN02) and optical softness (IN03). Recommending forensic detail recovery.\n\nRECONSTRUCTION DIRECTIVES (SLIDERS):\n- [P1 - HIGH] SIGNAL POLISH. Standard ISO reduction. Clean smooth surfaces but protect high-frequency texture areas.\n- [P3 - FORCE] MASTER LENS SIMULATION (ZEISS/LEICA). DIFFRACTION-LIMITED SHARPNESS. MAXIMUM MTF CURVE PERFORMANCE. CRYSTALLINE CLARITY.\n- [P6 - HIGH] HIGH-FREQ SYNTHESIS. Generate missing pores and fine lines based on context. 4K texture density.\n- [S1 - MED] STUDIO MATTE. Commercial retouch. Soften pores. Remove shine/oil. Brighten under-eyes.\n- [L6 - MED] EDITORIAL CONTRAST. Balanced contrast for studio look. Defined shadows without crushing.\n- [L1 - LOW] CHROMA DENOISE. Remove only color noise. Keep Luminance grain to prevent waxy skin.\n\nFollow the slider directives precisely while preserving the core identity and composition.",
  "generation_config": {
    "seed": 12345,
    "strength": 0.65,
    "guidance_scale": 7.0,
    "sampler": "Euler a"
  }
}
```

**Proceso Interno:**

1. Lee cada slider del `sliderConfig`
2. Para cada slider no nulo, busca su nivel (0-10 → OFF/LOW/MED/HIGH/FORCE)
3. Consulta `slider_definitions` tabla para obtener la instrucción exacta para ese nivel
4. Arma un bloque "RECONSTRUCTION DIRECTIVES" con todas las instrucciones
5. Ensambla prompt maestro: subject + diagnostics + directives

---

### 3.3 POST /generate-image

**Purpose:** Llamar a Nano Banana Pro con prompt compilado + imagen de referencia

**Request:**

```json
{
  "prompt": "...",
  "config": {
    "seed": 12345,
    "strength": 0.65,
    "guidance_scale": 7.0,
    "sampler": "Euler a"
  },
  "uploadId": "upload-uuid-123",
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
  "variationIndex": 0,
  "preset": null
}
```

**Response:**

```json
{
  "success": true,
  "url": "https://cdn.luxscaler.app/preview_0_1234567890.jpg",
  "clean_path": "uploads-123/clean_0_1234567890.jpg",
  "generation_id": "gen-uuid-456"
}
```

**Storage Locations:**

- **`generations_private`** bucket: Imagen limpia (sin watermark, disponible solo para propietario)
  
  - Path: `{uploadId}/clean_{variationIndex}_{timestamp}.jpg`

- **`generations_public`** bucket: Imagen con watermark (preview público)
  
  - Path: `{uploadId}/preview_{variationIndex}_{timestamp}.jpg`

---

### 3.4 POST /finalize-image (Unlock + Upscale 8K)

**Purpose:** Unlock la imagen: aplica refinamientos opcionales, inpaint de OCR, upscale 8K

**Request:**

```json
{
  "uploadId": "upload-uuid-123",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "targetResolution": "8K",
  "userRefinePrompt": "Make the background blur more cinematic",
  "userRefineMask": "base64-encoded mask image"
}
```

**Process Flow:**

1. **Validar Tier & Tokens:**
   
   - Leer `profiles.tier` y `tier_config`
   - Verificar `can_upscale_8k`
   - Calcular costo: `baseUnlockCost + (wants8k ? upscale8kCost : 0)`
   - Verificar `token_balance`

2. **Recuperar Imagen Limpia:**
   
   - Descargar desde `generations_private` bucket
   - Esta es la imagen sin watermark del paso anterior

3. **Cola de Ediciones (Si Existen):**
   
   - Si `userRefinePrompt` no es vacío → Laozhang Edit (inpainting/refinement)
   - Si hay `ocr_data` en `analysis_results` → Para cada texto OCR, Laozhang Edit para "render" el texto con precisión
   
   ```json
   {
     "prompt": "Render the text 'ACME' clearly on the building facade. High resolution typography.",
     "strength": 0.95,
     "mask_box": [100, 200, 300, 250],
     "text": "ACME",
     "surface_material": "concrete"
   }
   ```

4. **Upscale (Replicate):**
   
   - Si `targetResolution === "8K"` → 32 megapixels
   - Si `targetResolution === "4K"` → 8 megapixels
   
   ```typescript
   const upscaleRes = await fetch('https://api.replicate.com/v1/predictions', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Token ${REPLICATE_API_TOKEN}`
     },
     body: JSON.stringify({
       version: UPSCALER_MODEL,
       input: {
         image: imageBase64,
         megapixels: targetResolution === '8K' ? 32 : 8
       }
     })
   });
   ```

5. **Guardar Final:**
   
   - Subir a `generations_public` bucket
   - Path: `{uploadId}/final_{timestamp}_{resolution}.jpg`
   - Actualizar `generations` tabla: set `final_url`, `is_preview=false`, `tokens_spent`
   - Restar tokens de `profiles.token_balance`

**Response:**

```json
{
  "success": true,
  "final_url": "https://cdn.luxscaler.app/final_1234567890_8k.jpg",
  "tokens_spent": 50,
  "remaining_balance": 950
}
```

### 3.5 POST /save-preset (Crear Herramienta)

```


**Purpose:** Guardar configuración actual + Imagen de referencia (Smart Anchor)

**Request:**
```json
{
  "userId": "uuid-user...",
  "uploadId": "uuid-upload-source...",
  "presetName": "Restaurante Lujoso",
  "currentSliders": { "p1": 5, "s3": 8, "l1": 6 },
  "userAnchors": {
    "background": true,
    "lighting": true,
    "style": false
  }
}
```

**Response:**

JSON

```
{
  "success": true,
  "presetId": "new-preset-uuid"
}
```

### 3.6 POST /user/workflow (Configurar "Pocket Mode")

**Purpose:** Definir la receta de generación automática para subidas futuras.

**Request:**

JSON

```
{
  "userId": "uuid-user...",
  "isAsyncEnabled": true,
  "batchConfig": [
    { "type": "AUTO", "variant": "FORENSIC" },
    { "type": "PRESET", "preset_id": "uuid-preset-123" }
  ]
}
```

**Response:**

JSON

```
{
  "success": true,
  "message": "Workflow updated. New uploads will generate 2 variations automatically."
}
```

## 4. INFRAESTRUCTURA Y DESPLIEGUE

### 4.1 Estructura de Buckets Supabase Storage

```
🏭 Supabase Storage
├── 📁 biopsies (Private, RLS: owner only)
│   └── {uploadId}/
│       ├── thumbnail.jpg
│       ├── center.jpg
│       ├── shadow.jpg
│       └── detail.jpg
│
├── 📁 generations_private (Private, RLS: owner only)
│   └── {uploadId}/
│       ├── clean_0_timestamp.jpg
│       ├── clean_1_timestamp.jpg
│       └── ...
│
└── 📁 generations_public (Public, RLS: read-only for all, write only owner)
    └── {uploadId}/
        ├── preview_0_timestamp.jpg
        ├── preview_1_timestamp.jpg
        ├── final_timestamp_8k.jpg
        └── final_timestamp_4k.jpg
```

### 4.2 Políticas RLS (Row-Level Security)

**`biopsies` bucket:**

```sql
-- RLS Policy: Owner only
CREATE POLICY biopsies_owner_access ON storage.objects
  FOR ALL USING (
    (bucket_id = 'biopsies' AND auth.uid()::text = owner)
  );
```

**`generations_private` bucket:**

```sql
-- RLS Policy: Owner only
CREATE POLICY generations_private_owner_access ON storage.objects
  FOR ALL USING (
    (bucket_id = 'generations_private' AND auth.uid()::text = owner)
  );
```

**`generations_public` bucket:**

```sql
-- RLS Policy: Public read, owner write
CREATE POLICY generations_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'generations_public');

CREATE POLICY generations_public_owner_write ON storage.objects
  FOR INSERT, UPDATE, DELETE USING (
    (bucket_id = 'generations_public' AND auth.uid()::text = owner)
  );
```

### 4.3 Variables de Entorno (Supabase Edge Functions)

```bash
# .env.production
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...

# Vision API
GEMINI_API_KEY=AIzaSy...

# Image Generation
NANO_BANANA_API_KEY=xxxxx
NANO_BANANA_ENDPOINT=https://api.nanobananafarm.com/v1/generate

# Image Upscaler
REPLICATE_API_TOKEN=r8_xxxxx
UPSCALER_MODEL=xxxxxxx

# Image Inpainting/Editing
LAOZHANG_API_KEY=xxxxx
LAOZHANG_EDIT_ENDPOINT=https://api.laozhang.com/v1/edit

# Monitoring
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### 4.4 Despliegue de Edge Functions (Supabase)

```bash
# 1. Crear carpeta de funciones
mkdir -p supabase/functions/vision-orchestrator
mkdir -p supabase/functions/prompt-compiler
mkdir -p supabase/functions/generate-image
mkdir -p supabase/functions/finalize-image

# 2. Desplegar a Supabase
supabase functions deploy vision-orchestrator
supabase functions deploy prompt-compiler
supabase functions deploy generate-image
supabase functions deploy finalize-image

# 3. Verificar despliegue
supabase functions list
```

---

## 5. FLUJO DE ERRORES Y TROUBLESHOOTING

### 5.1 Matriz de Errores y Respuestas

| **Escenario**            | **Error**                              | **Causa**                           | **Respuesta al Usuario**                                     | **Acción Backend**                           |
|:------------------------ |:-------------------------------------- |:----------------------------------- |:------------------------------------------------------------ |:-------------------------------------------- |
| Biopsia no generada      | `Biopsy generation failed`             | Archivo corrupto o muy grande       | "Try a different image"                                      | Log error, alert                             |
| Gemini Vision falla      | `AI Vision Failed: API limit exceeded` | Quota de Gemini agotado             | "Service temporarily unavailable. Try later."                | Retry con backoff exponencial                |
| Imagen muy pequeña       | `Image too small`                      | < 512x512 (limite práctico)         | "Image must be at least 512x512"                             | Rechazar en frontend                         |
| Imagen muy grande        | `Image exceeds 19.5MP limit`           | > 19.5 MP                           | "Use LuxScaler Pro for larger files"                         | Rechazar en frontend                         |
| Insuficientes tokens     | `Insufficient tokens`                  | `token_balance < cost`              | "Not enough tokens. Upgrade or buy tokens."                  | Rechazar generación                          |
| Tier no permite 8K       | `Tier does not allow 8K Upscale`       | Usuario intenta upscale sin permiso | "Your plan doesn't support 8K. Upgrade to PRO_LUX."          | Rechazar solicitud                           |
| Nano Banana falla        | `Nano Banana failed: ...`              | Error en API externa                | "Generation failed. Please try again."                       | Log error, retry con seed diferente          |
| Replicate upscaler falla | `Replicate upscaler failed: ...`       | Error en upscaling                  | "Upscale failed. Refund tokens."                             | Revertir token deduction, alertar al usuario |
| Laozhang inpaint falla   | `Laozhang edit failed: ...`            | Error en refinamiento OCR           | "Text rendering failed. Imagen disponible sin refinamiento." | Saltar ese paso, continuar                   |

### 5.2 Estrategia de Fallback (Vision)

**Si Gemini falla 3 veces:**

```typescript
// fallback-strategy.ts
const FALLBACK_ANALYSIS: AnalysisResult = {
  cat_code: 'ERROR_UNIDENTIFIED',
  detected_defects: [],
  severity_score: 5,
  visual_summary: 'Unable to identify image content',
  reasoning: 'Vision service unavailable. Using conservative defaults.',
  auto_settings: {
    // Defaults "seguros": enhancement moderado
    p1: 5,  // Moderada limpieza
    p3: 5,  // Moderada nitidez
    s1: 3,  // Light retouch
    l6: 5   // Moderado contraste
  }
};

// Si vision-orchestrator falla 3x:
// 1. Log error para debugging
// 2. Usar CAT21 (FALLBACK) con settings conservadores
// 3. Mostrar banner: "Running in safe mode due to service issues"
// 4. Permitir usuario ajustar manualmente
```

### 5.3 Manejo de OCR Fallidos

```typescript
// Si OCR no puede leer texto en imagen:

if (!ocrData || ocrData.length === 0) {
  // Opción 1: Skip OCR refinement
  console.warn('OCR produced no detectable text. Skipping OCR inpaint.');

  // Opción 2: Notificar usuario
  toast.info('No text detected in image. Skipping text refinement.');

  // Opción 3: Permitir user input manualmente
  showManualOCRDialog();
}
```

### 5.4 Reembolso de Tokens (Upscale Failure)

```typescript
// Si upscale 8K falla después de deducir tokens:

if (upscalerFailed) {
  // Revertir token deduction
  await supabase
    .from('profiles')
    .update({ token_balance: profile.token_balance + totalCost })
    .eq('id', userId);

  // Crear audit log
  await supabase.from('token_audit_log').insert({
    user_id: userId,
    action: 'REFUND',
    amount: totalCost,
    reason: 'Upscale 8K failed',
    generation_id: genRecord.id,
    timestamp: new Date()
  });

  // Notificar usuario
  toast.success(`Tokens refunded due to upscale failure. ${totalCost} tokens restored.`);
}
```

### 5.5 Debugging: Logs Estructurados

```typescript
// Log tracing para debuggear flujo completo

const traceId = crypto.randomUUID();

console.log(JSON.stringify({
  traceId,
  timestamp: new Date().toISOString(),
  service: 'vision-orchestrator',
  event: 'BIOPSY_RECEIVED',
  userId,
  uploadId,
  biopsySize: biopsyUrls.thumbnail_base64.length,
  status: 'OK'
}));

// Luego en cada paso:
// - BIOPSY_RECEIVED
// - GEMINI_CALLED
// - GEMINI_RESPONSE
// - TAXONOMY_MATCHED (CAT02)
// - DIAGNOSIS_MATCHED (IN02, IN03)
// - AUTO_SETTINGS_APPLIED
// - BATCH_QUEUED / REVIEW_REQUIRED

// Al final, reunir todos los logs con mismo traceId para análisis completo
```

---

## RESUMEN: Flow Completo de Transacción

```
┌─────────────────────────────────────────────────────────────┐
│ USUARIO SUBE IMAGEN (Frontend)                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────────┐
         │ Biopsy Engine     │
         │ - Thumbnail: 1KB  │
         │ - Center: 512px   │
         │ - Shadow: 512px   │
         │ - Detail: 512px   │
         │ Total: ~300KB     │
         └────────┬──────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │ POST /vision-orchestrator   │
    │ (Gemini Vision Analyze)     │
    └────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   ┌─────────┐        ┌──────────┐
   │ AUTO    │        │USER/PRO/ │
   │ TIER    │        │PRO_LUX   │
   └────┬────┘        └─────┬────┘
        │                   │
        ▼                   ▼
   ┌──────────────┐  ┌───────────────────┐
   │BATCH_        │  │REVIEW_REQUIRED    │
   │PROCESSING   │  │Status returned     │
   │Auto genera   │  │User ajusta sliders │
   │3 variations  │  │                    │
   └──────┬───────┘  └──────────┬────────┘
          │                     │
          ▼                     ▼
   ┌─────────────────┐  ┌──────────────────┐
   │POST /prompt-    │  │POST /prompt-     │
   │compiler (x3)    │  │compiler (x1)     │
   └────────┬────────┘  └────────┬─────────┘
            │                    │
            ▼                    ▼
   ┌─────────────────┐  ┌──────────────────┐
   │POST /generate-  │  │POST /generate-   │
   │image (x3)       │  │image (x1)        │
   │Nano Banana Pro  │  │Nano Banana Pro   │
   └────────┬────────┘  └────────┬─────────┘
            │                    │
            ▼                    ▼
   ┌─────────────────┐  ┌──────────────────┐
   │3 Previews       │  │1 Preview         │
   │Watermarked      │  │Watermarked       │
   │Public URLs      │  │Public URL        │
   └────────┬────────┘  └────────┬─────────┘
            │                    │
            └────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ USUARIO SELECCIONA   │
          │ PREVIEW + UNLOCK     │
          │ (Paga con tokens)    │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ POST /finalize-image │
          │ - Optional refine    │
          │ - OCR inpaint        │
          │ - Upscale 8K (opt)   │
          │ - Watermark removal  │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ IMAGEN FINAL LISTA   │
          │ 4K/8K Sin watermark  │
          │ URL privada/pública  │
          │ Tokens deducidos     │
          └──────────────────────┘
```

---

## CONCLUSIÓN

Este documento describe el **sistema nervioso completo** de LuxScaler:

1. **Frontend genera biopsia quirúrgica** (4 imágenes comprimidas)
2. **Backend analiza con Gemini Vision** (clasificación automática)
3. **3 UI profiles** (AUTO, USER, PRO, PRO_LUX) → mapeos de sliders
4. **Compilador de prompts** traduce sliders a instrucciones semánticas
5. **Generador crea imagen** con controles determinísticos
6. **Finalizador** aplica refinamientos y upscale 8K

**Todo es data-driven:** Las 135 instrucciones de slider, las 21 categorías, los 10 diagnósticos y las 4 tiers viven en la BD, NO en código hardcodeado.

Un desarrollador React/Next.js puede ahora leer este documento y construir exactamente la interfaz necesaria sin tener que preguntar \"¿qué hace este botón?\".
