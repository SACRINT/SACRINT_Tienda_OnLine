/**
 * StructuredData Component
 * Semanas 31-32: SEO Avanzado
 *
 * Componente para insertar JSON-LD structured data en páginas Next.js
 * Soporta múltiples schemas y validación automática
 *
 * @example
 * // Uso básico
 * <StructuredData schema={productSchema} />
 *
 * // Múltiples schemas
 * <StructuredData schemas={[organizationSchema, websiteSchema]} />
 */

import { toJSONLD, combineSchemas } from "@/lib/seo/structured-data";

interface StructuredDataProps {
  schema?: object;
  schemas?: object[];
  validate?: boolean;
}

/**
 * Component to inject JSON-LD structured data into the page head
 * Uses dangerouslySetInnerHTML which is safe for JSON-LD from trusted sources
 */
export function StructuredData({ schema, schemas, validate = false }: StructuredDataProps) {
  // Determine which schema(s) to use
  let finalSchema: object;

  if (schemas && schemas.length > 0) {
    finalSchema = combineSchemas(schemas);
  } else if (schema) {
    finalSchema = schema;
  } else {
    // No schema provided
    if (process.env.NODE_ENV === 'development') {
      console.warn('StructuredData component: No schema or schemas provided');
    }
    return null;
  }

  // Optional validation in development
  if (validate && process.env.NODE_ENV === 'development') {
    try {
      JSON.parse(toJSONLD(finalSchema));
    } catch (error) {
      console.error('StructuredData validation error:', error);
      return null;
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJSONLD(finalSchema) }}
    />
  );
}

/**
 * Hook para usar structured data en componentes
 * Útil cuando necesitas el JSON-LD como string
 */
export function useStructuredData(schema: object): string {
  return toJSONLD(schema);
}

export default StructuredData;
