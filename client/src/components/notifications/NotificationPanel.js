/**
 * Notification Panel Component
 * Sprint 11-12: Dropdown panel showing notifications
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Check,
  CheckCheck,
  Trash2,
  Bell,
  AlertCircle,
  TrendingUp,
  Target,
  DollarSign,
  CreditCard,
  Loader2
} from 'lucide-react';

import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  closeNotificationPanel,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsLoading
} from '../../store/features/notificationsSlice';

const NOTIFICATION_ICONS = {
  price_alert: TrendingUp,
  budget_warning: AlertCircle,
  budget_exceeded: AlertCircle,
  debt_payment_due: CreditCard,
  goal_milestone: Target,
  goal_achieved: Target,
  rebalance_needed: TrendingUp,
  market_news: TrendingUp,
  system: Bell,
  tip: DollarSign
};

const NOTIFICATION_COLORS = {
  price_alert: 'text-blue-600 bg-blue-100',
  budget_warning: 'text-yellow-600 bg-yellow-100',
  budget_exceeded: 'text-red-600 bg-red-100',
  debt_payment_due: 'text-orange-600 bg-orange-100',
  goal_milestone: 'text-purple-600 bg-purple-100',
  goal_achieved: 'text-green-600 bg-green-100',
  rebalance_needed: 'text-blue-600 bg-blue-100',
  market_news: 'text-gray-600 bg-gray-100',
  system: 'text-gray-600 bg-gray-100',
  tip: 'text-green-600 bg-green-100'
};

const NotificationPanel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const isLoading = useSelector(selectNotificationsLoading);

  const handleClose = () => {
    dispatch(closeNotificationPanel());
  };

  const handleMarkAsRead = (e, id) => {
    e.stopPropagation();
    dispatch(markNotificationAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      dispatch(markNotificationAsRead(notification.id));
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      handleClose();
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notification => {
                const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-gray-600 bg-gray-100';

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(e, notification.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                navigate('/notifications');
                handleClose();
              }}
              className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPanel;
