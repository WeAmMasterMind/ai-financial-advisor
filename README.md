AI Financial Advisor Platform
A comprehensive, privacy-first financial management platform featuring an AI-powered advisor named Atlas. Built as a full-stack application demonstrating proficiency in React, Node.js, PostgreSQL, and AI integration.
Show Image
Show Image
Show Image
Show Image
Show Image

Overview
This platform helps users take control of their finances through intelligent budgeting, strategic debt elimination, and personalized investment portfolio management. Unlike traditional financial apps that require invasive bank connections, this platform uses a privacy-first approach with manual data entry and comprehensive questionnaires to build accurate financial profiles.
Key Differentiator: Atlas, the integrated AI financial advisor, has real-time access to user financial data and provides contextual, personalized advice rather than generic recommendations.

Features
AI Financial Advisor (Atlas)

Real-time streaming chat interface with Claude API integration
Context-aware responses using complete financial profile
Conversation history with searchable archives
Rate limiting and quota management
Financial health scoring and personalized recommendations

Financial Questionnaire System

Progressive 5-step wizard (Personal → Income → Expenses → Debt → Goals)
Risk tolerance assessment algorithm
Investment horizon calculation
Psychological profile for debt strategy matching

Budget Management

Monthly budget creation and tracking
Category-based expense allocation
Income vs. expense visualization
Spending pattern analysis with charts

Transaction Tracking

Manual transaction entry with categorization
Recurring transaction support
CSV import capability
Visual spending breakdowns (pie charts, trend lines)

Debt Elimination Engine

Avalanche Method: Highest interest rate first (mathematically optimal)
Snowball Method: Smallest balance first (psychologically motivating)
Hybrid Approach: Personalized based on user profile
Payment tracking and payoff projections
Refinancing opportunity detection

Investment Portfolio Builder

Risk-based asset allocation recommendations
Model portfolios (Conservative → Aggressive)
Multi-asset class support (Stocks, Bonds, REITs, Alternatives, Crypto)
Portfolio rebalancing suggestions
Age-adjusted allocation algorithms

Market Intelligence

Real-time market data via Alpha Vantage API
Stock/ETF search and quotes
Watchlist management
Price history charts

Personalized Suggestions

AI-generated actionable recommendations
Priority-ranked financial action items
Context-aware tips based on current financial state


Tech Stack
Frontend
TechnologyPurposeReact 19UI FrameworkRedux ToolkitState ManagementReact Router v6NavigationTailwind CSSStylingRechartsData VisualizationAxiosAPI ClientReact Hot ToastNotifications
Backend
TechnologyPurposeNode.js + ExpressAPI ServerPostgreSQL 15+Primary DatabaseRedis 7+Caching & SessionsJWT + bcryptAuthenticationHelmet.jsSecurity Headers
External APIs
ServicePurposeAnthropic ClaudeAI AdvisorAlpha VantageMarket Data
DevOps
ToolPurposeDockerDatabase ContainerizationConcurrentlyDev Server Management

Architecture
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                           │
├─────────────────────────────────────────────────────────────────┤
│  Components    │  Pages        │  Store (Redux)  │  Services    │
│  ├─ Layout     │  ├─ Auth      │  ├─ authSlice   │  ├─ api      │
│  ├─ AI Chat    │  ├─ Dashboard │  ├─ budgetSlice │  ├─ auth     │
│  ├─ Budget     │  ├─ Budget    │  ├─ debtSlice   │  ├─ budget   │
│  ├─ Debt       │  ├─ Debt      │  ├─ portfolioS  │  ├─ debt     │
│  └─ Portfolio  │  └─ Portfolio │  └─ aiSlice     │  └─ ai       │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/SSE
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER (Express)                          │
├─────────────────────────────────────────────────────────────────┤
│  Routes        │  Controllers  │  Services       │  Middleware  │
│  ├─ /auth      │  ├─ auth      │  ├─ AI Module   │  ├─ auth.js  │
│  ├─ /budget    │  ├─ budget    │  │  ├─ claude   │  ├─ error    │
│  ├─ /debt      │  ├─ debt      │  │  ├─ context  │  └─ rate     │
│  ├─ /portfolio │  ├─ portfolio │  │  └─ prompts  │              │
│  ├─ /market    │  ├─ market    │  ├─ Market Data │              │
│  ├─ /ai        │  └─ ai        │  └─ Suggestions │              │
│  └─ /suggest   │               │                 │              │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐       ┌──────────┐       ┌──────────────┐
    │ Postgres │       │  Redis   │       │ External APIs│
    │ Database │       │  Cache   │       │ Claude/Alpha │
    └──────────┘       └──────────┘       └──────────────┘

Project Structure
ai-financial-advisor/
├── client/                    # React Frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── ai/            # Chat components
│       │   ├── budget/        # Budget components
│       │   ├── debt/          # Debt components
│       │   ├── layout/        # MainLayout, AuthLayout
│       │   ├── portfolio/     # Investment components
│       │   └── questionnaire/ # Wizard steps
│       ├── pages/             # Route pages
│       ├── services/          # API service layers
│       └── store/
│           └── features/      # Redux slices
│
├── server/                    # Express Backend
│   └── src/
│       ├── config/            # database.js, redis.js
│       ├── controllers/       # Route handlers
│       ├── db/
│       │   └── migrations/    # SQL migrations
│       ├── middleware/        # auth.js, errorHandler.js
│       ├── routes/            # API route definitions
│       ├── services/
│       │   ├── ai/            # Claude integration
│       │   └── market/        # Alpha Vantage integration
│       └── utils/             # Financial algorithms
│
├── docker-compose.yml         # Database containers
└── package.json               # Root scripts

Getting Started
Prerequisites

Node.js 18+
PostgreSQL 15+ (or Docker)
Redis 7+ (or Docker)
Anthropic API key
Alpha Vantage API key (free tier available)

Installation
1. Clone the repository
bashgit clone https://github.com/WeAmMasterMind/ai-financial-advisor.git
cd ai-financial-advisor
2. Install dependencies
bashnpm run install:all
3. Start databases (Docker)
bashdocker-compose up -d
4. Configure environment variables
bash# server/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_advisor
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secure-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
ANTHROPIC_API_KEY=sk-ant-xxxxx
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
5. Run database migrations
bashnpm run db:migrate
6. Start development servers
bashnpm run dev
Application will be available at:

Frontend: http://localhost:3000
Backend: http://localhost:5000


API Endpoints
Authentication
MethodEndpointDescriptionPOST/api/auth/registerCreate new accountPOST/api/auth/loginUser loginPOST/api/auth/refresh-tokenRefresh JWTGET/api/auth/meGet current userPOST/api/auth/logoutLogout
Budget
MethodEndpointDescriptionGET/api/budgetGet current budgetPOST/api/budgetCreate/update budgetGET/api/budget/categoriesGet categories
Transactions
MethodEndpointDescriptionGET/api/transactionsList transactionsPOST/api/transactionsAdd transactionPUT/api/transactions/:idUpdate transactionDELETE/api/transactions/:idDelete transaction
Debt
MethodEndpointDescriptionGET/api/debtList all debtsPOST/api/debtAdd debt accountGET/api/debt/strategiesCalculate payoff strategiesPOST/api/debt/:id/paymentRecord payment
Portfolio
MethodEndpointDescriptionGET/api/portfolioGet portfoliosPOST/api/portfolioCreate portfolioPOST/api/portfolio/:id/holdingsAdd holdingGET/api/portfolio/recommendedGet AI recommendations
AI Advisor
MethodEndpointDescriptionGET/api/ai/conversationsList conversationsPOST/api/ai/chatSend message (SSE stream)GET/api/ai/quotaCheck usage quota
Market Data
MethodEndpointDescriptionGET/api/market/quote/:symbolGet stock quoteGET/api/market/searchSearch symbolsGET/api/watchlistGet user watchlist

Financial Algorithms
Risk Assessment
Calculates user risk tolerance (1-10) based on:

Age factor
Income stability
Investment horizon
Loss tolerance responses
Financial knowledge level

Portfolio Allocation
Model portfolios with age-adjusted allocations:

Conservative: 20% stocks, 50% bonds, 25% cash
Moderate: 50% stocks, 35% bonds, 10% REITs
Aggressive: 80% stocks, 10% bonds, 10% alternatives

Debt Payoff Strategies

Avalanche: Minimizes total interest paid
Snowball: Maximizes psychological wins
Hybrid: Balances both based on user profile


Security Features

JWT authentication with refresh token rotation
Password hashing with bcrypt (12 rounds)
Rate limiting on API endpoints
Helmet.js security headers
Input validation and sanitization
SQL injection prevention (parameterized queries)
XSS protection
CORS configuration


Development
Available Scripts
bash# Start both servers in development
npm run dev

# Start only backend
npm run server:dev

# Start only frontend
npm run client:dev

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Production build
npm run build

Future Enhancements

 Financial goals tracking with milestone visualization
 Tax optimization recommendations
 Notification system (email, push)
 Bank connection via Plaid (optional)
 Mobile app (React Native)
 Multi-currency support
 Export reports (PDF)


License
This project is created for portfolio demonstration purposes.

Author
Wiam Ghoussaini

GitHub: @WeAmMasterMind