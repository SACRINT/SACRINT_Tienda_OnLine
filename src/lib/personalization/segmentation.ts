// Customer Segmentation
// RFM analysis and behavioral segments

export interface CustomerMetrics {
  userId: string;
  recency: number; // Days since last purchase
  frequency: number; // Number of purchases
  monetary: number; // Total spent
  avgOrderValue: number;
  lastPurchaseDate: Date;
}

export type CustomerSegment =
  | "champions"
  | "loyal"
  | "potential_loyal"
  | "new"
  | "promising"
  | "need_attention"
  | "about_to_sleep"
  | "at_risk"
  | "cant_lose"
  | "hibernating"
  | "lost";

// Calculate RFM scores (1-5 scale)
export function calculateRFMScores(
  metrics: CustomerMetrics,
  maxRecency: number = 365,
  maxFrequency: number = 50,
  maxMonetary: number = 50000
): { r: number; f: number; m: number } {
  // Recency: lower is better
  const r = Math.max(1, Math.min(5, 6 - Math.ceil((metrics.recency / maxRecency) * 5)));
  
  // Frequency: higher is better
  const f = Math.max(1, Math.min(5, Math.ceil((metrics.frequency / maxFrequency) * 5)));
  
  // Monetary: higher is better
  const m = Math.max(1, Math.min(5, Math.ceil((metrics.monetary / maxMonetary) * 5)));

  return { r, f, m };
}

// Determine segment based on RFM scores
export function determineSegment(r: number, f: number, m: number): CustomerSegment {
  const score = r * 100 + f * 10 + m;

  if (r >= 4 && f >= 4 && m >= 4) return "champions";
  if (r >= 3 && f >= 3 && m >= 3) return "loyal";
  if (r >= 4 && f >= 2 && m >= 2) return "potential_loyal";
  if (r >= 4 && f <= 2) return "new";
  if (r >= 3 && f >= 1 && m >= 1) return "promising";
  if (r >= 2 && f >= 2) return "need_attention";
  if (r >= 2 && f <= 2) return "about_to_sleep";
  if (r <= 2 && f >= 3) return "at_risk";
  if (r <= 1 && f >= 4 && m >= 4) return "cant_lose";
  if (r <= 2 && f <= 2 && m >= 2) return "hibernating";
  return "lost";
}

// Segment descriptions
export const SEGMENT_DESCRIPTIONS: Record<CustomerSegment, { name: string; description: string; action: string }> = {
  champions: {
    name: "Campeones",
    description: "Compradores frecuentes, alto gasto, recientes",
    action: "Ofrecer programa VIP y productos exclusivos",
  },
  loyal: {
    name: "Leales",
    description: "Compran regularmente con buen gasto",
    action: "Recompensar con descuentos especiales",
  },
  potential_loyal: {
    name: "Potenciales Leales",
    description: "Compradores recientes con potencial",
    action: "Incentivar segunda compra con ofertas",
  },
  new: {
    name: "Nuevos",
    description: "Primera compra reciente",
    action: "Email de bienvenida y tutorial",
  },
  promising: {
    name: "Prometedores",
    description: "Compradores recientes pero poco frecuentes",
    action: "Crear conciencia de marca",
  },
  need_attention: {
    name: "Necesitan Atención",
    description: "Fueron leales pero disminuyeron actividad",
    action: "Ofertas personalizadas de reactivación",
  },
  about_to_sleep: {
    name: "A Punto de Dormir",
    description: "Baja actividad reciente",
    action: "Campañas de reenganche urgentes",
  },
  at_risk: {
    name: "En Riesgo",
    description: "Eran compradores frecuentes",
    action: "Enviar encuestas y ofertas especiales",
  },
  cant_lose: {
    name: "No Podemos Perder",
    description: "Antes eran campeones",
    action: "Contacto personal y ofertas exclusivas",
  },
  hibernating: {
    name: "Hibernando",
    description: "Sin actividad por mucho tiempo",
    action: "Ofertas de reactivación agresivas",
  },
  lost: {
    name: "Perdidos",
    description: "Sin actividad, bajo gasto histórico",
    action: "Intentar reactivar con grandes descuentos",
  },
};
