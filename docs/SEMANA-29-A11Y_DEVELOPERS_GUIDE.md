# 📘 Guía de Accesibilidad (A11y) para Desarrolladores

## WCAG 2.1 Nivel AA

**Versión**: 1.0.0
**Fecha**: Semana 29
**Estado**: Oficial - Cumplimiento obligatorio

---

## 🎯 Objetivo

Garantizar que todos los usuarios, independientemente de sus capacidades, puedan:

- Navegar el sitio con teclado
- Leer contenido con lectores de pantalla
- Entender la información sin depender del color
- Acceder a audio/video con subtítulos
- Interactuar sin problemas de movimiento/parpadeo

---

## ✅ Checklist Rápido por Rol

### Para Diseñadores

- [ ] Contraste 4.5:1 (texto) o 3:1 (grande/UI)
- [ ] No solo color para información
- [ ] Iconos siempre con label
- [ ] Focus states visibles
- [ ] Espaciado mínimo 1.5 line-height

### Para Desarrolladores Frontend

- [ ] HTML semántico (nav, main, footer, etc)
- [ ] ARIA labels en elementos sin texto visible
- [ ] Orden de Tab lógico (no tabindex > 0)
- [ ] Alt text en imágenes
- [ ] Validación con mensajes de error en aria-describedby

### Para Desarrolladores Backend

- [ ] API devuelve alt text para imágenes
- [ ] Genera captions automáticos si es posible
- [ ] Logs de auditoría de cambios de A11y
- [ ] Rate limiting no bloquea usuarios asistivos

---

## 📋 Estructura HTML Correcta

### ✅ Encabezados

```html
<!-- ✅ Correcto: orden jerárquico H1 → H2 → H3 -->
<h1>Tienda Online</h1>
<section>
  <h2>Productos</h2>
  <article>
    <h3>Categoría: Electrónica</h3>
  </article>
</section>

<!-- ❌ Incorrecto: no saltear niveles -->
<h1>Tienda</h1>
<h3>Productos</h3>
<!-- Debería ser H2 -->
```

### ✅ Navegación

```html
<nav aria-label="Navegación principal">
  <ul>
    <li><a href="/" aria-current="page">Inicio</a></li>
    <li><a href="/productos">Productos</a></li>
  </ul>
</nav>
```

### ✅ Formularios

```html
<form>
  <div class="form-group">
    <label for="email">Email *</label>
    <input id="email" type="email" required aria-required="true" aria-describedby="email-help" />
    <p id="email-help" class="form-help">Usaremos esto para confirmación</p>
  </div>

  <button type="submit" aria-busy="false">Enviar</button>
</form>
```

### ✅ Imágenes

```html
<!-- Informativa -->
<img src="product.jpg" alt="Camiseta azul de algodón, talla M" />

<!-- Con caption -->
<figure>
  <img src="chart.png" alt="Gráfico de ventas Q1" />
  <figcaption>Ventas aumentaron 25% en Q1</figcaption>
</figure>

<!-- Decorativa -->
<img src="line.png" alt="" role="presentation" />
```

### ✅ Botones

```html
<!-- ✅ Correcto: texto visible -->
<button>Agregar al carrito</button>

<!-- ✅ Correcto: aria-label para iconos -->
<button aria-label="Cerrar diálogo">✕</button>

<!-- ❌ Incorrecto: vacío -->
<button>❌</button>

<!-- ❌ Incorrecto: solo título -->
<button title="Cerrar">X</button>
```

### ✅ Componentes Interactivos

```html
<!-- Menú desplegable -->
<button aria-haspopup="menu" aria-expanded="false" aria-controls="menu-items">Más opciones</button>
<ul id="menu-items" role="menu">
  <li role="menuitem"><a href="/perfil">Mi Perfil</a></li>
  <li role="menuitem"><a href="/salir">Salir</a></li>
</ul>

<!-- Modal/Diálogo -->
<dialog aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirmar acción</h2>
  <p>¿Estás seguro?</p>
  <button>Aceptar</button>
  <button>Cancelar</button>
</dialog>

<!-- Tabla -->
<table>
  <caption>
    Ventas mensuales
  </caption>
  <thead>
    <tr>
      <th scope="col">Mes</th>
      <th scope="col">Ventas</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Enero</th>
      <td>$10,000</td>
    </tr>
  </tbody>
</table>
```

---

## 🎨 ARIA Attributes - Guía Completa

### aria-label

Para elementos sin texto visible

```html
<button aria-label="Buscar productos">🔍</button>
```

### aria-labelledby

Referencia a otro elemento que lo describe

```html
<h2 id="cart-title">Carrito de compra</h2>
<div aria-labelledby="cart-title" role="region">
  <!-- contenido -->
</div>
```

### aria-describedby

Descripción adicional

```html
<input type="password" aria-describedby="pwd-hint" />
<p id="pwd-hint">Mínimo 8 caracteres, una mayúscula y un número</p>
```

### aria-invalid + aria-describedby

Para errores de formulario

```html
<input aria-invalid="true" aria-describedby="email-error" />
<p id="email-error" role="alert">❌ Email inválido</p>
```

### aria-required

Campo obligatorio

```html
<input required aria-required="true" />
```

### aria-disabled

Elemento deshabilitado

```html
<button aria-disabled="true">Procesando...</button>
```

### aria-expanded

Elemento expandible

```html
<button aria-expanded="false" aria-controls="details">Más detalles</button>
<div id="details" hidden>Información adicional</div>
```

### aria-hidden

Ocultar de lectores de pantalla (úsalo con cuidado)

```html
<!-- Ícono decorativo en un botón con label -->
<button aria-label="Guardar">💾 <span aria-hidden="true">Guardar</span></button>
```

### aria-live

Anuncios dinámicos

```html
<!-- polite: espera a pausas -->
<div aria-live="polite" aria-atomic="true">Guardado exitosamente</div>

<!-- assertive: interrumpe -->
<div aria-live="assertive" role="alert">❌ Error crítico</div>
```

### aria-current

Página/item actual

```html
<nav>
  <a href="/">Home</a>
  <a href="/products" aria-current="page">Productos</a>
</nav>
```

---

## ⌨️ Navegación por Teclado

### Skip Links (obligatorio)

```html
<!-- Al inicio del body -->
<a href="#main-content" class="skip-link"> Saltar a contenido principal </a>

<nav id="navigation">...</nav>
<main id="main-content">...</main>
<footer>...</footer>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: blue;
  color: white;
  padding: 8px;
  text-decoration: none;
}

.skip-link:focus {
  top: 0;
}
```

### Focus Visible (obligatorio)

```css
*:focus-visible {
  outline: 3px solid #4f46e5;
  outline-offset: 2px;
}
```

### Order de Tab

```html
<!-- ✅ Natural: Tab sigue orden del HTML -->
<button>1. Primero</button>
<button>2. Segundo</button>

<!-- ❌ Malo: tabindex > 0 confunde -->
<button tabindex="2">Segundo</button>
<button tabindex="1">Primero</button>

<!-- ✅ OK: -1 para excluir -->
<button tabindex="-1">No tabulable</button>
```

### Atajos de Teclado

```javascript
// Ctrl/Cmd + K para buscar
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    openSearch();
  }
});
```

---

## 🎨 Color y Contraste

### Ratios Requeridos (WCAG AA)

- **Texto normal**: 4.5:1
- **Texto grande** (18pt+ o 14pt bold+): 3:1
- **Componentes UI**: 3:1

### Verificar Contraste

```bash
# Online tools
- https://webaim.org/resources/contrastchecker/
- https://contrast-ratio.com/

# En código
const ratio = (lighter + 0.05) / (darker + 0.05);
if (ratio < 4.5) console.warn('Low contrast!');
```

### Colores Seguros

```typescript
// Usar paleta accesible
const COLORS = {
  text: "#1F2937", // Gris oscuro (16.5:1 sobre blanco)
  success: "#10B981", // Verde (4.8:1 sobre blanco)
  error: "#DC2626", // Rojo (5.3:1 sobre blanco)
};
```

---

## 📸 Imágenes y Alt Text

### Reglas Principales

```
INFORMATIVA:
❌ "Foto de producto"
✅ "Camiseta azul de algodón, talla M, $29.99"

DECORATIVA:
✅ alt="" (vacío)
✅ role="presentation"

CON TEXTO EMBEBIDO:
❌ alt="" (ignorar texto)
✅ alt="Anuncio: 50% OFF en todo" (incluir)

GRÁFICOS/TABLAS:
✅ alt="Gráfico: ventas crecieron 25%" + <table>
```

### Componente Seguro

```tsx
<AccessibleImage
  src="product.jpg"
  alt="Camiseta azul de algodón, talla M"
  caption="Nuevo arribo - Colección 2024"
/>
```

---

## 🔊 Lectores de Pantalla

### Estructura Semántica

```html
<header>
  <nav aria-label="Navegación principal">...</nav>
</header>

<main id="main-content">
  <h1>Título principal</h1>
  <section aria-labelledby="section-title">
    <h2 id="section-title">Subsección</h2>
    <article>...</article>
  </section>
</main>

<footer role="contentinfo">
  <p>© 2024 Tienda Online</p>
</footer>
```

### Anuncios Dinámicos (aria-live)

```jsx
const [message, setMessage] = useState("");

return (
  <>
    <div aria-live="polite" aria-atomic="true">
      {message}
    </div>
    <button onClick={() => setMessage("Producto agregado al carrito")}>Agregar</button>
  </>
);
```

---

## ✅ Testing de Accesibilidad

### Unit Tests

```bash
npm install --save-dev jest-axe

# Test cada componente
test('Button debe tener aria-label o texto', () => {
  const button = screen.getByRole('button');
  expect(
    button.textContent || button.getAttribute('aria-label')
  ).toBeTruthy();
});
```

### E2E Tests

```bash
npm run a11y:test

# Ejecuta:
# - axe-core
# - WCAG AA checker
# - Alt text validator
# - Contrast validator
```

### Auditoría Manual

```bash
# En navegador
1. Press Tab 5 veces → Focus debe ser visible
2. Press Ctrl/Cmd+K → Debe abrir búsqueda
3. Activar lector de pantalla
   - Windows: NVDA (gratuito)
   - Mac: VoiceOver (Cmd+F5)
4. Verificar encabezados: H → navega encabezados
```

---

## 🚀 Checklist Pre-Merge

Antes de mergear código:

- [ ] No hay botones vacíos
- [ ] Inputs tienen labels
- [ ] Sin traps de teclado (tabindex < 0)
- [ ] Alt text en imágenes
- [ ] Contraste >= 4.5:1
- [ ] Encabezados en orden
- [ ] Tests A11y pasan
- [ ] axe-core lint en CI/CD

---

## 📚 Recursos

- [WCAG 2.1 Oficial](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM: Articles](https://webaim.org/articles/)
- [MDN: ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [A11y Project](https://www.a11yproject.com/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

## 🔗 Links Útiles en el Proyecto

- Dashboard: `/admin/a11y`
- Componentes accesibles: `/src/components/a11y/`
- Librerías: `/src/lib/a11y/`
- Tests: `/__tests__/a11y/`

---

**Última actualización**: 22 de Noviembre, 2025
