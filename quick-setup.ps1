# PowerShell Setup Script for Financial Advisor Platform

Write-Host "Financial Advisor Platform - Quick Setup" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit
}

# Check current directory
Write-Host ""
Write-Host "Setting up in: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Create directory structure
Write-Host "Creating directory structure..." -ForegroundColor Yellow

$directories = @(
    "server\src\config",
    "server\src\controllers", 
    "server\src\middleware",
    "server\src\routes",
    "server\src\db",
    "client\src\components\layout",
    "client\src\pages\auth",
    "client\src\services",
    "client\src\store\features",
    "client\public",
    "database"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Gray
    }
}

Write-Host "✓ Directory structure created" -ForegroundColor Green
Write-Host ""

# Initialize root package.json
Write-Host "Creating root package.json..." -ForegroundColor Yellow
$rootPackageJson = @'
{
  "name": "financial-advisor-platform",
  "version": "1.0.0",
  "description": "AI-powered financial advisor application",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
    "server:dev": "cd server && npm run dev",
    "client:dev": "cd client && npm start",
    "install:all": "npm install && cd server && npm install && cd ../client && npm install",
    "build": "cd client && npm run build",
    "start": "cd server && npm start"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
'@
Set-Content -Path "package.json" -Value $rootPackageJson
Write-Host "✓ Root package.json created" -ForegroundColor Green

# Install root dependencies
Write-Host ""
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install

# Setup server
Write-Host ""
Write-Host "Setting up server..." -ForegroundColor Yellow
Set-Location server

# Create server package.json
$serverPackageJson = @'
{
  "name": "financial-advisor-server",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "db:migrate": "node src/db/migrate.js",
    "db:seed": "node src/db/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.1",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "express-async-handler": "^1.2.0",
    "morgan": "^1.10.0",
    "redis": "^4.6.11"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
'@
Set-Content -Path "package.json" -Value $serverPackageJson

# Create .env.example
$envExample = @'
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_advisor
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
CLIENT_URL=http://localhost:3000
'@
Set-Content -Path ".env.example" -Value $envExample

# Copy .env.example to .env
Copy-Item ".env.example" -Destination ".env"

Write-Host "Installing server dependencies..." -ForegroundColor Yellow
npm install

Set-Location ..

# Setup client
Write-Host ""
Write-Host "Setting up client..." -ForegroundColor Yellow
Set-Location client

# Create client package.json
$clientPackageJson = @'
{
  "name": "financial-advisor-client",
  "version": "0.1.0",
  "private": true,
  "proxy": "http://localhost:5000",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "react-redux": "^9.0.4",
    "@reduxjs/toolkit": "^2.0.1",
    "axios": "^1.6.2",
    "lucide-react": "^0.294.0",
    "react-hook-form": "^7.48.2",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "react-scripts": "5.0.1",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": ["react-app"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
'@
Set-Content -Path "package.json" -Value $clientPackageJson

# Create public/index.html
$indexHtml = @'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="AI-powered financial advisor application" />
    <title>Financial Advisor</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
'@
Set-Content -Path "public\index.html" -Value $indexHtml

Write-Host "Installing client dependencies..." -ForegroundColor Yellow
npm install

Set-Location ..

# Create docker-compose.yml
$dockerCompose = @'
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: financial_advisor_db
    environment:
      POSTGRES_DB: financial_advisor
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
'@
Set-Content -Path "docker-compose.yml" -Value $dockerCompose

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "✓ Basic setup completed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. You need to copy all the artifact code files to their respective locations" -ForegroundColor White
Write-Host "2. Update server\.env with your database password" -ForegroundColor White
Write-Host "3. Set up PostgreSQL database (manually or using Docker)" -ForegroundColor White
Write-Host "4. Run database migrations: cd server && npm run db:migrate" -ForegroundColor White
Write-Host "5. Start the application: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "For PostgreSQL setup without Docker:" -ForegroundColor Cyan
Write-Host "- Install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
Write-Host "- Create database: CREATE DATABASE financial_advisor;" -ForegroundColor Gray
Write-Host "- Update the password in server\.env" -ForegroundColor Gray