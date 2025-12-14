import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import userReducer from './features/userSlice';
import uiReducer from './features/uiSlice';
import questionnaireReducer from './features/questionnaireSlice';
import budgetReducer from './features/budgetSlice';
import transactionReducer from './features/transactionSlice';
import debtReducer from './features/debtSlice';
import portfolioReducer from './features/portfolioSlice';
import aiReducer from './features/aiSlice';
import marketReducer from './features/marketSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    ui: uiReducer,
    questionnaire: questionnaireReducer,
    budget: budgetReducer,
    transactions: transactionReducer,
    debt: debtReducer,
    portfolio: portfolioReducer,
    ai: aiReducer,
    market: marketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;