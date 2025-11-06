#!/bin/bash

# Financial Advisor Platform Setup Script

echo "🚀 Financial Advisor Platform - Setup Script"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Node.js version is less than 18. Please upgrade.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check if Docker is installed (optional)
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker detected${NC}"
    USE_DOCKER=true
else
    echo -e "${YELLOW}⚠️  Docker not found. You'll need to set up PostgreSQL and Redis manually.${NC}"
    USE_DOCKER=false
fi

# Step 1: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating server .env file..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please update server/.env with your configuration${NC}"
fi

cd ..

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install
cd ..

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 2: Start Docker services if available
if [ "$USE_DOCKER" = true ]; then
    echo ""
    echo "🐳 Starting Docker services..."
    docker-compose up -d
    
    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo -e "${GREEN}✅ Docker services started${NC}"
else
    echo ""
    echo -e "${YELLOW}Manual Database Setup Required:${NC}"
    echo "1. Install PostgreSQL 15+"
    echo "2. Create a database named 'financial_advisor'"
    echo "3. Update server/.env with your database credentials"
    echo "4. Install and start Redis (optional for caching)"
    echo ""
    read -p "Press Enter when database is ready..."
fi

# Step 3: Run database migrations
echo ""
echo "🗄️  Running database migrations..."
cd server
npm run db:migrate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migrations completed${NC}"
else
    echo -e "${RED}❌ Migration failed. Please check your database configuration.${NC}"
    exit 1
fi

# Step 4: Seed database (optional)
echo ""
read -p "Would you like to seed the database with demo data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:seed
    echo -e "${GREEN}✅ Database seeded with demo data${NC}"
fi

cd ..

# Step 5: Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p server/logs
mkdir -p server/uploads
mkdir -p client/public/assets

echo -e "${GREEN}✅ Directories created${NC}"

# Step 6: Final instructions
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo "=========================================="
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "This will start:"
echo "  - Backend: http://localhost:5000"
echo "  - Frontend: http://localhost:3000"
echo ""
if [ "$USE_DOCKER" = true ]; then
    echo "Docker services:"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo ""
fi
echo "Demo account:"
echo "  Email: demo@example.com"
echo "  Password: Demo123!"
echo ""
echo -e "${YELLOW}⚠️  Don't forget to:${NC}"
echo "  1. Update server/.env with your Anthropic API key"
echo "  2. Review and update security settings for production"
echo "  3. Set up SSL certificates for production deployment"
echo ""
echo "Happy coding! 🚀"