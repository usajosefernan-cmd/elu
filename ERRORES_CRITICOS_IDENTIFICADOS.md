# 🐛 ERRORES CRÍTICOS IDENTIFICADOS EN EL CHAT

## ❌ ERRORES ACTIVOS

### 1. API KEY LEAKED - Error 403 Persistente
**Problema:**
```
Error: 403 PERMISSION_DENIED
'Your API key was reported as leaked. Please use another API key.'
Key: AIzaSyAM1iSrdG5FS1twfl7WPckl5ea6VNHXEtw
```

**Causa raíz:**
- El código SIGUE usando Gemini API en vez de LaoZhang
- `edgeFunctionsService.ts` línea 149: Hace fallback a FastAPI
- FastAPI usa `gemini_service.py` que usa key leaked

**Dónde está el problema:**
```
edgeFunctionsService.ts:149
  → callFastApi()
    → /api/process/generate-image-with-sliders
      → gemini_service.py
        → key_manager.get_next_key()
          → Aunque cambié orden, aún puede usar key_1
```

**Solución real:**
- ❌ NO usar Gemini API (todas las keys pueden estar comprometidas)
- ✅ Usar LaoZhang directamente en frontend
- ✅ O crear Edge Function en Supabase con LaoZhang

---

### 2. Usuario Atrapado Sin Poder Salir

**Ubicaciones problemáticas:**
1. Admin System Config
2. Mobile Simulator
3. Pantalla de comparación (0/6 VARIATIONS)

**Problema:**
- Añadí botones pero NO son visibles
- O están en componentes que no se renderizan
- O el z-index no es suficiente

**Soluciones intentadas (fallidas):**
- Botón en AdminHeader (no se ve)
- Botón flotante en AdminDashboard (no se ve)
- Botón en MobileCameraView (no se ve)
- Botón en sidebar (no se ve)

**Solución real necesaria:**
- Botón con z-index: 99999999
- Position: fixed
- Style inline (no Tailwind que puede fallar)
- En TODOS los componentes problemáticos

---

### 3. Pantalla de Comparación Bloqueante

**Qué pasa:**
1. Usuario genera imagen
2. Aparece pantalla con:
   - "0 / 6 VARIATIONS"
   - Botón "REINICIAR"
   - Botón "CREAR MASTER 4K"
3. Usuario no puede hacer nada útil

**Problema:**
- La vista de comparación espera 6 variaciones
- Solo se genera 1
- previews.length = 0 o 1
- UI muestra pantalla vacía

**Dónde está:**
- App.tsx líneas 1580-1600
- Se renderiza cuando `status === AgentStatus.COMPLETED`

**Solución intentada:**
- Auto-redirect a /archives
- Cambiar botón a "IR A ARCHIVES"

**Por qué falla:**
- El redirect no se ejecuta si hay error antes
- O el status no llega a COMPLETED

---

### 4. ProcessingOverlay Props Incorrectos

**Hay 2 versiones del componente:**

**Versión 1:** `/components/mobile/ProcessingOverlay.tsx`
```typescript
interface ProcessingOverlayProps {
    profiles?: any[];
    onComplete?: () => void;
    onCancel?: () => void;
    status: 'ANALYZING' | 'GENERATING' | 'DONE' | 'ERROR';
    logs: string[];
    progress: number;
    phase?: 'upload' | 'vision' | 'compile' | 'generate' | null;
    canClose?: boolean;
}
```

**Versión 2:** Lo que intenté añadir
```typescript
interface ProcessingOverlayProps {
    visible: boolean;
    phase: string;
    progress: number;
    label: string;
    elapsedTime: number;
    etaSeconds: number;
    startedAt: number;
    systemLogs: string[];
    onClose?: () => void;
}
```

**Problema:**
- Props no coinciden
- App.tsx usa una versión
- Componente espera otra
- Mi cambio no aplicó correctamente

---

### 5. Archives Vacío

**Estado actual:**
```
uploads: 112 filas (hay datos)
generations: 0 filas (VACÍO)
analysis_results: 0 filas (VACÍO)
```

**Problema:**
- Las generaciones NO se están guardando
- Por eso Archives está vacío
- historyService busca en generations pero no hay nada

**Causa:**
- El flujo de generación falla con error 403
- Nunca llega a guardar en generations
- O guarda en tabla antigua que ya no existe

---

### 6. Confusión FastAPI vs Edge Functions

**Lo que el proyecto DEBE usar:**
- ✅ Supabase Edge Functions (Deno/TypeScript)

**Lo que implementé:**
- ❌ FastAPI endpoints en Python
- ❌ v41_routes.py
- ❌ vision_orchestrator_v41.py

**Problema:**
- Antigravity necesita Edge Functions
- Todo mi código v41 está en Python
- Necesita ser portado a Deno/TypeScript

---

## 🔧 SOLUCIONES REALES NECESARIAS

### Fix 1: Usar LaoZhang DIRECTAMENTE
```typescript
// En edgeFunctionsService.ts
export const generateImageWithSliders = async (imageUrl, sliderConfig, options) => {
  // NO llamar FastAPI
  // NO usar Gemini
  
  // Llamar LaoZhang directamente:
  const response = await fetch('https://api.laozhang.ai/v1beta/models/gemini-3-pro-image-preview:generateContent', {
    headers: { 'Authorization': 'Bearer sk-aduYr...' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { data: imageBase64 }}]}],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { imageSize: '4K' }}
    })
  });
  
  const result = await response.json();
  
  // Guardar en Supabase generations
  await supabase.from('generations').insert({
    upload_id: uploadId,
    watermarked_url: result.image_base64,
    ...
  });
};
```

### Fix 2: Botón de Salida REAL
```typescript
// En TODOS los componentes problemáticos
// Añadir al inicio del return:

<div
  onClick={() => window.location.href = '/'}
  style={{
    position: 'fixed',
    top: '10px',
    left: '10px',
    zIndex: 2147483647,  // MAX z-index posible
    width: '80px',
    height: '80px',
    backgroundColor: '#dc2626',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    border: '4px solid white'
  }}
>
  ← HOME
</div>
```

### Fix 3: Skip Vista de Comparación
```typescript
// En App.tsx después de generar exitosamente:
if (generateResult.success) {
  // NO mostrar vista de comparación
  // IR DIRECTO a Archives
  setShowProcessingOverlay(false);
  navigate('/archives');
  return;  // SALIR del flujo
}
```

---

## 📋 PLAN DE ACCIÓN

1. ✅ Cambiar generateImageWithSliders para usar LaoZhang directo
2. ✅ Guardar en generations table
3. ✅ Añadir botón HOME en todos los componentes (z-index máximo)
4. ✅ Skip vista de comparación → Direct to Archives
5. ✅ Fix ProcessingOverlay props
6. ✅ Commit y push a GitHub

¿Procedo con estos fixes?
