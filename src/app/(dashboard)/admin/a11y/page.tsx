/**
 * Dashboard de Accesibilidad (A11y)
 * Monitorea cumplimiento WCAG AA
 * Fecha: Semana 29, Tarea 29.8
 */

'use client';

import { useState, useEffect } from 'react';

interface AccessibilityMetrics {
  wcagScore: number;
  level: 'A' | 'AA' | 'AAA' | 'FAIL';
  violations: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  compliantPages: number;
  totalPages: number;
  lastAudit: Date;
}

export default function AccessibilityDashboard() {
  const [metrics, setMetrics] = useState<AccessibilityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar métricas de accesibilidad
    fetchAccessibilityMetrics();
  }, []);

  async function fetchAccessibilityMetrics() {
    try {
      // En producción, esto vendría del servidor
      const mockMetrics: AccessibilityMetrics = {
        wcagScore: 92,
        level: 'AA',
        violations: {
          critical: 0,
          serious: 2,
          moderate: 5,
          minor: 12,
        },
        compliantPages: 18,
        totalPages: 20,
        lastAudit: new Date(),
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching accessibility metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div aria-busy="true">Cargando métricas de accesibilidad...</div>;
  }

  if (!metrics) {
    return <div role="alert">Error cargando métricas</div>;
  }

  const getWCAGColor = (level: string) => {
    switch (level) {
      case 'AAA':
        return 'text-green-600';
      case 'AA':
        return 'text-blue-600';
      case 'A':
        return 'text-yellow-600';
      default:
        return 'text-red-600';
    }
  };

  return (
    <main id="main-content" className="space-y-8">
      <div>
        <h1>📊 Dashboard de Accesibilidad (WCAG AA)</h1>
        <p>Última auditoría: {metrics.lastAudit.toLocaleDateString()}</p>
      </div>

      {/* Tarjeta Principal - WCAG Score */}
      <section aria-labelledby="wcag-score-heading">
        <h2 id="wcag-score-heading" className="sr-only">
          Puntuación WCAG
        </h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Puntuación WCAG</p>
              <p className={`text-4xl font-bold ${getWCAGColor(metrics.level)}`}>
                {metrics.wcagScore}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Nivel</p>
              <p className={`text-4xl font-bold ${getWCAGColor(metrics.level)}`}>
                {metrics.level}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Métricas */}
      <section aria-labelledby="violations-heading" className="grid grid-cols-4 gap-4">
        <h2 id="violations-heading" className="sr-only">
          Violaciones por Severidad
        </h2>

        <MetricCard
          label="Violaciones Críticas"
          value={metrics.violations.critical}
          severity="critical"
          ariaLabel={`${metrics.violations.critical} violaciones críticas de accesibilidad`}
        />

        <MetricCard
          label="Violaciones Serias"
          value={metrics.violations.serious}
          severity="serious"
          ariaLabel={`${metrics.violations.serious} violaciones serias de accesibilidad`}
        />

        <MetricCard
          label="Violaciones Moderadas"
          value={metrics.violations.moderate}
          severity="moderate"
          ariaLabel={`${metrics.violations.moderate} violaciones moderadas de accesibilidad`}
        />

        <MetricCard
          label="Violaciones Menores"
          value={metrics.violations.minor}
          severity="minor"
          ariaLabel={`${metrics.violations.minor} violaciones menores de accesibilidad`}
        />
      </section>

      {/* Páginas Cumplientes */}
      <section aria-labelledby="pages-heading">
        <h2 id="pages-heading">Cumplimiento por Página</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="mb-4">
            {metrics.compliantPages} de {metrics.totalPages} páginas cumplen WCAG AA
          </p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-600 h-4 rounded-full transition-all duration-300"
              style={{
                width: `${(metrics.compliantPages / metrics.totalPages) * 100}%`,
              }}
              role="progressbar"
              aria-valuenow={(metrics.compliantPages / metrics.totalPages) * 100}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${Math.round((metrics.compliantPages / metrics.totalPages) * 100)}% de páginas cumplientes`}
            />
          </div>
        </div>
      </section>

      {/* Acciones Recomendadas */}
      <section aria-labelledby="recommendations-heading">
        <h2 id="recommendations-heading">🎯 Acciones Recomendadas</h2>
        <div className="bg-blue-50 p-6 rounded-lg space-y-3">
          {metrics.violations.critical > 0 && (
            <div role="alert" className="flex items-start gap-2">
              <span>❌</span>
              <div>
                <p className="font-semibold">Resolver violaciones críticas</p>
                <p className="text-sm text-gray-600">
                  {metrics.violations.critical} violaciones críticas requieren atención inmediata
                </p>
              </div>
            </div>
          )}

          {metrics.violations.serious > 0 && (
            <div className="flex items-start gap-2">
              <span>⚠️</span>
              <div>
                <p className="font-semibold">Remediar violaciones serias</p>
                <p className="text-sm text-gray-600">
                  {metrics.violations.serious} violaciones serias afectan la usabilidad
                </p>
              </div>
            </div>
          )}

          {metrics.level === 'AA' && metrics.wcagScore < 95 && (
            <div className="flex items-start gap-2">
              <span>📈</span>
              <div>
                <p className="font-semibold">Mejora hacia AAA</p>
                <p className="text-sm text-gray-600">
                  Trabaja en las violaciones moderadas para alcanzar nivel AAA
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Botones de Acción */}
      <section className="flex gap-4">
        <button
          onClick={() => window.location.href = '/admin/a11y/audit'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          aria-label="Ejecutar auditoría de accesibilidad completa"
        >
          🔍 Ejecutar Auditoría
        </button>
        <button
          onClick={() => window.location.href = '/admin/a11y/report'}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          aria-label="Ver reporte detallado de accesibilidad"
        >
          📄 Ver Reporte
        </button>
      </section>

      {/* Footer con información */}
      <footer className="text-sm text-gray-600 pt-8 border-t">
        <p>
          Estándar: WCAG 2.1 | Nivel: AA | Última auditoría: {metrics.lastAudit.toLocaleString()}
        </p>
        <p className="mt-2">
          Para más información sobre accesibilidad web, visite{' '}
          <a
            href="https://www.w3.org/WAI/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            W3C WAI
          </a>
        </p>
      </footer>
    </main>
  );
}

/**
 * Componente de Tarjeta de Métrica
 */
function MetricCard({
  label,
  value,
  severity,
  ariaLabel,
}: {
  label: string;
  value: number;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  ariaLabel: string;
}) {
  const colors = {
    critical: 'bg-red-50 border-red-300 text-red-700',
    serious: 'bg-orange-50 border-orange-300 text-orange-700',
    moderate: 'bg-yellow-50 border-yellow-300 text-yellow-700',
    minor: 'bg-blue-50 border-blue-300 text-blue-700',
  };

  const icons = {
    critical: '❌',
    serious: '⚠️',
    moderate: '⚡',
    minor: 'ℹ️',
  };

  return (
    <div
      className={`p-4 border-2 rounded-lg text-center ${colors[severity]}`}
      role="status"
      aria-label={ariaLabel}
    >
      <p className="text-2xl mb-2">{icons[severity]}</p>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}
