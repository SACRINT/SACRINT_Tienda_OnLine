# Diagnóstico Completo: Middleware 404 Error en Vercel

**Fecha**: 20 de Noviembre, 2025
**Estado**: BLOQUEADO - Requiere investigación del arquitecto
**Severidad**: CRÍTICA - Aplicación no es accesible en Vercel

---

## 📋 Resumen Ejecutivo

La aplicación compila correctamente en local (`npm run build` ✅) pero **Vercel retorna 404 NOT_FOUND en todas las rutas** después de múltiples intentos de corrección.

**Root cause identificado**: El middleware está rompiendo todas las respuestas, pero la causa exacta aún no está determinada.

---

## 🔴 Sintoma Observable

```
GET / → 404 NOT_FOUND
Middleware: 404 Not Found
ID: sfoi:sfoi::lwrq-1763690900502-d34eec87e85d
```

**Evidencia**:

- Network tab muestra: `GET https://sacrint-tienda-on-line.vercel.app/ 404 (Not Found)`
- Vercel logs muestran: `Middleware → 404 Not Found`
- Error persiste tras múltiples redeployments
- **Local dev (`npm run dev`) funciona perfectamente** - Sin errores
- **Build local (`npm run build`) exitoso** - "✓ Compiled successfully"

---

## 🔧 Intentos de Solución (TODOS FALLARON)

### Intento #1: Agregar `export const dynamic = "force-dynamic"`

**Commit**: e49e96d
**Cambios**:

- `/api/search/suggest/route.ts` → Agregado `export const dynamic = "force-dynamic"`
- `/api/metrics/route.ts` → Agregado `export const dynamic = "force-dynamic"`
- `/app/page.tsx` → Agregado dynamic rendering

**Resultado**: ❌ FALLÓ - 404 persiste

---

### Intento #2: Eliminar conflicto de configuración Next.js

**Commit**: 3f6e682
**Problema**:

- Existían DOS archivos de configuración:
  - `next.config.js` (CON next-intl plugin)
  - `next.config.mjs` (SIN next-intl plugin)
- Vercel estaba usando `.mjs` que no tenía el plugin de i18n

**Solución aplicada**:

- ✅ Eliminado `next.config.mjs` completamente
- ✅ Mantenido `next.config.js` con configuración correcta

**Resultado**: ❌ FALLÓ - 404 persiste

---

### Intento #3: Arreglar regex del middleware matcher

**Commit**: 0af0de8, e23be6e
**Problema**:

```javascript
// INCORRECTO
matcher: ["/((?!_next/static|_next/image|favicon.ico|public|^$).*)"];
// El patrón ^$ dentro de negación no funciona en matcher
```

**Soluciones aplicadas**:

1. Corregido regex a:

```javascript
matcher: ["/((?!_next/static|_next/image|favicon|public|\\.well-known).*) "];
```

2. Agregado error handling:

```typescript
try {
  response = intlMiddleware(req);
} catch (error) {
  console.error("Middleware error:", error);
  response = NextResponse.next(); // Fallback
}
```

3. Agregado null check:

```typescript
if (!response) {
  response = NextResponse.next();
}
```

**Resultado**: ❌ FALLÓ - 404 persiste

---

### Intento #4: Refactorizar orden de procesamiento del middleware

**Commit**: a081590
**Cambios**:

```typescript
// ANTES: i18n → protección
export default auth((req) => {
  const response = intlMiddleware(req); // ← Ejecutado primero
  // Luego: protección, headers de seguridad
  return response;
});

// DESPUÉS: protección → i18n
export default auth((req) => {
  // Protección y checks PRIMERO (early returns)
  if (needsAuth) return redirect;

  // Luego i18n SOLO si request procede
  response = intlMiddleware(req);
  return response;
});
```

**Lógica**: Si intlMiddleware rompe la respuesta, procesarlo último evita que afecte protección.

**Resultado**: ❌ FALLÓ - 404 persiste

---

### Intento #5: Deshabilitar intlMiddleware completamente

**Commit**: 1bbc5a6
**Cambios**:

```typescript
// ANTES
let response: NextResponse;
try {
  if (shouldApplyIntl) {
    response = intlMiddleware(req as unknown as NextRequest);
  } else {
    response = NextResponse.next();
  }
} catch (error) {
  response = NextResponse.next();
}

// DESPUÉS
let response = NextResponse.next();
// TODO: Re-enable intlMiddleware once root cause is found
```

**Lógica**: Si incluso sin intlMiddleware sigue fallando, el problema es ANTES (en auth middleware o middleware matcher).

**Resultado**: ❌ AÚN FALLA - 404 persiste (¡Esto es critical!)

---

## 🚨 Análisis Crítico

### Dato Clave #1: Local funciona, Vercel no

```
LOCAL:   npm run dev → ✅ http://localhost:3000 carga perfectamente
VERCEL:  sacrint-tienda-on-line.vercel.app → ❌ 404 NOT_FOUND
```

**Implicación**: El problema es específico de Vercel (edge execution o configuración).

### Dato Clave #2: Incluso sin intlMiddleware falla

Cuando deshabilitamos `intlMiddleware` completamente y dejamos solo:

```typescript
let response = NextResponse.next();
return addSecurityHeaders(response);
```

**Aún así devuelve 404**.

**Implicación**: El problema NO está en intlMiddleware. Está en:

- `auth` wrapper (NextAuth.js middleware)
- Middleware matcher configuration
- Vercel edge runtime

### Dato Clave #3: Build y dev funcionan perfectamente

```bash
npm run dev      → ✅ Funciona
npm run build    → ✅ Compila sin errores
npm run build && npm run start → ¿? (no probado en local)
```

**Implicación**: Problema en ejecución de Vercel, no en compilación.

---

## 📊 Middleware Stack Actual

```
┌─────────────────────────────────────┐
│ NextAuth.js auth() wrapper          │ ← Puede ser el culpable
├─────────────────────────────────────┤
│ src/middleware.ts                   │
│ - Route protection checks           │
│ - Security headers                  │
│ - (intlMiddleware DISABLED)         │
├─────────────────────────────────────┤
│ Matcher config                      │
│ /((?!_next/static|...).*)/          │
└─────────────────────────────────────┘
```

---

## 🔍 Hipótesis del Arquitecto

### Hipótesis #1: NextAuth.js auth() retorna 404

El wrapper `export default auth((req) => {...})` podría estar:

- No inicializándose correctamente en edge
- Retornando undefined/null en Vercel
- Teniendo issue con imports de `@/lib/auth/auth`

**Test**: Remover `auth()` wrapper y dejar middleware simple:

```typescript
// En lugar de:
export default auth((req) => { ... });

// Probar:
export default function middleware(req: NextRequest) {
  return NextResponse.next();
}
```

### Hipótesis #2: Vercel no tiene variables de entorno críticas

Auth puede fallar si falta:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- Credenciales de Google OAuth

**Test**: Verificar en Vercel → Settings → Environment Variables

### Hipótesis #3: Matcher regex excluye ruta raíz

El patrón `/((?!_next/static|_next/image|favicon|public|\\.well-known).*)` podría no coincidir con `/` en Vercel.

**Test**: Cambiar matcher a algo más simple:

```javascript
matcher: ["/((?!_next/static|_next/image).*)"];
```

### Hipótesis #4: Issue de conflicto entre next-intl config y auth

El archivo `next.config.js` tiene:

```javascript
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
module.exports = withNextIntl(nextConfig);
```

Incluso con intlMiddleware deshabilitado, el plugin envuelve todo. Podría causar conflicto con NextAuth.

**Test**: Verificar si `src/i18n/request.ts` está exportando correctamente.

---

## 📄 Archivos Críticos a Revisar

### 1. `src/middleware.ts`

```
Actual state: intlMiddleware DESHABILITADO
Lines: 35-141
Issues checked:
- ✅ Matcher regex
- ✅ Error handling
- ✅ Null checks
- ? auth() wrapper correctness
```

### 2. `next.config.js`

```
Status: Has next-intl plugin wrapper
Lines: Full file
Check: Is this plugin causing Vercel edge issues?
```

### 3. `src/lib/auth/auth.ts` (o auth.config.ts)

```
Status: UNKNOWN - archivo no revisado en detalle
Check: Is auth() exporting correctly for edge middleware?
```

### 4. `src/i18n/request.ts`

```
Status: UNKNOWN
Check: Is this causing module resolution issues in edge?
```

---

## 🛠️ Plan de Investigación para el Arquitecto

### PASO 1: Test de eliminación progresiva

```bash
# Branch: feature/debug-middleware-404
git checkout -b feature/debug-middleware-404

# CAMBIO 1: Remover auth() wrapper
# En src/middleware.ts reemplazar:
# export default auth((req) => { ... })
# CON:
# export default function middleware(req: NextRequest) {
#   return NextResponse.next();
# }

npm run build
# Push a Vercel y test
```

**Resultado esperado**: Si carga, problema está en NextAuth.js auth()

### PASO 2: Si PASO 1 falla, revisar matcher

```bash
# CAMBIO 2: Simplificar matcher
matcher: ["/((?!_next/static|_next/image).*)"]

npm run build
# Push y test
```

### PASO 3: Si PASO 2 falla, revisar variables de entorno

Vercel Dashboard → Settings → Environment Variables
Verificar:

- ✅ NEXTAUTH_URL está presente
- ✅ NEXTAUTH_SECRET está presente
- ✅ REDIS_URL está presente (agregado en sesión anterior)
- ✅ GOOGLE_CLIENT_ID está presente
- ✅ GOOGLE_CLIENT_SECRET está presente

### PASO 4: Revisar logs de Vercel

Vercel Dashboard → Project → Logs → Function
Buscar:

- Error messages en stdout/stderr
- Module resolution errors
- Auth initialization failures

### PASO 5: Test con middleware vacío

```typescript
export default function middleware(req: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-test", "works");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
```

Si esto funciona → problema está en código del middleware
Si esto falla → problema está en matcher o Vercel config

---

## 📝 Commits a Revertir (si es necesario)

Si quieres volver a estado pre-problemas:

```bash
git log --oneline | head -10
# e49e96d - Add force-dynamic (último bueno antes de problema)
# git revert a081590..HEAD
```

Pero primero sugiero investigar antes de revertir.

---

## 📞 Preguntas para el Arquitecto

1. **¿Hay algún custom middleware que no conocemos?**
   - Revisar: `vercel.json`, `.vercelconfig`, Vercel dashboard settings

2. **¿El proyecto tiene Middleware de third-party?**
   - next-intl plugin
   - NextAuth.js
   - Algún otro que envuelva todo?

3. **¿Se ha hecho deploy limpio de Vercel?**
   - Borrar caché: Vercel dashboard → Settings → Deployments → Clear Cache
   - Redeploy from scratch

4. **¿El problema ocurre en rama main?**
   - Sí, desde commit a081590

5. **¿Se puede hacer rollback a commit previo?**
   - `git revert a081590` para ver si resuelve

---

## 📦 Estado Actual del Código

**Branch**: `main`
**Latest commits**:

```
1bbc5a6 - fix: Temporarily disable intlMiddleware
a081590 - fix: Refactor middleware to prevent 404 errors
e23be6e - fix: Fix middleware regex and add error handling
3f6e682 - fix: Remove duplicate next.config.mjs
e49e96d - fix: Add force-dynamic to API routes
```

**Local status**:

- ✅ Build: Successful
- ✅ Dev server: Running
- ✅ TypeScript: 0 errors
- ❌ Vercel: 404 on all routes

---

## ✅ Checklist para el Arquitecto

- [ ] Revisar `src/lib/auth/auth.ts` - ¿Es correcto el export para edge?
- [ ] Revisar `src/i18n/request.ts` - ¿Hay imports que fallan en edge?
- [ ] Verificar variables de entorno en Vercel completamente
- [ ] Test: Remover auth() wrapper y probar middleware vacío
- [ ] Test: Simplificar matcher
- [ ] Revisar logs de Vercel Function (no solo deployment logs)
- [ ] Considerar: ¿Usar `vercelIgnore` para algunos archivos?
- [ ] Considerar: ¿Necesita refactor del auth en edge?
- [ ] Test: Hacer push a rama temporal y ver si problema se reproduce

---

## 🎯 Próximos Pasos

1. **Arquitecto investigar**: Siga el plan de investigación arriba
2. **Report findings**: Comparta en qué paso falló
3. **Colaboremos**: Juntos hacemos fix basado en hallazgos
4. **Re-enable i18n**: Una vez middleware funcione, re-habilitamos next-intl

---

**Documento preparado por**: Claude Code
**Para**: Arquitecto del equipo SACRINT
**Urgencia**: CRÍTICA - Bloquea el proyecto en Vercel
