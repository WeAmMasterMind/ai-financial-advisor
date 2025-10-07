import React, { useState } from 'react';
import { TrendingUp, DollarSign, PiggyBank, Target, Brain, AlertCircle, ChevronRight, Send, Loader2, PieChart, Shield, Zap } from 'lucide-react';
import aiService from '../services/aiService';
import { calculateBudgetAnalysis, getPortfolioAllocation } from '../utils/calculations';
import { investmentRecommendations } from '../data/investmentData';

const FinancialAdvisorApp = () => {
  const [currentView, setCurrentView] = useState('menu');
  const [conversation, setConversation] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState({
    income: '',
    expenses: '',
    savings: '',
    goals: '',
    age: '',
    riskTolerance: 'moderate'
  });

  const menuOptions = [
    { id: 'budget', icon: DollarSign, title: 'Budget Analysis', description: 'Review your income and expenses' },
    { id: 'savings', icon: PiggyBank, title: 'Savings Strategy', description: 'Optimize your saving potential' },
    { id: 'investment', icon: TrendingUp, title: 'Investment Portfolio', description: 'Get personalized investment recommendations' },
    { id: 'goals', icon: Target, title: 'Financial Goals', description: 'Plan for your future objectives' },
    { id: 'advice', icon: Brain, title: 'AI Financial Advisor', description: 'Get personalized financial advice' }
  ];

  const handleGetAdvice = async () => {
    if (!userMessage.trim()) return;
    
    setIsLoading(true);
    const currentMessage = userMessage;
    setUserMessage('');

    try {
      const claudeResponse = await aiService.getFinancialAdvice(
        userData,
        currentMessage,
        conversation
      );
      
      const newConversation = [...conversation, 
        { role: 'user', content: currentMessage },
        { role: 'assistant', content: claudeResponse }
      ];
      
      setConversation(newConversation);
    } catch (error) {
      console.error('Error getting advice:', error);
      setConversation([...conversation, 
        { role: 'user', content: currentMessage },
        { role: 'assistant', content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Menu Component
  const renderMenu = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Financial Advisor</h1>
        <p className="text-blue-100">Your personal finance companion powered by AI</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Setup - Tell us about yourself</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income ($)</label>
            <input
              type="number"
              className="w-full p-2 border rounded-md"
              value={userData.income}
              onChange={(e) => setUserData({...userData, income: e.target.value})}
              placeholder="5000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Expenses ($)</label>
            <input
              type="number"
              className="w-full p-2 border rounded-md"
              value={userData.expenses}
              onChange={(e) => setUserData({...userData, expenses: e.target.value})}
              placeholder="3500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Savings ($)</label>
            <input
              type="number"
              className="w-full p-2 border rounded-md"
              value={userData.savings}
              onChange={(e) => setUserData({...userData, savings: e.target.value})}
              placeholder="10000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              className="w-full p-2 border rounded-md"
              value={userData.age}
              onChange={(e) => setUserData({...userData, age: e.target.value})}
              placeholder="30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Financial Goals</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={userData.goals}
              onChange={(e) => setUserData({...userData, goals: e.target.value})}
              placeholder="e.g., Buy a house, retirement"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Tolerance</label>
            <select
              className="w-full p-2 border rounded-md"
              value={userData.riskTolerance}
              onChange={(e) => setUserData({...userData, riskTolerance: e.target.value})}
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setCurrentView(option.id)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <option.icon className="w-6 h-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold">{option.title}</h3>
                </div>
                <p className="text-gray-600 text-sm">{option.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Investment Portfolio Component
  const renderInvestmentPortfolio = () => {
    const allocation = getPortfolioAllocation(userData.age, userData.riskTolerance);
    const recommendations = investmentRecommendations[userData.riskTolerance];
    const age = parseInt(userData.age) || 30;
    
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => setCurrentView('menu')}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Menu
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6">Investment Portfolio Recommendations</h2>
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                These are educational recommendations only. Please consult with a licensed financial advisor before making investment decisions.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">
              Recommended Asset Allocation
              <span className="text-sm font-normal text-gray-600 ml-2">
                (Age: {age}, Risk: {userData.riskTolerance})
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-semibold text-green-900">Stocks</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{allocation.stocks}%</p>
                <p className="text-xs text-green-700 mt-1">Growth & Capital Appreciation</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Shield className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-semibold text-blue-900">Bonds</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">{allocation.bonds}%</p>
                <p className="text-xs text-blue-700 mt-1">Stability & Income</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center mb-2">
                  <Zap className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-semibold text-purple-900">Alternatives</span>
                </div>
                <p className="text-3xl font-bold text-purple-600">{allocation.alternatives}%</p>
                <p className="text-xs text-purple-700 mt-1">REITs, Commodities, Crypto</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Recommended ETFs</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 font-semibold text-sm border">Symbol</th>
                    <th className="text-left p-3 font-semibold text-sm border">Name</th>
                    <th className="text-left p-3 font-semibold text-sm border">Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.etfs.map((etf, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-3 border font-mono text-sm font-semibold text-blue-600">{etf.symbol}</td>
                      <td className="p-3 border text-sm">{etf.name}</td>
                      <td className="p-3 border text-sm font-medium">{etf.allocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Individual Stock Ideas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.stocks.map((stock, idx) => (
                <div key={idx} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-sm font-bold text-blue-600">{stock.symbol}</span>
                      <p className="text-sm font-medium">{stock.name}</p>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{stock.sector}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Budget Analysis Component
  const renderBudgetAnalysis = () => {
    const analysis = calculateBudgetAnalysis(userData.income, userData.expenses);
    
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => setCurrentView('menu')}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Menu
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Budget Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-green-600">${userData.income || '0'}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-600">${userData.expenses || '0'}</p>
            </div>
            <div className={`${analysis.surplus >= 0 ? 'bg-blue-50' : 'bg-orange-50'} p-4 rounded-lg`}>
              <p className="text-sm text-gray-600">Monthly Surplus</p>
              <p className={`text-2xl font-bold ${analysis.surplus >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                ${analysis.surplus.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Savings Strategy Component
  const renderSavingsStrategy = () => (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => setCurrentView('menu')}
        className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
      >
        ← Back to Menu
      </button>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Savings Strategy</h2>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Emergency Fund</h3>
            <p className="text-gray-600 mb-2">Target: 3-6 months of expenses</p>
            <p className="text-lg font-bold">
              Recommended: ${((parseFloat(userData.expenses) || 0) * 6).toFixed(0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Goals Planning Component  
  const renderGoalsPlanning = () => (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => setCurrentView('menu')}
        className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
      >
        ← Back to Menu
      </button>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Financial Goals Planning</h2>
        
        {userData.goals ? (
          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Your Goals</h3>
            <p className="text-gray-600">{userData.goals}</p>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-gray-600">Add your financial goals in the setup section.</p>
          </div>
        )}
      </div>
    </div>
  );

  // AI Advisor Component
  const renderAIAdvisor = () => (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => setCurrentView('menu')}
        className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
      >
        ← Back to Menu
      </button>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">AI Financial Advisor</h2>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4 h-96 overflow-y-auto">
          {conversation.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Ask me anything about your finances!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversation.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-100 ml-8' 
                      : 'bg-white mr-8'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {msg.role === 'user' ? 'You' : 'AI Advisor'}
                  </p>
                  <p className="text-gray-700">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-3 border rounded-lg"
            placeholder="Ask about budgeting, savings, investments..."
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleGetAdvice()}
            disabled={isLoading}
          />
          <button
            onClick={handleGetAdvice}
            disabled={isLoading || !userMessage.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'menu' && renderMenu()}
      {currentView === 'budget' && renderBudgetAnalysis()}
      {currentView === 'savings' && renderSavingsStrategy()}
      {currentView === 'investment' && renderInvestmentPortfolio()}
      {currentView === 'goals' && renderGoalsPlanning()}
      {currentView === 'advice' && renderAIAdvisor()}
    </div>
  );
};

export default FinancialAdvisorApp;