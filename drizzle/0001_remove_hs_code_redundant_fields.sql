-- Migration: Remove hs_code_source and hs_code_6 fields
-- Date: 2025-01-15
-- Description: Simplify HS code storage - only keep hs_code and hs_code_extensions

-- Drop hs_code_source column (source tracking is not needed)
ALTER TABLE "products" DROP COLUMN IF EXISTS "hs_code_source";

-- Drop hs_code_6 column (can be derived from hs_code if needed)
ALTER TABLE "products" DROP COLUMN IF EXISTS "hs_code_6";
