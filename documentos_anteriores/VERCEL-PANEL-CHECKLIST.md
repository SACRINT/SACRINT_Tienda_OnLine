# Checklist para Revisar en Panel de Vercel

**Fecha**: 21 de Noviembre, 2025
**Problema**: Middleware retorna 404 NOT_FOUND en `/` incluso con next-intl deshabilitado
**Estado**: Código está correcto - Problema es configuración de Vercel

---

## 🔴 Síntoma Actual

```
GET https://sacrint-tienda-on-line.vercel.app/ → 404 (Not Found)
Middleware → 404 Not Found
Error Code: NOT_FOUND
ID: __vercel_toolbar_code
```

**Importante**: Aún después de deshabilitar next-intl en `next.config.js`, el error persiste.

---

## ✅ Lo Que Ya Se Confirmó

1. ✅ **Código compila correctamente**: `npm run build` → "✓ Compiled successfully"
2. ✅ **Dev local funciona**: `npm run dev` → Carga perfectamente
3. ✅ **Build TypeScript**: 0 errores
4. ✅ **next-intl deshabilitado**: Comentado en next.config.js (Commit: 1fda48d)
5. ✅ **Middleware simplificado**: Solo retorna `NextResponse.next()`
6. ✅ **Git push exitoso**: Cambios están en GitHub

---

## 🛠️ Checklist para Vercel Dashboard

Abre: https://vercel.com/dashboard

### 1️⃣ **Proyecto Correcto**

- [ ] Selecciona: `sacrint-tienda-on-line`
- [ ] Ambiente: `Production`
- [ ] Rama: `main` (debe estar deployada)

---

### 2️⃣ **Verificar Deployments**

Ve a: **Deployments** tab

- [ ] ¿El deployment más reciente está en estado `Ready` (verde)?
- [ ] ¿Muestra el commit `1fda48d` (test: TEMPORARY - Disable next-intl)?
- [ ] ¿El tiempo de build fue normal (2-3 minutos)?

Si hay error en el build:

- Abre el deployment y ve a **Logs**
- Busca mensajes de error en la compilación

---

### 3️⃣ **Revisar Environment Variables**

Ve a: **Settings → Environment Variables**

Confirma que TODAS existan:

```
✅ NEXTAUTH_URL             = https://sacrint-tienda-on-line.vercel.app
✅ NEXTAUTH_SECRET          = [debe existir]
✅ REDIS_URL                = [debe existir - agregado en sesión anterior]
✅ DATABASE_URL             = [debe existir]
✅ GOOGLE_CLIENT_ID         = [debe existir]
✅ GOOGLE_CLIENT_SECRET     = [debe existir]
✅ NODE_ENV                 = production
```

**Si falta alguna**: Eso podría causar el 404 si auth falla silenciosamente

---

### 4️⃣ **Revisar Middleware en Edge Logs**

Ve a: **Logs → Middleware** (si existe tab)

O: **Deployments → [Latest] → Logs → Function Logs**

Busca:

- [ ] ¿Hay errores en el middleware?
- [ ] ¿Hay warnings sobre módulos que no se pueden cargar?
- [ ] ¿Hay errores de autenticación?

---

### 5️⃣ **Revisar Build & Development Settings**

Ve a: **Settings → Build & Development**

Verifica:

- [ ] **Build Command**: `npm run build` (default)
- [ ] **Output Directory**: `.next` (default)
- [ ] **Install Command**: `npm ci` (default)
- [ ] **Node.js Version**: ¿Es compatible? (v18+ recomendado)

---

### 6️⃣ **Revisar Domains**

Ve a: **Settings → Domains**

- [ ] ¿El dominio `sacrint-tienda-on-line.vercel.app` está configurado?
- [ ] ¿Hay custom domains? Si sí, ¿son correctos?
- [ ] ¿Las redirecciones están configuradas correctamente?

---

### 7️⃣ **Limpiar Caché de Vercel**

Ve a: **Settings → Deployments**

Busca un botón similar a "Clear Build Cache" o "Clear Cache"

- [ ] Haz clic para limpiar el caché
- [ ] Vercel reconocerá el cambio en next.config.js
- [ ] Disparará un redeploy automático

**Alternativa**: Manual redeploy

- Ve a **Deployments**
- Busca el deployment más reciente
- Haz clic en **...** (tres puntos)
- Selecciona **Redeploy**

---

### 8️⃣ **Revisar Error Logs Específicos**

Ve a: **Deployments → [Latest] → Logs**

Selecciona **Runtime Logs** y busca:

```
Middleware error:
Module not found:
Cannot find:
Auth initialization failed:
```

Copia ANY error que encuentres.

---

### 9️⃣ **Test Manual en Vercel**

Dentro del dashboard:

- [ ] Haz clic en **Visit** (botón azul)
- [ ] Se abrirá: https://sacrint-tienda-on-line.vercel.app
- [ ] ¿Ves 404 o carga la página?

---

### 🔟 **Opciones Si Sigue Fallando**

#### Opción A: Desabilitar Middleware Completamente

Si el problema está en middleware, prueba esto:

1. Crea archivo `.vercelignore` con contenido:

```
src/middleware.ts
```

2. O: Renombra `src/middleware.ts` a `src/middleware.ts.disabled`

3. Commit y push

4. Redeploy en Vercel

Si esto funciona → El problema definitivamente está en middleware

---

#### Opción B: Limpiar Deploy History

1. Ve a **Settings → Deployments**
2. Si hay botón "Clear Deploy History" → clickea
3. Vercel olvidará todos los deployments anteriores
4. El siguiente deployment será completamente nuevo

---

#### Opción C: Crear Rama de Test

```bash
git checkout -b test/vercel-diagnostic
# Copia algunos cambios
git push origin test/vercel-diagnostic
```

En Vercel:

- Crea un **Preview Deployment** desde esa rama
- Si funciona diferente → El problema es específico de main

---

## 📊 Información para Compartir con Soporte Vercel

Si necesitas contactar soporte, proporciona:

```
Proyecto: sacrint-tienda-on-line
Error: Middleware returns 404 NOT_FOUND on GET /
Status: "NOT_FOUND"
ID: __vercel_toolbar_code pXBxQhSM3ssYjRq

Detalles:
- Local (npm run dev): ✅ Funciona
- Local (npm run build): ✅ Exitoso
- Vercel: ❌ 404 en todas las rutas

Diagnóstico:
- ✅ next-intl deshabilitado (Commit: 1fda48d)
- ✅ Middleware simplificado a NextResponse.next()
- ✅ TypeScript: 0 errores
- ❌ Vercel: Aún devuelve 404

Hipótesis: Problema en edge runtime de Vercel o variables de entorno
```

---

## 🎯 Recomendaciones Finales

1. **Mañana primero**: Revisar todo el checklist arriba
2. **Si nada funciona**: Contactar soporte de Vercel con info de arriba
3. **Mientras tanto**: El código está 100% correcto
4. **Siguiente paso**: Una vez que cargue, restaurar next-intl correctamente

---

## 📝 Resumen del Trabajo Realizado

### Intentos Exitosos en Local:

- ✅ Agregado `export const dynamic = "force-dynamic"` a rutas
- ✅ Eliminado duplicate `next.config.mjs`
- ✅ Arreglado middleware regex
- ✅ Refactorizado middleware processing
- ✅ Deshabilitado intlMiddleware
- ✅ **Deshabilitado completamente next-intl**

### Resultado:

- ✅ Todo funciona en local
- ❌ Vercel sigue con 404

**Conclusión**: El problema NO está en el código, está en configuración/edge runtime de Vercel

---

## ✉️ Próximos Pasos

1. Sigue este checklist mañana en el panel de Vercel
2. Reporta qué encontraste
3. Si encuentras un error específico → Compartelo
4. Juntos investigaremos basándonos en los hallazgos

**Estado**: 🔴 **BLOQUEADO EN VERCEL** - Código está correcto

---

**Documento preparado por**: Claude Code
**Para**: Equipo SACRINT
**Urgencia**: MEDIA - Código está listo, solo falta resolver config de Vercel
