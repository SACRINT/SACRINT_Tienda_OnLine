#!/usr/bin/env node

/**
 * Database Explorer Script (Node.js puro)
 * Lista todas las tablas, columnas y valores de la base de datos Neon
 *
 * Uso:
 *   node scripts/db-explorer.js              # Mostrar resumen
 *   node scripts/db-explorer.js --full       # Mostrar todos los datos
 *   node scripts/db-explorer.js --table=users # Mostrar tabla específica
 *   node scripts/db-explorer.js --json       # Formato JSON
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Obtiene información de todas las tablas
 */
async function getTablesInfo() {
  const tables = [];

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

  const columnsResult = await prisma.$queryRawUnsafe(columnsQuery);

  // Agrupar columnas por tabla
  const tableMap = new Map();

  for (const row of columnsResult) {
    if (!tableMap.has(row.table_name)) {
      tableMap.set(row.table_name, []);
    }

    tableMap.get(row.table_name).push({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === "YES",
    });
  }

  // Obtener conteo de filas para cada tabla
  for (const [tableName, columns] of tableMap.entries()) {
    try {
      const countResult = await prisma.$queryRawUnsafe(
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

  return tables.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Obtiene todos los datos de una tabla específica
 */
async function getTableData(tableName) {
  try {
    const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}" LIMIT 1000`);
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error.message);
    return [];
  }
}

/**
 * Imprime tabla de forma legible
 */
function printTable(headers, rows) {
  if (rows.length === 0) {
    console.log("  (sin datos)");
    return;
  }

  // Calcular ancho de columnas
  const colWidths = headers.map((h, i) => {
    const maxRowWidth = Math.max(...rows.map((r) => String(r[i] || "").length));
    return Math.max(h.length, maxRowWidth, 10);
  });

  // Imprimir encabezados
  const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join(" | ");
  console.log("  " + headerRow);
  console.log("  " + "-".repeat(Math.min(headerRow.length, 120)));

  // Imprimir filas
  rows.slice(0, 10).forEach((row) => {
    const dataRow = row
      .map((cell, i) => {
        const str = String(cell || "").slice(0, colWidths[i]);
        return str.padEnd(colWidths[i]);
      })
      .join(" | ");
    console.log("  " + dataRow.slice(0, 120));
  });

  if (rows.length > 10) {
    console.log(`  ... y ${rows.length - 10} filas más`);
  }
}

/**
 * Genera reporte en JSON
 */
async function generateJsonReport(tables) {
  const report = {
    timestamp: new Date().toISOString(),
    totalTables: tables.length,
    tables: tables.map((t) => ({
      name: t.name,
      rowCount: t.rowCount,
      columnCount: t.columns.length,
      columns: t.columns,
    })),
  };

  console.log(JSON.stringify(report, null, 2));
}

/**
 * Genera reporte en texto
 */
async function generateTextReport(tables, showData = false) {
  console.log("\n" + "=".repeat(100));
  console.log("📊 DATABASE EXPLORER - NEON PostgreSQL");
  console.log("=".repeat(100));
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`📈 Total de tablas: ${tables.length}\n`);

  // Resumen de tablas
  console.log("📋 RESUMEN DE TABLAS:");
  console.log("-".repeat(100));

  let totalRows = 0;
  for (const table of tables) {
    totalRows += table.rowCount;
    const rowsStr = table.rowCount.toString().padStart(8);
    const colsStr = table.columns.length.toString().padStart(4);
    console.log(`  ${table.name.padEnd(35)} → ${rowsStr} filas | ${colsStr} columnas`);
  }
  console.log("-".repeat(100));
  console.log(`  TOTAL: ${totalRows} filas en ${tables.length} tablas`);

  console.log("\n" + "=".repeat(100));
  console.log("📐 ESTRUCTURA DE COLUMNAS:");
  console.log("=".repeat(100));

  for (const table of tables) {
    console.log(`\n📦 ${table.name} (${table.rowCount} filas)`);
    console.log("-".repeat(100));

    const columnHeaders = ["Columna", "Tipo", "Nullable"];
    const columnRows = table.columns.map((col) => [
      col.name,
      col.type,
      col.nullable ? "✓ SÍ" : "✗ NO",
    ]);

    printTable(columnHeaders, columnRows);

    // Mostrar datos si se solicita
    if (showData && table.rowCount > 0) {
      console.log(`\n📊 Datos (primeras 10 filas de ${table.rowCount} total):`);
      console.log("-".repeat(100));

      try {
        const data = await getTableData(table.name);

        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          const rows = data.map((row) =>
            headers.map((h) => {
              const val = row[h];
              if (val === null) return "NULL";
              if (val === undefined) return "UNDEFINED";
              if (typeof val === "boolean") return val ? "true" : "false";
              if (typeof val === "object") return JSON.stringify(val).slice(0, 40);
              return String(val).slice(0, 50);
            }),
          );

          printTable(headers, rows);
        } else {
          console.log("  (sin datos)");
        }
      } catch (error) {
        console.log(`  ❌ Error al obtener datos: ${error.message}`);
      }
    }
  }

  console.log("\n" + "=".repeat(100));
  console.log("✅ Exploración completada");
  console.log("=".repeat(100) + "\n");
}

/**
 * Genera estadísticas SQL
 */
async function generateSqlStats() {
  console.log("\n" + "=".repeat(100));
  console.log("📈 ESTADÍSTICAS DE BASE DE DATOS:");
  console.log("=".repeat(100) + "\n");

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

    const stats = await prisma.$queryRawUnsafe(statsQuery);

    const headers = ["Tabla", "Columnas", "Tamaño"];
    const rows = stats.map((s) => [s.tablename, String(s.column_count), s.size]);

    printTable(headers, rows);

    // Total de base de datos
    const dbSize = await prisma.$queryRawUnsafe(
      "SELECT pg_size_pretty(pg_database_size(current_database())) as size",
    );

    console.log(`\n  💾 Tamaño total de BD: ${dbSize[0]?.size || "N/A"}`);

    // Información de conexión
    console.log(`  🔗 Tipo de BD: PostgreSQL`);
    console.log(`  📊 Versión: ${process.env.DATABASE_URL ? "Neon" : "Local"}`);
  } catch (error) {
    console.log(`  ❌ Error al obtener estadísticas: ${error.message}`);
  }

  console.log("\n" + "=".repeat(100) + "\n");
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  const isFull = args.includes("--full");
  const isJson = args.includes("--json");
  const isStats = args.includes("--stats");
  const specificTable = args.find((a) => a.startsWith("--table="))?.split("=")[1];

  try {
    console.log("🔄 Conectando a base de datos Neon...");
    const tables = await getTablesInfo();
    console.log("✅ Conexión exitosa\n");

    if (isStats) {
      await generateSqlStats();
    } else if (isJson) {
      await generateJsonReport(tables);
    } else if (specificTable) {
      // Mostrar tabla específica con todos sus datos
      const table = tables.find((t) => t.name === specificTable);
      if (table) {
        console.log(`\n📦 Tabla: ${table.name}`);
        console.log(`📊 Filas: ${table.rowCount}`);
        console.log(`🔧 Columnas: ${table.columns.length}\n`);

        // Mostrar estructura
        console.log("Estructura de columnas:");
        const columnHeaders = ["Columna", "Tipo", "Nullable"];
        const columnRows = table.columns.map((col) => [
          col.name,
          col.type,
          col.nullable ? "✓" : "✗",
        ]);
        printTable(columnHeaders, columnRows);

        // Mostrar datos
        if (table.rowCount > 0) {
          console.log("\nDatos:");
          const data = await getTableData(specificTable);
          if (data.length > 0) {
            const headers = Object.keys(data[0]);
            const rows = data.map((row) =>
              headers.map((h) => {
                const val = row[h];
                if (val === null) return "NULL";
                if (typeof val === "object") return JSON.stringify(val).slice(0, 40);
                return String(val).slice(0, 50);
              }),
            );
            printTable(headers, rows);
          }
        }
      } else {
        console.log(`\n❌ Tabla '${specificTable}' no encontrada\n`);
        console.log(`Tablas disponibles: ${tables.map((t) => t.name).join(", ")}\n`);
      }
    } else {
      // Reporte general
      await generateTextReport(tables, isFull);
      await generateSqlStats();
    }
  } catch (error) {
    console.error("\n❌ Error fatal:", error.message);
    console.error("\n💡 Asegúrate de que:");
    console.error("  1. DATABASE_URL está configurado en .env.local");
    console.error("  2. La conexión a Neon es válida");
    console.error("  3. Tienes permisos de lectura en la base de datos\n");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
