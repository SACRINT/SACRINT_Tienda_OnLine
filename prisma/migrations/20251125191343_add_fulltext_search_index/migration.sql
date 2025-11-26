-- CreateIndex: Full-text search on Product name and description
-- This uses PostgreSQL's built-in full-text search capabilities

-- Create a generated tsvector column for better performance
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce("description", '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce("sku", '')), 'C')
  ) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "Product_searchVector_idx" ON "Product" USING GIN ("searchVector");

-- Create additional index for name/description (fallback for Prisma fulltext)
CREATE INDEX IF NOT EXISTS "Product_name_description_idx" ON "Product" USING GIN (to_tsvector('spanish', "name" || ' ' || "description"));
