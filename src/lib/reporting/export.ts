// Report Export
// Export reports to various formats

import { ReportResult } from "./generator";

// Convert report to CSV
export function toCSV(report: ReportResult): string {
  const data = report.data as Record<string, unknown>[];
  if (!Array.isArray(data) || data.length === 0) {
    return "";
  }

  // Get headers from first row
  const headers = Object.keys(data[0]);

  // Create CSV content
  const rows: string[] = [];

  // Header row
  rows.push(headers.map(escapeCSV).join(","));

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      return escapeCSV(formatValue(value));
    });
    rows.push(values.join(","));
  }

  // Add summary section
  rows.push("");
  rows.push("Resumen");
  for (const [key, value] of Object.entries(report.summary)) {
    rows.push(escapeCSV(key) + "," + escapeCSV(String(value)));
  }

  return rows.join("\n");
}

// Convert report to JSON (formatted)
export function toJSON(report: ReportResult): string {
  return JSON.stringify(
    {
      title: report.title,
      generatedAt: report.generatedAt,
      period: report.period,
      summary: report.summary,
      data: report.data,
    },
    null,
    2,
  );
}

// Generate PDF content (returns HTML for PDF generation)
export function toPDFHTML(report: ReportResult): string {
  const data = report.data as Record<string, unknown>[];

  let html = "<!DOCTYPE html><html><head>";
  html += '<meta charset="UTF-8">';
  html += "<title>" + report.title + "</title>";
  html += "<style>";
  html += "body { font-family: Arial, sans-serif; margin: 20px; }";
  html += "h1 { color: #333; }";
  html += "table { border-collapse: collapse; width: 100%; margin: 20px 0; }";
  html += "th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }";
  html += "th { background-color: #f4f4f4; }";
  html += ".summary { margin: 20px 0; }";
  html += ".summary-item { margin: 5px 0; }";
  html += ".footer { margin-top: 30px; font-size: 12px; color: #666; }";
  html += "</style>";
  html += "</head><body>";

  // Header
  html += "<h1>" + report.title + "</h1>";
  html +=
    "<p>Período: " +
    formatDate(report.period.start) +
    " - " +
    formatDate(report.period.end) +
    "</p>";

  // Summary
  html += '<div class="summary">';
  html += "<h2>Resumen</h2>";
  for (const [key, value] of Object.entries(report.summary)) {
    html +=
      '<div class="summary-item"><strong>' +
      key +
      ":</strong> " +
      value +
      "</div>";
  }
  html += "</div>";

  // Data table
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0]);

    html += "<table>";
    html += "<thead><tr>";
    for (const header of headers) {
      html += "<th>" + formatHeader(header) + "</th>";
    }
    html += "</tr></thead>";

    html += "<tbody>";
    for (const row of data) {
      html += "<tr>";
      for (const header of headers) {
        html += "<td>" + formatValue(row[header]) + "</td>";
      }
      html += "</tr>";
    }
    html += "</tbody></table>";
  }

  // Footer
  html += '<div class="footer">';
  html += "Generado el " + formatDateTime(report.generatedAt);
  html += "</div>";

  html += "</body></html>";

  return html;
}

// Generate Excel XML (simplified)
export function toExcelXML(report: ReportResult): string {
  const data = report.data as Record<string, unknown>[];

  let xml = '<?xml version="1.0"?>';
  xml += '<?mso-application progid="Excel.Sheet"?>';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';

  // Summary sheet
  xml += '<Worksheet ss:Name="Resumen">';
  xml += "<Table>";
  xml +=
    '<Row><Cell><Data ss:Type="String">' +
    report.title +
    "</Data></Cell></Row>";
  xml += '<Row><Cell><Data ss:Type="String">Período</Data></Cell>';
  xml +=
    '<Cell><Data ss:Type="String">' +
    formatDate(report.period.start) +
    " - " +
    formatDate(report.period.end) +
    "</Data></Cell></Row>";
  xml += "<Row></Row>";

  for (const [key, value] of Object.entries(report.summary)) {
    xml += "<Row>";
    xml += '<Cell><Data ss:Type="String">' + key + "</Data></Cell>";
    xml += '<Cell><Data ss:Type="String">' + value + "</Data></Cell>";
    xml += "</Row>";
  }
  xml += "</Table></Worksheet>";

  // Data sheet
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0]);

    xml += '<Worksheet ss:Name="Datos">';
    xml += "<Table>";

    // Headers
    xml += "<Row>";
    for (const header of headers) {
      xml +=
        '<Cell><Data ss:Type="String">' +
        formatHeader(header) +
        "</Data></Cell>";
    }
    xml += "</Row>";

    // Data
    for (const row of data) {
      xml += "<Row>";
      for (const header of headers) {
        const value = row[header];
        const type = typeof value === "number" ? "Number" : "String";
        xml +=
          '<Cell><Data ss:Type="' +
          type +
          '">' +
          escapeXML(formatValue(value)) +
          "</Data></Cell>";
      }
      xml += "</Row>";
    }

    xml += "</Table></Worksheet>";
  }

  xml += "</Workbook>";

  return xml;
}

// Helper functions
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function escapeXML(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return formatDateTime(value);
  if (typeof value === "number") return value.toLocaleString("es-MX");
  return String(value);
}

function formatHeader(header: string): string {
  return header
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-MX");
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("es-MX");
}
