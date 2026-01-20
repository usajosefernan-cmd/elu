# MANUAL DE INSTRUCCIONES (BBLA)

## Estado Actual
El sistema está configurado para usar **Supabase (v28)** y **Gemini 3 Pro** (Nano Banana Pro).

## Problema de Conexión
Desde este entorno seguro, la conexión directa a la base de datos (`db.uxqtxk...`) está bloqueada por DNS.
Por eso, **NO he podido crear las tablas automáticamente**.

## Tu Misión (1 Minuto)
1. Abre el archivo `/app/BBLA/SCHEMA_v28.sql`.
2. Copia todo el contenido.
3. Ve a tu [Supabase Dashboard](https://supabase.com/dashboard/project/uxqtxkuldjdvpnojgdsh/sql).
4. Pégalo en el **SQL Editor** y ejecuta "RUN".

Una vez hecho esto, el backend (que ya tiene las credenciales en `supabase_service.py`) empezará a leer y escribir en la base de datos real.
