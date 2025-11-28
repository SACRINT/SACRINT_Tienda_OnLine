-- ============================================================================
-- SQL QUERIES PARA NEON - DATABASE EXPLORER
-- Ejecuta estos queries directamente en el editor SQL de Neon
-- ============================================================================

-- ============================================================================
-- 1. LISTAR TODAS LAS TABLAS
-- ============================================================================

SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


-- ============================================================================
-- 2. LISTAR TODAS LAS COLUMNAS DE TODAS LAS TABLAS
-- ============================================================================

SELECT
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  c.ordinal_position
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;


-- ============================================================================
-- 3. CONTAR FILAS EN TODAS LAS TABLAS
-- ============================================================================

SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = tablename) AS column_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;


-- ============================================================================
-- 4. INFORMACIÓN DETALLADA DE UNA TABLA (cambiar 'User' por el nombre)
-- ============================================================================

SELECT
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  tc.constraint_type,
  kcu.constraint_name
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu
  ON c.table_name = kcu.table_name
  AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc
  ON kcu.constraint_name = tc.constraint_name
WHERE c.table_name = 'User'
  AND c.table_schema = 'public'
ORDER BY c.ordinal_position;


-- ============================================================================
-- 5. LISTAR TODAS LAS CLAVES PRIMARIAS
-- ============================================================================

SELECT
  t.table_name,
  a.attname AS column_name,
  a.attnum AS position
FROM pg_index i
JOIN pg_attribute a ON a.attrelid = i.indrelid
  AND a.attnum = ANY(i.indkey)
JOIN pg_class t ON t.oid = i.indrelid
WHERE i.indisprimary
  AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY t.relname, a.attnum;


-- ============================================================================
-- 6. LISTAR TODAS LAS FOREIGN KEYS
-- ============================================================================

SELECT
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu
  ON rc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON rc.unique_constraint_name = ccu.constraint_name
WHERE kcu.table_schema = 'public'
ORDER BY table_name, constraint_name;


-- ============================================================================
-- 7. LISTAR TODOS LOS ÍNDICES
-- ============================================================================

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- ============================================================================
-- 8. TAMAÑO DE BASE DE DATOS COMPLETA
-- ============================================================================

SELECT
  pg_size_pretty(pg_database_size(current_database())) AS database_size,
  pg_database_size(current_database()) AS size_bytes;


-- ============================================================================
-- 9. TAMAÑO POR TABLA
-- ============================================================================

SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;


-- ============================================================================
-- 10. CONTAR FILAS EN TABLA ESPECÍFICA (cambiar 'User')
-- ============================================================================

SELECT
  'User' AS table_name,
  COUNT(*) AS row_count
FROM "User";


-- ============================================================================
-- 11. VER PRIMERAS 10 FILAS DE UNA TABLA (cambiar 'User')
-- ============================================================================

SELECT * FROM "User" LIMIT 10;


-- ============================================================================
-- 12. ESTRUCTURA COMPLETA CON DATOS DE TABLA (cambiar 'Product')
-- ============================================================================

SELECT
  c.column_name,
  c.data_type,
  c.is_nullable
FROM information_schema.columns c
WHERE c.table_name = 'Product'
  AND c.table_schema = 'public'
ORDER BY c.ordinal_position;

-- Luego ejecuta:
SELECT * FROM "Product" LIMIT 20;


-- ============================================================================
-- 13. BÚSQUEDA DE COLUMNA ESPECÍFICA
-- ============================================================================

SELECT
  t.table_name,
  c.column_name,
  c.data_type
FROM information_schema.columns c
JOIN information_schema.tables t ON t.table_name = c.table_name
WHERE c.table_schema = 'public'
  AND c.column_name LIKE '%email%'
ORDER BY t.table_name;


-- ============================================================================
-- 14. ESTADÍSTICAS COMPLETAS - RESUMEN
-- ============================================================================

SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS total_tables,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public') AS total_columns,
  pg_size_pretty(pg_database_size(current_database())) AS db_size,
  NOW() AS timestamp;


-- ============================================================================
-- 15. LISTAR TODAS LAS SECUENCIAS (AUTO INCREMENT)
-- ============================================================================

SELECT
  sequence_schema,
  sequence_name,
  data_type
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;


-- ============================================================================
-- 16. LISTAR ENUMS (TIPOS PERSONALIZADOS)
-- ============================================================================

SELECT
  t.typname AS enum_name,
  e.enumlabel AS enum_value,
  e.enumsortorder AS sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY t.typname, e.enumsortorder;


-- ============================================================================
-- 17. RESUMEN DE ENUMS EN TABLAS
-- ============================================================================

SELECT DISTINCT
  udt_name AS enum_type,
  column_name,
  table_name
FROM information_schema.columns
WHERE udt_schema = 'public'
  AND data_type = 'USER-DEFINED'
ORDER BY table_name, column_name;


-- ============================================================================
-- 18. BUSCAR TABLAS POR NOMBRE (cambiar patrón)
-- ============================================================================

SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE '%order%'
ORDER BY table_name;


-- ============================================================================
-- 19. MOSTRAR DEFINICIÓN COMPLETA DE TABLA (cambiar 'User')
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE
    WHEN is_nullable = 'NO' THEN 'NOT NULL'
    ELSE 'NULL'
  END AS nullable_status
FROM information_schema.columns
WHERE table_name = 'User'
  AND table_schema = 'public'
ORDER BY ordinal_position;


-- ============================================================================
-- 20. DATOS DE TABLA CON CONTEO (cambiar 'User')
-- ============================================================================

SELECT
  COUNT(*) AS total_rows,
  (SELECT COUNT(*) FROM "User" WHERE "id" IS NOT NULL) AS rows_with_id
FROM "User";


-- ============================================================================
-- 21. INFORMACIÓN DE CONSTRAINTS (RESTRICCIONES)
-- ============================================================================

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;


-- ============================================================================
-- 22. VER VISTA PREVIA DE DATOS (cambiar tabla y límite)
-- ============================================================================

SELECT * FROM "User" LIMIT 5;
SELECT * FROM "Tenant" LIMIT 5;
SELECT * FROM "Product" LIMIT 5;
SELECT * FROM "Order" LIMIT 5;
SELECT * FROM "OrderItem" LIMIT 5;


-- ============================================================================
-- 23. VALIDAR INTEGRIDAD REFERENCIAL
-- ============================================================================

SELECT
  c.table_name,
  c.column_name,
  (SELECT COUNT(*) FROM information_schema.tables t WHERE t.table_name = c.table_name) AS table_exists
FROM information_schema.columns c
WHERE c.table_schema = 'public'
GROUP BY c.table_name, c.column_name
ORDER BY c.table_name;


-- ============================================================================
-- 24. BÚSQUEDA AVANZADA - COLUMNAS CON NOMBRE ESPECÍFICO
-- ============================================================================

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'id'
ORDER BY table_name;


-- ============================================================================
-- 25. REPORTE EJECUTIVO COMPLETO
-- ============================================================================

-- Total de tablas
SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'public';

-- Total de columnas
SELECT COUNT(*) AS total_columns FROM information_schema.columns WHERE table_schema = 'public';

-- Total de filas en todas las tablas
SELECT SUM(n_live_tup) AS total_rows FROM pg_stat_user_tables;

-- Tamaño total
SELECT pg_size_pretty(pg_database_size(current_database())) AS total_database_size;

-- Tabla más grande
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 5;


-- ============================================================================
-- NOTAS DE USO:
-- ============================================================================
-- 1. Copia y pega cada query en el editor SQL de Neon
-- 2. Cambia los nombres entre comillas simples según necesites
-- 3. Para tablas con caracteres especiales, usa comillas dobles: "User", "Product"
-- 4. Algunos queries retornan múltiples resultados, ejecuta uno a la vez
-- 5. Los LIMIT limitan resultados a 10-20 filas (edita el número si necesitas más)
-- ============================================================================
