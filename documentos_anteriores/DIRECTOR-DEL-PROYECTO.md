# 👨‍💼 DIRECTOR DEL PROYECTO - Guía de Operación

**Rol**: Director de Proyecto (Local)
**Responsabilidad**: Coordinar ambos arquitectos, resolver conflictos, asegurar calidad
**Ubicación de trabajo**: Local (NO GitHub)
**Repositorio**: https://github.com/SACRINT/SACRINT_Tienda_OnLine.git

---

## 🎯 RESPONSABILIDADES PRINCIPALES

### 1. **Coordinación de Arquitectos**

- Asegurar que trabajan en paralelo sin conflictos
- Facilitar API contracts entre A y B
- Resolver blockers inmediatamente
- Hacer daily standups (9am, 5pm)

### 2. **Control de Calidad**

- Code reviews semanales (viernes 4pm)
- Verificar TypeScript strict mode
- Validar tests pasan
- Chequear seguridad (Zod validations, tenant isolation)

### 3. **Gestión de Ramas**

- NO mergear a main (solo cuando release)
- Mergear PRs de A a develop
- Mergear PRs de B a develop
- Mantener develop siempre deployable

### 4. **Documentación**

- Mantener CHANGELOG.md actualizado
- Documentar decisiones arquitectónicas
- Comunicar cambios a ambos arquitectos

### 5. **Releasing**

- Crear tags de versión
- Preparar production deployments
- Monitorear en Vercel

---

## 📊 ESTRUCTURA DE RAMAS

```
main                              ← PRODUCCIÓN (nunca commit directo)
  └── develop                     ← RAMA BASE DE DESARROLLO
       ├── feature/backend-arquitecto-a    ← Arquitecto A trabaja aquí
       └── feature/frontend-arquitecto-b   ← Arquitecto B trabaja aquí
```

### Flujo de PRs:

```
feature/backend-arquitecto-a  →  PR a develop  →  Code Review  →  Merge
feature/frontend-arquitecto-b →  PR a develop  →  Code Review  →  Merge
```

**NUNCA**:

- ❌ Mergear a main sin release
- ❌ Hacer commits directos a main o develop
- ❌ Ambos arquitectos editando mismo archivo simultáneamente

---

## 📅 CRONOGRAMA DIARIO

### 9:00 AM - Daily Standup

**Participantes**: Arquitecto A, Arquitecto B, Director
**Duración**: 15 minutos
**Agenda**:

```
Arquitecto A: ¿Qué hiciste ayer? ¿Qué haces hoy? ¿Blockers?
Arquitecto B: ¿Qué hiciste ayer? ¿Qué haces hoy? ¿Blockers?
Director:    Resolver blockers, comunicar cambios, próximos pasos
```

### 5:00 PM - Git Sync

**Participantes**: Ambos arquitectos
**Duración**: 10 minutos
**Acciones**:

```bash
# Cada uno en su rama
git pull origin develop        # Traer cambios del otro
# Si hay conflictos, resolver inmediatamente
npm install                    # Si hay cambios en package.json
```

### Viernes 4:00 PM - Code Review

**Participantes**: Ambos arquitectos + Director
**Duración**: 1 hora
**Agenda**:

```
1. Revisar PRs de la semana (10-15 PRs esperado)
2. Validar:
   - TypeScript strict mode
   - Zod validations implementadas
   - Tests pasan
   - Documentación actualizada
3. Mergear PRs aprobadas a develop
4. Discutir próxima semana
```

### Fin de mes - Retrospectiva

**Participantes**: Ambos arquitectos + Director
**Duración**: 1 hora
**Agenda**:

```
1. Qué salió bien
2. Qué salió mal
3. Improvements para siguiente sprint
4. Planning del siguiente sprint
5. Actualizar timeline si es necesario
```

---

## 🚀 SPRINT 0 - TU OPERACIÓN

### Hora 0-30 min: Preparación

```bash
# 1. Verificar estado del proyecto local
cd "C:\03_Tienda digital"
git status
git log --oneline -5

# 2. Verificar que ambos arquitectos tengan acceso a GitHub
# - Enviar INSTRUCCIONES-ARQUITECTO-A.md a Arquitecto A
# - Enviar INSTRUCCIONES-ARQUITECTO-B.md a Arquitecto B
```

### Hora 30 min - 3 horas: Monitorear Arquitecto A

**Arquitecto A está haciendo**:

1. Clonar repositorio
2. Crear proyecto Next.js
3. Configurar Prisma + Neon
4. Crear estructura de carpetas
5. Primer commit y push

**Tu rol**:

- Estar disponible para questions
- Verificar que no hay errores
- Resolver problemas de setup

**Monitoreo**:

```bash
# Cada 30 minutos, verifica GitHub
# Ir a: https://github.com/SACRINT/SACRINT_Tienda_OnLine/branches

# Debe ver cambios en feature/backend-arquitecto-a
```

### Hora 3+ horas: Arquitecto B puede comenzar

Cuando veas que Arquitecto A hizo push a `feature/backend-arquitecto-a`:

```
✅ Notificar a Arquitecto B: "Sprint 0 Backend completado, puedes comenzar"
```

### Monitorear Arquitecto B (1-2 horas adicionales)

**Arquitecto B está haciendo**:

1. Clonar repositorio
2. Traer cambios de Arquitecto A
3. Configurar Tailwind + shadcn/ui
4. Crear layout y home page
5. Primer commit y push

**Tu rol**:

- Estar disponible para questions
- Verificar que no hay errores

---

## 📋 CHECKLIST - SPRINT 0 COMPLETADO

Cuando ambos terminen Sprint 0:

```
ARQUITECTO A:
☐ Proyecto Next.js creado
☐ Prisma configurado
☐ Schema con 20+ modelos
☐ Base de datos Neon conectada
☐ Estructura de carpetas creada
☐ Primer commit en feature/backend-arquitecto-a
☐ npm run build sin errores
☐ npm run dev funciona

ARQUITECTO B:
☐ Tailwind configurado con paleta de colores
☐ shadcn/ui instalado con componentes base
☐ Layout principal creado
☐ Home page básica creada
☐ globals.css con design system
☐ Primer commit en feature/frontend-arquitecto-b
☐ npm run build sin errores
☐ npm run dev funciona

PROYECTO:
☐ Ambas ramas pushadas a GitHub
☐ Ambos pueden hacer merge a develop
☐ main branch intacta (solo documentación)
☐ Proyecto listo para Sprint 1
```

---

## 🔀 MERGING A DEVELOP (DESPUÉS DE SPRINT 0)

Cuando ambos terminen:

```bash
# 1. Ir a GitHub
# https://github.com/SACRINT/SACRINT_Tienda_OnLine/pulls

# 2. Crear PR desde feature/backend-arquitecto-a a develop
#    - Title: "feat(backend): Sprint 0 configuration complete"
#    - Description: Lista de cambios

# 3. Code review (verifica changes)

# 4. Mergear si OK:
#    - Merge pull request
#    - Confirm merge
#    - Delete branch after merging

# 5. Repetir para feature/frontend-arquitecto-b

# 6. Verificar que develop tiene ambos cambios
git checkout develop
git pull origin develop
git log --oneline -10
# Debe ver commits de ambos
```

---

## 🚨 RESOLUCIÓN DE CONFLICTOS

### Conflicto: Mismo archivo editado

**Si A y B editan el mismo archivo**:

```
Ejemplo: src/lib/utils/constants.ts

NUNCA:
❌ Ambos trabajar en el mismo archivo simultáneamente

SIEMPRE:
✅ Coordinar primero
✅ Uno espera a que otro termine
✅ Si urgente, dividir archivo en dos (constants-backend.ts, constants-frontend.ts)
```

**Cómo evitar**:

1. Usar carpetas diferentes (src/lib/db vs src/components)
2. APIs bien definidas (API contracts)
3. Daily sync (9am, 5pm)

### Conflicto: Merge de ramas

```bash
# Si hay merge conflict en GitHub:
# 1. CLI: Resolver en local
git checkout feature/backend-arquitecto-a
git pull origin develop

# 2. Resolver conflictos en archivos
# 3. git add .
# 4. git commit -m "merge: Resolve conflicts with develop"
# 5. git push origin feature/backend-arquitecto-a

# 6. PR refresh automáticamente en GitHub
# 7. Mergear cuando OK
```

---

## 📊 MONITOREO Y MÉTRICAS

### Diarios:

```
□ Ambos están en sus ramas correctas
□ Están committeando regularmente
□ No hay más de 2 horas sin commits
□ No hay errores en build
```

### Semanales:

```
□ Code review realizado
□ Tests están pasando
□ Coverage >= 80%
□ 0 security vulnerabilities
□ TypeScript strict mode active
□ Documentación actualizada
```

### Sprints:

```
□ Todos los acceptance criteria met
□ PRs mergeadas a develop
□ Main branch no cambia
□ Timeline en track
□ Equipo happy
```

---

## 📞 COMUNICACIÓN

### Canales:

```
Urgente (< 15 min):
└─ Chat directo / Llamada

Importante (< 1 hora):
└─ Email / Slack

Documentación:
└─ GitHub (CHANGELOG, documentación)

Decisiones:
└─ Documento en GitHub + comunicado a ambos
```

### Template de comunicación:

```
Subject: [PROYECTO] Cambio en [módulo]

Cambio: Descripción breve
Impacto: A quién afecta (A, B, o ambos)
Acción: Qué deben hacer
Deadline: Cuándo

Ejemplo:
Subject: [PROYECTO] API de productos cambia de /api/products a /api/v1/products
Cambio: Versionamos APIs
Impacto: Arquitecto B (frontend) debe actualizar fetch calls
Acción: Actualizar todos los fetch calls a /api/v1/products
Deadline: Antes de code review viernes
```

---

## 🔐 SEGURIDAD - TU RESPONSABILIDAD

### Nunca permitir:

```
❌ .env.local commiteado
❌ Secrets en código
❌ SQL sin Prisma (raw queries)
❌ Zod validation solo en frontend
❌ Sin tenant isolation
❌ Sin rate limiting en APIs críticas
❌ Sin TypeScript strict mode
```

### Siempre verificar:

```
✅ Validaciones Zod en AMBOS lados (frontend + backend)
✅ Tenant isolation en TODAS las queries
✅ RBAC implementado correctamente
✅ Secretos en .env.local
✅ CSP headers presentes
✅ Tests incluyen edge cases de seguridad
```

---

## 📈 PROGRESO ESPERADO

### Sprint 0 (Hoy)

- Arquitecto A: 2-3 horas
- Arquitecto B: 1-2 horas (después de A)
- **Total**: 3-5 horas para proyecto funcional

### Sprint 1 (Próxima semana)

- Arquitecto A: NextAuth.js + Google OAuth backend
- Arquitecto B: Login/signup UI
- **Duración**: 4-5 días de trabajo paralelo

### Sprint 2-4 (Semanas 2-4)

- Catálogo, Carrito, Checkout, Post-venta
- **Total para MVP**: 3-4 semanas

---

## 🎯 GOALS DIARIOS

### Arquitecto A (Backend)

```
□ Code compiles (npm run build)
□ All tests pass
□ No TypeScript errors
□ At least 1 commit
□ Documentation updated if needed
```

### Arquitecto B (Frontend)

```
□ Code compiles (npm run build)
□ All tests pass
□ No TypeScript errors
□ At least 1 commit
□ Design system applied
```

### Director (Tú)

```
□ Daily standups facilitadas (9am, 5pm)
□ Blockers resueltos
□ GitHub monitoreado
□ Comunicación clara
□ Próximos pasos claros
```

---

## 📋 COMANDOS ÚTILES (DIRECTOR)

### Ver estado de ambos arquitectos

```bash
# Ver todas las ramas
git branch -a

# Ver commits recientes
git log --oneline -20 --all --graph

# Ver cambios en feature branches
git diff develop feature/backend-arquitecto-a
git diff develop feature/frontend-arquitecto-b

# Contar commits por arquitecto
git log feature/backend-arquitecto-a --oneline | wc -l
git log feature/frontend-arquitecto-b --oneline | wc -l
```

### Validar proyecto

```bash
# Build
npm run build

# Tests
npm test

# TypeScript
npx tsc --noEmit

# Lint
npm run lint
```

### Preparar merge a develop

```bash
# Traer cambios de ambas ramas
git fetch origin

# Crear rama temporal para verificar merge
git checkout -b temp-merge origin/develop
git merge origin/feature/backend-arquitecto-a
git merge origin/feature/frontend-arquitecto-b

# Si no hay conflictos, ambos pueden mergear
# Si hay conflictos, coordinar resolución

# Limpiar
git checkout develop
git branch -D temp-merge
```

---

## 🚀 PRÓXIMAS INSTRUCCIONES

### Después de Sprint 0:

1. **PASO 1**: Ambos hacen PR a develop
2. **PASO 2**: Code review viernes
3. **PASO 3**: Mergear a develop
4. **PASO 4**: Dar instrucciones de Sprint 1

```
SPRINT 1 INSTRUCTIONS:
- Arquitecto A: NextAuth.js configuration
- Arquitecto B: Login/signup pages

Esperar a que ambos lean ARQUITECTURA sección 6
```

---

## 📞 SOPORTE PARA DIRECTORES

Si necesitas ayuda como Director:

1. **Conflicto técnico**: Ver ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md
2. **Workflow Git**: Ver DIVISION-TRABAJO-PARALELO.md "Git Workflow"
3. **Sprint específico**: Ver SPRINT-0-SETUP-CHECKLIST.md
4. **Diseño**: Ver Proyecto de Diseño Tienda digital.md

---

**Última actualización**: 15 de Noviembre, 2025
**Status**: ✅ Listo para Sprint 0
**Rol**: Director del Proyecto - Coordinación local

¡A por ello! 💪
