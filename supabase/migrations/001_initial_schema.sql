-- =============================================================================
-- ALSHADAN Luxury Perfumes — Initial Database Schema
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enum Types ───────────────────────────────────────────────────────────────
CREATE TYPE user_role     AS ENUM ('customer', 'admin');
CREATE TYPE product_gender AS ENUM ('hombre', 'mujer', 'unisex');
CREATE TYPE order_status  AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- =============================================================================
-- TABLE: profiles
-- Extends auth.users — one row per registered user.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID          NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name    TEXT,
  phone        TEXT,
  role         user_role     NOT NULL DEFAULT 'customer',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- ─── RLS: profiles ───────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role bypasses RLS automatically.

-- =============================================================================
-- TABLE: products
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id              UUID          NOT NULL DEFAULT uuid_generate_v4(),
  name            TEXT          NOT NULL,
  brand           TEXT          NOT NULL,
  slug            TEXT          NOT NULL UNIQUE,
  gender          product_gender NOT NULL,
  description     TEXT,
  olfactory_notes TEXT[]        NOT NULL DEFAULT '{}',
  image_url       TEXT,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_products_gender    ON public.products (gender);
CREATE INDEX idx_products_brand     ON public.products (brand);
CREATE INDEX idx_products_is_active ON public.products (is_active);
CREATE INDEX idx_products_slug      ON public.products (slug);

-- ─── RLS: products ───────────────────────────────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = TRUE);

-- Writes handled exclusively by service role (admin panel in Phase 2).

-- =============================================================================
-- TABLE: product_variants
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id          UUID          NOT NULL DEFAULT uuid_generate_v4(),
  product_id  UUID          NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  size_ml     INTEGER       NOT NULL,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock       INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku         TEXT          UNIQUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (product_id, size_ml)
);

CREATE INDEX idx_variants_product_id ON public.product_variants (product_id);

-- ─── RLS: product_variants ───────────────────────────────────────────────────
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view variants of active products"
  ON public.product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.is_active = TRUE
    )
  );

-- =============================================================================
-- TABLE: coupons
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id             UUID          NOT NULL DEFAULT uuid_generate_v4(),
  code           TEXT          NOT NULL UNIQUE,
  discount_type  discount_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_purchase   NUMERIC(10,2),
  max_uses       INTEGER,
  current_uses   INTEGER       NOT NULL DEFAULT 0,
  expires_at     TIMESTAMPTZ,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_coupons_code      ON public.coupons (UPPER(code));
CREATE INDEX idx_coupons_is_active ON public.coupons (is_active);

-- ─── RLS: coupons ────────────────────────────────────────────────────────────
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = TRUE);

-- =============================================================================
-- TABLE: orders
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id                 UUID          NOT NULL DEFAULT uuid_generate_v4(),
  user_id            UUID          NOT NULL REFERENCES auth.users (id),
  status             order_status  NOT NULL DEFAULT 'pending',
  subtotal           NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  discount           NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  shipping_cost      NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total              NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  coupon_code        TEXT,
  shipping_address   JSONB         NOT NULL,
  payment_provider   TEXT,
  payment_reference  TEXT,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_orders_user_id    ON public.orders (user_id);
CREATE INDEX idx_orders_status     ON public.orders (status);
CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);

-- ─── RLS: orders ─────────────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: order_items
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id           UUID          NOT NULL DEFAULT uuid_generate_v4(),
  order_id     UUID          NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  variant_id   UUID          NOT NULL REFERENCES public.product_variants (id),
  product_name TEXT          NOT NULL,   -- snapshot
  size_ml      INTEGER       NOT NULL,   -- snapshot
  quantity     INTEGER       NOT NULL CHECK (quantity > 0),
  unit_price   NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),  -- snapshot
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_order_items_order_id ON public.order_items (order_id);

-- ─── RLS: order_items ────────────────────────────────────────────────────────
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

-- =============================================================================
-- TRIGGER: auto-create profile on user sign-up
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    'customer'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- FUNCTION: updated_at auto-update trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
