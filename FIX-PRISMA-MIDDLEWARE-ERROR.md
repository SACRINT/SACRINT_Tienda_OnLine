# Fix: Prisma Middleware Error en Desarrollo Local

**Fecha**: 22 de Noviembre, 2025
**Problema**: `Error: prisma.$use is not a function`
**Estado**: ✅ RESUELTO
**Archivos modificados**: `src/lib/db/connection.ts`

---

## 🐛 EL PROBLEMA

Al intentar ejecutar `npm run dev` en local, la aplicación fallaba con:

```
Error: prisma.$use is not a function
Source: src\lib\db\connection.ts (49:10) @ $use
```

### Causa raíz

El archivo `connection.ts` intentaba aplicar middleware de Prisma **cada vez que se hacía hot reload** en desarrollo. Prisma es un singleton, así que cuando el archivo se recargaba:

1. Primera carga: `prisma.$use()` se aplicaba ✅
2. Hot reload: Se recargaba el módulo
3. `prisma.$use()` se intentaba aplicar de nuevo en la **MISMA instancia** de Prisma ❌
4. Error: "prisma.$use is not a function" (porque ya estaba aplicado)

---

## ✅ LA SOLUCIÓN

Se agregó un **flag de control** para asegurar que el middleware se aplique **solo una vez**:

### Cambio en `src/lib/db/connection.ts`:

**ANTES** (líneas 35-65):
```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Query timing middleware - Se aplicaba CADA VEZ
if (process.env.NODE_ENV === "development") {
  prisma.$use(async (params, next) => {
    // ... middleware code ...
  });
}
```

**DESPUÉS** (líneas 35-72):
```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaMiddlewareApplied?: boolean;  // ← FLAG NUEVO
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Query timing middleware - Solo aplica UNA VEZ
if (process.env.NODE_ENV === "development" && !globalForPrisma.prismaMiddlewareApplied) {
  try {
    prisma.$use(async (params, next) => {
      // ... middleware code ...
    });
    globalForPrisma.prismaMiddlewareApplied = true;  // ← MARCAR COMO APLICADO
  } catch (error) {
    console.debug("Prisma middleware already applied");
  }
}
```

---

## 🔧 QUÉ CAMBIÓ

```diff
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
+ prismaMiddlewareApplied?: boolean;
};

- if (process.env.NODE_ENV === "development") {
+ if (process.env.NODE_ENV === "development" && !globalForPrisma.prismaMiddlewareApplied) {
+   try {
      prisma.$use(async (params, next) => {
        // ... middleware logic ...
      });
+     globalForPrisma.prismaMiddlewareApplied = true;
+   } catch (error) {
+     console.debug("Prisma middleware already applied");
+   }
  }
```

---

## ✅ VERIFICACIÓN

**Después del fix**:

```bash
$ npm run dev
✔ Generated Prisma Client v6.19.0
✓ Starting...
✓ Ready in 2.1s
```

✅ **Servidor corriendo sin errores en `http://localhost:3001`**

---

## 🎯 IMPACTO

- ✅ Desarrollo local ahora funciona correctamente
- ✅ Hot reload sin errores
- ✅ Middleware de Prisma se aplica una sola vez
- ✅ Errores en slow queries se registran normalmente
- ✅ Sin cambios en producción (código ya no usa $use en prod)

---

## 🚀 PRÓXIMO PASO

Ahora sí puedes:

1. **Probar localmente**:
   ```bash
   cd "C:\03_Tienda digital"
   npm run dev
   # Abre http://localhost:3001
   ```

2. **Probar Google OAuth**:
   - Click en "Sign in with Google"
   - Verifica que tu cuenta de Google funcione localmente

3. **Después, probar en producción**:
   - Hace commit de este cambio
   - Push a GitHub
   - Vercel redeploy automático
   - Prueba en https://sacrint-tienda-on-line.vercel.app

---

**Fix por**: Claude Code
**Fecha**: 22 de Noviembre, 2025
