# 🚀 INSTRUCCIONES PARA ARQUITECTO NUEVO - EMPIEZA AQUÍ

**Documento de Onboarding Completo**
**Fecha**: 2025-11-19
**Tu Role**: Frontend o Backend (especificar)
**Timeline**: 24 semanas (Nov 20 2025 - May 8 2026)

---

## ⚠️ ANTES DE EMPEZAR

Tienes **3 instrucciones precisas**:

1. Leer documentación (4 horas máximo)
2. Setup local (30 minutos)
3. Primera PR (viernes)

**No hagas nada más** hasta leer esto completamente.

---

## PASO 1: LECTURA (Semana 1 - Lunes a Jueves)

### ⏱️ Timeline de Lectura

#### Lunes (2-3 horas)

**1. RESUMEN-FINAL-Y-PROXIMOS-PASOS.md** (5 minutos)

- Entiende qué se logró
- Entiende qué falta
- Entiende el timeline

**2. INDICE-LECTURA-FASE-3.md** (5 minutos)

- Lee "Mapa de lectura por rolle"
- Elige tu ruta según tu role (Frontend vs Backend)

#### Martes (2-3 horas)

**3. INSTRUCCIONES-FASE-3-ARQUITECTO-24-SEMANAS.md** (1.5 horas)

- Lee TODO
- Enfoque especial en "Semanas 1-4"
- Enfoque especial en tu rolle específica
- Aprende el "Git workflow" section

#### Miércoles (2 horas)

**4. Proyecto de Diseño Tienda digital.md** (SI ERES FRONTEND) (1 hora)

```
Lee:
- Informe de Arquitectura y Guía de Diseño
- Paleta de colores
- Tipografía
- Responsive design (mobile-first)
```

**4. ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md** (SI ERES BACKEND) (1.5 horas)

```
Lee:
- Stack tecnológico
- Principios fundamentales
- Database schema
- Patrones de seguridad
```

#### Jueves (1 hora)

**5. CHANGELOG.md** (30 minutos)

- Lee qué se implementó ya
- Usa como referencia (no reimplements)

**6. VERCEL-DEPLOYMENT-GUIDE.md** (30 minutos)

- Entiende variables de entorno
- Entiende deployment

---

## PASO 2: SETUP LOCAL (Viernes - Mañana)

### 2.1 Clonar Repositorio

```bash
# Si no tienes el repo
git clone https://github.com/SACRINT/SACRINT_Tienda_OnLine.git
cd SACRINT_Tienda_OnLine

# Si ya lo tienes
cd "ruta/a/tu/proyecto"
```

### 2.2 Sincronizar Cambios Recientes

```bash
# Asegúrate de estar en main
git checkout main

# Pull cambios más recientes
git pull origin main

# Verifica que tienes los últimos commits
git log --oneline -5
```

**Deberías ver estos 5 commits en el output**:

```
adef58d docs: Add reading index and navigation guide for Phase 3
e975e12 docs: Add executive summary and next steps for architect
5b2ed24 docs: Add comprehensive 24-week roadmap and architect instructions for Phase 3
b860892 fix: Add prisma generate to build and dev scripts for Vercel compatibility
7b93f0b docs: Add comprehensive Vercel deployment guide for production
```

### 2.3 Instalar Dependencias

```bash
# Instalar node_modules
npm install

# Generar Prisma Client
prisma generate

# Verificar que todo compila
npm run build
```

**Esperado**: `✓ Compiled successfully`

### 2.4 Ejecutar Localmente

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abre en navegador
# http://localhost:3000
```

**Deberías ver**:

- ✅ Homepage cargando
- ✅ "Bienvenido a Tienda Online 2025"
- ✅ "Iniciar Sesión" y "Crear Tienda" buttons funcionan
- ✅ 0 console errors

### 2.5 Verificar Git Setup

```bash
# Verifica tu nombre y email están configurados
git config user.name
git config user.email

# Si no están, configúralos
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@ejemplo.com"
```

---

## PASO 3: CREAR RAMA PARA SEMANA 1 (Viernes)

### 3.1 Crear Feature Branch

```bash
# Asegúrate de estar en main y sincronizado
git checkout main
git pull origin main

# Crea rama para Sprint 7 (Semanas 1-4)
git checkout -b feature/sprint-7-design-system

# Empuja rama al remoto
git push origin feature/sprint-7-design-system

# Verifica que creó bien
git branch -a
```

**Output esperado**:

```
  develop
  main
* feature/sprint-7-design-system
  remotes/origin/develop
  remotes/origin/feature/sprint-7-design-system
  remotes/origin/main
```

---

## PASO 4: PRIMERA TAREA (Semana 1 - Viernes)

### ⚠️ IMPORTANTE: Lee esto BIEN

Tu primera tarea depende de tu rolle:

### SI ERES FRONTEND (Arquitecto B)

**Tarea Semana 1 (60 horas)**: Crear Design System + 40+ Componentes

**Archivo**: INSTRUCCIONES-FASE-3-ARQUITECTO-24-SEMANAS.md → Semana 1

**Qué hacer**:

1. Crear paleta de colores en Tailwind (colores del "Proyecto de Diseño")
2. Implementar 40+ componentes Shadcn/ui personalizados:
   - Header/Footer
   - ProductCard
   - CategoryCard
   - FilterPanel
   - PriceRange
   - CheckoutSteps
   - etc.
3. Crear Storybook
4. Tests de responsive design

**Deliverables Viernes Semana 1**:

- [ ] `/components/ui/` con 40+ componentes
- [ ] Storybook corriendo en `http://localhost:6006`
- [ ] Todos los componentes documentados
- [ ] 0 console errors
- [ ] Lighthouse > 90

**Cómo entregar**:

1. Haz cambios en rama `feature/sprint-7-design-system`
2. Viernes antes de las 5pm:

   ```bash
   git add .
   git commit -m "feat: Implement design system and component library (Sprint 7 - Week 1)

   - 40+ Shadcn/ui components
   - Tailwind color palette (Blue navy, Gold, Mint green)
   - Storybook setup
   - Responsive design tested
   - Lighthouse > 90

   🤖 Generated with Claude Code"

   git push origin feature/sprint-7-design-system
   ```

3. Crea PR en GitHub
4. Pide code review
5. Espera merge (usualmente viernes noche)

---

### SI ERES BACKEND (Arquitecto A)

**Tarea Semana 1 (40 horas)**: Database Optimization + Backend Support

**Archivo**: INSTRUCCIONES-FASE-3-ARQUITECTO-24-SEMANAS.md → Semana 1 (Backend Support section)

**Qué hacer**:

1. Revisar y optimizar búsqueda de productos
2. Agregar índices PostgreSQL para performance
3. Optimize API de categorías
4. Caching de productos populares

**Deliverables Viernes Semana 1**:

- [ ] 5+ índices agregados a BD
- [ ] Búsqueda 50% más rápida (benchmark)
- [ ] Documentación de índices
- [ ] Todos los tests pasando
- [ ] Lighthouse > 90

**Cómo entregar**:

1. Haz cambios en rama `feature/sprint-7-design-system` (la misma rama, colaborar con Frontend)
2. Viernes antes de las 5pm:

   ```bash
   git add .
   git commit -m "perf: Database optimization and indexing for Sprint 7

   - Added 5+ PostgreSQL indexes
   - Optimized product search queries
   - Implemented caching for popular products
   - 50% performance improvement in search
   - All tests passing

   🤖 Generated with Claude Code"

   git push origin feature/sprint-7-design-system
   ```

3. Coordina con Frontend para hacer 1 sola PR viernes
4. Code review
5. Merge

---

## PASO 5: TAREAS POR SEMANA (REFERENCIA RÁPIDA)

### Semana 1 (Nov 25-29)

**Frontend**: Design System + 40 componentes
**Backend**: Database optimization
**Entrega**: Viernes PR

### Semana 2 (Dic 2-6)

**Frontend**: HomePage + CategoryPage
**Backend**: API optimization
**Entrega**: Viernes PR

### Semana 3 (Dic 9-13)

**Frontend**: ProductDetailPage
**Backend**: Search optimization
**Entrega**: Viernes PR

### Semana 4 (Dic 16-20)

**Frontend**: CartPage + Checkout inicio
**Backend**: Cart API
**Entrega**: Viernes PR → Merge a main

**Luego**: Semanas 5-24 siguiente roadmap...

---

## ✅ CHECKLIST DE ONBOARDING

Marca cada que completes:

### Lectura

- [ ] Leí RESUMEN-FINAL-Y-PROXIMOS-PASOS.md
- [ ] Leí INDICE-LECTURA-FASE-3.md
- [ ] Leí INSTRUCCIONES-FASE-3-ARQUITECTO-24-SEMANAS.md
- [ ] Leí documentación de mi rolle (Diseño o Arquitectura)
- [ ] Leí CHANGELOG.md (referencias)
- [ ] Leí VERCEL-DEPLOYMENT-GUIDE.md

### Setup Local

- [ ] Cloné/sincronícé repositorio
- [ ] Corrí `npm install`
- [ ] Corrí `prisma generate`
- [ ] Corrí `npm run build` (✓ Compiled successfully)
- [ ] Corrí `npm run dev`
- [ ] Verifyé http://localhost:3000 funciona
- [ ] Configuré git (user.name, user.email)

### Rama + Primera PR

- [ ] Creé rama `feature/sprint-7-design-system`
- [ ] Hicé cambios locales
- [ ] Commitié cambios
- [ ] Pushié rama a remoto
- [ ] Creé PR en GitHub
- [ ] Pedí code review

### Listo para Semana 1

- [ ] Entiendo el timeline (24 semanas)
- [ ] Entiendo mi rolle específica
- [ ] Entiendo Git workflow
- [ ] Entiendo quality gates
- [ ] Estoy listo para empezar

---

## 🆘 SI TIENES PROBLEMAS

### Problema: npm install falla

```bash
# Intenta limpiar caché
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Problema: prisma generate falla

```bash
# Asegúrate que DATABASE_URL está configurado
echo $DATABASE_URL

# Si no está, usa .env.local (ya existe template)
# Llena DATABASE_URL en .env.local
```

### Problema: npm run build falla

```bash
# Lee el error específico
npm run build

# Usualmente es:
# 1. TypeScript error - lee línea específica
# 2. Missing dependency - npm install [package]
# 3. Prisma issue - prisma generate

# Si no entiendes el error, pregunta en Slack/Discord
```

### Problema: http://localhost:3000 muestra blanco

```bash
# Abre browser console (F12)
# Ve qué error hay

# Usualmente es:
# 1. Server no corrió - npm run dev
# 2. Port ocupado - cambiar puerto en package.json
# 3. Componentes missing - npm install

# Si ves "Cannot find module" error:
npm install && npm run dev
```

### Problema: Git auth falla (push rechazado)

```bash
# Verifica credentials
git config --list | grep github

# O usa SSH en vez de HTTPS
git remote -v
# Debe mostrar: fetch/push con https://github.com/SACRINT/...

# Si falla, configura GitHub token o SSH key
```

---

## 📞 QUIEN CONTACTAR

**Para preguntas sobre**:

- **Arquitectura/Database**: Lee ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md primero
- **UI/UX/Componentes**: Lee "Proyecto de Diseño Tienda digital.md" primero
- **Timeline/Sprints**: Lee INSTRUCCIONES-FASE-3-ARQUITECTO-24-SEMANAS.md
- **Git workflow**: Lee "Git Workflow" section en INSTRUCCIONES-FASE-3
- **Específico del código**: Abre issue en GitHub o pregunta en Slack

---

## 🎯 RESUMEN DE HOY

**Si es Lunes**:

- Lée RESUMEN-FINAL + INDICE
- Empieza lectura de documentos principales

**Si es Viernes (Hoy)**:

- Completa lectura (si no terminaste)
- Setup local (2.1 - 2.5)
- Crea rama feature/sprint-7
- Empieza primera tarea
- Entrega PR antes de las 5pm

---

## 🚀 SIGUIENTE PASO INMEDIATO

### HOY (Viernes Nov 19 o Lunes Nov 20)

1. **Lee este documento completamente** ← Estás aquí
2. **Hace setup local** (30 minutos)
   ```bash
   git clone https://github.com/SACRINT/SACRINT_Tienda_OnLine.git
   cd SACRINT_Tienda_OnLine
   git checkout main
   git pull origin main
   npm install
   npm run build
   npm run dev
   ```
3. **Crea rama**
   ```bash
   git checkout -b feature/sprint-7-design-system
   git push origin feature/sprint-7-design-system
   ```
4. **Empieza tarea Semana 1** según tu rolle

---

## ✨ TIP IMPORTANTE

**No trates de hacer todo en el Día 1.**

La lectura te toma 4 horas. Setup local 30 minutos. Eso es 4.5 horas.

**Tu primer día real de trabajo es el Lunes.** Usa ese fin de semana para procesar la información.

---

**Status**: Ready for onboarding
**Date**: 2025-11-19
**Next**: First PR due Friday

¡Bienvenido al equipo! 🚀

You've got this! 💪
