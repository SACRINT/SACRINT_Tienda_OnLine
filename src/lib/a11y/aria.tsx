/**
 * ARIA Attributes y Semantic HTML Helper
 * Proporciona utilidades para accesibilidad
 * Fecha: Semana 29
 */

export type AriaLiveRegion = "polite" | "assertive" | "off";
export type AriaRole =
  | "button"
  | "navigation"
  | "region"
  | "complementary"
  | "contentinfo"
  | "form"
  | "main"
  | "search"
  | "alert"
  | "dialog"
  | "progressbar"
  | "tab"
  | "tablist"
  | "tabpanel";

/**
 * Propiedades comunes ARIA
 */
export const ARIA_ATTRIBUTES = {
  /**
   * Describe el propósito de un elemento
   */
  label: (text: string) => ({
    "aria-label": text,
  }),

  /**
   * Describe el elemento en más detalle
   */
  describedBy: (id: string) => ({
    "aria-describedby": id,
  }),

  /**
   * Marca elementos requeridos
   */
  required: () => ({
    "aria-required": true,
  }),

  /**
   * Estado de error en formularios
   */
  invalid: (isInvalid: boolean) => ({
    "aria-invalid": isInvalid,
  }),

  /**
   * Indica elemento deshabilitado
   */
  disabled: () => ({
    "aria-disabled": true,
  }),

  /**
   * Para elementos expandibles
   */
  expanded: (isExpanded: boolean) => ({
    "aria-expanded": isExpanded,
  }),

  /**
   * Para elementos ocultos
   */
  hidden: (isHidden: boolean) => ({
    "aria-hidden": isHidden,
  }),

  /**
   * Indica elemento seleccionado
   */
  selected: (isSelected: boolean) => ({
    "aria-selected": isSelected,
  }),

  /**
   * Controla visibilidad en screen readers
   */
  live: (region: AriaLiveRegion) => ({
    "aria-live": region,
    "aria-atomic": true,
  }),

  /**
   * Indica carga en progreso
   */
  busy: () => ({
    "aria-busy": true,
  }),

  /**
   * Label para grupos de campos
   */
  labelledBy: (id: string) => ({
    "aria-labelledby": id,
  }),

  /**
   * Para tablas: indica si hay header
   */
  rowHeader: () => ({
    role: "rowheader",
  }),

  /**
   * Indica número de ítems en lista
   */
  setSize: (size: number) => ({
    "aria-setsize": size,
  }),

  /**
   * Indica posición en lista
   */
  posinSet: (position: number) => ({
    "aria-posinset": position,
  }),
};

/**
 * Semantic HTML helpers
 */
export const SEMANTIC_HTML = {
  /**
   * Encabezados con nivel correcto
   */
  heading: (level: 1 | 2 | 3 | 4 | 5 | 6, text: string) => {
    const tag = `h${level}`;
    return { tag, text };
  },

  /**
   * Botón semánticamente correcto
   */
  button: (text: string, options?: { primary?: boolean; disabled?: boolean }) => ({
    tag: "button",
    text,
    disabled: options?.disabled,
    className: options?.primary ? "btn-primary" : "btn-secondary",
  }),

  /**
   * Link semánticamente correcto
   */
  link: (text: string, href: string, options?: { external?: boolean }) => ({
    tag: "a",
    href,
    text,
    rel: options?.external ? "noopener noreferrer" : undefined,
    target: options?.external ? "_blank" : undefined,
  }),

  /**
   * Grupo de formulario
   */
  formGroup: (label: string, inputId: string, required?: boolean) => ({
    structure: {
      label: {
        htmlFor: inputId,
        text: label,
      },
      input: {
        id: inputId,
        required,
        "aria-required": required,
      },
    },
  }),

  /**
   * Navegación principal
   */
  nav: (label?: string) => ({
    tag: "nav",
    "aria-label": label || "Navegación principal",
  }),

  /**
   * Región principal
   */
  main: () => ({
    tag: "main",
    role: "main",
  }),

  /**
   * Pie de página
   */
  footer: () => ({
    tag: "footer",
    role: "contentinfo",
  }),

  /**
   * Tabla semánticamente correcta
   */
  table: {
    structure: {
      thead: "Encabezados de tabla",
      tbody: "Cuerpo de tabla",
      tfoot: "Pie de tabla",
      th: 'Celda de encabezado (scope="row" o "col")',
      td: "Celda de datos",
    },
  },
};

/**
 * Genera estructura de formulario accesible
 */
export function createAccessibleForm(
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required?: boolean;
    error?: string;
    help?: string;
  }>,
) {
  return fields.map((field) => ({
    id: field.name,
    label: {
      htmlFor: field.name,
      text: field.label,
      children: field.required && <span aria-label="required">*</span>,
    },
    input: {
      id: field.name,
      name: field.name,
      type: field.type,
      required: field.required,
      "aria-required": field.required,
      "aria-invalid": !!field.error,
      "aria-describedby": field.error
        ? `${field.name}-error`
        : field.help
          ? `${field.name}-help`
          : undefined,
    },
    helpText: field.help && {
      id: `${field.name}-help`,
      text: field.help,
      className: "form-help",
    },
    errorText: field.error && {
      id: `${field.name}-error`,
      text: field.error,
      role: "alert",
      className: "form-error",
    },
  }));
}

/**
 * Valida ARIA attributes en HTML
 */
export function validateAriaAttributes(htmlElement: HTMLElement): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Verificar que aria-labels no sean vacíos
  const ariaLabel = htmlElement.getAttribute("aria-label");
  if (ariaLabel === "") {
    errors.push("aria-label no puede estar vacío");
  }

  // Verificar que elementos interactivos tengan nombres accesibles
  const role = htmlElement.getAttribute("role");
  if (role === "button" && !ariaLabel && !htmlElement.textContent?.trim()) {
    errors.push("Botones deben tener aria-label o texto visible");
  }

  // Verificar aria-describedby referencia a elemento existente
  const describedBy = htmlElement.getAttribute("aria-describedby");
  if (describedBy && !document.getElementById(describedBy)) {
    errors.push(`aria-describedby referencia ID inexistente: ${describedBy}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
