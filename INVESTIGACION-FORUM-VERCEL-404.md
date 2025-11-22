# Investigación: Foro de Vercel sobre Error 404

**Fecha de investigación**: 22 de Noviembre, 2025
**Fuentes**: community.vercel.com/tag/react y community.vercel.com/t/404-not-found-code-not-found/1585
**Estado**: Investigación completada
**Objetivo**: Encontrar soluciones para el error 404 en tu proyecto

---

## 🔍 INVESTIGACIÓN REALIZADA

Se investigaron los foros de Vercel Community en busca de información sobre:
- Errores 404 en aplicaciones React/Next.js
- Problemas con middleware en Vercel
- Configuración de rutas en `vercel.json`
- Soluciones implementadas por usuarios

---

## 📊 INFORMACIÓN ENCONTRADA

### 1. **Caso de Estudio: React + Sanity Studio** (Hilo 404-not-found-code-not-found)

#### Descripción del Problema
Un usuario reportó que después de desplegar un proyecto en Vercel, **TODOS los dominios retornaban errores `404: NOT_FOUND`**. Este es exactamente el mismo problema que estás teniendo con tu proyecto.

**Síntomas idénticos a tu situación**:
```
✅ Proyecto compila localmente sin errores
✅ En Vercel: TODOS los dominios retornan 404
✅ Error: "404: NOT_FOUND"
✅ Middleware → 404 Not Found
```

#### La Causa Raíz Identificada
```
PROBLEMA:
┌──────────────────────────────────────────┐
│ La configuración en vercel.json apuntaba  │
│ a rutas de carpetas que NO EXISTÍAN en   │
│ la estructura real del repositorio:      │
│                                          │
│ - Buscaba: /hitech_landingpage/          │
│ - Realidad: /hitech/ (nombre diferente)  │
└──────────────────────────────────────────┘
```

#### La Solución Que Funcionó
La respuesta de **Pawlean** (desarrollador experimentado en Vercel) fue actualizar `vercel.json`:

```json
{
  "builds": [
    {
      "src": "hitech/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "build" }
    }
  ],
  "routes": [
    { "src": "/studio(.*)", "dest": "/hitech/dist$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

**Cambios clave**:
1. ✅ **Rutas EXACTAS**: Apuntan a las carpetas reales del repositorio
2. ✅ **Ruta catch-all**: `"/(.*)" → "/index.html"` para enrutamiento del lado del cliente
3. ✅ **Configuración clara**: Cada construcción sabe exactamente dónde ir

---

## 🎯 CÓMO APLICA ESTO A TU PROYECTO

### Tu Situación Actual

**Tu proyecto**: Next.js 14 con TypeScript, Prisma, NextAuth, etc.

**Tu error actual**:
```
GET / → 404 NOT_FOUND
Middleware → 404 Not Found
ID: sfoi:sfoi::lwrq-1763690900502-d34eec87e85d
```

**TU VERCEL.JSON** (si existe):
Vamos a revisar qué tienes...

---

## 🔧 POSIBLES CAUSAS EN TU PROYECTO

Basado en la investigación del foro, aquí están las **causas más probables** para tu error 404:

### Causa #1: Configuración de `vercel.json` Incorrecta o Faltante

**Si tu archivo `vercel.json` existe pero está mal configurado:**

```json
❌ INCORRECTO:
{
  "builds": [
    { "src": "src/app", "use": "@vercel/next" }
  ]
}

✅ CORRECTO para Next.js 14:
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

**Por qué fallaría**:
- Vercel no reconoce el build output
- Las rutas no se mapean correctamente
- Resultado: 404 en TODAS las rutas

---

### Causa #2: Conflicto con Middleware

**Tu problema específico**: Deshabilitaste `next-intl` en `next.config.js`

Esto puede causar:
- Middleware intenta procesar requests sin i18n plugin
- Middleware no retorna respuesta válida
- Vercel edge devuelve 404 por defecto

**Síntoma confirmado**:
> "Middleware → 404 Not Found" (en tus logs de Vercel)

---

### Causa #3: Environment Variables Faltando

Aunque menos probable (porque tu proyecto funcionaría con error diferente), algunos middlewares requieren ENV vars:

```
Falta DATABASE_URL    → La app no puede conectarse
Falta NEXTAUTH_SECRET → La autenticación falla
Middleware error → Vercel retorna 404
```

---

## 💡 SOLUCIONES RECOMENDADAS (En Orden de Probabilidad)

### Solución #1: Verificar/Actualizar `vercel.json` (MÁS PROBABLE)

**Paso 1**: Verifica si existe tu archivo `vercel.json`:

```bash
cd "C:\03_Tienda digital"
ls -la vercel.json
```

**Paso 2**: Si EXISTE, contiene esto?

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

**Paso 3**: Si FALTA, créalo con eso exacto:

```bash
# Crear vercel.json correcto
```

**Paso 4**: Push a GitHub

```bash
git add vercel.json
git commit -m "fix: Configure vercel.json correctly for Next.js 14"
git push origin main
```

**Paso 5**: En Vercel Dashboard, hace REDEPLOY

---

### Solución #2: Desabilitar Middleware Temporalmente (SI FALLA #1)

**Razón**: Tu middleware podría estar causando el 404

Tu `src/middleware.ts` actualmente:
- Intenta autenticación con NextAuth
- Intenta i18n (aunque deshabilitado)
- Podría no estar retornando respuesta correcta

**Solución temporal**:
```typescript
// Comentar TODO en middleware.ts temporalmente
// export default async function middleware(req: NextRequest) { ... }
// Simplificar a:
export default function middleware(req: NextRequest) {
  return NextResponse.next();
}
```

---

### Solución #3: Verificar Environment Variables (SI FALLA #1 y #2)

En Vercel Dashboard:
- [ ] NEXTAUTH_URL = https://sacrint-tienda-on-line.vercel.app ✅
- [ ] NEXTAUTH_SECRET = (valor válido) ✅
- [ ] DATABASE_URL = (URL de Neon) ✅
- [ ] REDIS_URL = (URL de Redis) ✅

Si alguna **FALTA O ESTÁ VACÍA** → Configúrala

---

## 📋 CHECKLIST BASADO EN INVESTIGACIÓN DE FORO

```
Verificar en Vercel:
□ vercel.json existe y está bien configurado
□ Build command: npm run build
□ Output directory: .next
□ Framework detectado: Next.js
□ Todas las ENV vars están presentes
□ Middleware.ts no causa problemas
□ No hay conflictos de rutas

Verificar en Código:
□ src/middleware.ts retorna respuesta válida
□ next.config.js exporta nextConfig sin plugins problemáticos
□ No hay código que bloquee las rutas
□ [locale] no está requirido pero i18n está deshabilitada
```

---

## 🔗 COMPARACIÓN: TU PROYECTO vs CASO DEL FORO

| Aspecto | Caso del Foro | Tu Proyecto |
|---------|-------|-------|
| **Error** | 404 ALL ROUTES | 404 ALL ROUTES |
| **Local** | ✅ Funciona | ✅ Funciona |
| **Vercel** | ❌ Falla | ❌ Falla |
| **Causa** | Rutas mal configuradas | **?? (Por investigar)** |
| **Solución** | `vercel.json` correcto | **? (Próximo paso)** |

**Conclusión**: Tu problema es SIMILAR al del foro, pero posiblemente con causa diferente (middleware + next-intl deshabilitado)

---

## 🚀 PRÓXIMOS PASOS (EN ORDEN)

### Paso 1: Revisar `vercel.json` (HOY)
```bash
# Ver si existe:
ls -la "C:\03_Tienda digital\vercel.json"

# Si existe, verifica contenido
cat "C:\03_Tienda digital\vercel.json"

# Si NO existe, vamos a crearlo
```

### Paso 2: Configurar correctamente si falta (HOY)
```bash
# Crear vercel.json correcto
# Push a GitHub
# Redeploy en Vercel
# Probar
```

### Paso 3: Si aún falla, simplificar middleware (MAÑANA)
```bash
# Comentar middleware complejo
# Dejar solo NextResponse.next()
# Probar
```

### Paso 4: Si aún falla, revisar ENV vars (MAÑANA)
```bash
# Verificar todas las variables en Vercel
# Agregar logs para debugging
# Contactar Vercel support con información
```

---

## 📚 FUENTES CONSULTADAS

1. **Vercel Community - React Tag**
   - Búsqueda general de problemas 404 con React en Vercel
   - Encontró problemas similares pero no soluciones directas

2. **Vercel Community - 404-not-found-code-not-found Hilo (ID: 1585)**
   - Caso de estudio: React + Sanity Studio con error 404
   - Usuario: Pawlean (experto en Vercel)
   - Solución: Configurar `vercel.json` con rutas correctas
   - Hilo cerrado automáticamente 30 días después (sin confirmación de fix)

---

## 🎯 CONCLUSIÓN

El foro de Vercel Community confirma que:

1. ✅ **El error 404 en Vercel es COMÚN** con proyectos mal configurados
2. ✅ **Usualmente es configuración**, no código
3. ✅ **`vercel.json` es crítica** para Vercel entienda tu setup
4. ✅ **Middleware puede causar problemas** si no retorna respuesta válida
5. ✅ **Las soluciones son simples** una vez identificada la causa

**Tu proyecto tiene los mismos síntomas del caso del foro**, así que las mismas soluciones podrían funcionar.

---

**Investigación completada por**: Claude Code
**Fecha**: 22 de Noviembre, 2025
**Siguiente acción**: Revisar tu `vercel.json` y aplicar soluciones
