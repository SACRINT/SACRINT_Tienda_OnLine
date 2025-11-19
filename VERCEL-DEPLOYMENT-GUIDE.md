# 🚀 Guía de Deployment en Vercel - Production Ready

**Versión**: 1.0.0 - Phase 2 Complete
**Última actualización**: 2025-11-19
**Estado**: Production Ready for Deployment

---

## 📋 Pre-requisitos

1. **Cuenta Vercel** (https://vercel.com)
2. **Proyecto GitHub** conectado a Vercel
3. **Variables de entorno** para producción
4. **Base de datos PostgreSQL** (Neon o similar)
5. **APIs configuradas** (Google OAuth, Stripe, Resend)

---

## 🔧 Variables de Entorno Requeridas

### 1️⃣ DATABASE - PostgreSQL (Neon)

```env
# Copiar URL de conexión desde Neon Dashboard
DATABASE_URL="postgresql://user:password@host.neon.tech/tienda_online?sslmode=require"
```

**Pasos**:
1. Ir a https://neon.tech
2. Crear proyecto PostgreSQL para producción
3. Copiar connection string
4. Reemplazar `user:password` con credenciales

---

### 2️⃣ NEXTAUTH.JS - Autenticación y Sesiones

```env
# Generar secret seguro:
# Opción 1: Online - https://generate-secret.vercel.app/32
# Opción 2: CLI - openssl rand -base64 32
NEXTAUTH_SECRET="[GENERAR_CON_openssl_rand_base64_32]"

# URL pública de la aplicación en producción
NEXTAUTH_URL="https://tu-dominio.com"
```

**Pasos**:
1. Ir a https://generate-secret.vercel.app/32
2. Copiar el valor generado
3. Reemplazar `tu-dominio.com` con tu dominio real

---

### 3️⃣ GOOGLE OAUTH - Login Social

```env
# Obtenidos desde Google Cloud Console
GOOGLE_ID="[COPIAR_DE_GOOGLE_CLOUD]"
GOOGLE_SECRET="[COPIAR_DE_GOOGLE_CLOUD]"
```

**Pasos para obtener**:
1. Ir a https://console.cloud.google.com
2. Crear nuevo proyecto o seleccionar existente
3. Buscar "OAuth consent screen"
4. Ir a "Credenciales" → "Crear credenciales" → "OAuth client ID"
5. Seleccionar "Aplicación web"
6. Agregar URI autorizado: `https://tu-dominio.com/api/auth/callback/google`
7. Copiar Client ID y Client Secret

---

### 4️⃣ STRIPE - Procesamiento de Pagos

```env
# Claves de API de Stripe (modo test primero, luego producción)
STRIPE_SECRET_KEY="sk_[test_o_live]_YOUR_KEY"
STRIPE_PUBLISHABLE_KEY="pk_[test_o_live]_YOUR_KEY"

# Webhook para procesamiento de eventos
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
```

**Pasos**:
1. Ir a https://dashboard.stripe.com
2. Dashboard → API keys
3. Copiar Secret key y Publishable key
4. Para webhook: Developers → Webhooks → Create endpoint
   - URL: `https://tu-dominio.com/api/webhooks/stripe`
   - Eventos: `payment_intent.succeeded`, `charge.refunded`
5. Copiar Signing secret

---

### 5️⃣ RESEND - Email Transaccional

```env
# API key para envío de emails
RESEND_API_KEY="re_YOUR_RESEND_API_KEY"

# Email desde el cual se enviarán los emails
# Reemplazar con tu dominio verificado en Resend
```

**Pasos**:
1. Ir a https://resend.com
2. Crear cuenta y verificar dominio
3. API keys → Crear nueva
4. Copiar el token

---

### 6️⃣ APP CONFIGURATION - Configuración de la Aplicación

```env
# URL pública de la aplicación (necesaria para webhooks y redirects)
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"

# Clave pública de Stripe (accesible desde cliente)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_[test_o_live]_YOUR_KEY"
```

---

## 📍 Cómo Añadir Variables en Vercel Dashboard

### Opción 1: Dashboard Web

1. **Login** en https://vercel.com
2. Seleccionar el proyecto → **Settings**
3. Ir a **Environment Variables**
4. Hacer click en **Add New**
5. Rellenar:
   - **Name**: `DATABASE_URL`
   - **Value**: [Copiar valor]
   - **Environments**: Development, Preview, Production
6. Repetir para cada variable

### Opción 2: Vercel CLI (Automático)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Conectar a Vercel
vercel link

# Añadir variables
vercel env pull .env.local

# O crear manualmente
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... etc
```

---

## ✅ Lista de Variables (Copiar y Pegar)

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_ID
GOOGLE_SECRET
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

**Total**: 11 variables de entorno

---

## 🔒 Seguridad - Mejores Prácticas

### ✅ DO's (Si hacer esto):
- ✅ Usar secretos diferentes para test y producción
- ✅ Rotar secretos regularmente
- ✅ Usar Vercel Environment Variables (nunca hardcodear)
- ✅ Limitar permisos en APIs externas
- ✅ Habilitar 2FA en Google Cloud, Stripe, Resend

### ❌ DON'Ts (No hacer esto):
- ❌ Nunca pushear `.env.local` al repo
- ❌ No compartir secretos por Slack/email
- ❌ No usar mismos secretos en dev y prod
- ❌ No exponer secret keys en componentes React
- ❌ No versionear cambios de secretos

---

## 🔄 Configuración de Webhooks

### Stripe Webhook Setup

```bash
# URL del webhook
https://tu-dominio.com/api/webhooks/stripe

# Eventos a escuchar:
- payment_intent.succeeded      # Pago exitoso
- charge.refunded               # Reembolso procesado
- invoice.payment_succeeded     # Factura pagada
```

**Verificar en Vercel Logs**:
```
Vercel Dashboard → Deployments → Logs → Filter: "webhook"
```

---

## 🚀 Proceso de Deployment

### Paso 1: Push a Main
```bash
git push origin main
```

### Paso 2: Vercel Auto-Deploy
- Automático: Vercel detecta push a `main`
- Builds y deploya en ~2 minutos
- Status: Vercel deployment check en GitHub

### Paso 3: Verificar
- URL: https://tu-dominio.com
- Logs: Vercel Dashboard → Deployments → Logs
- Funciones: Probar login, pago, emails

---

## 🔍 Testing Post-Deployment

### Checklist Básico:

```
✅ Homepage carga correctamente
✅ Login con Google funciona
✅ Crear tienda sin errores
✅ Agregar producto a carrito
✅ Checkout procesa pago (modo test)
✅ Email de confirmación llega
✅ Dashboard de órdenes muestra la compra
✅ Logs en Vercel sin errores
✅ Performance > 90 (Lighthouse)
```

### Debugging - Logs en Vercel:

```
Vercel Dashboard → Deployments → Logs
Filter por: "error", "warning", "DATABASE_ERROR"
```

---

## 🆘 Troubleshooting

### "DATABASE_ERROR: Connection failed"
- Verificar `DATABASE_URL` está correcta
- Revisar IP whitelist en Neon
- Ejecutar `prisma migrate deploy` localmente

### "GOOGLE_OAUTH: Invalid client"
- Verificar `GOOGLE_ID` y `GOOGLE_SECRET`
- Revisar redirect URI en Google Cloud
- Confirmar dominio coincida exactamente

### "STRIPE: API key invalid"
- Asegurarse de usar keys de PRODUCCIÓN (no test)
- Verificar `STRIPE_SECRET_KEY` comienza con `sk_live_`
- Revisar webhooks están configurados

### "EMAIL: RESEND API failed"
- Verificar `RESEND_API_KEY` es válido
- Comprobar dominio está verificado en Resend
- Revisar rate limits (100/día)

---

## 📊 Monitoreo en Producción

### Herramientas Recomendadas:

1. **Vercel Analytics**
   - Rendimiento de página
   - Web Vitals
   - Tráfico

2. **Sentry** (opcional - Error tracking)
   - Excepciones en tiempo real
   - User impact tracking
   - Performance monitoring

3. **Stripe Dashboard**
   - Transacciones exitosas
   - Refunds
   - Disputes

4. **Logs de Vercel**
   - Errores de aplicación
   - Database queries
   - API calls

---

## 🔄 Actualizaciones Futuras

### Desde Vercel CLI:
```bash
# Pull cambios
git pull origin main

# Vercel auto-deploya
# Verificar en https://vercel.com/dashboard

# Rollback si es necesario
vercel rollback
```

---

## 📞 Contacto y Soporte

- **Vercel Docs**: https://vercel.com/docs
- **NextAuth Docs**: https://next-auth.js.org
- **Stripe Docs**: https://stripe.com/docs
- **Resend Docs**: https://resend.com/docs

---

## ✨ Siguiente Paso

1. Completar todas las variables de entorno
2. Hacer push a `main`
3. Vercel auto-deploya
4. Ejecutar checklist de testing
5. Anunciar que Phase 2 está en producción! 🎉

---

**Estado**: ✅ Ready for Production Deployment
**Versión de Código**: v1.0.0 (Phase 2 Complete)
**Última Actualización**: 2025-11-19
