/**
 * Notification Settings Page
 * Sprint 11-12: Manage notification preferences
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  TrendingUp,
  Target,
  CreditCard,
  DollarSign,
  Newspaper,
  Lightbulb,
  Clock,
  Loader2,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  selectNotificationPreferences,
  selectNotificationsLoading
} from '../../store/features/notificationsSlice';

const NotificationSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const preferences = useSelector(selectNotificationPreferences);
  const isLoading = useSelector(selectNotificationsLoading);

  const [formData, setFormData] = useState({
    priceAlerts: true,
    budgetAlerts: true,
    debtReminders: true,
    goalUpdates: true,
    rebalanceAlerts: true,
    marketNews: false,
    tipsEnabled: true,
    quietHoursStart: '',
    quietHoursEnd: ''
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    dispatch(fetchNotificationPreferences());
  }, [dispatch]);

  useEffect(() => {
    if (preferences) {
      setFormData({
        priceAlerts: preferences.price_alerts ?? true,
        budgetAlerts: preferences.budget_alerts ?? true,
        debtReminders: preferences.debt_reminders ?? true,
        goalUpdates: preferences.goal_updates ?? true,
        rebalanceAlerts: preferences.rebalance_alerts ?? true,
        marketNews: preferences.market_news ?? false,
        tipsEnabled: preferences.tips_enabled ?? true,
        quietHoursStart: preferences.quiet_hours_start || '',
        quietHoursEnd: preferences.quiet_hours_end || ''
      });
    }
  }, [preferences]);

  const handleToggle = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    setHasChanges(true);
  };

  const handleTimeChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const result = await dispatch(updateNotificationPreferences(formData));
    if (!result.error) {
      toast.success('Preferences saved');
      setHasChanges(false);
    } else {
      toast.error('Failed to save preferences');
    }
  };

  const notificationTypes = [
    {
      key: 'priceAlerts',
      icon: TrendingUp,
      title: 'Price Alerts',
      description: 'Get notified when watched assets hit your target prices',
      color: 'text-blue-500'
    },
    {
      key: 'budgetAlerts',
      icon: DollarSign,
      title: 'Budget Alerts',
      description: 'Warnings when approaching or exceeding budget limits',
      color: 'text-yellow-500'
    },
    {
      key: 'debtReminders',
      icon: CreditCard,
      title: 'Debt Reminders',
      description: 'Payment due date reminders and payoff milestones',
      color: 'text-red-500'
    },
    {
      key: 'goalUpdates',
      icon: Target,
      title: 'Goal Updates',
      description: 'Progress milestones and goal achievement notifications',
      color: 'text-purple-500'
    },
    {
      key: 'rebalanceAlerts',
      icon: DollarSign,
      title: 'Rebalance Alerts',
      description: 'Notifications when your portfolio drifts from targets',
      color: 'text-indigo-500'
    },
    {
      key: 'marketNews',
      icon: Newspaper,
      title: 'Market News',
      description: 'Important market updates and news affecting your holdings',
      color: 'text-cyan-500'
    },
    {
      key: 'tipsEnabled',
      icon: Lightbulb,
      title: 'Financial Tips',
      description: 'Personalized tips to improve your financial health',
      color: 'text-teal-500'
    }
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600">Manage how and when you receive notifications</p>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-xl shadow divide-y divide-gray-100">
        {notificationTypes.map(type => {
          const Icon = type.icon;
          return (
            <div 
              key={type.key}
              className="flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100`}>
                  <Icon className={`w-5 h-5 ${type.color}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{type.title}</p>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={() => handleToggle(type.key)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  formData[type.key] ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    formData[type.key] ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <div>
            <h2 className="font-semibold text-gray-900">Quiet Hours</h2>
            <p className="text-sm text-gray-500">
              Pause notifications during specific hours
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={formData.quietHoursStart}
              onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={formData.quietHoursEnd}
              onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Leave blank to receive notifications anytime
        </p>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">About Notifications</p>
            <p className="mt-1">
              Notifications appear in the app. Email and push notifications 
              will be available in a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
