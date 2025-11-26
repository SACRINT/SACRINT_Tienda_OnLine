/**
 * Navegación por teclado - Skip links, Tab traps, Focus visible
 * Cumple WCAG AA
 * Fecha: Semana 29, Tarea 29.3
 */

/**
 * Configurar navegación con teclado
 * - Skip to main content (Ctrl+K)
 * - Tab traps en modales
 * - Focus visible en elementos interactivos
 */
export function setupKeyboardNavigation() {
  if (typeof document === 'undefined') return;

  // Skip to main content con Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // Tab trap dentro de modales
  const modals = document.querySelectorAll('[role="dialog"]');
  modals.forEach((modal) => {
    setupTabTrap(modal as HTMLElement);
  });
}

/**
 * Implementar tab trap dentro de un elemento
 * Previene que el focus salga del modal
 */
function setupTabTrap(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  element.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  });
}

/**
 * Estilos CSS para focus visible
 */
export const focusStyles = `
  /* Focus visible para navegación por teclado */
  *:focus-visible {
    outline: 3px solid #4F46E5;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  }

  /* Para navegadores que soportan :focus-visible */
  button:focus-visible,
  a:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 3px solid #4F46E5;
    outline-offset: 2px;
  }

  /* Remover outline predeterminado en navegadores antiguos */
  button:focus,
  a:focus,
  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
  }
`;

/**
 * Hook para manejar navegación con teclado en componentes React
 */
export function useKeyboardNavigation(
  onEscape?: () => void,
  onEnter?: () => void
) {
  return {
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
      if (e.key === 'Enter' && onEnter) {
        onEnter();
      }
    },
  };
}

/**
 * Componente para Skip Links
 */
export function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        Saltar a contenido principal
      </a>
      <a href="#navigation" className="skip-link">
        Saltar a navegación
      </a>
      <a href="#footer" className="skip-link">
        Saltar a pie de página
      </a>
    </div>
  );
}

/**
 * CSS para skip links ocultos (visibles solo con focus)
 */
export const skipLinksStyles = `
  .skip-links {
    position: relative;
    z-index: 9999;
  }

  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #4F46E5;
    color: white;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
    border-radius: 4px;
  }

  .skip-link:focus {
    top: 0;
  }
`;

/**
 * Detectar navegación por teclado vs mouse
 */
export function useKeyboardOnly() {
  if (typeof document === 'undefined') return;

  let lastInteractionWasKeyboard = false;

  document.addEventListener('keydown', () => {
    lastInteractionWasKeyboard = true;
    document.documentElement.classList.add('keyboard-nav');
  });

  document.addEventListener('mousedown', () => {
    lastInteractionWasKeyboard = false;
    document.documentElement.classList.remove('keyboard-nav');
  });

  return () => lastInteractionWasKeyboard;
}

/**
 * Mantener registro de focus para debugging
 */
export function enableFocusLogging() {
  if (typeof document === 'undefined') return;

  document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement;
    console.log('[Focus]', target.tagName, target.id, target.className);
  });
}
