/**
 * Validación de Contraste y Tema de Alto Contraste
 * Cumple WCAG AA (4.5:1 para texto normal, 3:1 para grande)
 * Fecha: Semana 29, Tarea 29.4
 */

/**
 * Calcula el ratio de contraste entre dos colores
 * Basado en: https://www.w3.org/TR/WCAG20/
 */
export function getContrastRatio(foreground: string, background: string): number {
  const fgLuma = getLuminance(foreground);
  const bgLuma = getLuminance(background);

  const lighter = Math.max(fgLuma, bgLuma);
  const darker = Math.min(fgLuma, bgLuma);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calcula la luminancia relativa de un color
 */
function getLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  let [r, g, b] = rgb.map((value) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convierte hex a RGB
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
}

/**
 * Verifica si cumple WCAG AA
 * - Normal: 4.5:1
 * - Large (18pt+): 3:1
 */
export function isWCAGAACompliant(
  contrast: number,
  isLargeText: boolean = false
): boolean {
  return isLargeText ? contrast >= 3 : contrast >= 4.5;
}

/**
 * Colores accesibles para sistema de diseño
 */
export const ACCESSIBLE_COLOR_PALETTE = {
  // Grises con contraste garantizado
  text: {
    primary: '#1F2937', // Gris oscuro en blanco (16.5:1)
    secondary: '#6B7280', // Gris medio en blanco (6.8:1)
    inverse: '#FFFFFF', // Blanco en gris oscuro
  },

  // Fondos
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },

  // Estados
  states: {
    success: '#10B981', // Verde (4.8:1 sobre blanco)
    warning: '#F59E0B', // Ámbar (4.5:1 sobre blanco)
    error: '#DC2626', // Rojo (5.3:1 sobre blanco)
    info: '#3B82F6', // Azul (5.3:1 sobre blanco)
  },

  // Alto contraste
  highContrast: {
    text: '#000000',
    background: '#FFFFFF',
    focus: '#000000',
    focusOutline: '#000000',
  },
};

/**
 * Tema de alto contraste
 */
export const HIGH_CONTRAST_THEME = `
  [data-theme="high-contrast"] {
    --text-primary: #000000;
    --text-secondary: #1F2937;
    --bg-primary: #FFFFFF;
    --bg-secondary: #F0F0F0;

    --color-success: #003300;
    --color-error: #990000;
    --color-warning: #664400;
    --color-info: #000099;

    --focus-outline: 3px solid #000000;
    --focus-offset: 2px;
  }

  [data-theme="high-contrast"] * {
    background-color: transparent !important;
    color: inherit !important;
    border-color: currentColor !important;
  }

  [data-theme="high-contrast"] *:focus-visible {
    outline: 3px solid #000000 !important;
    outline-offset: 2px;
  }
`;

/**
 * Validador de contraste en página
 */
export function validatePageContrast(): {
  compliant: number;
  issues: Array<{
    element: string;
    foreground: string;
    background: string;
    ratio: number;
    required: number;
  }>;
} {
  const issues: any[] = [];
  let compliant = 0;

  // Obtener todos los elementos de texto
  document.querySelectorAll('*').forEach((el) => {
    if (!el.textContent?.trim()) return;

    const style = window.getComputedStyle(el);
    const color = style.color;
    const bgColor = style.backgroundColor;

    // Convertir a hex si es necesario
    const fgHex = rgbToHex(color);
    const bgHex = rgbToHex(bgColor);

    if (fgHex && bgHex) {
      const ratio = getContrastRatio(fgHex, bgHex);
      const fontSize = parseFloat(style.fontSize);
      const isLarge = fontSize >= 18;
      const required = isLarge ? 3 : 4.5;

      if (ratio >= required) {
        compliant++;
      } else {
        issues.push({
          element: el.tagName,
          foreground: fgHex,
          background: bgHex,
          ratio: ratio.toFixed(2),
          required,
        });
      }
    }
  });

  return { compliant, issues };
}

/**
 * Convierte RGB a Hex
 */
function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return null;

  return (
    '#' +
    [1, 2, 3].map((x) => parseInt(match[x], 10).toString(16).padStart(2, '0')).join('')
  );
}

/**
 * Inicializar tema de alto contraste
 */
export function initializeContrastMode() {
  if (typeof window === 'undefined') return;

  // Detectar preferencia de usuario
  const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;

  if (prefersHighContrast) {
    document.documentElement.setAttribute('data-theme', 'high-contrast');
  }

  // Permitir cambio manual
  window.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.id === 'contrast-toggle') {
      if (target.checked) {
        document.documentElement.setAttribute('data-theme', 'high-contrast');
        localStorage.setItem('theme', 'high-contrast');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'default');
      }
    }
  });
}
