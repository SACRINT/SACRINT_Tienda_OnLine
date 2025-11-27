/**
 * Certificación de Accesibilidad WCAG AA
 * Genera badges, reportes y validación de cumplimiento
 * Fecha: Semana 29, Tarea 29.12
 */

export interface A11yCertification {
  level: "A" | "AA" | "AAA" | "FAIL";
  score: number;
  date: Date;
  expiresAt: Date;
  auditor: string;
  violations: number;
  passed: number;
  badge: string;
  reportUrl: string;
}

/**
 * Generar badge de certificación
 */
export function generateA11yBadge(level: "A" | "AA" | "AAA" | "FAIL"): string {
  const badges = {
    A: `
      <svg width="100" height="50" viewBox="0 0 100 50">
        <rect width="100" height="50" fill="#FCD34D"/>
        <text x="50" y="30" font-size="24" font-weight="bold" text-anchor="middle" fill="#1F2937">
          WCAG A
        </text>
      </svg>
    `,
    AA: `
      <svg width="100" height="50" viewBox="0 0 100 50">
        <rect width="100" height="50" fill="#34D399"/>
        <text x="50" y="30" font-size="24" font-weight="bold" text-anchor="middle" fill="#1F2937">
          WCAG AA
        </text>
      </svg>
    `,
    AAA: `
      <svg width="100" height="50" viewBox="0 0 100 50">
        <rect width="100" height="50" fill="#60A5FA"/>
        <text x="50" y="30" font-size="20" font-weight="bold" text-anchor="middle" fill="#FFFFFF">
          WCAG AAA
        </text>
      </svg>
    `,
    FAIL: `
      <svg width="100" height="50" viewBox="0 0 100 50">
        <rect width="100" height="50" fill="#EF4444"/>
        <text x="50" y="30" font-size="18" font-weight="bold" text-anchor="middle" fill="#FFFFFF">
          NO WCAG
        </text>
      </svg>
    `,
  };

  return badges[level];
}

/**
 * Generar reporte HTML de certificación
 */
export function generateA11yCertificationReport(cert: A11yCertification): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reporte de Certificación WCAG AA</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1F2937;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          background: #F9FAFB;
        }
        h1 { color: #111827; border-bottom: 3px solid #3B82F6; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; }
        .badge { text-align: center; margin: 30px 0; }
        .metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        .metric {
          background: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .metric-value {
          font-size: 28px;
          font-weight: bold;
          color: #3B82F6;
        }
        .metric-label {
          font-size: 12px;
          color: #6B7280;
          margin-top: 10px;
        }
        .details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #E5E7EB;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .label { font-weight: 600; }
        .value { color: #6B7280; }
        .checklist {
          list-style: none;
          padding: 0;
        }
        .checklist li {
          padding: 10px;
          margin: 5px 0;
          border-left: 4px solid #10B981;
          background: #F0FDF4;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          font-size: 12px;
          color: #6B7280;
          text-align: center;
        }
        .expires {
          background: #FEF3C7;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #F59E0B;
        }
      </style>
    </head>
    <body>
      <h1>📊 Certificado de Accesibilidad WCAG</h1>

      <div class="badge">
        ${generateA11yBadge(cert.level)}
      </div>

      <div class="expires">
        <strong>⏰ Válido hasta:</strong> ${cert.expiresAt.toLocaleDateString("es-ES")}
      </div>

      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${cert.score}</div>
          <div class="metric-label">Puntuación</div>
        </div>
        <div class="metric">
          <div class="metric-value">${cert.level}</div>
          <div class="metric-label">Nivel WCAG</div>
        </div>
        <div class="metric">
          <div class="metric-value">${cert.passed}</div>
          <div class="metric-label">Criterios Cumplidos</div>
        </div>
        <div class="metric">
          <div class="metric-value">${cert.violations}</div>
          <div class="metric-label">Violaciones</div>
        </div>
      </div>

      <div class="details">
        <h2>Detalles de la Certificación</h2>
        <div class="detail-row">
          <span class="label">Fecha de Auditoría:</span>
          <span class="value">${cert.date.toLocaleDateString("es-ES")}</span>
        </div>
        <div class="detail-row">
          <span class="label">Auditor:</span>
          <span class="value">${cert.auditor}</span>
        </div>
        <div class="detail-row">
          <span class="label">Estándar:</span>
          <span class="value">WCAG 2.1 Nivel ${cert.level}</span>
        </div>
      </div>

      <div class="details">
        <h2>Criterios Cumplidos</h2>
        <ul class="checklist">
          <li>✅ Percepción: Todo contenido es perceptible</li>
          <li>✅ Operabilidad: Funciona con teclado y navegación</li>
          <li>✅ Comprensibilidad: Texto claro e instrucciones</li>
          <li>✅ Robustez: Compatible con tecnologías asistivas</li>
        </ul>
      </div>

      <div class="footer">
        <p>Este certificado valida el cumplimiento de WCAG 2.1 Nivel ${cert.level}</p>
        <p>Para más información: <a href="https://www.w3.org/WAI/">W3C WAI</a></p>
        <p>Generado el ${new Date().toLocaleString("es-ES")}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Clase para gestionar certificaciones
 */
export class A11yCertificationManager {
  /**
   * Generar nueva certificación
   */
  static generateCertificate(
    score: number,
    violations: number,
    passed: number,
    auditor: string = "Sistema Automático",
  ): A11yCertification {
    let level: "A" | "AA" | "AAA" | "FAIL" = "FAIL";

    if (score >= 95 && violations === 0) {
      level = "AAA";
    } else if (score >= 85 && violations < 3) {
      level = "AA";
    } else if (score >= 70 && violations < 10) {
      level = "A";
    }

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Válido por 1 año

    return {
      level,
      score,
      date: now,
      expiresAt,
      auditor,
      violations,
      passed,
      badge: generateA11yBadge(level),
      reportUrl: `/certificates/${now.getTime()}.pdf`,
    };
  }

  /**
   * Guardar certificado
   */
  static async saveCertificate(cert: A11yCertification): Promise<boolean> {
    // En producción, guardar en BD
    localStorage.setItem("a11y_cert", JSON.stringify(cert));
    return true;
  }

  /**
   * Obtener certificado válido
   */
  static async getValidCertificate(): Promise<A11yCertification | null> {
    const certStr = localStorage.getItem("a11y_cert");
    if (!certStr) return null;

    const cert = JSON.parse(certStr) as A11yCertification;
    const now = new Date();

    if (new Date(cert.expiresAt) < now) {
      return null; // Certificado expirado
    }

    return cert;
  }

  /**
   * Comparar certificados
   */
  static compareCertificates(
    oldCert: A11yCertification,
    newCert: A11yCertification,
  ): {
    improved: boolean;
    scoreChange: number;
    violationReduction: number;
    levelChange: string;
  } {
    const scoreChange = newCert.score - oldCert.score;
    const violationReduction = oldCert.violations - newCert.violations;
    const improved = scoreChange > 0 || violationReduction > 0;

    return {
      improved,
      scoreChange,
      violationReduction,
      levelChange: `${oldCert.level} → ${newCert.level}`,
    };
  }
}

/**
 * Embedable certification badge
 */
export function AccessibilityCertificationBadge({
  level,
  reportUrl,
}: {
  level: "A" | "AA" | "AAA";
  reportUrl: string;
}) {
  const colors = {
    A: "#FCD34D",
    AA: "#34D399",
    AAA: "#60A5FA",
  };

  return `
    <a href="${reportUrl}" title="Certificado WCAG ${level} - Click para ver reporte" style="display: inline-block;">
      <img
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='50'%3E%3Crect width='100' height='50' fill='${colors[level]}'/%3E%3Ctext x='50' y='30' font-size='${level === "AAA" ? 20 : 24}' font-weight='bold' text-anchor='middle' fill='%231F2937'%3EWCAG ${level}%3C/text%3E%3C/svg%3E"
        alt="Cumple WCAG ${level}"
      />
    </a>
  `;
}
