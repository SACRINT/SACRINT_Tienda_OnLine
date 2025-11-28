#!/usr/bin/env node

/**
 * Database Explorer Script
 * Lista todas las tablas, columnas y valores de la base de datos Neon
 *
 * Uso:
 *   npx ts-node scripts/db-explorer.ts              # Mostrar resumen
 *   npx ts-node scripts/db-explorer.ts --full       # Mostrar todos los datos
 *   npx ts-node scripts/db-explorer.ts --table=users # Mostrar tabla específica
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

/**
 * Obtiene información de todas las tablas
 */
async function getTablesInfo(): Promise<TableInfo[]> {
  const tables: TableInfo[] = [];

  // Query para obtener información de columnas de PostgreSQL
  const columnsQuery = `
    SELECT
      t.table_name,
      c.column_name,
      c.udt_name as data_type,
      c.is_nullable
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public'
    ORDER BY t.table_name, c.ordinal_position
  `;

  const columnsResult = await prisma.$queryRawUnsafe<any[]>(columnsQuery);

  // Agrupar columnas por tabla
  const tableMap = new Map<string, ColumnInfo[]>();

  for (const row of columnsResult) {
    if (!tableMap.has(row.table_name)) {
      tableMap.set(row.table_name, []);
    }

    tableMap.get(row.table_name)!.push({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === "YES",
    });
  }

  // Obtener conteo de filas para cada tabla
  for (const [tableName, columns] of tableMap.entries()) {
    try {
      const countResult = await prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(*) as count FROM "${tableName}"`,
      );
      const rowCount = countResult[0]?.count || 0;

      tables.push({
        name: tableName,
        columns,
        rowCount,
      });
    } catch (error) {
      // Tabla sin acceso o error
      tables.push({
        name: tableName,
        columns,
        rowCount: 0,
      });
    }
  }

  return tables;
}

/**
 * Obtiene todos los datos de una tabla específica
 */
async function getTableData(tableName: string): Promise<any[]> {
  try {
    const data = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "${tableName}" LIMIT 1000`);
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    return [];
  }
}

/**
 * Imprime tabla de forma legible
 */
function printTable(headers: string[], rows: any[][]): void {
  if (rows.length === 0) {
    console.log("  (sin datos)");
    return;
  }

  // Calcular ancho de columnas
  const colWidths = headers.map((h, i) => {
    const maxRowWidth = Math.max(...rows.map((r) => String(r[i] || "").length));
    return Math.max(h.length, maxRowWidth);
  });

  // Imprimir encabezados
  const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join(" | ");
  console.log("  " + headerRow);
  console.log("  " + "-".repeat(headerRow.length));

  // Imprimir filas
  rows.slice(0, 10).forEach((row) => {
    const dataRow = row.map((cell, i) => String(cell || "").padEnd(colWidths[i])).join(" | ");
    console.log("  " + dataRow);
  });

  if (rows.length > 10) {
    console.log(`  ... y ${rows.length - 10} filas más`);
  }
}

/**
 * Genera reporte en JSON
 */
async function generateJsonReport(tables: TableInfo[]): Promise<void> {
  const report = {
    timestamp: new Date().toISOString(),
    tables: tables.map((t) => ({
      name: t.name,
      rowCount: t.rowCount,
      columns: t.columns,
    })),
  };

  console.log(JSON.stringify(report, null, 2));
}

/**
 * Genera reporte en texto
 */
async function generateTextReport(tables: TableInfo[], showData: boolean = false): Promise<void> {
  console.log("\n" + "=".repeat(80));
  console.log("📊 DATABASE EXPLORER - NEON");
  console.log("=".repeat(80));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Total de tablas: ${tables.length}\n`);

  // Resumen de tablas
  console.log("📋 TABLAS Y FILAS:");
  console.log("-".repeat(80));
  const tableList = tables.map((t) => `  ${t.name.padEnd(30)} → ${t.rowCount} filas`).join("\n");
  console.log(tableList);

  console.log("\n" + "=".repeat(80));
  console.log("📐 ESTRUCTURA DE COLUMNAS:");
  console.log("=".repeat(80));

  for (const table of tables) {
    console.log(`\n📦 Tabla: ${table.name}`);
    console.log("-".repeat(80));

    const columnHeaders = ["Columna", "Tipo", "Nullable"];
    const columnRows = table.columns.map((col) => [col.name, col.type, col.nullable ? "✓" : ""]);

    printTable(columnHeaders, columnRows);

    // Mostrar datos si se solicita
    if (showData && table.rowCount > 0) {
      console.log(`\n📊 Datos (primeras 10 filas de ${table.rowCount} total):`);
      console.log("-".repeat(80));

      try {
        const data = await getTableData(table.name);

        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          const rows = data.map((row) =>
            headers.map((h) => {
              const val = row[h];
              if (val === null) return "NULL";
              if (typeof val === "object") return JSON.stringify(val).slice(0, 30);
              return String(val).slice(0, 50);
            }),
          );

          printTable(headers, rows);
        }
      } catch (error) {
        console.log(`  Error al obtener datos: ${error}`);
      }
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ Exploración completada");
  console.log("=".repeat(80) + "\n");
}

/**
 * Genera estadísticas SQL
 */
async function generateSqlStats(): Promise<void> {
  console.log("\n" + "=".repeat(80));
  console.log("📈 ESTADÍSTICAS SQL:");
  console.log("=".repeat(80) + "\n");

  try {
    // Total de filas por tabla
    const statsQuery = `
      SELECT
        tablename,
        (SELECT count(*) FROM information_schema.columns WHERE table_name = tablename) as column_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    const stats = await prisma.$queryRawUnsafe<any[]>(statsQuery);

    const headers = ["Tabla", "Columnas", "Tamaño"];
    const rows = stats.map((s) => [s.tablename, s.column_count, s.size]);

    printTable(headers, rows);

    // Total de base de datos
    const dbSize = await prisma.$queryRawUnsafe<any[]>(
      "SELECT pg_size_pretty(pg_database_size(current_database())) as size",
    );

    console.log(`\n  Tamaño total de BD: ${dbSize[0]?.size || "N/A"}`);
  } catch (error) {
    console.log(`Error al obtener estadísticas: ${error}`);
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isFull = args.includes("--full");
  const isJson = args.includes("--json");
  const specificTable = args.find((a) => a.startsWith("--table="))?.split("=")[1];

  try {
    const tables = await getTablesInfo();

    if (isJson) {
      await generateJsonReport(tables);
    } else if (specificTable) {
      // Mostrar tabla específica
      const table = tables.find((t) => t.name === specificTable);
      if (table) {
        console.log(`\n📦 Tabla: ${table.name}`);
        console.log(`Filas: ${table.rowCount}`);
        console.log(`Columnas: ${table.columns.length}\n`);

        const data = await getTableData(specificTable);
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          const rows = data.map((row) =>
            headers.map((h) => {
              const val = row[h];
              if (val === null) return "NULL";
              if (typeof val === "object") return JSON.stringify(val);
              return String(val);
            }),
          );
          printTable(headers, rows);
        }
      } else {
        console.log(`❌ Tabla '${specificTable}' no encontrada`);
        console.log(`Tablas disponibles: ${tables.map((t) => t.name).join(", ")}`);
      }
    } else {
      // Reporte general
      await generateTextReport(tables, isFull);
      await generateSqlStats();
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
