# QA Ejecución - Suite 2: Error Scenarios

## Semana 8 - Validación de Manejo de Errores en Checkout

**Fecha:** 25 de Noviembre, 2025
**Responsable:** QA Team
**Suite:** Error Handling & Edge Cases
**Estado:** ✅ **DOCUMENTADO - LISTO PARA EJECUCIÓN**

---

## 📋 Resumen de Test Cases

Esta suite valida que el sistema maneja gracefully todos los casos de error posibles durante el flujo de checkout.

### Total de Test Cases: 8

- 4 cases de validación de formulario
- 2 cases de error de pago
- 1 case de stock insuficiente
- 1 case de timeout

---

## 🔴 Test Case: TC2.1 - Campo Vacío en Formulario (Step 1)

### Descripción

Validar que el formulario rechaza envío con campos requeridos vacíos.

### Precondiciones

- Usuario autenticado
- En página de checkout
- Carrito con items

### Steps

1. Navegar a `/checkout`
2. Dejar todos los campos en blanco
3. Click en botón "Siguiente"

### Expected Result

- [ ] Formulario no se envía
- [ ] Mensaje de error aparece debajo de cada campo requerido
- [ ] Error messages en español:
  - "Nombre es requerido"
  - "Email es requerido"
  - "Teléfono es requerido"
  - "Dirección es requerida"
  - "Ciudad es requerida"
  - "Estado es requerido"
  - "Código postal es requerido"
- [ ] Campos con error tienen borde rojo
- [ ] Foco regresa a primer campo vacío

### Severity

🔴 **Critical** (bloquea checkout)

### Actual Result

- [ ] **PASADO** / [ ] **FALLIDO** / [ ] **BLOQUEADO**

### Notas

```
Evidencia:
- Código: src/app/(store)/checkout/page.tsx:129-171
- Schema validación: CreateAddressSchema
- Mode: onChange (validación en tiempo real)
```

---

## 🔴 Test Case: TC2.2 - Email Inválido (Step 1)

### Descripción

Validar que emails inválidos son rechazados.

### Precondiciones

- En formulario de dirección (Step 1)
- Otros campos llenos correctamente

### Steps

1. Llenar nombre, teléfono, dirección, ciudad, estado, postal
2. En campo Email, ingresar uno de estos valores:
   - `usuario@` (sin dominio)
   - `@example.com` (sin usuario)
   - `usuario.example.com` (sin @)
   - `usuario@.com` (sin dominio intermedio)
3. Click fuera del campo (blur)

### Expected Result

- [ ] Campo Email muestra borde rojo
- [ ] Mensaje de error: "Email inválido"
- [ ] Botón "Siguiente" deshabilitado o no funciona
- [ ] Validación usando RFC 5322

### Severity

🔴 **Critical** (impide checkout)

### Actual Result

- [ ] **PASADO** / [ ] **FALLIDO** / [ ] **BLOQUEADO**

### Test Data

```
✗ Inválidos:
  - usuario@
  - @example.com
  - usuario.example.com
  - usuario@.com
  - user.name@.com
  - user@domain..com

✓ Válidos:
  - user@example.com
  - user.name@example.co.uk
  - user+tag@example.com
```

---

## 🔴 Test Case: TC2.3 - Teléfono con Formato Incorrecto (Step 1)

### Descripción

Validar que teléfonos con menos de 10 dígitos son rechazados.

### Precondiciones

- En formulario de dirección
- Otros campos completos

### Steps

1. Llenar todos los campos excepto teléfono
2. En campo Teléfono, ingresar:
   - `555` (solo 3 dígitos)
   - `55 1234` (6 dígitos)
3. Click fuera del campo

### Expected Result

- [ ] Campo Teléfono muestra borde rojo
- [ ] Mensaje: "Teléfono debe tener al menos 10 dígitos"
- [ ] Botón "Siguiente" deshabilitado
- [ ] Validación: min 10 caracteres

### Severity

🟡 **High** (impide checkout)

### Actual Result

- [ ] **PASADO** / [ ] **FALLIDO** / [ ] **BLOQUEADO**

### Test Data

```
Formato México válido: +52 55 1234 5678 (14 caracteres)
Formato México válido: (55) 1234-5678 (14 caracteres incluyendo símbolos)
Formato válido: 5512345678 (10 dígitos)
Formato inválido: 555 (3 dígitos)
```

---

## 🔴 Test Case: TC2.4 - Dirección Menor a 5 Caracteres (Step 1)

### Descripción

Validar que direcciones muy cortas son rechazadas.

### Precondiciones

- En formulario de dirección
- Otros campos completos

### Steps

1. En campo "Calle y Número", ingresar:
   - `Ave 1` (5 caracteres - límite mínimo)
   - `Av 1` (4 caracteres - menor al límite)
2. Click fuera del campo

### Expected Result

- [ ] Con "Ave 1" (5 chars): Válido, sin error
- [ ] Con "Av 1" (4 chars): Error, borde rojo
- [ ] Mensaje: "Dirección debe tener al menos 5 caracteres"
- [ ] Botón "Siguiente" deshabilitado en caso inválido

### Severity

🟡 **High**

### Actual Result

- [ ] **PASADO** / [ ] **FALLIDO** / [ ] **BLOQUEADO**

---

## 🔴 Test Case: TC2.5 - Tarjeta Rechazada (Step 3)

### Descripción

Validar que tarjetas rechazadas por Stripe muestran error apropiado.

### Precondiciones

- Completó Steps 1 y 2 correctamente
- En Step 3 (Método de Pago)

### Steps

1. En CardElement de Stripe, ingresar:
   - Número: `4000 0000 0000 0002` (card_declined)
   - Fecha: `12/26`
   - CVC: `123`
2. Click "Siguiente"

### Expected Result

- [ ] Stripe rechaza la tarjeta
- [ ] Se muestra Alert error en rojo
- [ ] Mensaje: "La tarjeta fue rechazada. Por favor intenta con otra tarjeta."
- [ ] Botón "Siguiente" sigue disponible para reintentar
- [ ] Usuario no avanza a Step 4

### Severity

🟡 **High** (esperado en caso de tarjeta rechazada)

### Actual Result

- [ ] **PASADO** / [ ] **FALLIDO** / [ ] **BLOQUEADO**

### Stripe Test Cards

```
card_declined:           4000 0000 0000 0002
insufficient_funds:      (usa card_declined code)
expired_card:            4000 0000 0000 0069
incorrect_cvc:           4000 0000 0000 0127
```

---

## 🔴 Test Case: TC2.6 - Tarjeta Expirada (Step 3)

### Descripción

Validar que tarjetas expiradas muestran error específico.

### Precondiciones

- En Step 3 (Método de Pago)

### Steps

1. Ingresar tarjeta expirada:
   - Número: `4000 0000 0000 0069`
   - Fecha: `01/20` (pasada)
   - CVC: `123`
2. Click "Siguiente"

### Expected Result

- [ ] Stripe rechaza la tarjeta
- [ ] Alert muestra error rojo
- [ ] Mensaje: "Tu tarjeta ha expirado. Por favor usa una tarjeta válida."
- [ ] Usuario permanece en Step 3

### Severity

🟡 **High**

### Actual Result

- [ ] **PASADO** / [ ] **FALLIDO** / [ ] **BLOQUEADO**

---

## 🔴 Test Case: TC2.7 - Producto sin Stock (Step 4)

### Descripción

Validar que sistema detecta si producto se agota durante checkout.

### Precondiciones

- Completó Steps 1-3
- En Step 4 (Resumen)
- Producto en carrito tiene stock limitado

### Steps

1. Completar Steps 1-3 normalmente
2. Mientras está en Step 4, otra sesión compra el último item
3. Click "Confirmar y Pagar"

### Expected Result

- [ ] Sistema detecta stock insuficiente
- [ ] Se muestra error antes de cargar Stripe
- [ ] Mensaje: "Uno de los productos ya no está disponible. Por favor actualiza tu carrito."
- [ ] Usuario es redirigido a `/cart` o se muestra modal
- [ ] Carrito se actualiza automáticamente

### Severity

🔴 **Critical** (protege integridad de pedidos)

### Actual Result

- [ ] **PASADO** / [ ] **FALLIDO** / [ ] **BLOQUEADO**

### Notas

```
Código: src/app/(store)/checkout/page.tsx:600-620
Validación de stock antes de stripe.confirmPayment()
```

---

## 🔴 Test Case: TC2.8 - Timeout de Respuesta de Servidor (Step 4)

### Descripción

Validar comportamiento cuando servidor no responde en tiempo.

### Precondiciones

- Completó Steps 1-3
- Servidor disponible

### Steps

1. Completar Steps 1-3
2. Simular lentitud de red (DevTools → Network → Slow 4G)
3. Click "Confirmar y Pagar"
4. Esperar 30 segundos

### Expected Result

- [ ] Se muestra loader/spinner
- [ ] Si timeout (>30s): Mostrar error graceful
- [ ] Mensaje: "Hubo un error procesando el pago. Por favor intenta de nuevo."
- [ ] Botón "Reintentar" disponible
- [ ] Carrito NO se limpia (aún tiene datos)

### Severity

🟡 **High** (UX importante)

### Actual Result

- [ ] **PASADO** / [ ] **FALLIDO** / [ ] **BLOQUEADO**

### Network Throttling

```
Chrome DevTools:
1. F12 → Network
2. Throttling: "Slow 4G"
3. CPU: 4x slowdown
```

---

## 📊 Resumen de Ejecución

| TC    | Caso              | Severity    | Estado |
| ----- | ----------------- | ----------- | ------ |
| TC2.1 | Campo Vacío       | 🔴 Critical | [ ]    |
| TC2.2 | Email Inválido    | 🔴 Critical | [ ]    |
| TC2.3 | Teléfono Inválido | 🟡 High     | [ ]    |
| TC2.4 | Dirección Corta   | 🟡 High     | [ ]    |
| TC2.5 | Tarjeta Rechazada | 🟡 High     | [ ]    |
| TC2.6 | Tarjeta Expirada  | 🟡 High     | [ ]    |
| TC2.7 | Sin Stock         | 🔴 Critical | [ ]    |
| TC2.8 | Timeout Servidor  | 🟡 High     | [ ]    |

### Defectos Encontrados

```
DEFECTO #[#]
Título: [Descripción]
Severidad: Critical|High|Medium|Low
Pasos para reproducir:
1. ...
Resultado Esperado:
Resultado Actual:
Screenshots: [adjuntar]
```

---

## ✅ Criterios de Aceptación

Para que Suite 2 sea considerada **PASADA**:

- [ ] 6/8 tests pasados (75%)
- [ ] 0 Critical defectos abiertos
- [ ] High defectos documentados con plan de fix
- [ ] Error messages en español verificados
- [ ] Todos los campos Actual Result llenados

---

## 🔗 Referencias

- Checkout Implementation: `src/app/(store)/checkout/page.tsx`
- Validation Schemas: `src/lib/security/schemas/order-schemas.ts`
- Error Handling: Líneas 33-46, 600-620
- Stripe Docs: https://stripe.com/docs/payments/stripe-elements

---

**Documento:** QA-EJECUCION-SUITE-ERROR-SCENARIOS-SEMANA-8.md
**Versión:** 1.0
**Generado:** 25 Nov 2025
