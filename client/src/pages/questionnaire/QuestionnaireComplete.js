import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, TrendingUp, Shield, Target, ArrowRight } from 'lucide-react';

const QuestionnaireComplete = ({ results }) => {
  const navigate = useNavigate();

  const getRiskColor = (category) => {
    switch (category) {
      case 'conservative': return 'text-blue-600 bg-blue-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'aggressive': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Complete!</h1>
        <p className="text-gray-600">Here's your personalized financial assessment</p>
      </div>

      {/* Scores Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Risk Score */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Risk Tolerance</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-gray-900">{results.riskScore}/10</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getRiskColor(results.riskCategory)}`}>
                {results.riskCategory?.charAt(0).toUpperCase() + results.riskCategory?.slice(1)}
              </span>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-blue-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">{results.riskScore}</span>
            </div>
          </div>
        </div>

        {/* Health Score */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold">Financial Health</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-4xl font-bold ${getHealthColor(results.healthScore)}`}>
                {results.healthScore}/100
              </p>
              <p className="text-gray-500 mt-2">
                {results.healthScore >= 70 ? 'Excellent' : results.healthScore >= 50 ? 'Good' : 'Needs Work'}
              </p>
            </div>
            <div className="w-20 h-20">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={results.healthScore >= 70 ? '#10b981' : results.healthScore >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${results.healthScore}, 100`}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Life Stage */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center mb-4">
          <Target className="w-6 h-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold">Life Stage</h3>
        </div>
        <p className="text-xl text-gray-900 capitalize">
          {results.lifeStage?.replace(/_/g, ' ')}
        </p>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Personalized Recommendations</h3>
        <div className="space-y-4">
          {results.recommendations?.map((rec, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                rec.priority === 'high'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{rec.title}</h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {rec.priority} priority
                </span>
              </div>
              <p className="text-gray-600 mt-1">{rec.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
        <button
          onClick={() => navigate('/budget')}
          className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Set Up Budget
        </button>
      </div>
    </div>
  );
};

export default QuestionnaireComplete;