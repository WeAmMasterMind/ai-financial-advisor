# AI Financial Advisor Application

## Overview
A comprehensive financial planning and advisory application powered by AI, built with React and Tailwind CSS.

## Features
- Budget Analysis & Tracking
- Investment Portfolio Recommendations
- Savings Strategy Planning
- Financial Goals Management
- AI-Powered Financial Advice (Claude API)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Anthropic API key

### Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-financial-advisor
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Anthropic API key:
```
REACT_APP_ANTHROPIC_API_KEY=your-api-key-here
```

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Structure
```
ai-financial-advisor/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── FinancialAdvisorApp.js
│   ├── services/
│   │   └── aiService.js
│   ├── utils/
│   │   └── calculations.js
│   ├── data/
│   │   └── investmentData.js
│   ├── config/
│   │   └── apiConfig.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── .env
├── .gitignore
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Build for Production
```bash
npm run build
```

This creates a production-ready build in the `build` folder.

## Technologies Used
- React 18
- Tailwind CSS
- Lucide React (icons)
- Axios (API calls)
- Anthropic Claude API

## License
MIT