# SACRINT Demo Store - Guía de Instalación y Uso

## Descripción
Tienda demo completamente funcional con productos reales de la base de datos, carrito de compras persistente, y proceso de checkout completo.

## Características de la Demo

### Funcionalidades Implementadas
- **Catálogo de Productos**: Productos reales con imágenes, precios, variantes y reseñas
- **Categorías**: Electrónica, Ropa, Hogar, Deportes
- **Carrito de Compras**: Persistencia en localStorage con Zustand
- **Checkout**: Proceso completo de compra con validación de direcciones
- **Cupones**: BIENVENIDO10 (10%), ENVIOGRATIS, SUMMER20 (20%)
- **Dashboard Admin**: Estadísticas reales de productos, órdenes y clientes
- **Responsive**: Diseño adaptable a móvil y escritorio

### Datos de Demo
- **Tenant**: "SACRINT Demo Store" (slug: demo-store)
- **9 Productos** en 4 categorías
- **3 Cupones** activos
- **Usuarios**:
  - owner@demo.com (STORE_OWNER)
  - customer@demo.com (CUSTOMER)
  - Password: demo123456

## Instalación

### 1. Prerequisitos
- Node.js 18+
- pnpm (o npm/yarn)
- PostgreSQL (o cuenta en Neon)

### 2. Clonar y Instalar Dependencias
\`\`\`bash
git clone https://github.com/SACRINT/SACRINT_Tienda_OnLine.git
cd SACRINT_Tienda_OnLine
pnpm install
\`\`\`

### 3. Configurar Variables de Entorno
Crear archivo \`.env.local\`:
\`\`\`env
# Base de Datos
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"

# Auth (NextAuth.js)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe (opcional para pagos reales)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (opcional)
RESEND_API_KEY="re_..."
\`\`\`

### 4. Configurar Base de Datos
\`\`\`bash
# Generar cliente Prisma
pnpm prisma generate

# Ejecutar migraciones
pnpm prisma migrate deploy

# Poblar datos demo
pnpm prisma db seed
\`\`\`

### 5. Iniciar Servidor de Desarrollo
\`\`\`bash
pnpm dev
\`\`\`

La aplicación estará disponible en: http://localhost:3000

## Guía de Uso

### Navegación
- **Inicio**: Página principal con productos destacados
- **Tienda**: Catálogo completo con filtros
- **Categorías**: Ver productos por categoría
- **Carrito**: Ver y editar items del carrito
- **Checkout**: Completar compra

### Flujo de Compra
1. Navegar a la tienda (/shop)
2. Agregar productos al carrito
3. Ir al carrito (/cart)
4. Aplicar cupón (opcional): BIENVENIDO10
5. Proceder al checkout
6. Completar información de envío
7. Confirmar pedido

### Panel de Administración
Acceder a /dashboard para ver:
- Estadísticas de ventas
- Lista de productos
- Órdenes recientes
- Gestión de clientes

## Estructura del Proyecto

\`\`\`
src/
├── app/                    # Páginas Next.js App Router
│   ├── (shop)/            # Páginas de la tienda
│   ├── (store)/           # Carrito y checkout
│   ├── dashboard/         # Panel admin
│   └── api/               # API Routes
├── components/
│   ├── shop/              # Componentes de tienda
│   ├── store/             # Header y Footer
│   └── ui/                # Componentes shadcn/ui
├── lib/
│   ├── db/                # Funciones de base de datos
│   ├── store/             # Zustand stores
│   └── payment/           # Integración Stripe
└── prisma/
    ├── schema.prisma      # Esquema de BD
    └── seed.ts            # Datos demo
\`\`\`

## Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Estilos**: Tailwind CSS, shadcn/ui
- **Estado**: Zustand (carrito), React Query
- **Base de Datos**: PostgreSQL, Prisma ORM
- **Pagos**: Stripe
- **Auth**: NextAuth.js

## Personalización

### Cambiar Datos de Demo
Editar \`prisma/seed.ts\` para modificar:
- Productos y precios
- Categorías
- Cupones disponibles
- Usuarios de prueba

### Agregar Nuevos Productos
1. Agregar al archivo seed.ts
2. Ejecutar: \`pnpm prisma db seed\`

## Soporte

Para preguntas o problemas:
- GitHub Issues: https://github.com/SACRINT/SACRINT_Tienda_OnLine/issues

## Licencia

Este proyecto es parte del curso de desarrollo SACRINT.
