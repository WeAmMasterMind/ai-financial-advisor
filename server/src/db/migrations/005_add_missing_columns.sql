-- Migration 005: Add missing columns for Sprint 9-10 features
-- Run after init.sql and other migrations

-- =============================================
-- Financial Questionnaire table updates
-- =============================================
ALTER TABLE financial_questionnaire 
ADD COLUMN IF NOT EXISTS investment_experience VARCHAR(50) DEFAULT 'beginner';

ALTER TABLE financial_questionnaire 
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1;

ALTER TABLE financial_questionnaire 
ADD COLUMN IF NOT EXISTS time_horizon VARCHAR(50) DEFAULT 'medium';

ALTER TABLE financial_questionnaire 
ADD COLUMN IF NOT EXISTS risk_tolerance VARCHAR(50) DEFAULT 'moderate';

-- Ensure risk_score exists (may have been added manually)
ALTER TABLE financial_questionnaire 
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 5;

-- =============================================
-- Transactions table updates
-- =============================================
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'expense';

-- =============================================
-- Seed price history data for charts
-- =============================================
INSERT INTO price_history (symbol, date, open, high, low, close, volume)
SELECT 
  a.symbol,
  CURRENT_DATE - (n || ' days')::interval,
  a.current_price * (0.95 + random() * 0.1),
  a.current_price * (1.0 + random() * 0.05),
  a.current_price * (0.9 + random() * 0.1),
  a.current_price * (0.95 + random() * 0.1),
  floor(random() * 10000000)::bigint
FROM assets a
CROSS JOIN generate_series(1, 90) AS n
WHERE a.symbol IN (
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'JNJ', 'V',
  'PG', 'XOM', 'VOO', 'VTI', 'QQQ', 'SPY', 'IWM', 'BND', 'AGG', 'TLT',
  'VXUS', 'EFA', 'VWO', 'XLK', 'XLF', 'XLE', 'XLV', 'XLRE', 'BTC', 'ETH',
  'VNQ', 'O'
)
ON CONFLICT DO NOTHING;

-- =============================================
-- Add unique constraint for questionnaire if missing
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'financial_questionnaire_user_id_unique'
  ) THEN
    ALTER TABLE financial_questionnaire 
    ADD CONSTRAINT financial_questionnaire_user_id_unique UNIQUE (user_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- Create indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_price_history_symbol_date 
ON price_history(symbol, date DESC);

CREATE INDEX IF NOT EXISTS idx_questionnaire_user_completed 
ON financial_questionnaire(user_id, completed_at);

COMMIT;