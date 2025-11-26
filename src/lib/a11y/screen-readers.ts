/**
 * Optimización para Lectores de Pantalla
 * NVDA, JAWS, VoiceOver, TalkBack
 * Fecha: Semana 29, Tarea 29.6
 */

/**
 * Utilidades para contenido oculto pero accesible
 */
export const SCREEN_READER_UTILITIES = {
  /**
   * CSS para ocultar visualmente pero mantener accesible
   */
  srOnly: `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `,

  /**
   * Aria-live para anuncios dinámicos
   */
  ariaLive: {
    polite: {
      'aria-live': 'polite',
      'aria-atomic': true,
    },
    assertive: {
      'aria-live': 'assertive',
      'aria-atomic': true,
    },
  },
};

/**
 * Anunciar contenido dinámico a lectores de pantalla
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  let container = document.getElementById('sr-announcer');

  if (!container) {
    container = document.createElement('div');
    container.id = 'sr-announcer';
    container.setAttribute('aria-live', priority);
    container.setAttribute('aria-atomic', 'true');
    container.className = 'sr-only';
    document.body.appendChild(container);
  }

  container.textContent = message;
  container.setAttribute('aria-live', priority);

  // Limpiar después de que se anuncie
  setTimeout(() => {
    container!.textContent = '';
  }, 1000);
}

/**
 * Optimización para menús y navegación
 */
export const SCREEN_READER_NAV = {
  /**
   * Estructura de navegación accesible
   */
  navExample: `
    <nav aria-label="Navegación principal">
      <ul>
        <li><a href="/" aria-current="page">Inicio</a></li>
        <li>
          <a href="/productos">Productos</a>
          <ul hidden aria-expanded="false">
            <li><a href="/productos/tecnologia">Tecnología</a></li>
            <li><a href="/productos/ropa">Ropa</a></li>
          </ul>
        </li>
      </ul>
    </nav>
  `,

  /**
   * Atributos para menús desplegables
   */
  dropdownAttrs: {
    button: {
      'aria-haspopup': 'menu',
      'aria-expanded': false,
    },
    menuOpen: {
      'aria-expanded': true,
    },
  },
};

/**
 * Actualizar estado aria-current para navegación
 */
export function updateAriaCurrentPage(currentPath: string) {
  document.querySelectorAll('[aria-current]').forEach((el) => {
    el.removeAttribute('aria-current');
  });

  const activeLink = document.querySelector(`a[href="${currentPath}"]`);
  if (activeLink) {
    activeLink.setAttribute('aria-current', 'page');
  }
}

/**
 * Descripción de errores para formularios
 */
export function describeFormError(fieldId: string, errorMessage: string) {
  let errorContainer = document.getElementById(`${fieldId}-error`);

  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.id = `${fieldId}-error`;
    errorContainer.className = 'error-message sr-only';
    errorContainer.setAttribute('role', 'alert');
    const field = document.getElementById(fieldId);
    field?.parentElement?.appendChild(errorContainer);
  }

  errorContainer.textContent = errorMessage;

  // Conectar al input con aria-describedby
  const field = document.getElementById(fieldId);
  if (field) {
    const current = field.getAttribute('aria-describedby') || '';
    const ids = current.split(' ').filter((id) => id !== errorContainer!.id);
    ids.push(errorContainer.id);
    field.setAttribute('aria-describedby', ids.join(' '));
    field.setAttribute('aria-invalid', 'true');
  }
}

/**
 * Describir cambios de estado con aria-live
 */
export function describeStateChange(message: string) {
  announceToScreenReader(message, 'assertive');
}

/**
 * Para tablas: describir encabezados
 */
export const TABLE_ACCESSIBILITY = {
  /**
   * Estructura correcta de tabla
   */
  structure: `
    <table>
      <caption>Datos de ventas mensuales</caption>
      <thead>
        <tr>
          <th scope="col">Mes</th>
          <th scope="col">Ventas</th>
          <th scope="col">Crecimiento</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Enero</th>
          <td>$10,000</td>
          <td>5%</td>
        </tr>
      </tbody>
    </table>
  `,

  /**
   * Scope para conectar celdas con encabezados
   */
  scopes: {
    column: 'scope="col"',
    row: 'scope="row"',
    colgroup: 'scope="colgroup"',
    rowgroup: 'scope="rowgroup"',
  },
};

/**
 * Validar accesibilidad de tabla
 */
export function validateTableAccessibility(table: HTMLTableElement) {
  const issues: string[] = [];

  // Verificar caption
  if (!table.querySelector('caption')) {
    issues.push('Tabla sin <caption>');
  }

  // Verificar encabezados con scope
  table.querySelectorAll('th').forEach((th) => {
    if (!th.getAttribute('scope')) {
      issues.push(`Encabezado sin scope: "${th.textContent}"`);
    }
  });

  // Verificar thead/tbody
  if (!table.querySelector('thead')) {
    issues.push('Tabla sin <thead>');
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Para listas: describir estructura
 */
export const LIST_ACCESSIBILITY = {
  /**
   * Lista no ordenada
   */
  unordered: `
    <ul>
      <li>Primer item</li>
      <li>Segundo item</li>
    </ul>
  `,

  /**
   * Lista ordenada
   */
  ordered: `
    <ol>
      <li>Primero</li>
      <li>Segundo</li>
    </ol>
  `,

  /**
   * Lista de descripción (términos y definiciones)
   */
  description: `
    <dl>
      <dt>Accesibilidad</dt>
      <dd>Capacidad de un sitio web para ser usado por todos</dd>
    </dl>
  `,
};

/**
 * Anuncios de página cargada
 */
export function announcePageLoaded(pageName: string) {
  announceToScreenReader(`${pageName} cargada`, 'polite');
}

/**
 * Anunciar transiciones de página
 */
export function announcePageTransition(fromPage: string, toPage: string) {
  announceToScreenReader(`Navegando desde ${fromPage} a ${toPage}`, 'polite');
}
