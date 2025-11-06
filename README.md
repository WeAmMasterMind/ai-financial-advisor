# Financial Advisor Platform

A comprehensive AI-powered financial advisor application built with React, Node.js, and PostgreSQL.

## 🚀 Features

- **User Authentication**: Secure JWT-based authentication with refresh tokens
- **Budget Management**: Track income, expenses, and savings
- **Investment Portfolio**: AI-powered investment recommendations
- **Financial Goals**: Set and track financial objectives
- **Real-time Dashboard**: Monitor your financial health at a glance
- **Secure Data Storage**: PostgreSQL database with encrypted sensitive data

## 🛠️ Tech Stack

### Frontend
- React 18
- Redux Toolkit (State Management)
- React Router v6 (Routing)
- Tailwind CSS (Styling)
- React Hook Form (Form Management)
- Axios (API Client)
- Recharts (Data Visualization)

### Backend
- Node.js & Express
- PostgreSQL (Database)
- Redis (Caching & Sessions)
- JWT (Authentication)
- Bcrypt (Password Hashing)

## 📦 Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for database setup)

## 🔧 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd financial-advisor-platform
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (root, server, client)
npm run install:all
```

### 3. Set up environment variables

#### Server (.env)
```bash
cd server
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- Database credentials
- JWT secrets
- API keys (Anthropic)

### 4. Set up the database

#### Using Docker (Recommended):
```bash
# From root directory
docker-compose up -d
```

#### Manual PostgreSQL setup:
```bash
# Create database
createdb financial_advisor

# Run migrations
cd server
npm run db:migrate
```

### 5. Start the development servers
```bash
# From root directory
npm run dev
```

This will start:
- Backend server: http://localhost:5000
- Frontend app: http://localhost:3000

## 🏗️ Project Structure

```
financial-advisor-platform/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable components
│       ├── pages/         # Page components
│       ├── services/      # API services
│       ├── store/         # Redux store
│       └── utils/         # Utility functions
├── server/                # Node.js backend
│   └── src/
│       ├── config/        # Configuration files
│       ├── controllers/   # Route controllers
│       ├── middleware/    # Express middleware
│       ├── models/        # Database models
│       ├── routes/        # API routes
│       └── utils/         # Utility functions
├── database/              # Database files
│   └── init.sql          # Initial schema
└── docker-compose.yml     # Docker configuration
```

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection with Helmet.js
- CORS configuration

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### User Profile
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🧪 Testing

```bash
# Run server tests
npm run test:server

# Run client tests
npm run test:client

# Run all tests
npm test
```

## 🚀 Deployment

### Production Build
```bash
# Build client
cd client
npm run build

# Start production server
cd ../server
NODE_ENV=production npm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure production database
- Set up Redis for production
- Configure CORS for your domain

## 📝 Development Workflow

1. Create feature branch from `develop`
2. Make changes and test locally
3. Commit with descriptive messages
4. Push branch and create Pull Request
5. Merge to `develop` after review
6. Deploy from `main` branch

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -d financial_advisor`