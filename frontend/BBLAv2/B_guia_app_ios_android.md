# GUÍA MAESTRA: ESTRATEGIA MÓVIL Y DESPLIEGUE (LUXCAMERA PRO)
>
> **VERSIÓN:** 2.0 (2026-01-10)
> **ESTADO:** APPROVED FOR EXECUTION
> **OBJETIVO:** Documento técnico autosuficiente para desplegar LuxScaler en iOS y Android.

---

## 1. PREVIEW INSTANTÁNEO: "WEB SIMULATOR" (SIN ANDROID STUDIO)

Para visualizar la interfaz móvil ("LuxCamera Pro") directamente en tu navegador sin compilar nada:

1. Ve al Panel Admin: `http://localhost:8081/admin`
2. Pestaña **CONFIG_VIVA** (System Config).
3. Busca la sección **"Simulador de Plataforma (Dev)"**.
4. Click en **"SIMULAR APP MÓVIL"**.

Esto activará `LUX_DEV_PLATFORM_OVERRIDE` y recargará la página renderizando `<MobileCameraView />` en lugar del Admin.
*Para volver:* Usa el botón "Exit Sim" en la barra superior de la app simulada.

---

## 2. VISIÓN DEL PRODUCTO: "PROCREW IN POCKET"

La aplicación móvil no es una versión "lite" del administrador web. Es una herramienta especializada para captura y producción.

* **Identidad:** "LuxCamera Pro".
* **Concepto:** Un equipo de producción en tu bolsillo (Fotógrafo + Estilista + Editor).
* **Interfaz (Camouflage UI):**
  * Los controles de IA se disfrazan de ajustes de cámara profesional.
  * **Film Stock** → Controla `StyleScaler`.
  * **Iluminación/Flash** → Controla `LightScaler`.
  * **Lentes** → Controla `PhotoScaler`.
* **Dual Save System:**
  * **Local (Carrete):** Guarda la foto original (RAW/High-Res) sin procesar.
  * **Nube (Galería Lux):** Sube la foto y procesa la versión "Master" con IA.

---

## 2. ARQUITECTURA TÉCNICA: "ADAPTIVE MONOLITH"

Utilizamos una arquitectura monolítica híbrida. El mismo código React ejecuta Web y App, adaptándose al entorno.

### 2.1 Stack Tecnológico

* **Core:** React 19 + TypeScript + Vite.
* **Native Engine:** Capacitor 6.0 (Latest 2026).
* **Camera:** `@capacitor-community/camera-preview` (Permite UI React sobre el feed de cámara nativo).
* **State:** Zustand (Global Store).

### 2.2 Estructura de Proyecto

```
LUXADMIN/
├── android/              # Proyecto Nativo Android (Generado)
├── ios/                  # Proyecto Nativo iOS (Generado)
├── src/
│   ├── components/
│   │   ├── mobile/       # UI Específica Móvil (Ruedas, Sliders táctiles)
│   │   └── admin/        # UI Dashboard Web (Existente)
│   ├── hooks/
│   │   └── usePlatform.ts # Detecta si es Web, iOS o Android
│   └── main.tsx          # Router condicional (App vs Web)
└── capacitor.config.ts   # Puente Nativo
```

### 2.3 Lógica Adaptativa

El archivo `usePlatform.ts` debe exponer:

```typescript
import { Capacitor } from '@capacitor/core';

export const usePlatform = () => {
    return {
        isNative: Capacitor.isNativePlatform(),
        isIOS: Capacitor.getPlatform() === 'ios',
        isAndroid: Capacitor.getPlatform() === 'android',
        isWeb: !Capacitor.isNativePlatform()
    };
};
```

En `App.tsx`, si `isNative` es true, renderizamos `<MobileCameraView />` en lugar de `<AdminDashboard />`.

---

## 3. ESTRATEGIA DE DEPLIEGUE AUTOMATIZADO (CI/CD)

El objetivo es "Zero-Touch Deploy". El desarrollador hace `git push` o `npm run deploy`, y el sistema se encarga de firmar, compilar y subir a las tiendas.

### 3.1 ANDROID: Gradle Play Publisher (GPP)

Automatización total desde Windows/Linux.

**Requisitos Previos:**

1. **Cuenta Google Play Developer:** ($25 one-time).
2. **Service Account JSON:**
    * Google Play Console -> Setup -> API Access.
    * Crear Service Account -> Descargar JSON key.
    * Guardar como `android/service-account.json` (¡AÑADIR A .GITIGNORE!).
3. **Keystore de Firmado:**
    * Generar archivo `.jks` (Java KeyStore).
    * Guardar credenciales en `~/.gradle/gradle.properties` (para no subirlas al repo).

**Configuración `android/app/build.gradle`:**

```groovy
plugins {
    id 'com.android.application'
    id 'com.github.triplet.play' version '3.8.4' // GPP Plugin
}

play {
    serviceAccountCredentials.set(file("service-account.json"))
    defaultToAppBundles.set(true)
    track.set("internal") // Sube a "Internal Testing" por defecto
}
```

**Comando de Disparo:**
`npm run deploy:android` -> Ejecuta: `cd android && ./gradlew publishBundle`

---

### 3.2 iOS: "CLOUD BUILD" (SIN MAC LOCAL)

Esta sección ha sido ampliada para eliminar la dependencia de hardware Apple local mediante **Fastlane Match** y **App Store Connect API Keys**.

#### A. FILOSOFÍA "GIT-OPS SIGNING"

En lugar de manejar certificados `.p12` manualmente en cada máquina, usamos un repositorio de Git privado encriptado para almacenar las identidades de firma. GitHub Actions accede a este repo para firmar la app en la nube.

#### B. REQUISITOS (SOLO UNA VEZ)

1. **App Store Connect API Key (Clave Maestra):**
    * Ir a [App Store Connect > Users and Access > Keys](https://appstoreconnect.apple.com/access/api).
    * Generar Key con rol "App Manager".
    * Descargar el archivo `.p8`. **NO PERDERLO.**
    * Anotar: `ISSUER_ID`, `KEY_ID`.
2. **Repositorio Privado de Certificados:**
    * Crear un repo privado vacío en GitHub: `luxscaler-ios-certs`.
3. **Configuración Inicial (Requiere Mac Prestado 1 Hora):**
    * Aunque el objetivo es "Sin Mac", necesitamos uno *una vez* para inicializar `match`.
    * `fastlane match init` -> Elegir repo `luxscaler-ios-certs`.
    * `fastlane match appstore` -> Genera y sube los certificados al repo.
    * Output: `MATCH_PASSWORD` (La contraseña que encripta el repo).

#### C. SECRETOS EN GITHUB (REPO PRINCIPAL)

En `Settings > Secrets and variables > Actions`, añadir:

* `APP_STORE_CONNECT_API_KEY_KEY_ID`: (Ej: D383SF739)
* `APP_STORE_CONNECT_API_KEY_ISSUER_ID`: (Ej: 69a6de78-...)
* `APP_STORE_CONNECT_API_KEY_KEY`: (Contenido del .p8 en Base64 o texto plano)
* `MATCH_PASSWORD`: (La contraseña de encriptación)
* `MATCH_GIT_BASIC_AUTHORIZATION`: (Token para leer el repo de certificados)

#### D. WORKFLOW DE GITHUB ACTIONS (`.github/workflows/ios-deploy.yml`)

Este script convertirá un `git push` en una versión de TestFlight.

```yaml
name: iOS Cloud Build
on:
  push:
    tags:
      - 'v*ios' # Solo despliega si creas un tag ej: v1.0.3-ios

jobs:
  build_ios:
    runs-on: macos-14 # Usamos runners M1 oficiales de GitHub
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }

      - name: Install Dependencies
        run: npm ci && npm run build # Compila el JS/React

      - name: Sync Capacitor
        run: npx cap sync ios

      - name: Setup Fastlane
        run: bundle install

      - name: Build & Upload to TestFlight
        env:
          ASC_KEY_ID: ${{ secrets.APP_STORE_CONNECT_API_KEY_KEY_ID }}
          ASC_ISSUER_ID: ${{ secrets.APP_STORE_CONNECT_API_KEY_ISSUER_ID }}
          ASC_KEY_CONTENT: ${{ secrets.APP_STORE_CONNECT_API_KEY_KEY }}
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          MATCH_GIT_URL: "git@github.com:tu-org/luxscaler-ios-certs.git"
        run: bundle exec fastlane ios beta
```

#### E. FASTFILE (`ios/fastlane/Fastfile`)

La lógica que ejecuta el runner de GitHub.

```ruby
default_platform(:ios)

platform :ios do
  desc "Push a new beta build to TestFlight"
  lane :beta do
    # 1. Autenticación vía API Key (No 2FA request)
    api_key = app_store_connect_api_key(
      key_id: ENV["ASC_KEY_ID"],
      issuer_id: ENV["ASC_ISSUER_ID"],
      key_content: ENV["ASC_KEY_CONTENT"],
      duration: 1200,
      in_house: false
    )

    # 2. Descargar Certificados del Repo Privado
    match(
      type: "appstore",
      readonly: true, # CI/CD no debe generar certs, solo leer
      git_url: ENV["MATCH_GIT_URL"]
    )

    # 3. Compilar IPA (Gym)
    build_app(
      scheme: "App",
      export_method: "app-store"
    )

    # 4. Subir a TestFlight (Pilot)
    upload_to_testflight(
      api_key: api_key,
      skip_waiting_for_build_processing: true # No bloquear el runner
    )
  end
end
```

---

## 4. ESTRATEGIA DE MONETIZACIÓN & COMPLIANCE (READER APP)

Para evitar la comisión del 30% de Apple/Google y cumplir las normas (Guideline 3.1.3(a)).

**Modelo:** "Companion / Reader App".

1. **App Gratuita:** La descarga es gratis.
2. **Sin IAP (In-App Purchases):** La app NO tiene botones de "Comprar Créditos".
3. **Consumo:** La app solo *consume* créditos que el usuario ya tiene.
4. **Compra Web:** El usuario compra packs de créditos en `luxscaler.com` (Stripe).
5. **Compliance:**
    * La app muestra el saldo: "Créditos Disponibles: 50".
    * Si el saldo es 0, mensaje: "Visita luxscaler.com para recargar". (Apple permite esto bajo la regla "Reader" si no es la función principal vender contenido digital, o simplemente se omite el enlace directo y se dice "Recarga en tu cuenta web").

---

## 5. NEXT STEPS (EJECUCIÓN INMEDIATA)

1. **Fase 1:** Instalar Capacitor Core & Android Platform. (`npm install @capacitor/core...`)
2. **Fase 2:** Generar carpeta `android/` y abrir en Android Studio para verificar compilación vacía.
3. **Fase 3:** Implementar `MobileCameraView` básica con botón de captura.
4. **Fase 4:** Configurar Scripts de Despliegue.

---
**FIN DEL DOCUMENTO**
