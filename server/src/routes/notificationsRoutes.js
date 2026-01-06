/**
 * Notifications Routes
 * Sprint 11-12: User notifications API endpoints
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getPreferences,
  updatePreferences,
  generateNotifications,
  getNotificationCounts
} = require('../controllers/notificationsController');

// All routes require authentication
router.use(protect);

// Notification management
router.get('/', getNotifications);
router.get('/counts', getNotificationCounts);
router.post('/generate', generateNotifications);
router.put('/read-all', markAllAsRead);
router.delete('/read', deleteAllRead);

// Single notification operations
router.get('/:id', getNotification);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// Preferences
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

module.exports = router;
