/**
 * Componente de imagen accesible con alt text
 * Cumple WCAG AA
 * Fecha: Semana 29, Tarea 29.5
 */

import Image from 'next/image';
import { ImgHTMLAttributes } from 'react';

interface AccessibleImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt'> {
  src: string;
  alt: string; // Alt text es REQUERIDO
  title?: string;
  caption?: string;
  figureCaption?: string;
  hideFromScreenReader?: boolean;
}

/**
 * Imagen accesible con alt text requerido
 */
export function AccessibleImage({
  src,
  alt,
  title,
  caption,
  figureCaption,
  hideFromScreenReader = false,
  ...props
}: AccessibleImageProps) {
  // Alt text es obligatorio
  if (!alt) {
    console.warn(`AccessibleImage: Missing alt text for image ${src}`);
  }

  return (
    <figure>
      <img
        src={src}
        alt={alt}
        title={title}
        role={hideFromScreenReader ? 'presentation' : 'img'}
        aria-hidden={hideFromScreenReader}
        {...props}
      />
      {(caption || figureCaption) && (
        <figcaption>{caption || figureCaption}</figcaption>
      )}
    </figure>
  );
}

/**
 * Next.js Image component accesible
 */
export function AccessibleNextImage({
  src,
  alt,
  title,
  caption,
  figureCaption,
  hideFromScreenReader = false,
  ...props
}: AccessibleImageProps) {
  if (!alt) {
    console.warn(`AccessibleNextImage: Missing alt text for image ${src}`);
  }

  return (
    <figure>
      <Image
        src={src}
        alt={alt}
        title={title}
        role={hideFromScreenReader ? 'presentation' : 'img'}
        aria-hidden={hideFromScreenReader}
        {...(props as any)}
      />
      {(caption || figureCaption) && (
        <figcaption>{caption || figureCaption}</figcaption>
      )}
    </figure>
  );
}

/**
 * Guía para escribir alt text accesible
 */
export const ALT_TEXT_GUIDELINES = `
## Guía de Alt Text Accesible (WCAG AA)

### ✅ ALT TEXT DESCRIPTIVO (Imágenes informativas)
- Describe el CONTENIDO y PROPÓSITO de la imagen
- Debe ser conciso pero completo (máx 125 caracteres)
- Incluye texto importante que aparece en la imagen

**Ejemplos:**
- ❌ "Foto de producto"
- ✅ "Camiseta azul de algodón, talla M, precio $29.99"

### ✅ ALT TEXT PARA ICONOS
- Describe la acción o función que representa
- En botones, el alt text del ícono es redundante si el botón tiene label

**Ejemplos:**
- ❌ <img src="icon-close.png" alt="X">
- ✅ <button aria-label="Cerrar diálogo"><img src="icon-close.png" alt=""></button>

### ✅ ALT TEXT VACÍO PARA IMÁGENES DECORATIVAS
- Imágenes puramente decorativas deben tener alt=""
- Esto previene que lectores de pantalla las anuncien

**Ejemplos:**
- ✅ <img src="decorative-line.png" alt="">
- ✅ <img src="background-pattern.png" alt="" role="presentation">

### ✅ ALT TEXT PARA GRÁFICOS Y TABLAS
- Resume datos principales
- Proporciona texto alternativo si es complejo
- Usa <table> con <thead>, <tbody>, <th scope>

**Ejemplos:**
- ✅ "Gráfico de ventas 2024: crecimiento del 25% anual"

### ✅ ALT TEXT PARA FONDOS (CSS)
- Si es informativo, usa contenido alternativo
- Considera usar <canvas> o SVG para datos

### ❌ ERRORES COMUNES
- "Imagen" (demasiado genérico)
- "Foto de..." (la palabra "foto" es redundante)
- Repetir el caption (el caption es suficiente)
- Keyword stuffing (no abuses de palabras clave)
- Dejar vacío cuando debería ser descriptivo

### 🎯 CHECKLIST
✓ ¿Qué información transmite la imagen?
✓ ¿Sería comprensible sin ver la imagen?
✓ ¿Es decorativa o informativa?
✓ ¿Tiene texto que debe incluirse?
✓ ¿Necesita más contexto (caption)?
`;

/**
 * Validador de alt text en página
 */
export function validateImageAltText(): {
  valid: number;
  missing: Array<{
    src: string;
    element: string;
  }>;
} {
  const images = document.querySelectorAll('img');
  const missing: any[] = [];
  let valid = 0;

  images.forEach((img) => {
    const alt = img.getAttribute('alt');
    const isDecorative = img.getAttribute('role') === 'presentation' && alt === '';

    if (!alt && !isDecorative) {
      missing.push({
        src: img.src,
        element: img.outerHTML.substring(0, 100),
      });
    } else if (alt) {
      valid++;
    }
  });

  return { valid, missing };
}

/**
 * Hook para validar imágenes en página
 */
export function useImageAltValidation() {
  if (typeof window === 'undefined') return;

  const result = validateImageAltText();

  if (result.missing.length > 0) {
    console.warn(
      `[A11y] ${result.missing.length} imágenes sin alt text descriptivo:`,
      result.missing
    );
  }

  return result;
}
