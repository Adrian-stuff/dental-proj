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

-- ============================================
-- Payroll: saved payout sets + batched payroll runs
-- ============================================

-- A saved set of employees and what each one is paid per payroll
CREATE TABLE IF NOT EXISTS payroll_sets (
  set_id SERIAL PRIMARY KEY,
  set_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_set_items (
  item_id SERIAL PRIMARY KEY,
  set_id INTEGER NOT NULL REFERENCES payroll_sets(set_id) ON DELETE CASCADE,
  employee_name VARCHAR(255) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_payroll_set_items_set_id ON payroll_set_items (set_id);

-- One generated payroll batch. Every payout in it is also written to supply as an expense.
CREATE TABLE IF NOT EXISTS payroll_runs (
  run_id SERIAL PRIMARY KEY,
  set_id INTEGER REFERENCES payroll_sets(set_id) ON DELETE SET NULL,
  set_name VARCHAR(255),  -- snapshot, kept if the set is renamed or deleted
  pay_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_pay_date ON payroll_runs (pay_date);

CREATE TABLE IF NOT EXISTS payroll_run_items (
  run_item_id SERIAL PRIMARY KEY,
  run_id INTEGER NOT NULL REFERENCES payroll_runs(run_id) ON DELETE CASCADE,
  employee_name VARCHAR(255) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  supply_id INTEGER REFERENCES supply(supply_id) ON DELETE SET NULL  -- the expense row it created
);

CREATE INDEX IF NOT EXISTS idx_payroll_run_items_run_id ON payroll_run_items (run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_run_items_supply_id ON payroll_run_items (supply_id);
