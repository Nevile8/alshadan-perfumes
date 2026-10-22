-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 006: Purchase cost per variant + product photo gallery
-- Run this in Supabase Dashboard > SQL Editor
--
-- Costs live in their own table instead of a column on product_variants:
-- variants are readable by anyone (anon key), and RLS works per row, not per
-- column, so a cost column there would be visible to every visitor. This table
-- has RLS on and no policies, so only the service role (admin panel) sees it.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Purchase cost (admin only) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_variant_costs (
  variant_id  UUID          NOT NULL REFERENCES public.product_variants (id) ON DELETE CASCADE,
  cost        NUMERIC(12,2) NOT NULL CHECK (cost >= 0 AND cost <= 100000000),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (variant_id)
);

ALTER TABLE public.product_variant_costs ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: anon and logged-in customers can read nothing.

CREATE TRIGGER set_variant_costs_updated_at
  BEFORE UPDATE ON public.product_variant_costs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Extra photos shown on the product page (image_url stays the cover) ──────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.products
  ADD CONSTRAINT products_gallery_count CHECK (cardinality(gallery_urls) <= 8) NOT VALID;
