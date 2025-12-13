DO $$ 
BEGIN
    -- Add debt_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'debts' AND column_name = 'debt_name') THEN
        ALTER TABLE debts ADD COLUMN debt_name VARCHAR(255);
    END IF;
    
    -- Add original_balance if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'debts' AND column_name = 'original_balance') THEN
        ALTER TABLE debts ADD COLUMN original_balance DECIMAL(12, 2);
    END IF;
    
    -- Rename balance to current_balance if needed (check first)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'debts' AND column_name = 'balance') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'debts' AND column_name = 'current_balance') THEN
        ALTER TABLE debts RENAME COLUMN balance TO current_balance;
    END IF;
    
    -- Add current_balance if it doesn't exist at all
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'debts' AND column_name = 'current_balance') THEN
        ALTER TABLE debts ADD COLUMN current_balance DECIMAL(12, 2);
    END IF;
END $$;

-- Create debt_payments table
CREATE TABLE IF NOT EXISTS debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(12, 2) NOT NULL,
    principal_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
    interest_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
    balance_after DECIMAL(12, 2) NOT NULL,
    is_extra BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_date ON debt_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);

-- Update debt_strategies table if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'debt_strategies' AND column_name = 'monthly_extra') THEN
        ALTER TABLE debt_strategies ADD COLUMN monthly_extra DECIMAL(12, 2) DEFAULT 0;
    END IF;
END $$;

-- Add updated_at trigger for debts if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_debts_updated_at ON debts;
CREATE TRIGGER update_debts_updated_at
    BEFORE UPDATE ON debts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();