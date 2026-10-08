-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004: Security and checkout fixes
-- Run this in Supabase Dashboard > SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── profiles: users may edit their own name/phone, never their role ──────────
-- The UPDATE policy from 001 allowed changing every column, including role.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, phone) ON public.profiles TO authenticated;

-- ── orders: allow guest checkout ─────────────────────────────────────────────
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- ── coupons: codes are validated server-side, never listed publicly ──────────
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

-- ── mark_order_paid: called by the Mercado Pago webhook ─────────────────────
-- Atomically moves a pending order to paid, decrements stock for each item
-- and counts the coupon use. Returns false if the order was not pending
-- (already processed, cancelled or unknown), so retries are harmless.
CREATE OR REPLACE FUNCTION public.mark_order_paid(
  p_order_id          UUID,
  p_payment_reference TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_coupon_code TEXT;
BEGIN
  UPDATE orders
     SET status = 'paid',
         payment_reference = p_payment_reference
   WHERE id = p_order_id
     AND status = 'pending'
  RETURNING coupon_code INTO v_coupon_code;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Payment is already taken, so never fail here: clamp stock at 0.
  UPDATE product_variants pv
     SET stock = GREATEST(pv.stock - oi.quantity, 0)
    FROM (
      SELECT variant_id, SUM(quantity) AS quantity
        FROM order_items
       WHERE order_id = p_order_id
       GROUP BY variant_id
    ) oi
   WHERE pv.id = oi.variant_id;

  IF v_coupon_code IS NOT NULL THEN
    UPDATE coupons
       SET current_uses = current_uses + 1
     WHERE UPPER(code) = UPPER(v_coupon_code);
  END IF;

  RETURN TRUE;
END;
$$;

-- Only the service role (webhook) may call it.
REVOKE EXECUTE ON FUNCTION public.mark_order_paid(UUID, TEXT) FROM PUBLIC, anon, authenticated;
