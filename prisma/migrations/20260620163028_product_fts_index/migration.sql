-- Full-text search index on product title (English config), matching the
-- to_tsvector expression used by Prisma's `search` filter so queries are fast.
CREATE INDEX IF NOT EXISTS "product_title_fts_idx"
  ON "product" USING GIN (to_tsvector('english', "title"));
