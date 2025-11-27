# Guía de Despliegue en Vercel - Solución Completa

**Problema**: El webhook de GitHub → Vercel no está detectando cambios
**Estado**: GitHub actualizado ✅ | Vercel desactualizado ⏳
**Última actualización**: 2025-11-27

## 🎯 Solución Rápida (Opción Recomendada)

### Opción 1: Redeploy Manual Inmediato (SIN CÓDIGO)

1. **Abre Vercel Dashboard**:
   - https://vercel.com/dashboard

2. **Selecciona tu proyecto**:
   - `sacrint-tienda-on-line`

3. **Busca el botón "Redeploy"**:
   - En la pestaña "Deployments"
   - En la esquina superior derecha
   - Haz clic en el menú `⋯` → "Redeploy"

4. **Ejecuta redeploy**:
   - Selecciona rama: `main`
   - Haz clic en "Deploy"
   - Espera 2-5 minutos

✅ **Resultado esperado**: Las nuevas páginas estarán vivas en 2-5 minutos

---

## 🔧 Solución Técnica (Opción 2)

Si Opción 1 no funciona, usa la Vercel API:

### Pasos:

1. **Obtén tu Vercel Token**:
   - Ve a: https://vercel.com/account/tokens
   - Crea un nuevo token (personal access token)
   - Copia el token (empieza con "ver\_")

2. **Ejecuta el script de despliegue**:

```bash
# Windows PowerShell
$env:VERCEL_TOKEN="tu_token_aqui"
node scripts/trigger-vercel-deploy.js

# O Linux/Mac
export VERCEL_TOKEN="tu_token_aqui"
node scripts/trigger-vercel-deploy.js
```

3. **Script hará automáticamente**:
   - ✅ Conecta a API de Vercel
   - ✅ Dispara redeploy
   - ✅ Muestra ID de despliegue
   - ✅ Confirma éxito/fallo

### Ejemplo:

```
🚀 Triggering Vercel deployment...
📦 Project: SACRINT_Tienda_OnLine
🔑 Using token: ver_xxxxxxxxxxx...

📊 Response Status: 201
✅ Deployment triggered successfully!
📍 Deployment ID: dpl_abc123xyz
🌐 Check progress at dashboard
```

---

## 🐛 Solución Nuclear (Opción 3)

Si ambas opciones fallan, desconecta/reconecta GitHub:

1. **Ve a Vercel Project Settings**:
   - https://vercel.com/dashboard/project/sacrint-tienda-on-line/settings/git

2. **Busca "Git Integration"**:
   - Haz clic en "Disconnect"
   - Espera 30 segundos
   - Haz clic en "Connect"
   - Selecciona GitHub repository

3. **Vercel reconectará** y debería detectar los últimos cambios

---

## ✅ Verificación Post-Despliegue

Una vez que el despliegue complete, verifica que las nuevas páginas existan:

```bash
# Reemplaza con tu dominio de Vercel
DOMAIN="sacrint-tienda-on-line-git-main-sacrints-projects.vercel.app"

# Prueba cada página
curl -I https://$DOMAIN/blog          # Debe mostrar 200
curl -I https://$DOMAIN/security      # Debe mostrar 200
curl -I https://$DOMAIN/contact       # Debe mostrar 200
curl -I https://$DOMAIN/cookies       # Debe mostrar 200
curl -I https://$DOMAIN/privacy       # Debe mostrar 200
curl -I https://$DOMAIN/terms         # Debe mostrar 200
```

**Éxito si todos muestran**: `HTTP/2 200 OK`
**Fallo si muestran**: `HTTP/2 404 Not Found`

---

## 📋 Cambios Que Esperar Ver Desplegados

### Nuevas Páginas (6)

- `/blog` - Página de blog con artículos
- `/security` - Información de seguridad y compliance
- `/contact` - Formulario de contacto
- `/cookies` - Política de cookies
- `/privacy` - Política de privacidad
- `/terms` - Términos y condiciones

### Correcciones (8)

- ✅ Image component props modernizados
- ✅ TypeScript parsing errors solucionados
- ✅ Syntax errors corregidos
- ✅ PWA assets generados
- ✅ Build cache desactivado para forzar rebuild

### Commits Esperados

```
895ab9f - fix(vercel): Disable build cache to force fresh deployment
7d87981 - chore: Mark production deployment - ready for Vercel webhook trigger
9fb663a - chore: add .vercelignore to force fresh vercel build
52bde7b - chore: trigger vercel deployment
16260be - fix: resolve parsing errors and generate PWA assets
893abd4 - fix: Repair page errors and add missing functionality
```

---

## 🆘 Troubleshooting

### Problema: Redeploy no funciona

**Solución**: Ve a "Settings" → "Build & Development" → Verifica que:

- Build Command: `prisma generate && next build` ✓
- Framework: `Next.js` ✓
- Branch: `main` ✓

### Problema: Pages siguen mostrando 404

**Solución**:

- Espera 5 minutos después del despliegue
- Haz hard refresh: `Ctrl+Shift+R` (Windows) o `Cmd+Shift+R` (Mac)
- Borra caché del navegador

### Problema: "Deployment quota exceeded"

**Solución**:

- Ve a https://vercel.com/account/billing
- Verifica tu plan
- Si excediste límite, espera mes siguiente o upgrade plan

### Problema: Token de Vercel no funciona

**Solución**:

- Token debe empezar con `ver_`
- Debe tener permiso de "Projects"
- Crea token nuevo si es muy viejo

---

## 📞 Resumen Rápido

| Opción             | Dificultad   | Tiempo | Confiabilidad |
| ------------------ | ------------ | ------ | ------------- |
| Opción 1 (Manual)  | ⭐ Muy Fácil | 5 min  | 95%           |
| Opción 2 (Script)  | ⭐⭐ Fácil   | 3 min  | 99%           |
| Opción 3 (Nuclear) | ⭐⭐⭐ Medio | 10 min | 100%          |

**Recomendación**: Comienza con Opción 1. Si no funciona en 5 minutos, intenta Opción 2.

---

## 🔄 Próxima Vez

Para futuros despliegues, este problema no debería ocurrir porque:

- ✅ Desactivamos caché de build en vercel.json
- ✅ Todos los cambios están en GitHub
- ✅ Webhook debería funcionar normalmente

Si GitHub webhook sigue roto, abre issue con Vercel support.

---

**Última actualización**: 2025-11-27 09:30 UTC
**Estado**: Ready for deployment ✅
**Próximo paso**: Ejecuta Opción 1 o Opción 2
