-- Sprint 9-10: Market Intelligence & Investment Suggestions
-- Run this migration to add new tables

-- ============================================
-- 1. ASSETS TABLE - Master list of investable assets
-- ============================================
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('stock', 'etf', 'crypto', 'bond', 'reit', 'mutual_fund')),
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap VARCHAR(20), -- 'large', 'mid', 'small', 'micro'
    description TEXT,
    exchange VARCHAR(50),
    country VARCHAR(50) DEFAULT 'US',
    risk_level INTEGER CHECK (risk_level BETWEEN 1 AND 10),
    dividend_yield DECIMAL(5, 2),
    expense_ratio DECIMAL(5, 4), -- For ETFs/mutual funds
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. PRICE HISTORY TABLE - Historical prices for charts
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    open_price DECIMAL(12, 4),
    high_price DECIMAL(12, 4),
    low_price DECIMAL(12, 4),
    close_price DECIMAL(12, 4) NOT NULL,
    adjusted_close DECIMAL(12, 4),
    volume BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, date)
);

-- ============================================
-- 3. WATCHLIST TABLE - User's tracked assets
-- ============================================
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    asset_type VARCHAR(50),
    notes TEXT,
    target_buy_price DECIMAL(12, 4),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, symbol)
);

-- ============================================
-- 4. PRICE ALERTS TABLE - User price notifications
-- ============================================
CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('above', 'below', 'percent_change')),
    target_price DECIMAL(12, 4),
    percent_threshold DECIMAL(5, 2),
    is_triggered BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. INVESTMENT SUGGESTIONS TABLE - AI/Engine suggestions
-- ============================================
CREATE TABLE IF NOT EXISTS investment_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    suggestion_type VARCHAR(50) NOT NULL, -- 'diversification', 'risk_match', 'sector_gap', 'rebalance'
    reason TEXT NOT NULL,
    confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
    priority INTEGER DEFAULT 5, -- 1-10, higher = more important
    suggested_allocation DECIMAL(5, 2), -- Suggested % of portfolio
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'dismissed')),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. PORTFOLIO SNAPSHOTS - Daily portfolio value history
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_value DECIMAL(14, 2) NOT NULL,
    total_cost DECIMAL(14, 2),
    day_change DECIMAL(12, 2),
    day_change_percent DECIMAL(6, 2),
    holdings_snapshot JSONB, -- Snapshot of holdings with prices
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portfolio_id, date)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_sector ON assets(sector);
CREATE INDEX IF NOT EXISTS idx_assets_risk ON assets(risk_level);

CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON price_history(symbol);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(date);
CREATE INDEX IF NOT EXISTS idx_price_history_symbol_date ON price_history(symbol, date DESC);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlist(symbol);

CREATE INDEX IF NOT EXISTS idx_suggestions_user ON investment_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON investment_suggestions(status);

CREATE INDEX IF NOT EXISTS idx_snapshots_portfolio ON portfolio_snapshots(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON portfolio_snapshots(date);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suggestions_updated_at ON investment_suggestions;
CREATE TRIGGER update_suggestions_updated_at
    BEFORE UPDATE ON investment_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Popular assets for suggestions
-- ============================================
INSERT INTO assets (symbol, name, asset_type, sector, market_cap, risk_level, description) VALUES
-- Large Cap Stocks
('AAPL', 'Apple Inc.', 'stock', 'Technology', 'large', 5, 'Consumer electronics and software company'),
('MSFT', 'Microsoft Corporation', 'stock', 'Technology', 'large', 4, 'Software and cloud computing'),
('GOOGL', 'Alphabet Inc.', 'stock', 'Technology', 'large', 5, 'Search engine and advertising'),
('AMZN', 'Amazon.com Inc.', 'stock', 'Consumer Cyclical', 'large', 6, 'E-commerce and cloud services'),
('NVDA', 'NVIDIA Corporation', 'stock', 'Technology', 'large', 7, 'Graphics processing and AI chips'),
('META', 'Meta Platforms Inc.', 'stock', 'Technology', 'large', 6, 'Social media and virtual reality'),
('TSLA', 'Tesla Inc.', 'stock', 'Consumer Cyclical', 'large', 8, 'Electric vehicles and energy'),
('JPM', 'JPMorgan Chase & Co.', 'stock', 'Financial Services', 'large', 5, 'Investment banking and financial services'),
('JNJ', 'Johnson & Johnson', 'stock', 'Healthcare', 'large', 3, 'Pharmaceuticals and consumer health'),
('V', 'Visa Inc.', 'stock', 'Financial Services', 'large', 4, 'Payment processing'),
('PG', 'Procter & Gamble Co.', 'stock', 'Consumer Defensive', 'large', 3, 'Consumer goods'),
('XOM', 'Exxon Mobil Corporation', 'stock', 'Energy', 'large', 5, 'Oil and gas'),

-- ETFs - Broad Market
('VOO', 'Vanguard S&P 500 ETF', 'etf', 'Broad Market', 'large', 4, 'Tracks S&P 500 index'),
('VTI', 'Vanguard Total Stock Market ETF', 'etf', 'Broad Market', 'large', 4, 'Total US stock market exposure'),
('QQQ', 'Invesco QQQ Trust', 'etf', 'Technology', 'large', 6, 'Tracks Nasdaq-100 index'),
('SPY', 'SPDR S&P 500 ETF Trust', 'etf', 'Broad Market', 'large', 4, 'Tracks S&P 500 index'),
('IWM', 'iShares Russell 2000 ETF', 'etf', 'Small Cap', 'small', 6, 'Small cap US stocks'),

-- ETFs - Bonds
('BND', 'Vanguard Total Bond Market ETF', 'etf', 'Bonds', 'large', 2, 'Total US bond market'),
('AGG', 'iShares Core U.S. Aggregate Bond ETF', 'etf', 'Bonds', 'large', 2, 'US investment grade bonds'),
('TLT', 'iShares 20+ Year Treasury Bond ETF', 'etf', 'Bonds', 'large', 3, 'Long-term US treasuries'),

-- ETFs - International
('VXUS', 'Vanguard Total International Stock ETF', 'etf', 'International', 'large', 5, 'International developed and emerging markets'),
('EFA', 'iShares MSCI EAFE ETF', 'etf', 'International', 'large', 5, 'Developed markets ex-US'),
('VWO', 'Vanguard FTSE Emerging Markets ETF', 'etf', 'Emerging Markets', 'large', 7, 'Emerging market stocks'),

-- ETFs - Sector
('XLK', 'Technology Select Sector SPDR Fund', 'etf', 'Technology', 'large', 6, 'US technology sector'),
('XLF', 'Financial Select Sector SPDR Fund', 'etf', 'Financial Services', 'large', 5, 'US financial sector'),
('XLE', 'Energy Select Sector SPDR Fund', 'etf', 'Energy', 'large', 6, 'US energy sector'),
('XLV', 'Health Care Select Sector SPDR Fund', 'etf', 'Healthcare', 'large', 4, 'US healthcare sector'),
('XLRE', 'Real Estate Select Sector SPDR Fund', 'etf', 'Real Estate', 'large', 5, 'US real estate sector'),

-- Crypto
('BTC', 'Bitcoin', 'crypto', 'Cryptocurrency', NULL, 9, 'Decentralized digital currency'),
('ETH', 'Ethereum', 'crypto', 'Cryptocurrency', NULL, 9, 'Smart contract platform'),

-- REITs
('VNQ', 'Vanguard Real Estate ETF', 'reit', 'Real Estate', 'large', 5, 'US real estate investment trusts'),
('O', 'Realty Income Corporation', 'reit', 'Real Estate', 'large', 4, 'Monthly dividend REIT')

ON CONFLICT (symbol) DO NOTHING;

-- ============================================
-- Add missing column to holdings if needed
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'holdings' AND column_name = 'current_price') THEN
        ALTER TABLE holdings ADD COLUMN current_price DECIMAL(12, 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'holdings' AND column_name = 'last_price_update') THEN
        ALTER TABLE holdings ADD COLUMN last_price_update TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;