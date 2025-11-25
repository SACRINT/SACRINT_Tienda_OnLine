# ⚡ QUICK FIX: Arregla estos 5 errores y listo

**Para**: Arquitecto
**Tiempo**: 5 minutos
**Pasos**: 4 simples

---

## 🔴 EL PROBLEMA

Tu rama tiene 5 caracteres escapados que rompen el build:

```
❌ \!  (debe ser: !)
❌ \`  (debe ser: `)
```

**Resultado**: `npm run build` falla

---

## ✅ LA SOLUCIÓN RÁPIDA

### PASO 1: Abre VS Code en tu rama

```bash
cd "C:\03_Tienda digital"
git checkout claude/fix-typescript-errors-01URvcAccWEhy6Wndeeo3eYK
code .
```

### PASO 2: Abre Find & Replace (Ctrl+H)

```
Ctrl + H
```

### PASO 3: Reemplaza \! por !

```
Find:    \!
Replace: !
Click: "Replace All"
```

### PASO 4: Reemplaza \` por `

```
Find:    \`
Replace: `
Click: "Replace All"
```

### PASO 5: Guarda todo (Ctrl+K, Ctrl+S)

```
Ctrl + K, Ctrl + S
```

---

## 📁 ARCHIVOS AFECTADOS (para verificar)

```
src/app/robots.ts              (línea 22)
src/app/sitemap.ts             (línea 18)
src/app/api/reviews/[id]/route.ts         (línea 23)
src/app/api/reviews/[id]/vote/route.ts    (línea 18)
src/app/api/search/suggestions/route.ts   (línea 25)
```

---

## ✅ VERIFICA QUE COMPILA

```bash
npm run build
```

Debe decir:

```
✓ Compiled successfully
```

---

## 🚀 COMMIT Y PUSH

```bash
git add .
git commit -m "fix: Remove incorrectly escaped characters"
git push origin claude/fix-typescript-errors-01URvcAccWEhy6Wndeeo3eYK
```

---

## 🎉 LISTO!

Una vez pusheado, avísale y podremos mergear a main.

---

**Tiempo total**: ~5 minutos
**Dificultad**: Muy fácil (Find & Replace)
**Urgencia**: ALTA (bloquea todo)
