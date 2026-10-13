-- Create app_settings key/value store for application settings (idempotent)
CREATE TABLE IF NOT EXISTS app_settings (
    "key" VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL
);

-- ============================================
-- Discord Bot & Site Management Tables
-- ============================================

-- Site notifications (banners)
CREATE TABLE IF NOT EXISTS site_notifications (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',  -- info, warning, error, maintenance
  is_active VARCHAR(5) DEFAULT 'true',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Site lockdown status
CREATE TABLE IF NOT EXISTS site_status (
  id SERIAL PRIMARY KEY,
  is_locked VARCHAR(5) DEFAULT 'false',
  lock_title VARCHAR(255) DEFAULT 'Site Under Maintenance',
  lock_message TEXT,
  lock_html TEXT,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by VARCHAR(255),
  fake_error VARCHAR(5) DEFAULT 'false',
  error_code VARCHAR(10) DEFAULT '500',
  error_message TEXT,
  phishing_mode VARCHAR(5) DEFAULT 'false'
);

-- Add phishing_mode column if it doesn't exist (for existing tables)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_status' AND column_name='phishing_mode') THEN
    ALTER TABLE site_status ADD COLUMN phishing_mode VARCHAR(5) DEFAULT 'false';
  END IF;
END $$;

-- Insert default row if not exists
INSERT INTO site_status (id, is_locked, fake_error, phishing_mode) VALUES (1, 'false', 'false', 'false') ON CONFLICT (id) DO NOTHING;

-- Environment/Config storage (for syncing to .env)
CREATE TABLE IF NOT EXISTS app_config (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Payments log (money in history)
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  payment_id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(order_id),
  amount NUMERIC(10, 2) NOT NULL,  -- positive = money received, negative = correction
  payment_method VARCHAR(255),
  payment_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments (payment_date);

-- Backfill payments made before the log existed, dated on the order date (idempotent)
INSERT INTO payments (order_id, amount, payment_method, payment_date)
SELECT o.order_id, o.paid_amount, o.payment_method, o.order_date
FROM orders o
WHERE COALESCE(o.paid_amount, 0) <> 0
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.order_id);
