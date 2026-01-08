-- Add updated_at column to financial_questionnaire
ALTER TABLE financial_questionnaire 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create trigger to auto-update timestamp
CREATE OR REPLACE FUNCTION update_financial_questionnaire_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_financial_questionnaire_updated_at ON financial_questionnaire;

CREATE TRIGGER update_financial_questionnaire_updated_at
    BEFORE UPDATE ON financial_questionnaire
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_questionnaire_timestamp();