-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 005: Length limits enforced by the database
-- Run this in Supabase Dashboard > SQL Editor
--
-- Sign-up and the account page write to Supabase with the public anon key, so
-- the app's own validation can be skipped by calling the API directly. These
-- limits match lib/limits.ts. NOT VALID: existing rows are not re-checked, only
-- new inserts and updates.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── profiles: written by customers themselves ───────────────────────────────
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_full_name_length CHECK (char_length(full_name) <= 100) NOT VALID,
  ADD CONSTRAINT profiles_phone_length     CHECK (char_length(phone)     <= 30)  NOT VALID;

-- Sign-up metadata comes straight from the browser: trim the name instead of
-- failing the whole sign-up when it is too long.
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
    LEFT(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), 100),
    'customer'
  );
  RETURN NEW;
END;
$$;

-- ── Defence in depth for tables written by the server ───────────────────────
ALTER TABLE public.products
  ADD CONSTRAINT products_name_length        CHECK (char_length(name)        <= 120)  NOT VALID,
  ADD CONSTRAINT products_brand_length       CHECK (char_length(brand)       <= 80)   NOT VALID,
  ADD CONSTRAINT products_slug_length        CHECK (char_length(slug)        <= 140)  NOT VALID,
  ADD CONSTRAINT products_description_length CHECK (char_length(description) <= 3000) NOT VALID,
  ADD CONSTRAINT products_notes_count        CHECK (cardinality(olfactory_notes) <= 20) NOT VALID;

ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_sku_length CHECK (char_length(sku) <= 40) NOT VALID;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_tracking_number_length CHECK (char_length(tracking_number) <= 60)  NOT VALID,
  ADD CONSTRAINT orders_tracking_url_length    CHECK (char_length(tracking_url)    <= 500) NOT VALID,
  ADD CONSTRAINT orders_coupon_code_length     CHECK (char_length(coupon_code)     <= 50)  NOT VALID;
