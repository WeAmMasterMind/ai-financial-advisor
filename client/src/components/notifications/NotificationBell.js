/**
 * Notification Bell Component
 * Sprint 11-12: Header notification indicator
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell } from 'lucide-react';

import {
  fetchNotifications,
  toggleNotificationPanel,
  selectUnreadCount,
  selectNotificationPanelOpen
} from '../../store/features/notificationsSlice';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const unreadCount = useSelector(selectUnreadCount);
  const panelOpen = useSelector(selectNotificationPanelOpen);

  useEffect(() => {
    dispatch(fetchNotifications({ unreadOnly: false, limit: 20 }));
  }, [dispatch]);

  const handleClick = () => {
    dispatch(toggleNotificationPanel());
  };

  return (
    <button
      onClick={handleClick}
      className={`relative p-2 rounded-lg transition-colors ${
        panelOpen ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
      }`}
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
