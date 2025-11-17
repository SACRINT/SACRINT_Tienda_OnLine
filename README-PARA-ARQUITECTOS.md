# 📚 GUÍA RÁPIDA PARA ARQUITECTOS A & B

## Tu rol en el proyecto

**Arquitecto A (Backend)**: Implementar APIs y lógica del servidor
**Arquitecto B (Frontend)**: Implementar interfaz y experiencia del usuario

---

## 🚀 EMPIEZA AQUÍ

### Paso 1: Lee tu instrucción
- **Arquitecto A**: Abre `INSTRUCCIONES-SPRINT4-ARQUITECTO-A.md`
- **Arquitecto B**: Abre `INSTRUCCIONES-SPRINT2-ARQUITECTO-B.md`

### Paso 2: Entiende los requisitos
- Lee completamente la sección "REQUISITOS TÉCNICOS"
- No es pseudocódigo - son requisitos claros que DEBES implementar
- Si no entienden algo: pregunta a la directora

### Paso 3: Prepara tu ambiente
```bash
cd "C:\03_Tienda digital"
git fetch origin
git checkout develop
git pull origin develop
```

### Paso 4: Crea tu rama
**Arquitecto A**:
```bash
git checkout -b claude/backend-sprint-4-reviews-inventory
```

**Arquitecto B**:
```bash
git checkout -b claude/frontend-sprint-2-products
```

### Paso 5: Implementa
- Sigue EXACTAMENTE lo que dice tu instrucción
- No inventes funciones que no pidieron
- No cambies nombres de funciones
- Escribe código limpio con comentarios

### Paso 6: Verifica y sube
```bash
npm run build  # Debe pasar sin errores
npm run lint   # Debe pasar sin warnings (opcional)
git add .
git commit -m "feat: [descripción]"
git push origin tu-rama
```

---

## 📋 RESUMEN DE SPRINTS

### Sprint 4 (Arquitecto A)
**Qué hacer**: Reviews de productos + Gestión de inventario
**Cuántos archivos**: 8 archivos nuevos
**Líneas de código estimadas**: 1,500+
**Duración**: 4-5 días

**Archivos a crear**:
1. `src/lib/db/reviews.ts` - DAL para reseñas
2. `src/lib/db/inventory.ts` - DAL para inventario
3. `src/lib/security/schemas/review-schemas.ts` - Validaciones
4. `src/app/api/products/[id]/reviews/route.ts` - GET/POST reseñas
5. `src/app/api/reviews/[id]/route.ts` - PATCH/DELETE reseñas
6. `src/app/api/inventory/route.ts` - GET/PATCH inventario
7. `src/app/api/inventory/reserve/route.ts` - POST reserva
8. `src/app/api/inventory/confirm/route.ts` - POST confirmar reserva

**Modificar**:
- `prisma/schema.prisma` - Agregar 4 modelos
- `src/app/api/checkout/route.ts` - Integrar reservas

### Sprint 2 (Arquitecto B)
**Qué hacer**: UI/UX completa de compra
**Cuántos archivos**: 6 archivos nuevos
**Líneas de código estimadas**: 1,200+
**Duración**: 4-5 días

**Archivos a crear**:
1. `src/lib/store/useCart.ts` - Zustand store
2. `src/app/(shop)/layout.tsx` - Layout principal
3. `src/app/(shop)/page.tsx` - Listado de productos
4. `src/app/(shop)/products/[id]/page.tsx` - Detalle
5. `src/app/(shop)/cart/page.tsx` - Página del carrito
6. `src/app/(shop)/checkout/page.tsx` - Checkout con Stripe

---

## 🎯 REQUISITOS CLAVE (AMBOS)

### Arquitecto A
- ✅ Usar TypeScript strict mode
- ✅ Validaciones Zod en TODOS los endpoints
- ✅ Checks de autenticación donde se requiera
- ✅ RBAC (verificar roles de usuario)
- ✅ Multi-tenant isolation (filtrar por tenantId)
- ✅ Manejo de errores (try/catch, responses apropiadas)
- ✅ Transacciones para operaciones críticas
- ❌ NO hardcodear valores
- ❌ NO confiar en datos del cliente

### Arquitecto B
- ✅ Componentes funcionales con React hooks
- ✅ TypeScript con tipos explícitos
- ✅ Responsive design (mobile-first)
- ✅ Tailwind CSS (no CSS custom)
- ✅ Manejo de estados (loading, error, empty)
- ✅ Zustand para estado global (carrito)
- ✅ useSession() para proteger rutas
- ❌ NO usar componentes de clase
- ❌ NO hardcodear URLs
- ❌ NO componentes sin tipos TypeScript

---

## 🔗 APIs DISPONIBLES

**Arquitecto B**: Estas APIs ya existen (Arquitecto A las hizo en Sprint 3):

```
GET  /api/products?page=1&limit=20&category=slug
GET  /api/products/[id]
GET  /api/categories?format=tree
GET  /api/cart
POST /api/cart
PATCH /api/cart/items/[itemId]
DELETE /api/cart/items/[itemId]
POST /api/checkout
GET  /api/orders
```

---

## 🐛 SI ALGO SALE MAL

### "npm run build" falla
1. Lee el error EXACTO
2. NO intentes "arreglarlo" por tu cuenta
3. Mensaje a directora: "Error en [archivo], línea [X]: [error exacto]"
4. Espera a que te ayude

### TypeScript error que no entienden
1. Lee el error
2. Pregunta a directora: "¿Qué significa este error?"
3. Aprende la solución

### Merge conflict cuando hagas push
1. **NO hagas git pull después de git push**
2. Mensaje a directora: "Tengo merge conflict en [archivo]"
3. Espera a que resuelva

---

## ✅ CHECKLIST ANTES DE HACER COMMIT

- [ ] Leí COMPLETAMENTE mi instrucción
- [ ] Implementé TODO lo que pedía
- [ ] No dejé funciones a medias
- [ ] `npm run build` PASÓ sin errores
- [ ] `npm run lint` PASÓ (opcional pero recomendado)
- [ ] Código tiene comentarios en lógica compleja
- [ ] Sin console.log en código final
- [ ] Sin valores hardcodeados
- [ ] Sin commits incompletos

---

## 📊 ESTADO ACTUAL DEL PROYECTO

```
✅ Sprint 0: Setup completado
✅ Sprint 1: Auth completado
✅ Sprint 2 (Backend): Productos API completado
✅ Sprint 3: Cart & Checkout completado

⏳ Sprint 2 (Frontend): Tú, Arquitecto B
⏳ Sprint 4 (Backend): Tú, Arquitecto A
```

---

## 👥 TRABALANDO EN PARALELO

**AMBOS pueden trabajar al mismo tiempo:**
- Arquitecto A en rama: `claude/backend-sprint-4-...`
- Arquitecto B en rama: `claude/frontend-sprint-2-...`
- **NO hay conflictos** porque trabajan en archivos diferentes

**Cuando ambos terminen:**
1. Directora revisa ambas ramas
2. Merge a `develop` sin problemas
3. Ambos traen cambios: `git checkout develop && git pull`

---

## 🚨 REGLAS IMPORTANTES

**NUNCA hagas:**
- ❌ `git push --force` (puede romper todo)
- ❌ `git reset --hard` (pierde tu trabajo)
- ❌ Commits a `develop` o `main` directamente
- ❌ Cambiar código de archivos que no tocas
- ❌ Merges manuales (directora lo hace)

**SIEMPRE haz:**
- ✅ `npm run build` antes de commit
- ✅ Commits en tu rama (claude/...)
- ✅ Mensajes de commit descriptivos
- ✅ Preguntar si no entienden algo
- ✅ Avisar cuando terminas

---

## 📞 CONTACTO

Si tienes dudas durante el sprint:

```
"No entiende esto: [pregunta específica]"
→ Directora explica

"Tengo error en: [error específico]"
→ Directora ayuda

"Ya terminé mi sprint"
→ Directora revisa
```

---

## 🎓 APRENDE MIENTRAS TRABAJAS

**Arquitecto A aprenderá:**
- Prisma + PostgreSQL
- API REST design
- Validaciones con Zod
- RBAC y multi-tenancy
- Transacciones de BD

**Arquitecto B aprenderá:**
- Next.js App Router
- React Hooks avanzados
- Zustand para estado
- Tailwind CSS
- Stripe integration
- Responsive design

---

## 🏁 FIN DE SPRINT

Cuando termines:

1. **Haz commit final**:
   ```bash
   git add .
   git commit -m "feat: Complete [Sprint X] - [descripción]"
   git push origin tu-rama
   ```

2. **Avisa a directora**:
   "Terminé Sprint X. Mi rama está en `claude/...`"

3. **Directora revisa** y hace merge a `develop`

4. **Tú traes cambios**:
   ```bash
   git checkout develop
   git pull origin develop
   ```

5. **Listo para próximo sprint** o para ajustes

---

## 🎯 ÉXITO = CÓDIGO DE CALIDAD EN PRIMER INTENTO

```
Meta anterior:
  34 errores encontrados
  2+ horas de reparación

Meta nueva:
  0 errores esperados
  0 reparaciones necesarias
  ✅ Merge limpio en primer intento
```

**Ustedes pueden lograrlo. Tienen instrucciones claras. Solo implementen.**

---

**¡ADELANTE! 🚀**

Cualquier duda: pregunta.
Cualquier error: avisa.
Cualquier éxito: celebra.

La directora está aquí para apoyar, no para desarrollar.
Ustedes son quienes construyen este proyecto.

---

Última actualización: 16 de Noviembre, 2025
