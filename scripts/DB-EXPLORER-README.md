# 📊 Database Explorer - Neon PostgreSQL

Script para explorar y analizar toda la estructura y datos de la base de datos Neon de manera interactiva.

## 🚀 Uso Rápido

### Comando Básico (Resumen)

```bash
node scripts/db-explorer.js
```

Muestra:

- ✅ Lista de todas las tablas con conteo de filas
- ✅ Estructura de columnas (nombre, tipo, nullable)
- ✅ Estadísticas de tamaño de base de datos

### Ver Datos de Tabla Específica

```bash
node scripts/db-explorer.js --table=users
```

Muestra:

- ✅ Estructura de la tabla
- ✅ Primeras 10 filas de datos
- ✅ Información detallada

### Ver TODAS las Tablas con Datos

```bash
node scripts/db-explorer.js --full
```

Muestra:

- ✅ Estructura completa de cada tabla
- ✅ Primeras 10 filas de CADA tabla
- ✅ Resumen completo del database

### Formato JSON (para automatización)

```bash
node scripts/db-explorer.js --json
```

Retorna JSON con:

- Estructura de todas las tablas
- Conteos de filas
- Información de columnas

### Solo Estadísticas

```bash
node scripts/db-explorer.js --stats
```

Muestra:

- 📈 Tamaño de cada tabla
- 💾 Tamaño total de BD
- 🔗 Información de conexión

---

## 📋 Ejemplos de Uso

### 1️⃣ Exploración Básica

```bash
$ node scripts/db-explorer.js

🔄 Conectando a base de datos Neon...
✅ Conexión exitosa

====================================
📊 DATABASE EXPLORER - NEON PostgreSQL
====================================
⏰ Timestamp: 2024-11-27T10:30:00.000Z
📈 Total de tablas: 25

📋 RESUMEN DE TABLAS:
User                                →        50 filas |    8 columnas
Tenant                              →         5 filas |    6 columnas
Product                             →       250 filas |   12 columnas
Order                               →       120 filas |   10 columnas
...
```

### 2️⃣ Ver Usuarios

```bash
$ node scripts/db-explorer.js --table=User

📦 Tabla: User (50 filas)
🔧 Columnas: 8

Estructura de columnas:
Columna          | Tipo      | Nullable
id               | uuid      | ✗ NO
email            | varchar   | ✗ NO
name             | varchar   | ✓ SÍ
role             | varchar   | ✗ NO
...

Datos:
id               | email               | name        | role
c1f2d3e4-...    | user1@example.com   | John Doe    | CUSTOMER
a5b6c7d8-...    | user2@example.com   | Jane Smith  | CUSTOMER
...
```

### 3️⃣ Ver Productos con Datos Completos

```bash
$ node scripts/db-explorer.js --table=Product --full

📦 Tabla: Product (250 filas)
🔧 Columnas: 12

[Estructura]

Datos (primeras 10 filas de 250 total):
id    | name           | price    | tenantId         | status
uuid1 | Laptop Dell    | 999.99   | tenant-uuid-1    | ACTIVE
uuid2 | Mouse Logitech | 29.99    | tenant-uuid-1    | ACTIVE
uuid3 | Keyboard RGB   | 89.99    | tenant-uuid-2    | ACTIVE
...
```

### 4️⃣ Exportar como JSON para Procesamiento

```bash
$ node scripts/db-explorer.js --json > database-export.json

# Archivo genera JSON con estructura:
{
  "timestamp": "2024-11-27T10:30:00.000Z",
  "totalTables": 25,
  "tables": [
    {
      "name": "User",
      "rowCount": 50,
      "columnCount": 8,
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false
        },
        ...
      ]
    },
    ...
  ]
}
```

---

## 🔍 Casos de Uso Comunes

### 📊 Auditoría de Datos

```bash
# Ver cuántos registros hay en cada tabla
node scripts/db-explorer.js
```

### 🔐 Verificar Estructura

```bash
# Confirmar que columnas existen y tipos son correctos
node scripts/db-explorer.js --table=Order
```

### 📤 Backup de Estructura

```bash
# Guardar esquema de BD completo en JSON
node scripts/db-explorer.js --json > schema-backup-$(date +%Y-%m-%d).json
```

### 🐛 Debugging de Datos

```bash
# Ver primeras 10 filas de tabla problemática
node scripts/db-explorer.js --table=Order
```

### 📈 Monitoreo

```bash
# Ver tamaño actual de BD
node scripts/db-explorer.js --stats
```

### 🔄 Migración/Validación

```bash
# Ver estructura completa con datos
node scripts/db-explorer.js --full > full-report.txt
```

---

## 🎯 Tablas Principales (Tienda Online)

| Tabla            | Propósito                  | Filas  |
| ---------------- | -------------------------- | ------ |
| `User`           | Usuarios del sistema       | ~ 50   |
| `Tenant`         | Tiendas (vendedores)       | ~ 5    |
| `Product`        | Catálogo de productos      | ~ 250  |
| `ProductVariant` | Variaciones (talla, color) | ~ 500  |
| `ProductImage`   | Galerías de imágenes       | ~ 1000 |
| `Category`       | Categorías de productos    | ~ 20   |
| `Order`          | Órdenes de compra          | ~ 120  |
| `OrderItem`      | Items de órdenes           | ~ 400  |
| `Cart`           | Carritos activos           | ~ 30   |
| `CartItem`       | Items en carrito           | ~ 80   |
| `Review`         | Reseñas de productos       | ~ 200  |
| `Address`        | Direcciones de envío       | ~ 150  |
| `Coupon`         | Cupones y descuentos       | ~ 40   |

---

## 🛠️ Solución de Problemas

### ❌ "Connection refused"

```
✅ Solución: Verifica DATABASE_URL en .env.local
```

### ❌ "permission denied"

```
✅ Solución: Asegúrate de tener permisos de lectura en Neon
```

### ❌ "Table not found"

```
✅ Solución: Ejecuta `npx prisma db push` primero
```

### ❌ "Timeout"

```
✅ Solución: La BD está lenta. Intenta en otro momento.
```

---

## 📝 Notas Técnicas

- **Driver**: Prisma Client (conexión segura)
- **Base de Datos**: PostgreSQL (Neon)
- **Límite de Filas**: 1000 filas máximo por tabla (editable en código)
- **Formato**: Tablas ASCII para terminal

---

## 🚀 Versión TypeScript (Alternativa)

Si prefieres usar TypeScript:

```bash
npx ts-node scripts/db-explorer.ts
```

Usa los mismos comandos:

```bash
npx ts-node scripts/db-explorer.ts --table=User
npx ts-node scripts/db-explorer.ts --full
npx ts-node scripts/db-explorer.ts --json
```

---

## 📊 Output Esperado

```
====================================
📊 DATABASE EXPLORER - NEON PostgreSQL
====================================
⏰ Timestamp: 2024-11-27T10:30:00.000Z
📈 Total de tablas: 25

📋 RESUMEN DE TABLAS:
User                                →        50 filas |    8 columnas
Tenant                              →         5 filas |    6 columnas
Product                             →       250 filas |   12 columnas
Order                               →       120 filas |   10 columnas
OrderItem                           →       400 filas |    8 columnas
...

📐 ESTRUCTURA DE COLUMNAS:

📦 User (50 filas)
Columna              | Tipo       | Nullable
id                   | uuid       | ✗ NO
email                | varchar    | ✗ NO
name                 | varchar    | ✓ SÍ
role                 | varchar    | ✗ NO
...

📈 ESTADÍSTICAS DE BASE DE DATOS:

Tabla         | Columnas | Tamaño
User          |        8 | 256 KB
Product       |       12 | 2 MB
Order         |       10 | 512 KB
...

💾 Tamaño total de BD: 15 MB
🔗 Tipo de BD: PostgreSQL
📊 Versión: Neon

✅ Exploración completada
```

---

## 💡 Tips & Tricks

### 1. Guardar Reporte Completo

```bash
node scripts/db-explorer.js --full > database-report-$(date +%Y-%m-%d-%H%M%S).txt
```

### 2. Analizar Estructura en Editor

```bash
node scripts/db-explorer.js --json | jq '.' > schema.json
# Abre schema.json en tu editor
```

### 3. Monitoreo Automático

```bash
# En cron job (cada día a las 6 AM)
0 6 * * * cd /path/to/project && node scripts/db-explorer.js --json > backups/schema-$(date +\%Y-\%m-\%d).json
```

### 4. Comparar Schemas de Diferentes BD

```bash
# Guardar schema actual
node scripts/db-explorer.js --json > schema-prod.json

# Comparar con staging
ssh staging-server "cd /app && node scripts/db-explorer.js --json" > schema-staging.json

# Comparar
diff schema-prod.json schema-staging.json
```

---

**Creado**: 27 de Noviembre, 2024
**Versión**: 1.0.0
**Mantenimiento**: Automatizado con Neon CLI
