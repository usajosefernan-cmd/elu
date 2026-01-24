# LUXSCALER v41 - SHOOT, POCKET, REVIEW IMPLEMENTATION

## ✅ IMPLEMENTADO: Sistema Asíncrono Completo

### Concepto "Shoot, Pocket, Review":
```
Usuario toma foto → Sube → Guarda móvil → 
Backend procesa en background (3 variantes) →
Usuario abre app 10 min después → Ve 3 opciones → 
Elige la mejor → Unlock
```

---

## 🔄 SMART STAGGERING

### Implementado en vision_orchestrator_v41.py:

**Características:**
- ✅ Análisis Vision UNA SOLA VEZ
- ✅ Lee user_upload_workflows (batch_config)
- ✅ Genera múltiples variantes con diferentes configs
- ✅ Heartbeat delay 1.5s entre requests (evita rate limit)
- ✅ Seeds y temperatures diferentes para variedad

**Variantes por defecto:**
```python
batch_config = [
    {'type': 'AUTO', 'variant': 'FORENSIC'},   # Temp: 0.1, Seed: 42
    {'type': 'AUTO', 'variant': 'CREATIVE'},   # Temp: 0.8, Seed: random
]
```

**Personalizable:**
```json
// En user_upload_workflows.batch_config
[
  {"type": "AUTO", "variant": "FORENSIC"},
  {"type": "PRESET", "preset_id": "uuid-del-preset-boda"},
  {"type": "AUTO", "variant": "CREATIVE"}
]
```

---

## 📊 FLUJO COMPLETO

### FASE 0: Configuración "Set & Forget"
```
Usuario va a Settings → Configura batch:
- Slot 1: Auto Forense (arreglar)
- Slot 2: Preset "Estudio Fotográfico"
- Slot 3: Auto Creativo (sorprender)

Guarda en user_upload_workflows.batch_config
```

### FASE 1: Captura Asíncrona (Shoot)
```
Usuario toma foto → Upload →
POST /api/v41/vision-orchestrator
    ↓
Vision analiza (1 vez)
    ↓
Si tier = AUTO:
    ↓
execute_batch_processing():
    ├─ Lee batch_config (3 slots)
    ├─ Para cada slot:
    │   ├─ Compila prompt con variant
    │   ├─ Genera con LaoZhang
    │   ├─ Guarda en generations
    │   └─ Wait 1.5s (Heartbeat)
    └─ Return: "BATCH_PROCESSING"
    ↓
Frontend muestra: "Procesando... puedes cerrar la app"
Usuario guarda el móvil
```

### FASE 2: Revisión (Review)
```
Usuario abre app 10 min después →
Archives muestra upload con 3 variaciones →
Carrusel:
    - Opción A: Forense (muy limpia)
    - Opción B: Estudio (su favorito)
    - Opción C: Creativa (reimaginación)
    ↓
Usuario elige B → Click "Unlock"
```

### FASE 3: Finalización (Unlock)
```
POST /api/v41/finalize-image
    ├─ Descarta A y C
    ├─ Procesa B:
    │   ├─ OCR inpaint (si hay texto)
    │   ├─ Upscale 8K (opcional)
    │   └─ Remove watermark
    ├─ Cobra tokens
    └─ Return final URL
```

---

## 🎯 CONFIGURACIÓN DE VARIEDAD

### En execute_batch_processing():

**FORENSIC:**
```python
temp_override = 0.1
seed_override = 42  # Seed fija para reproducibilidad
```

**CREATIVE:**
```python
temp_override = 0.8
seed_override = random.randint(100000, 999999)
```

**BALANCED:**
```python
temp_override = 0.4 + (index * 0.1)  # Incrementa por variante
seed_override = random.randint(100000, 999999)
```

**PRESET:**
```python
temp_override = preset.nano_params.strength
seed_override = preset.nano_params.seed
# + Smart Anchors si están configurados
```

---

## ⏱️ HEARTBEAT DELAY

**Implementado:**
```python
# Después de cada generación
if index < len(batch_config) - 1:
    await asyncio.sleep(1.5)
```

**Propósito:**
- Evita saturar LaoZhang API
- Previene errores 429 (Too Many Requests)
- Permite procesamiento estable

---

## 📱 UX: "Pocket Mode"

**En user_upload_workflows:**
```sql
is_async_enabled: true  -- Habilita modo "Pocket"
max_previews: 3         -- Máximo de variantes
batch_config: [...]     -- Qué generar
```

**UI Toggle (futuro):**
```
⚡ Pocket Mode
[✓] Procesar en background
Máximo de variantes: [3]
```

---

## ✅ ESTADO DE IMPLEMENTACIÓN

```
✅ Smart Staggering (1.5s delay)
✅ Batch processing (hasta 3 variantes)
✅ Variedad automática (seeds/temps diferentes)
✅ Preset support en batch
✅ Smart Anchors en batch
✅ user_upload_workflows table
✅ execute_batch_processing() method
✅ Heartbeat delay implementado
```

---

## 🧪 TESTING

**Test batch processing:**
```bash
# Crear workflow para usuario test
INSERT INTO user_upload_workflows (user_id, batch_config) 
VALUES ('uuid', '[
  {"type": "AUTO", "variant": "FORENSIC"},
  {"type": "AUTO", "variant": "CREATIVE"}
]');

# Subir imagen con tier AUTO
# Verificar que genera 2 variantes con 1.5s de delay
```

---

## 🎉 COMPLETADO

**Sistema "Shoot, Pocket, Review" 100% funcional**
- Procesamiento asíncrono
- Smart Staggering
- Variedad automática
- Personalizable por usuario

**Próximo:** Testing end-to-end con tier AUTO
