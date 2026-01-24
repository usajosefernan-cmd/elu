# LUXSCALER v41 - API REFERENCE

## 🌐 BASE URL
```
Producción: https://photo-wizard-123.preview.emergentagent.com/api/v41
Desarrollo: http://localhost:8001/api/v41
```

---

## 📡 ENDPOINTS

### 1. POST /vision-orchestrator

**Purpose:** Analiza y clasifica imagen usando Vision + Supabase

**Request:**
```json
{
  "userId": "uuid",
  "biopsyUrls": {
    "thumbnail_base64": "...",
    "center_base64": "...",
    "shadow_base64": "...",
    "detail_base64": "...",
    "originalWidth": 4000,
    "originalHeight": 3000
  }
}
```

**Response (AUTO):**
```json
{
  "status": "BATCH_PROCESSING",
  "uploadId": "uuid",
  "count": 1,
  "analysis": {
    "cat_code": "CAT02",
    "detected_defects": ["IN02", "IN03"],
    "severity_score": 6,
    "visual_summary": "..."
  },
  "auto_settings": {"p1": 7, "p3": 10, "s1": 5}
}
```

**Response (USER/PRO/PRO_LUX):**
```json
{
  "status": "REVIEW_REQUIRED",
  "uploadId": "uuid",
  "analysis": {...},
  "final_prescription": {"p1": 7, "p3": 10},
  "can_refine": false,
  "can_upscale_8k": false,
  "tier": "USER",
  "token_balance": 100
}
```

---

### 2. POST /prompt-compiler

**Purpose:** Ensambla prompt desde slider_definitions en Supabase

**Request:**
```json
{
  "visionResult": {...},
  "sliderConfig": {"p1": 5, "p3": 9, "s1": 7},
  "savedPreset": {"seed": 123, "temperature": 0.4},
  "userMode": "pro"
}
```

**Response:**
```json
{
  "success": true,
  "compiled_prompt": "You are LuxScaler... [RECONSTRUCTION DIRECTIVES]...",
  "generation_config": {
    "seed": 123,
    "temperature": 0.4,
    "top_k": 40,
    "top_p": 0.9
  },
  "metadata": {
    "photoscaler_count": 3,
    "stylescaler_count": 2,
    "lightscaler_count": 1
  }
}
```

---

### 3. POST /generate

**Purpose:** Genera imagen con LaoZhang Nano Banana Pro

**Request:**
```json
{
  "uploadId": "uuid",
  "prompt": "...",
  "config": {"temperature": 0.4, "seed": 123},
  "imageBase64": "...",
  "preset": {
    "id": "uuid",
    "reference_image_url": "data:image/...",
    "anchor_preferences": {"background": true, "lighting": true},
    "nano_params": {"strength": 0.85, "guidance_scale": 4.0}
  }
}
```

**Response:**
```json
{
  "success": true,
  "image_base64": "...",
  "upload_id": "uuid",
  "generation_id": "uuid"
}
```

---

### 4. POST /save-preset

**Purpose:** Guarda preset con Smart Anchors

**Request:**
```json
{
  "userId": "uuid",
  "uploadId": "uuid",
  "presetName": "Restaurante Lujoso",
  "description": "Iluminación dramática interior",
  "userAnchors": {
    "background": true,
    "lighting": true,
    "clothes": false,
    "pose": false,
    "style": false
  },
  "currentSliders": {"p1": 5, "p3": 9, "s1": 7},
  "thumbnailBase64": "..."
}
```

**Response:**
```json
{
  "success": true,
  "presetId": "uuid",
  "message": "Preset Anchored Successfully",
  "preset": {...}
}
```

---

### 5. GET /presets/{userId}

**Purpose:** Obtiene presets del usuario

**Response:**
```json
{
  "success": true,
  "presets": [
    {
      "id": "uuid",
      "name": "Restaurante Lujoso",
      "description": "...",
      "sliders_config": {...},
      "nano_params": {"strength": 0.85, "guidance_scale": 4.0},
      "anchor_preferences": {"background": true},
      "reference_image_url": "...",
      "thumbnail_base64": "..."
    }
  ]
}
```

---

### 6. GET /macro-definitions/{profile_tier}

**Purpose:** Obtiene macros para USER o PRO

**Response:**
```json
{
  "success": true,
  "macros": [
    {
      "macro_key": "restauracion",
      "profile_tier": "PRO",
      "pillar": "PHOTOSCALER",
      "ui_title": "Restauración",
      "ui_icon": "🛠️",
      "slave_sliders": ["p1", "p2", "p8", "p9"]
    }
  ]
}
```

---

## 🍌 LAOZHANG API

### Credenciales:
```
API Key: sk-aduYr9zcGnV39Vpj238041B0Af384432BeFf37C5E8F8Bf24
Base URL: https://api.laozhang.ai
```

### Nano Banana Pro:
```
Model: gemini-3-pro-image-preview
Endpoint: /v1beta/models/gemini-3-pro-image-preview:generateContent
Costo: $0.05/edit
Resolución: 4K (4096x4096)
Multi-imagen: Hasta 14 referencias
```

### Configuración:
```json
{
  "contents": [{
    "parts": [
      {"text": "prompt"},
      {"inline_data": {"mime_type": "image/jpeg", "data": "base64"}},
      {"inline_data": {"mime_type": "image/jpeg", "data": "reference_base64"}}
    ]
  }],
  "generationConfig": {
    "responseModalities": ["IMAGE"],
    "imageConfig": {
      "aspectRatio": "16:9",
      "imageSize": "4K"
    }
  }
}
```

---

## FIN API REFERENCE