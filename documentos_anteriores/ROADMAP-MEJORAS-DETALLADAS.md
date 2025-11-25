# Roadmap Detallado de Mejoras - Tienda Online 2025

**Fecha**: 22 de Noviembre, 2025
**Prioridad**: Después de resolver error 404 en Vercel
**Tiempo Estimado Total**: 3-4 semanas (dividible en sprints)

---

## 🎯 OBJETIVO

Mejorar la experiencia de usuario (tanto vendedores como clientes) y agregar funcionalidades críticas para que la plataforma sea production-ready con features competitivas.

---

## 📋 MEJORAS POR CATEGORÍA

### PRIORIDAD 1️⃣: CRÍTICA (Semana 1-2)

#### 1.1 Resolver Error 404 en Vercel

**Dependencia**: Bloqueante para todo lo demás
**Pasos**:

1. Revisar VERCEL-PANEL-CHECKLIST.md
2. Investigar environment variables
3. Revisar build settings y middleware logs
4. Hacer redeploy limpio si es necesario

**Resultado esperado**: Aplicación accesible en producción

---

#### 1.2 Re-habilitar next-intl

**Dependencia**: Después de resolver Vercel
**Pasos**:

1. Descomentar imports en `next.config.js`
2. Reestructurar carpetas: `app/[locale]/(auth)/...`
3. Mover todas las rutas bajo estructura con locale
4. Actualizar middleware para routing de locale
5. Probar rutas con `/es/` y `/en/`
6. Configurar fallback locale

**Archivos a modificar**:

- `next.config.js` - Descomentar next-intl plugin
- `src/middleware.ts` - Agregar lógica de locale routing
- Estructura de `src/app` - Mover todas las rutas

**Tiempo**: 3-4 horas
**Riesgo**: MEDIO (requiere reorganización de carpetas)

**Checklist de validación**:

- [ ] `/es/` redirige correctamente
- [ ] `/en/` redirige correctamente
- [ ] Rutas públicas sin locale funcionan
- [ ] Locale se preserva en navegación
- [ ] Build exitoso
- [ ] Vercel deploy exitoso

---

### PRIORIDAD 2️⃣: ALTA (Semana 2-3)

#### 2.1 Dashboard Mejorado - Store Owner

**Descripción**: Actualizar dashboard para que sea más visualmente atractivo y funcional

**Cambios necesarios**:

##### 2.1.1 Página de Productos Mejorada

```
Ubicación: src/app/(dashboard)/[storeId]/products/page.tsx

Mejoras:
- Tabla con imágenes en miniatura de productos
- Filtros por categoría, estado (activo/inactivo)
- Búsqueda rápida por nombre
- Acciones: Editar, Duplicar, Archivar, Ver en tienda
- Paginación con 10/25/50 items por página
- Bulk actions: cambiar estado, archivar múltiples
- Estadísticas: Total productos, activos, archivados
- Link directo a agregar nuevo producto

Componentes necesarios:
- ProductsTable (tabla con datos de producto)
- ProductActions (menú de acciones)
- ProductFilters (filtros avanzados)
- BulkActionsBar (acciones en lote)

Tiempo: 1-2 días
Puntos: 8-13
Dificultad: MEDIA
```

##### 2.1.2 Dashboard de Órdenes Mejorado

```
Ubicación: src/app/(dashboard)/[storeId]/orders/page.tsx

Mejoras:
- Vista rápida: Órdenes pendientes, procesando, completadas
- Filtros: Por estado, fecha, cliente, monto
- Tabla: Orden #, Cliente, Monto, Fecha, Estado, Acciones
- Click en orden → panel lateral con detalles
- Cambiar estado de orden desde dashboard
- Imprimir etiqueta de envío
- Ver tracking de envío
- Notas internas por orden

Componentes necesarios:
- OrdersTable (tabla con órdenes)
- OrderDetailPanel (panel lateral)
- OrderStatusBadge (estado con color)
- ShippingLabel (generar etiqueta)

Tiempo: 2 días
Puntos: 13-21
Dificultad: MEDIA
```

##### 2.1.3 Analytics Mejorado

```
Ubicación: src/app/(dashboard)/[storeId]/analytics/page.tsx

Mejoras:
- Gráficos: Ventas por día/semana/mes (línea), Top productos (barras)
- KPIs: Ingresos totales, órdenes, ticket promedio, tasa conversión
- Período configurable: Últimos 7/30/90 días, personalizado
- Exportar a PDF: Reporte de ventas
- Segmentación: Por categoría, producto, cliente

Librerías recomendadas:
- Recharts (gráficos simple pero potente)
- date-fns (manejo de fechas)

Tiempo: 2-3 días
Puntos: 13-21
Dificultad: MEDIA
```

---

#### 2.2 Mejora de Experiencia de Compra - Customer

##### 2.2.1 Página de Producto Mejorada

```
Ubicación: src/app/(store)/products/[id]/page.tsx

Cambios actuales → Mejorados:
1. Galería de imágenes
   - Antes: Lista simple de imágenes
   - Después: Galería con zoom, miniaturas, vista principal grande

2. Variantes (talla, color)
   - Antes: Selects normales
   - Después: Grid visual (cuadrados de color, opciones de talla)

3. Información del producto
   - Agregar: Stock en tiempo real, sku, código de barras
   - Mostrar: Marca, categoría con breadcrumb

4. Reviews y calificaciones
   - Rating visual (estrellas)
   - Listado de reviews con foto y nombre de cliente
   - Opción para agregar review (si compró)

5. Productos relacionados
   - Mostrar 4-6 productos similares al final
   - Por categoría o tags

Componentes necesarios:
- ImageGallery (galería con zoom)
- VariantSelector (selector visual)
- ReviewSection (reviews y calificaciones)
- RelatedProducts (carrusel)

Tiempo: 2-3 días
Puntos: 13-21
Dificultad: MEDIA
```

##### 2.2.2 Carrito Mejorado

```
Ubicación: src/app/(store)/cart/page.tsx

Mejoras:
- Resumen visual por categoría
- Productos recomendados ("Clientes también compraron")
- Código de descuento/cupón
- Envío calculado automáticamente
- Mostrar impuestos desglosados
- "Continuar comprando" link
- Estimado de entrega basado en código postal
- Guardar carrito para después (persistencia)

Tiempo: 1-2 días
Puntos: 8-13
Dificultad: MEDIA
```

##### 2.2.3 Búsqueda Mejorada

```
Ubicación: src/app/(store)/shop/page.tsx + src/lib/search

Mejoras:
- Filtros facetados: Categoría, precio (slider), marca, rating
- Ordenamiento: Relevancia, precio (asc/desc), nuevos, trending
- Vista: Grid (por defecto) o Lista
- Paginación mejorada
- "No results" con sugerencias
- Búsqueda: Case-insensitive, partial matching
- Historial de búsquedas del usuario

Cambios de backend:
- Agregar índices en Prisma para búsqueda rápida
- Implementar filtros en API `/api/products?category=&minPrice=&maxPrice=`

Tiempo: 2 días
Puntos: 13-21
Dificultad: MEDIA-ALTA
```

---

### PRIORIDAD 3️⃣: MEDIA (Semana 3-4)

#### 3.1 Sistema de Pagos Completo

##### 3.1.1 Stripe Integration Completa

```
Cambios necesarios:
1. Crear PaymentForm mejorado
   - Mostrar métodos disponibles: Tarjeta, Apple Pay, Google Pay
   - 3D Secure automático para seguridad

2. Manejo de errores de pago
   - Reintentos automáticos
   - Mensajes de error específicos
   - Logging de fallos para debugging

3. Confirmación y recibos
   - Email con recibo de compra
   - Página de confirmación con orden #
   - Link para descargar recibo en PDF

Tiempo: 2 días
Puntos: 13-21
Dificultad: ALTA
```

##### 3.1.2 Mercado Pago Integration

```
Cambios necesarios:
1. Setup de Mercado Pago
   - Crear cuenta merchant
   - Agregar credentials a .env

2. Checkout con Mercado Pago
   - Método de pago adicional en checkout
   - Webhook para confirmaciones

3. Soporte para OXXO/efectivo
   - Método adicional: Pagar en OXXO
   - Generar código de pago
   - Confirmar cuando se paga en sucursal

Tiempo: 2 días
Puntos: 13-21
Dificultad: ALTA
```

---

#### 3.2 Email Transaccional Completo

```
Implementar emails con Resend:

1. Emails implementados:
   - Bienvenida (signup)
   - Verificación de email
   - Reset de contraseña
   - Confirmación de orden
   - Actualización de estado de orden
   - Notificación de envío

2. Templates mejorados:
   - Branding de la tienda
   - Detalles de orden con tablas
   - Links con tracking
   - CTA (llamada a acción) claros

3. Mejoras:
   - Queue de emails (para evitar timeouts)
   - Retry automático si falla
   - Logging de emails enviados
   - Unsubscribe link

Tiempo: 2 días
Puntos: 13-21
Dificultad: MEDIA
```

---

#### 3.3 Órdenes y Post-venta

##### 3.3.1 Gestión de Órdenes

```
Cambios:
1. Estados de orden: Pendiente → Pagada → Procesando → Enviada → Entregada
2. Cambio de estado solo por admin
3. Tracking automático:
   - Integración con Shippo (multi-carrier)
   - Números de tracking
   - Estimados de entrega
4. Devoluciones y reembolsos:
   - Crear RMA (Return Merchandise Authorization)
   - Procesar reembolsos (inversión en Stripe)
   - Estados de devolución

Tiempo: 3 días
Puntos: 21-34
Dificultad: ALTA
```

##### 3.3.2 Reseñas y Calificaciones

```
Implementar sistema completo:
1. Dejar review después de compra:
   - Calificación (1-5 estrellas)
   - Título y comentario
   - Fotos opcionales

2. Moderación:
   - Admin aprueba antes de mostrar
   - Filtro de spam

3. Verificación:
   - Solo usuarios que compraron pueden dejar review
   - Mostrar "Comprador verificado"

4. Rating en producto:
   - Promedio de calificaciones
   - Distribución de estrellas
   - Cantidad de reviews

Tiempo: 2 días
Puntos: 13-21
Dificultad: MEDIA
```

---

### PRIORIDAD 4️⃣: BAJA (Mejoras futuras)

#### 4.1 Seguridad Avanzada

- [ ] Rate limiting en endpoints críticos (login, checkout)
- [ ] 2FA (autenticación de dos factores)
- [ ] Audit logging (registro de acciones sensibles)
- [ ] IP whitelist para admin
- [ ] Detección de fraude en órdenes

#### 4.2 Performance

- [ ] Image optimization (next/image)
- [ ] Code splitting automático
- [ ] Lazy loading de componentes
- [ ] Caching de API con Redis
- [ ] CDN para imágenes (Cloudinary)

#### 4.3 SEO

- [ ] Sitemap generado dinámicamente
- [ ] Meta tags dinámicos por producto
- [ ] Open Graph para compartir
- [ ] Schema.org para rich snippets
- [ ] Robots.txt

#### 4.4 Social

- [ ] Compartir en redes sociales
- [ ] Reviews en Google
- [ ] Integración con Facebook Catalog
- [ ] Instagram Shopping

---

## 📊 TIMELINE SUGERIDO

```
SEMANA 1-2:
├─ Resolver 404 Vercel (bloqueante)
├─ Re-habilitar next-intl
└─ Pruebas exhaustivas

SEMANA 2-3 (Paralelo):
├─ Dashboard mejorado (Arch A)
├─ E-commerce experience (Arch B)
└─ Búsqueda facetada (Arch A)

SEMANA 3-4:
├─ Pagos completos: Stripe + Mercado Pago (Arch A)
├─ Email transaccional (Arch B)
└─ Órdenes y post-venta (Arch A)

SEMANA 4+:
├─ Reseñas y calificaciones (Arch B)
├─ Devoluciones y reembolsos (Arch A)
└─ Testing y optimización
```

---

## 🎯 CRITERIOS DE ÉXITO

Cada mejora debe cumplir:

1. **Funcional**
   - Feature completa y probada
   - Sin errores en consola
   - Responde correctamente a inputs

2. **Performance**
   - Tiempo de carga < 2s
   - Lighthouse > 90
   - No hay memory leaks

3. **Seguridad**
   - Validaciones en backend
   - Sin XSS, SQL injection
   - Autenticación correcta

4. **UX**
   - Interfaz intuitiva
   - Accesible (WCAG 2.1 AA)
   - Responsive en móvil

5. **Documentado**
   - Cambios en CHANGELOG.md
   - Comentarios en código
   - PR con descripción clara

---

## 📚 RECURSOS RECOMENDADOS

### Librerías ya disponibles

- `Recharts` - Gráficos
- `Zod` - Validación
- `React Hook Form` - Formularios
- `shadcn/ui` - Componentes
- `Zustand` - Estado del cliente

### Por agregar

- `Shippo` - Tracking de envíos
- `sharp` - Optimización de imágenes
- `node-cron` - Tasks programadas

---

## 🚨 RIESGOS CONOCIDOS

| Riesgo                    | Probabilidad | Impacto | Mitigación                |
| ------------------------- | ------------ | ------- | ------------------------- |
| 404 Vercel no se resuelve | MEDIA        | CRÍTICO | Contactar Vercel support  |
| next-intl causa regresión | BAJA         | ALTO    | Tests exhaustivos después |
| Stripe webhooks fallan    | BAJA         | ALTO    | Logging detallado + retry |
| Performance en mobile     | MEDIA        | MEDIO   | Optimizar imágenes y JS   |

---

## ✅ CHECKLIST FINAL

Cuando esté todo listo:

```
✅ Vercel funcionando
✅ next-intl re-habilitado
✅ Dashboard bonito y funcional
✅ E-commerce experience mejorada
✅ Búsqueda facetada
✅ Pagos: Stripe completo
✅ Pagos: Mercado Pago completo
✅ Email transaccional
✅ Órdenes con tracking
✅ Reseñas y calificaciones
✅ Build exitoso
✅ Tests pasando
✅ Documentación actualizada
✅ Lighthouse > 90
✅ Listo para MVP
```

---

**Documento preparado por**: Claude Code
**Fecha**: 22 de Noviembre, 2025
**Próximo paso**: Resolver Vercel 404 error
