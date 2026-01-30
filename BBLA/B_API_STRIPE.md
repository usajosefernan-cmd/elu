# 📘 GUÍA TÉCNICA: STRIPE & TWILIO INTEGRATION

> **Dominio:** Pagos y Notificaciones
> **Fuente de Verdad:** BBLAv2
> **Estado:** API Live / Production

## 1. STRIPE PAYMENTS (LUXSCALER)

### 🔑 Credenciales de Producción

Configurar en Supabase Secrets y `.env` frontend.

| Variable | Valor / Descripción | Ubicación |
| :--- | :--- | :--- |
| **Publishable Key** | `pk_live_51SNFYvCvkxGJFhEYXfvZbMVmSauCV26MrqcIECCKsP0Zgt8cbhbYqbYl8lSnWOLXA8iPEa1MTZYed7Yob5ydYTd100eKrZsuOd` | Frontend (`.env`) |
| **Secret Key** | `rk_live_...QA7O` (Verificar en Supabase) | Backend (Supabase) |
| **Webhook Secret** | `whsec_UGHaKZo7EfXYkoBPjgZZS7TahdIu9QvK` | Backend (Supabase) |
| **Webhook URL** | `https://pjscnzymofaijevonxkm.supabase.co/functions/v1/stripe-luxscaler` | Stripe Dashboard |

### 📦 Productos (Price IDs)

Obtener IDs actualizados en [Stripe Dashboard](https://dashboard.stripe.com/products).

* **Tokens (One-time):** Try (€3), Basic (€9), Plus (€19).
* **Subscriptions (Monthly):** Lite (€12), Pro (€29), Studio (€59).
* **Subscriptions (Annual):** Lite (€99), Pro (€249), Studio (€499).

---

## 3. EDGE FUNCTIONS

### `stripe-manager`

* **Rol:** API Gateway para frontend.
* **Acciones:** Listar precios, crear sesiones de checkout, gestionar portal de cliente.

### `stripe-luxscaler`

* **Rol:** Webhook Handler.
* **Eventos Escuchados:**
  * `checkout.session.completed` -> Añadir créditos + Notificar Twilio.
  * `customer.subscription.updated` -> Sincronizar plan.
  * `customer.subscription.deleted` -> Revocar acceso pago.

## 4. COMANDOS DE DESPLIEGUE

```bash
# Configurar Secretos (Incluyendo Twilio)
supabase secrets set STRIPE_PUBLISHABLE_KEY=pk_live_...
supabase secrets set STRIPE_SECRET_KEY=rk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_UGHaKZo7EfXYkoBPjgZZS7TahdIu9QvK
supabase secrets set TWILIO_ACCOUNT_SID=...
supabase secrets set TWILIO_AUTH_TOKEN=...

# Desplegar
supabase functions deploy stripe-manager --no-verify-jwt
supabase functions deploy stripe-luxscaler --no-verify-jwt
```
