export const investmentRecommendations = {
  conservative: {
    etfs: [
      { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', allocation: '25%' },
      { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', allocation: '40%' },
      { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', allocation: '15%' },
      { symbol: 'GLD', name: 'SPDR Gold Shares', allocation: '10%' },
      { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', allocation: '10%' }
    ],
    stocks: [
      { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
      { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples' },
      { symbol: 'KO', name: 'Coca-Cola', sector: 'Consumer Staples' },
      { symbol: 'VZ', name: 'Verizon', sector: 'Telecom' },
      { symbol: 'PEP', name: 'PepsiCo', sector: 'Consumer Staples' }
    ]
  },
  moderate: {
    etfs: [
      { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', allocation: '35%' },
      { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', allocation: '20%' },
      { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', allocation: '25%' },
      { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', allocation: '10%' },
      { symbol: 'GLD', name: 'SPDR Gold Shares', allocation: '10%' }
    ],
    stocks: [
      { symbol: 'AAPL', name: 'Apple', sector: 'Technology' },
      { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology' },
      { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials' },
      { symbol: 'DIS', name: 'Disney', sector: 'Entertainment' },
      { symbol: 'V', name: 'Visa', sector: 'Financials' },
      { symbol: 'HD', name: 'Home Depot', sector: 'Consumer Cyclical' },
      { symbol: 'UNH', name: 'UnitedHealth', sector: 'Healthcare' }
    ]
  },
  aggressive: {
    etfs: [
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', allocation: '40%' },
      { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', allocation: '25%' },
      { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', allocation: '15%' },
      { symbol: 'ARKK', name: 'ARK Innovation ETF', allocation: '10%' },
      { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', allocation: '10%' }
    ],
    stocks: [
      { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology' },
      { symbol: 'TSLA', name: 'Tesla', sector: 'Auto/Technology' },
      { symbol: 'AMZN', name: 'Amazon', sector: 'Technology/Retail' },
      { symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology' },
      { symbol: 'META', name: 'Meta Platforms', sector: 'Technology' },
      { symbol: 'AMD', name: 'AMD', sector: 'Technology' },
      { symbol: 'SQ', name: 'Block', sector: 'Fintech' },
      { symbol: 'SHOP', name: 'Shopify', sector: 'E-commerce' },
      { symbol: 'NET', name: 'Cloudflare', sector: 'Technology' }
    ]
  }
};