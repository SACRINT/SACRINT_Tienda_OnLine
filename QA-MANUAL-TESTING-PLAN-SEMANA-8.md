# Plan de Testing Manual Detallado - Semana 8

## Checkout End-to-End & Validación de Producción

**Fecha**: 25 Noviembre 2025
**Responsable**: QA Team
**Objetivo**: Validar que el flujo completo de checkout funciona sin errores
**ETA**: 4-6 horas
**Prioridad**: 🔴 CRÍTICA

---

## 📋 TEST SUITE 1: FLUJO HAPPY PATH (Flujo Ideal)

### Test 1.1: Step 1 - Formulario de Dirección

**Precondiciones**: Carrito con al menos 1 producto, usuario en `/checkout`

**Pasos**:

1. ✓ Verificar que Step 1 se muestra como activo (Step 01 azul)
2. ✓ Llenar campo "Nombre Completo": `Juan Pérez García`
3. ✓ Llenar campo "Email": `juan@example.com`
4. ✓ Llenar campo "Teléfono": `+55 (555) 123-4567`
5. ✓ Llenar campo "Calle y Número": `Avenida Principal 123, Apt 4B`
6. ✓ Llenar campo "Ciudad": `México`
7. ✓ Llenar campo "Estado/Región": `CDMX`
8. ✓ Llenar campo "Código Postal": `06500`
9. ✓ Verifica que NO hay errores de validación mostrados
10. ✓ Haz clic en botón "Siguiente" (debe estar habilitado)

**Resultado Esperado**:

- ✅ Formulario acepta todos los datos
- ✅ No hay errores de validación roja
- ✅ Botón "Siguiente" es clickeable
- ✅ Step pasa a Step 02 automáticamente

---

### Test 1.2: Step 2 - Selector de Método de Envío

**Precondiciones**: Test 1.1 completado, Step 2 es activo

**Pasos**:

1. ✓ Verifica que Step 2 se muestra como activo (Step 02 azul)
2. ✓ Verifica que 3 opciones de envío son visibles:
   - [ ] Envío Estándar ($4.99) - 5-7 días
   - [ ] Envío Express ($12.99) - 2-3 días
   - [ ] Envío Nocturno ($29.99) - 1 día
3. ✓ Haz clic en "Envío Estándar"
4. ✓ Verifica que se muestra seleccionado (border azul, fondo azul)
5. ✓ Haz clic en botón "Siguiente"

**Resultado Esperado**:

- ✅ Las 3 opciones de envío son visibles
- ✅ Selección se muestra visualmente
- ✅ Avanza a Step 03

---

### Test 1.3: Step 3 - Método de Pago (Stripe)

**Precondiciones**: Test 1.2 completado, Step 3 es activo

**Pasos**:

1. ✓ Verifica que Step 3 se muestra como activo
2. ✓ Verifica que aparece campo "Stripe Card Element"
3. ✓ Ingresa tarjeta de test: `4242 4242 4242 4242`
4. ✓ Ingresa fecha: `12/25`
5. ✓ Ingresa CVC: `123`
6. ✓ Haz clic en botón "Siguiente"

**Resultado Esperado**:

- ✅ Card Element acepta la tarjeta
- ✅ No hay errores de validación
- ✅ Avanza a Step 04

---

### Test 1.4: Step 4 - Revisar y Confirmar

**Precondiciones**: Test 1.3 completado, Step 4 es activo

**Pasos**:

1. ✓ Verifica que Step 4 se muestra como activo
2. ✓ Verifica Resumen de Productos:
   - [ ] Nombre del producto visible
   - [ ] Cantidad correcta mostrada
   - [ ] Precio calculado correctamente
3. ✓ Verifica Dirección de Envío:
   - [ ] Juan Pérez García
   - [ ] juan@example.com
   - [ ] +55 (555) 123-4567
   - [ ] Avenida Principal 123, Apt 4B, México, CDMX 06500
4. ✓ Verifica Método de Envío:
   - [ ] "Envío Estándar" mostrado
   - [ ] Costo "$4.99" visible
5. ✓ Verifica Desglose de Totales:
   - [ ] Subtotal = suma correcta de productos
   - [ ] Impuestos (16%) = Subtotal × 0.16
   - [ ] Envío = $4.99
   - [ ] Total = Subtotal + Impuestos + Envío
6. ✓ Haz clic en "Confirmar y Pagar"

**Resultado Esperado**:

- ✅ Todos los datos mostrados correctamente
- ✅ Los totales son calculados correctamente
- ✅ Se redirige a Stripe o muestra confirmación de pago

---

### Test 1.5: Confirmación de Pago (Post-Checkout)

**Precondiciones**: Test 1.4 completado

**Pasos**:

1. ✓ Espera redirección (puede ser a Stripe o a página de confirmación)
2. ✓ Si va a Stripe, verifica que:
   - [ ] Sesión de Stripe se carga
   - [ ] Monto mostrado es correcto
   - [ ] Email del cliente es correcto
3. ✓ Completa pago en Stripe (si aplica)
4. ✓ Verifica que se crea orden en BD:
   - [ ] Accede a admin panel
   - [ ] Verifica que nueva orden aparece
   - [ ] Estado es "PROCESSING" o "PENDING_PAYMENT"
5. ✓ Verifica que email de confirmación se envía:
   - [ ] Revisa inbox del cliente
   - [ ] Email contiene detalles de la orden

**Resultado Esperado**:

- ✅ Pago se procesa exitosamente
- ✅ Orden se crea en BD
- ✅ Email de confirmación se envía
- ✅ Usuario ve confirmación visual

---

## 🚨 TEST SUITE 2: FLUJOS DE ERROR

### Test 2.1: Error - Formulario Incompleto (Step 1)

**Pasos**:

1. ✓ Llena solo "Nombre Completo" y "Email"
2. ✓ Deja otros campos vacíos
3. ✓ Haz clic en "Siguiente"

**Resultado Esperado**:

- ✅ Muestra error rojo en campos requeridos
- ✅ NO avanza a Step 2
- ✅ Mensaje de error es clara en español

---

### Test 2.2: Error - Email Inválido (Step 1)

**Pasos**:

1. ✓ Llena "Email" con valor inválido: `notanemail`
2. ✓ Llena resto del formulario correctamente
3. ✓ Haz clic en "Siguiente"

**Resultado Esperado**:

- ✅ Campo Email muestra error de validación
- ✅ NO avanza a Step 2
- ✅ Mensaje dice "Email inválido" o similar

---

### Test 2.3: Error - Método de Envío No Seleccionado (Step 2)

**Pasos**:

1. ✓ En Step 2, NO selecciones ningún método
2. ✓ Haz clic en "Siguiente"

**Resultado Esperado**:

- ✅ Muestra error de alerta
- ✅ Mensaje dice "Por favor selecciona un método de envío"
- ✅ NO avanza a Step 3

---

### Test 2.4: Error - Tarjeta Declinada (Step 3)

**Pasos**:

1. ✓ En Step 3, ingresa tarjeta declinada: `4000 0000 0000 0002`
2. ✓ Ingresa fecha y CVC válidos
3. ✓ Haz clic en "Siguiente"

**Resultado Esperado**:

- ✅ Stripe rechaza la tarjeta
- ✅ Muestra mensaje de error: "La tarjeta fue rechazada"
- ✅ NO avanza a Step 4
- ✅ Usuario puede intentar de nuevo

---

### Test 2.5: Error - Fondos Insuficientes (Step 3)

**Pasos**:

1. ✓ En Step 3, ingresa tarjeta con fondos insuficientes: `4000 0000 0000 9995`
2. ✓ Completa fecha y CVC
3. ✓ Haz clic en "Siguiente"

**Resultado Esperado**:

- ✅ Stripe rechaza con: "Fondos insuficientes"
- ✅ NO avanza a Step 4
- ✅ Permite reintentar

---

### Test 2.6: Error - Carrito Vacío

**Pasos**:

1. ✓ Vacía el carrito completamente
2. ✓ Intenta acceder a `/checkout`
3. ✓ Intenta pasar todos los steps

**Resultado Esperado**:

- ✅ Al llegar a Step 4, muestra error
- ✅ Al hacer clic en "Confirmar y Pagar", muestra:
  - "Tu carrito está vacío. Agrega productos antes de proceder."
- ✅ NO procesa pago

---

### Test 2.7: Error - Stock Agotado Durante Checkout

**Pasos**:

1. ✓ En carrito, agrega 1 unidad de producto con stock limitado
2. ✓ Abre otra pestaña y vende ese producto (reduce stock a 0)
3. ✓ Vuelve a pestaña de checkout
4. ✓ Continúa con los pasos hasta Step 4
5. ✓ Haz clic en "Confirmar y Pagar"

**Resultado Esperado**:

- ✅ API retorna error: "Uno de los productos ya no está disponible"
- ✅ Muestra alerta clara al usuario
- ✅ NO procesa pago
- ✅ Usuario puede actualizar carrito

---

## 📱 TEST SUITE 3: RESPONSIVE DESIGN

### Test 3.1: Desktop (Chrome, Firefox, Safari)

**Dispositivo**: Laptop/Desktop (1920x1080)

**Pasos**:

1. ✓ Ejecuta flujo completo en Chrome v120+
2. ✓ Ejecuta flujo completo en Firefox v121+
3. ✓ Ejecuta flujo completo en Safari v17+

**Resultado Esperado**:

- ✅ Todos los elementos visibles y alineados
- ✅ Botones clickeables en todos los navegadores
- ✅ Validaciones funcionan igual
- ✅ Sin errores en console

---

### Test 3.2: Tablet (iPad Air, Android Tablet)

**Dispositivo**: iPad Air (768x1024) o Android Tablet equivalente

**Pasos**:

1. ✓ Accede a checkout en tablet
2. ✓ Ejecuta flujo completo
3. ✓ Verifica que formulario es legible

**Resultado Esperado**:

- ✅ Campos de formulario tienen tamaño adecuado
- ✅ Botones son fáciles de presionar (no son muy pequeños)
- ✅ Sin scroll horizontal innecesario
- ✅ Layout se adapta al ancho de la pantalla

---

### Test 3.3: Mobile (iPhone 14, Samsung Galaxy S21)

**Dispositivo**: iPhone 14 (390x844) o Samsung Galaxy S21 (360x800)

**Pasos**:

1. ✓ Accede a checkout en mobile
2. ✓ Rellena Step 1
3. ✓ Verifica legibilidad de texto
4. ✓ Verifica que teclado virtual no oculta campos
5. ✓ Completa flujo completo

**Resultado Esperado**:

- ✅ Texto es legible (sin zoom)
- ✅ Campos de input son accesibles
- ✅ Botones son grandes (>44px altura)
- ✅ Validaciones funcionan en mobile
- ✅ Sin layout shift cuando aparece teclado

---

## 🔒 TEST SUITE 4: SEGURIDAD BÁSICA

### Test 4.1: CSRF Protection

**Pasos**:

1. ✓ Abre DevTools → Network tab
2. ✓ Completa checkout hasta Step 4
3. ✓ En Network tab, busca la request a `/api/checkout/session`
4. ✓ Verifica que incluye headers CSRF o session válida

**Resultado Esperado**:

- ✅ Request incluye validación CSRF
- ✅ Token es único por sesión
- ✅ No se puede reutilizar token antiguo

---

### Test 4.2: No Exposición de Datos Sensibles

**Pasos**:

1. ✓ Completa checkout
2. ✓ Abre DevTools → Console
3. ✓ Verifica que NO hay logs de:
   - [ ] Números de tarjeta
   - [ ] CVCs
   - [ ] Datos personales en texto plano
4. ✓ Network tab: Verifica que card data NO se envía a tu servidor
   - [ ] Stripe.js maneja directamente

**Resultado Esperado**:

- ✅ Console está limpia (sin logs sensibles)
- ✅ Tarjeta SOLO se envía a Stripe
- ✅ Tu servidor NO ve los datos de la tarjeta

---

### Test 4.3: Input Sanitization

**Pasos**:

1. ✓ En Step 1, intenta inyectar JavaScript en "Nombre":
   - Ingresa: `<script>alert('xss')</script>`
2. ✓ Completa resto del formulario
3. ✓ Avanza a Step 4
4. ✓ Verifica que en "Resumen" el nombre aparece escapado (no ejecuta script)

**Resultado Esperado**:

- ✅ Script NO se ejecuta
- ✅ Texto aparece literalmente: `<script>alert('xss')</script>`
- ✅ Sin errores en console

---

## 📊 TEST SUITE 5: PERFORMANCE

### Test 5.1: Tiempo de Carga Initial

**Pasos**:

1. ✓ Abre DevTools → Lighthouse
2. ✓ Accede a `/checkout`
3. ✓ Espera carga completa
4. ✓ Nota el "Time to Interactive"

**Resultado Esperado**:

- ✅ TTI < 3 segundos
- ✅ First Contentful Paint (FCP) < 1.5s
- ✅ Largest Contentful Paint (LCP) < 2.5s

---

### Test 5.2: Tiempo de Validación

**Pasos**:

1. ✓ En Step 1, empieza a escribir rápidamente en todos los campos
2. ✓ Mide tiempo hasta que aparecen/desaparecen errores

**Resultado Esperado**:

- ✅ Validación responde en < 500ms
- ✅ Sin lag notorio mientras escribes
- ✅ Errores aparecen/desaparecen suavemente

---

## 🧪 TEST SUITE 6: INTEGRACIÓN CON CARRITO

### Test 6.1: Datos de Carrito Persisten

**Pasos**:

1. ✓ Agrega 2 productos al carrito
2. ✓ Accede a checkout
3. ✓ Actualiza página (F5)
4. ✓ Verifica que Step 4 aún muestra los 2 productos

**Resultado Esperado**:

- ✅ Productos NO se pierden al recargar
- ✅ localStorage mantiene los datos del carrito
- ✅ Subtotal es correcto

---

### Test 6.2: Cantidad de Productos Actualizada

**Pasos**:

1. ✓ Agrega 2 unidades del Producto A
2. ✓ Accede a `/checkout`
3. ✓ En Step 4, verifica cantidad = 2
4. ✓ Vuelve atrás al carrito
5. ✓ Cambia cantidad a 5
6. ✓ Vuelve a checkout
7. ✓ Verifica cantidad = 5 en Step 4

**Resultado Esperado**:

- ✅ Cantidad se sincroniza correctamente
- ✅ Subtotal se recalcula automáticamente

---

## 🎯 CHECKLIST DE ACEPTACIÓN

Marca con ✓ cada test pasado:

```
FLUJO HAPPY PATH:
[ ] Test 1.1: Step 1 - Formulario completo
[ ] Test 1.2: Step 2 - Método de envío
[ ] Test 1.3: Step 3 - Tarjeta Stripe
[ ] Test 1.4: Step 4 - Revisión
[ ] Test 1.5: Confirmación y orden creada

FLUJOS DE ERROR:
[ ] Test 2.1: Formulario incompleto
[ ] Test 2.2: Email inválido
[ ] Test 2.3: Método de envío no seleccionado
[ ] Test 2.4: Tarjeta declinada
[ ] Test 2.5: Fondos insuficientes
[ ] Test 2.6: Carrito vacío
[ ] Test 2.7: Stock agotado

RESPONSIVE:
[ ] Test 3.1: Desktop (Chrome, Firefox, Safari)
[ ] Test 3.2: Tablet (iPad, Android)
[ ] Test 3.3: Mobile (iPhone, Samsung)

SEGURIDAD:
[ ] Test 4.1: CSRF protection
[ ] Test 4.2: No datos sensibles expuestos
[ ] Test 4.3: Input sanitization (XSS)

PERFORMANCE:
[ ] Test 5.1: TTI < 3s, FCP < 1.5s, LCP < 2.5s
[ ] Test 5.2: Validación < 500ms

INTEGRACIÓN:
[ ] Test 6.1: Datos de carrito persisten
[ ] Test 6.2: Cantidad actualizada correctamente
```

---

## 📝 REGISTRO DE RESULTADOS

### Defectos Encontrados:

| ID      | Descripción | Severidad | Estado |
| ------- | ----------- | --------- | ------ |
| BUG-001 |             |           |        |
| BUG-002 |             |           |        |

### Notas Adicionales:

```
[Espacio para notas de testing]
```

---

## ✅ SIGNOFF DE QA

**Probado por**: ******\_\_\_\_******
**Fecha**: ******\_\_\_\_******
**Resultado**: ☐ PASADO ☐ FALLIDO
**Bloqueadores Críticos**: ☐ Sí ☐ No

**Firma**: ******\_\_\_\_******

---

**Próximos pasos después de testing**:

1. Si PASADO → Proceder con Lighthouse Audit (Task 1.2)
2. Si FALLIDO → Documentar bugs y crear fixing tasks
