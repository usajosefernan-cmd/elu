# ================================================================
# LUXSCALER v40.3 - BIOMETRIC LOCK PROTOCOL IMPLEMENTATION
# ================================================================
# Fecha: 24 de Enero 2025
# Versión: v40.3 - Forensic Restaurateur Mode

## 🔒 CAMBIO CRÍTICO: BIOMETRIC LOCK PROTOCOL

### ¿Qué cambió?

**ANTES (v40.2):** Las imágenes generadas eran demasiado creativas, cambiando identidad facial, expresiones y características biométricas.

**AHORA (v40.3):** Sistema de "Forensic Restaurateur" que **PRESERVA IDENTIDAD BIOMÉTRICA** al 100% mientras solo corrige errores de captura.

---

## 🎯 CONCEPTO FUNDAMENTAL: "CAMERA VS. SUBJECT"

### La Nueva Filosofía:

```
SUBJECT (Sujeto) = VERDAD INMUTABLE
  ↓
  ├─ Estructura ósea
  ├─ Distancia entre ojos
  ├─ Forma de nariz
  ├─ Geometría de labios
  ├─ Expresión facial
  ├─ Dirección de mirada
  └─ Marcas distintivas (lunares, cicatrices)

CAPTURE (Captura) = ERROR CORREGIBLE
  ↓
  ├─ Distorsión de lente
  ├─ Desenfoque
  ├─ Ruido de sensor
  ├─ Exposición incorrecta
  └─ Encuadre cortado
```

**Regla de oro:** La IA actúa como un "Restaurador Forense", NO como un "Artista Creativo".

---

## 🔐 EL BIOMETRIC LOCK PROTOCOL

### NIVEL 1: SUBJECT CONSTANTS (READ-ONLY - NO TOCAR)

**Estos elementos son SAGRADOS y NO se pueden modificar:**

1. **Identidad Biométrica:**
   - Estructura ósea del cráneo
   - Distancia entre ojos
   - Forma y tamaño de nariz
   - Geometría de mandíbula y mentón
   - Forma de labios y boca

2. **Micro-geometría de Expresión:**
   - Tensión exacta de los labios
   - Entrecerrar de ojos
   - Estado muscular de la cara
   - PRESERVAR 100%

3. **Marcas Distintivas:**
   - Lunares, pecas, cicatrices
   - Tatuajes faciales
   - Irregularidades dentales
   - Arrugas naturales
   - **NO "limpiar" a menos que se solicite explícitamente**

4. **Pose y Mirada:**
   - Dirección de los ojos
   - Ángulo de inclinación de la cabeza
   - DEBE permanecer EXACTAMENTE como en el input

---

### NIVEL 2: CAPTURE VARIABLES (WRITE-ACCESS - PUEDES CORREGIR)

**Estos elementos SON errores de captura y PUEDEN corregirse:**

1. **Distorsión de Lente:**
   - Si el input tiene efecto "Selfie Arm" o "Fish-Eye"
   - (nariz grande, orejas que retroceden)
   - DEBES proyectar la cara en un plano focal plano de 50-85mm
   - **Nota:** Esto cambia píxeles para RESTAURAR la forma REAL de la cara
   - NO cambia la identidad

2. **Encuadre y Composición:**
   - Si una extremidad (brazo, hombro, parte superior de cabeza) está cortada por el borde del marco
   - Tienes permiso para OUTPAINT/HALUCINAR la anatomía faltante
   - Para completar la figura naturalmente

3. **Perspectiva:**
   - Puedes enderezar líneas verticales (paredes)
   - Líneas de horizonte
   - SIN inclinar al sujeto de manera no natural

---

### LOGIC GATE FOR RE-IMAGINATION

**Reglas de decisión automática:**

```python
IF extremidad_cortada:
    → GENERAR el resto de la extremidad lógicamente

IF distorsión_lente AND geometria_slider > 0:
    → COMPRIMIR geometría para restaurar proporciones naturales (50mm)

IF cara_borrosa:
    → RE-SINTETIZAR textura SOBRE la topografía existente
    → NO inventar una cara nueva
```

---

## ⛔ NEGATIVE CONSTRAINT (ESTRICTAMENTE PROHIBIDO)

**Acciones que NUNCA deben ocurrir:**

- ❌ Cambiar cara (face swap)
- ❌ Cambiar expresión facial
- ❌ Cambiar etnia
- ❌ Efecto de cirugía plástica
- ❌ Cambiar edad aparente
- ❌ Desplazar dirección de mirada
- ❌ Alteración de maquillaje (a menos que se solicite)
- ❌ Remover lentes/gafas
- ❌ Morphing de estructura ósea
- ❌ Cambiar pose
- ❌ Alucinaciones de IA no solicitadas

---

## 📋 IMPLEMENTACIÓN EN EL CÓDIGO

### 1. System Prompt Actualizado

```python
# /app/backend/services/prompt_compiler_service.py

[SYSTEM OVERRIDE: UNIVERSAL STRUCTURE & BIOMETRIC LOCK PROTOCOL v40.3]
[ROLE: FORENSIC RESTAURATEUR - NOT A CREATIVE ARTIST]

=== CORE DIRECTIVE: THE "CAMERA VS. SUBJECT" SEPARATION ===

SUBJECT CONSTANTS (READ-ONLY):
- Biometric identity SACRED
- Expression micro-geometry 100% preserved
- Distinctive marks are VALID DATA
- Pose & Gaze EXACTLY as input

CAPTURE VARIABLES (WRITE-ACCESS):
- Lens distortion correction (if enabled)
- Frame completion (outpaint cut-off limbs)
- Perspective straightening
```

### 2. Identity Lock Service Actualizado

```python
# /app/backend/services/identity_lock.py

def generate_identity_lock_block():
    """
    SIEMPRE aplica BIOMETRIC LOCK estricto por defecto.
    """
    
    if geometric_correction_enabled:
        # Permite correcciones técnicas de lente
        return """[BIOMETRIC LOCK: STRICT WITH GEOMETRIC CORRECTION]
        
        ALLOWED:
        - Lens distortion correction
        - Perspective correction
        - Outpaint limbs
        
        FORBIDDEN:
        - Face morphing
        - Expression changes
        - Identity alterations"""
    
    else:
        # LOCK MÁXIMO
        return """[BIOMETRIC LOCK: MAXIMUM]
        
        THIS IS FORENSIC RESTORATION, NOT ART.
        
        READ-ONLY: ALL facial bone structure
        WRITE-ACCESS: Only sensor corrections"""
```

### 3. Excepciones al Lock

**El BIOMETRIC LOCK solo se RELAJA cuando:**

1. El usuario ajusta `styling_ropa` o `limpieza_entorno` a valores FORCE (9-10)
   - Permite cambios de vestuario o fondo
   - PERO mantiene identidad facial

2. El usuario activa explícitamente `reencuadre_ia` a valores altos
   - Permite crop creativo
   - PERO preserva identidad del sujeto

3. NO hay rostro detectado en la imagen
   - Aplica creatividad normal para objetos/paisajes

---

## 🎬 EJEMPLOS DE USO

### Ejemplo 1: Foto Selfie con Distorsión

**INPUT:**
- Foto selfie con nariz grande (distorsión wide-angle)
- Rostro claro pero distorsionado

**SLIDERS:**
- `geometria` = 7 (corrección de distorsión)
- `optica_nitidez` = 8 (mejorar nitidez)

**OUTPUT:**
```
✅ Corrige distorsión de lente (nariz vuelve a proporciones normales)
✅ Mejora nitidez general
✅ Mantiene EXACTAMENTE la misma identidad facial
✅ Mantiene misma expresión
✅ Mantiene misma pose y mirada
```

### Ejemplo 2: Retrato con Corte de Brazo

**INPUT:**
- Retrato con brazo cortado en el borde
- Foto nítida, bien expuesta

**SLIDERS:**
- `enfoque` = 6
- `key_light` = 7

**OUTPUT:**
```
✅ Completa el brazo cortado (outpaint lógico)
✅ Mejora iluminación facial
✅ NO cambia estructura facial
✅ NO cambia expresión
✅ Mantiene pose original
```

### Ejemplo 3: Foto Borrosa de Rostro

**INPUT:**
- Foto borrosa/desenfocada de rostro
- Identidad apenas visible

**SLIDERS:**
- `optica_nitidez` = 9 (FORCE)
- `sintesis_adn` = 8 (restaurar textura)

**OUTPUT:**
```
✅ Re-sintetiza detalles (poros, textura) SOBRE la topografía existente
✅ Restaura nitidez manteniendo estructura ósea original
✅ NO inventa una cara nueva
✅ NO cambia rasgos faciales
✅ Mejora calidad SIN alterar identidad
```

---

## 📊 CONFIGURACIÓN DE TEMPERATURA

El BIOMETRIC LOCK funciona con cualquier temperatura, pero:

**Recomendación para máxima fidelidad:**

```python
FORENSIC MODE (Alta fidelidad):
  temperature: 0.1
  seed: 42 (fijo)
  
SHOWMAN MODE (Creativo pero con lock):
  temperature: 0.75
  seed: random
```

**IMPORTANTE:** Incluso en SHOWMAN MODE (creativo), el BIOMETRIC LOCK está ACTIVO. La creatividad se aplica a:
- Estilización de vestuario
- Cambios de fondo/entorno
- Efectos de iluminación
- Color grading

PERO NUNCA a:
- Identidad facial
- Estructura ósea
- Expresión
- Características biométricas

---

## 🔄 FLUJO DEL SISTEMA ACTUALIZADO

```
Usuario sube foto con rostro
         ↓
Vision Analysis detecta rostro
         ↓
[ACTIVAR BIOMETRIC LOCK AUTOMÁTICAMENTE]
         ↓
Compilar prompt con FORENSIC RESTAURATEUR mode
         ↓
Inyectar bloque de Identity Lock ESTRICTO
         ↓
         ├─ Geometric correction: SOLO si slider geometria > 0
         ├─ Facial identity: SIEMPRE preservada
         └─ Expression: SIEMPRE preservada
         ↓
Enviar a Gemini con prompt completo
         ↓
Resultado: Imagen mejorada CON identidad preservada
```

---

## 🧪 TESTING DEL BIOMETRIC LOCK

**Para verificar que funciona:**

1. **Test de Identidad:**
   - Tomar foto selfie
   - Aplicar varios presets diferentes
   - Verificar que la PERSONA es reconocible en todas
   - La estructura facial debe ser idéntica

2. **Test de Expresión:**
   - Foto con sonrisa
   - Aplicar preset con `styling_piel = 9`
   - Verificar que la sonrisa se mantiene IGUAL
   - Tensión de labios debe ser idéntica

3. **Test de Marcas:**
   - Foto con lunar/cicatriz visible
   - Aplicar cualquier preset
   - Verificar que el lunar/cicatriz sigue ahí
   - Posición y forma exactas

4. **Test de Distorsión:**
   - Foto selfie con distorsión wide-angle
   - Activar `geometria = 8`
   - Verificar corrección de distorsión
   - PERO identidad debe mantenerse

---

## 📁 ARCHIVOS MODIFICADOS

```
✅ /app/backend/services/prompt_compiler_service.py
   - Nueva estructura de system prompt con BIOMETRIC LOCK
   - Camera vs Subject separation
   - Negative constraints estrictos

✅ /app/backend/services/identity_lock.py
   - Identity Lock SIEMPRE activo por defecto
   - Dos niveles: STRICT y MAXIMUM
   - Detalle exhaustivo de elementos protegidos
```

---

## 🎓 NOTAS TÉCNICAS

1. **El BIOMETRIC LOCK NO es opcional**
   - Está SIEMPRE activo cuando hay rostro
   - Solo se ajusta el nivel (STRICT vs MAXIMUM)

2. **Geometric correction es la única excepción**
   - Solo cuando `geometria` slider > 0
   - Permite corrección de distorsión de lente
   - PERO mantiene identidad

3. **Dictator Prompt sigue funcionando**
   - Para cambios de entorno/vestuario
   - NO afecta identidad facial
   - Creatividad en elementos no biométricos

4. **Compatible con DNA Anchor**
   - Si DNA Anchor está activo
   - Proporciona referencia biométrica adicional
   - Refuerza el BIOMETRIC LOCK

---

## 🆚 ANTES vs DESPUÉS

### ANTES (v40.2):
```
Input: Selfie de José con barba
Preset "Hollywood Glam" aplicado
Output: ❌ Persona diferente, rostro más "perfecto", barba suavizada
```

### DESPUÉS (v40.3):
```
Input: Selfie de José con barba
Preset "Hollywood Glam" aplicado
Output: ✅ JOSÉ reconocible, barba preservada, solo mejor iluminación
```

---

## 🚀 DEPLOY & ROLLOUT

**Estado actual:**
- ✅ Código actualizado en backend
- ✅ System prompt con BIOMETRIC LOCK implementado
- ✅ Identity Lock service reforzado
- ⏳ Testing exhaustivo pendiente

**Próximos pasos:**
1. Testing con múltiples rostros
2. Verificar preservación de identidad
3. Ajustar niveles de lock si es necesario

---

**FIN DE LA ACTUALIZACIÓN v40.3 - BIOMETRIC LOCK PROTOCOL**

Este sistema garantiza que LuxScaler funcione como un "Restaurador Forense" profesional, mejorando la calidad de captura SIN alterar la identidad del sujeto.
