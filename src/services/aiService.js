import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';

class AIService {
  constructor() {
    // In production, get this from environment variable
    this.apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY || 'YOUR_API_KEY_HERE';
  }

  async getFinancialAdvice(userData, userMessage, conversation = []) {
    const contextPrompt = this.buildContextPrompt(userData, userMessage);
    
    try {
      const response = await axios.post(
        API_CONFIG.ANTHROPIC_API_URL,
        {
          model: API_CONFIG.MODEL,
          max_tokens: API_CONFIG.MAX_TOKENS,
          messages: [
            ...conversation,
            { role: 'user', content: contextPrompt }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  buildContextPrompt(userData, userMessage) {
    return `You are a helpful financial advisor. The user has provided the following financial information:
- Monthly Income: $${userData.income || 'Not specified'}
- Monthly Expenses: $${userData.expenses || 'Not specified'}
- Current Savings: $${userData.savings || 'Not specified'}
- Financial Goals: ${userData.goals || 'Not specified'}
- Age: ${userData.age || 'Not specified'}
- Risk Tolerance: ${userData.riskTolerance}

Based on this context, please provide personalized financial advice. Be specific, actionable, and encouraging. Keep responses concise (under 200 words).

User's question: ${userMessage}`;
  }
}

export default new AIService();
