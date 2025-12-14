import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Target,
  PieChart,
  Zap,
  Info
} from 'lucide-react';
import { fetchSuggestions } from '../../store/features/marketSlice';
import suggestionService from '../../services/suggestionService';
import toast from 'react-hot-toast';

const InvestmentSuggestions = () => {
  const dispatch = useDispatch();
  const { suggestions, suggestionsLoading } = useSelector((state) => state.market);
  const [activeTab, setActiveTab] = useState('suggestions');

  useEffect(() => {
    dispatch(fetchSuggestions());
  }, [dispatch]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await suggestionService.updateSuggestion(id, status);
      toast.success(`Suggestion ${status}`);
      dispatch(fetchSuggestions());
    } catch (error) {
      toast.error('Failed to update suggestion');
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'allocation_gap':
        return <PieChart className="w-5 h-5 text-blue-500" />;
      case 'concentration_warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'diversification':
        return <Target className="w-5 h-5 text-green-500" />;
      case 'sector_gap':
        return <Zap className="w-5 h-5 text-purple-500" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    if (priority >= 8) return 'bg-red-100 text-red-800';
    if (priority >= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (suggestionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Suggestions</h1>
          <p className="text-gray-600">Personalized recommendations based on your risk profile</p>
        </div>
        <button
          onClick={() => dispatch(fetchSuggestions())}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Risk Summary Card */}
      {suggestions && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-blue-100 text-sm">Your Risk Score</p>
              <p className="text-3xl font-bold">{suggestions.riskScore}/10</p>
              <p className="text-blue-100 text-sm mt-1">
                {suggestions.riskScore <= 3 ? 'Conservative' : 
                 suggestions.riskScore <= 6 ? 'Moderate' : 'Aggressive'}
              </p>
            </div>
            
            <div>
              <p className="text-blue-100 text-sm">Current Allocation</p>
              <div className="flex gap-4 mt-2">
                <div>
                  <p className="text-xl font-semibold">{suggestions.currentAllocation?.stocks?.toFixed(0) || 0}%</p>
                  <p className="text-blue-100 text-xs">Stocks</p>
                </div>
                <div>
                  <p className="text-xl font-semibold">{suggestions.currentAllocation?.bonds?.toFixed(0) || 0}%</p>
                  <p className="text-blue-100 text-xs">Bonds</p>
                </div>
                <div>
                  <p className="text-xl font-semibold">{suggestions.currentAllocation?.alternatives?.toFixed(0) || 0}%</p>
                  <p className="text-blue-100 text-xs">Alts</p>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-blue-100 text-sm">Target Allocation</p>
              <div className="flex gap-4 mt-2">
                <div>
                  <p className="text-xl font-semibold">{suggestions.targetAllocation?.stocks || 0}%</p>
                  <p className="text-blue-100 text-xs">Stocks</p>
                </div>
                <div>
                  <p className="text-xl font-semibold">{suggestions.targetAllocation?.bonds || 0}%</p>
                  <p className="text-blue-100 text-xs">Bonds</p>
                </div>
                <div>
                  <p className="text-xl font-semibold">{suggestions.targetAllocation?.alternatives || 0}%</p>
                  <p className="text-blue-100 text-xs">Alts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`py-3 px-1 border-b-2 font-medium ${
              activeTab === 'suggestions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Suggestions ({suggestions?.suggestions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('how')}
            className={`py-3 px-1 border-b-2 font-medium ${
              activeTab === 'how'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            How It Works
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          {(!suggestions?.suggestions || suggestions.suggestions.length === 0) ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Portfolio Looking Good!</h3>
              <p className="text-gray-600 mt-2">
                No urgent suggestions at this time. Your portfolio aligns well with your risk profile.
              </p>
            </div>
          ) : (
            suggestions.suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{suggestion.symbol}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(suggestion.priority)}`}>
                          Priority: {suggestion.priority}/10
                        </span>
                        {suggestion.name && (
                          <span className="text-gray-500 text-sm">{suggestion.name}</span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{suggestion.reason}</p>
                      {suggestion.suggestedAllocation && (
                        <p className="text-sm text-blue-600 mt-2">
                          Suggested allocation: ~{suggestion.suggestedAllocation.toFixed(0)}% of portfolio
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500 capitalize">
                          {suggestion.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {(suggestion.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(suggestion.id, 'accepted')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Accept suggestion"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(suggestion.id, 'dismissed')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Dismiss suggestion"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'how' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            How Suggestions Work
          </h3>
          <div className="space-y-4 text-gray-600">
            <p>
              Our suggestion engine analyzes your portfolio based on several factors:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Risk Profile Match:</strong> Compares your holdings to your questionnaire risk score</li>
              <li><strong>Asset Allocation:</strong> Checks if your stocks/bonds/alternatives ratio matches recommendations</li>
              <li><strong>Diversification:</strong> Identifies concentration risks in any single holding</li>
              <li><strong>Sector Coverage:</strong> Ensures exposure to key market sectors</li>
            </ul>
            <p className="mt-4">
              Suggestions are refreshed whenever you request them and prioritized by urgency. 
              Higher priority items indicate larger gaps between your current and recommended allocation.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-yellow-800 text-sm">
                <strong>Disclaimer:</strong> These suggestions are for educational purposes only and 
                do not constitute financial advice. Always consult with a qualified financial advisor 
                before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentSuggestions;