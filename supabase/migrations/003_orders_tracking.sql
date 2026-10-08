-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Add tracking fields to orders
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url    TEXT;