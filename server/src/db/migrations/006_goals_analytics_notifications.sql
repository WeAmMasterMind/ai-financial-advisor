-- Sprint 11-12: Advanced Analytics, Goals & Notifications
-- Run this migration to add new tables

-- ============================================
-- 1. FINANCIAL GOALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS financial_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN (
        'emergency_fund', 'debt_payoff', 'house_down_payment', 
        'retirement', 'vacation', 'education', 'car', 
        'investment', 'wedding', 'other'
    )),
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) DEFAULT 0,
    target_date DATE,
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    monthly_contribution DECIMAL(12, 2) DEFAULT 0,
    icon VARCHAR(50) DEFAULT 'target',
    color VARCHAR(20) DEFAULT '#3B82F6',
    notes TEXT,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. GOAL CONTRIBUTIONS TABLE (Track progress history)
-- ============================================
CREATE TABLE IF NOT EXISTS goal_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. NET WORTH HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS net_worth_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_assets DECIMAL(14, 2) DEFAULT 0,
    total_liabilities DECIMAL(14, 2) DEFAULT 0,
    net_worth DECIMAL(14, 2) DEFAULT 0,
    breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, record_date)
);

-- ============================================
-- 4. FINANCIAL HEALTH HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS financial_health_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
    risk_score INTEGER CHECK (risk_score BETWEEN 1 AND 10),
    savings_rate DECIMAL(5, 2),
    debt_to_income DECIMAL(5, 2),
    emergency_fund_months DECIMAL(4, 1),
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, record_date)
);

-- ============================================
-- 5. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'price_alert', 'budget_warning', 'budget_exceeded',
        'debt_payment_due', 'goal_milestone', 'goal_achieved',
        'rebalance_needed', 'market_news', 'system', 'tip'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. USER NOTIFICATION PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    price_alerts BOOLEAN DEFAULT true,
    budget_alerts BOOLEAN DEFAULT true,
    debt_reminders BOOLEAN DEFAULT true,
    goal_updates BOOLEAN DEFAULT true,
    rebalance_alerts BOOLEAN DEFAULT true,
    market_news BOOLEAN DEFAULT false,
    tips_enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. SPENDING TRENDS CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS spending_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_income DECIMAL(12, 2) DEFAULT 0,
    total_expenses DECIMAL(12, 2) DEFAULT 0,
    total_savings DECIMAL(12, 2) DEFAULT 0,
    category_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, period_type, period_start)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_goals_user ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_type ON financial_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON financial_goals(is_completed);
CREATE INDEX IF NOT EXISTS idx_contributions_goal ON goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_contributions_date ON goal_contributions(contribution_date);
CREATE INDEX IF NOT EXISTS idx_net_worth_user_date ON net_worth_history(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_health_history_user_date ON financial_health_history(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_spending_trends_user ON spending_trends(user_id, period_type);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update financial_goals updated_at
DROP TRIGGER IF EXISTS set_timestamp_goals ON financial_goals;
CREATE TRIGGER set_timestamp_goals 
    BEFORE UPDATE ON financial_goals 
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Update notification_preferences updated_at
DROP TRIGGER IF EXISTS set_timestamp_notification_prefs ON notification_preferences;
CREATE TRIGGER set_timestamp_notification_prefs 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Auto-complete goal when target reached
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_amount >= NEW.target_amount AND OLD.current_amount < OLD.target_amount THEN
        NEW.is_completed := true;
        NEW.completed_at := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_goal_completion ON financial_goals;
CREATE TRIGGER trigger_goal_completion
    BEFORE UPDATE ON financial_goals
    FOR EACH ROW EXECUTE FUNCTION check_goal_completion();

-- Update goal current_amount when contribution is added
CREATE OR REPLACE FUNCTION update_goal_on_contribution()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE financial_goals 
    SET current_amount = current_amount + NEW.amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.goal_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_goal_on_contribution ON goal_contributions;
CREATE TRIGGER trigger_update_goal_on_contribution
    AFTER INSERT ON goal_contributions
    FOR EACH ROW EXECUTE FUNCTION update_goal_on_contribution();
