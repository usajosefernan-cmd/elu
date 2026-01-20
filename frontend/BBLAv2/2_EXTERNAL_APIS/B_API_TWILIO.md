# 📘 GUÍA TÉCNICA: TWILIO NOTIFICATIONS (WHATSAPP)

> **Dominio:** Notificaciones & Alertas
> **Fuente de Verdad:** BBLAv2
> **Estado:** API Live (Webhook Integration)

## 1. RESUMEN EJECUTIVO

Sistema de alertas automatizadas para eventos críticos del sistema, principalmente confirmaciones de pago exitosas (`checkout.session.completed`) procesadas por Stripe.

## 2. CREDENCIALES

Variables de entorno requeridas en las Edge Functions (ej: `stripe-luxscaler`). Configurar en Supabase Secrets.

| Variable | Descripción |
| :--- | :--- |
| **TWILIO_ACCOUNT_SID** | Identificador de cuenta Twilio (SID) |
| **TWILIO_AUTH_TOKEN** | Token de autenticación secreto |
| **TWILIO_WHATSAPP_FROM** | Número origen (ej: `whatsapp:+14690604332`) |
| **DEFAULT_TO** | (Opcional) Número admin para alertas de sistema |

## 3. FLUJO DE NOTIFICACIÓN (PAYMENT SUCCESS)

1. **Evento:** Usuario completa pago en Stripe.
2. **Trigger:** Webhook `stripe-luxscaler` recibe evento `checkout.session.completed`.
3. **Acción:**
   - La función verifica la firma de Stripe.
   - Actualiza los créditos del usuario en `profiles`.
   - Invoca a la API de Twilio para enviar un mensaje WhatsApp.
   - **Destinatario:** Al usuario (si tiene teléfono registrado) o al Admin (`DEFAULT_TO`).

## 4. INTEGRACIÓN DE CÓDIGO (Snippet)

```typescript
// Ejemplo de uso en Deno Edge Function
import { Twilio } from "twilio";

const twilioClient = new Twilio(Deno.env.get("TWILIO_ACCOUNT_SID"), Deno.env.get("TWILIO_AUTH_TOKEN"));

await twilioClient.messages.create({
  body: `✅ Pago Recibido! Has comprado ${tokens} Lumens.`,
  from: Deno.env.get("TWILIO_WHATSAPP_FROM"),
  to: `whatsapp:${userPhone}`
});
```
