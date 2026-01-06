/**
 * Notifications Controller
 * Sprint 11-12: User notification management
 */

const asyncHandler = require('express-async-handler');
const { query, transaction } = require('../config/database');

// Get all notifications for user
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { unreadOnly = false, type, limit = 50, offset = 0 } = req.query;

  let sql = `
    SELECT * FROM notifications
    WHERE user_id = $1
      AND (expires_at IS NULL OR expires_at > NOW())
  `;
  const params = [userId];
  let paramIndex = 2;

  if (unreadOnly === 'true') {
    sql += ` AND is_read = false`;
  }

  if (type) {
    sql += ` AND type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }

  sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit), parseInt(offset));

  const result = await query(sql, params);

  // Get unread count
  const unreadCount = await query(
    `SELECT COUNT(*) FROM notifications 
     WHERE user_id = $1 AND is_read = false 
     AND (expires_at IS NULL OR expires_at > NOW())`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      notifications: result.rows,
      unreadCount: parseInt(unreadCount.rows[0].count),
      hasMore: result.rows.length === parseInt(limit)
    }
  });
});

// Get single notification
const getNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await query(
    `UPDATE notifications 
     SET is_read = true, read_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    `UPDATE notifications 
     SET is_read = true, read_at = NOW()
     WHERE user_id = $1 AND is_read = false
     RETURNING id`,
    [userId]
  );

  res.json({
    success: true,
    message: `${result.rows.length} notifications marked as read`
  });
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.json({
    success: true,
    message: 'Notification deleted'
  });
});

// Delete all read notifications
const deleteAllRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    'DELETE FROM notifications WHERE user_id = $1 AND is_read = true RETURNING id',
    [userId]
  );

  res.json({
    success: true,
    message: `${result.rows.length} notifications deleted`
  });
});

// Create notification (internal use)
const createNotification = async (userId, notificationData) => {
  const {
    type,
    title,
    message,
    priority = 'normal',
    actionUrl,
    metadata = {},
    expiresAt
  } = notificationData;

  const result = await query(
    `INSERT INTO notifications 
     (user_id, type, title, message, priority, action_url, metadata, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, type, title, message, priority, actionUrl, JSON.stringify(metadata), expiresAt]
  );

  return result.rows[0];
};

// Get notification preferences
const getPreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  let result = await query(
    'SELECT * FROM notification_preferences WHERE user_id = $1',
    [userId]
  );

  // Create default preferences if not exist
  if (result.rows.length === 0) {
    result = await query(
      `INSERT INTO notification_preferences (user_id) VALUES ($1) RETURNING *`,
      [userId]
    );
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

// Update notification preferences
const updatePreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    priceAlerts,
    budgetAlerts,
    debtReminders,
    goalUpdates,
    rebalanceAlerts,
    marketNews,
    tipsEnabled,
    quietHoursStart,
    quietHoursEnd
  } = req.body;

  const result = await query(
    `INSERT INTO notification_preferences (user_id, price_alerts, budget_alerts, 
       debt_reminders, goal_updates, rebalance_alerts, market_news, tips_enabled,
       quiet_hours_start, quiet_hours_end)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (user_id) DO UPDATE SET
       price_alerts = COALESCE($2, notification_preferences.price_alerts),
       budget_alerts = COALESCE($3, notification_preferences.budget_alerts),
       debt_reminders = COALESCE($4, notification_preferences.debt_reminders),
       goal_updates = COALESCE($5, notification_preferences.goal_updates),
       rebalance_alerts = COALESCE($6, notification_preferences.rebalance_alerts),
       market_news = COALESCE($7, notification_preferences.market_news),
       tips_enabled = COALESCE($8, notification_preferences.tips_enabled),
       quiet_hours_start = COALESCE($9, notification_preferences.quiet_hours_start),
       quiet_hours_end = COALESCE($10, notification_preferences.quiet_hours_end),
       updated_at = NOW()
     RETURNING *`,
    [userId, priceAlerts, budgetAlerts, debtReminders, goalUpdates,
     rebalanceAlerts, marketNews, tipsEnabled, quietHoursStart, quietHoursEnd]
  );

  res.json({
    success: true,
    message: 'Preferences updated',
    data: result.rows[0]
  });
});

// Check and generate budget alerts
const checkBudgetAlerts = async (userId) => {
  const alerts = [];

  // Check for overspent categories
  const overspent = await query(
    `SELECT 
      sc.category_name,
      sc.monthly_limit,
      COALESCE(SUM(t.amount), 0) as spent
    FROM spending_categories sc
    LEFT JOIN transactions t ON t.user_id = sc.user_id 
      AND t.category = sc.category_name
      AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)
      AND t.type = 'expense'
    WHERE sc.user_id = $1 AND sc.monthly_limit > 0
    GROUP BY sc.id, sc.category_name, sc.monthly_limit
    HAVING COALESCE(SUM(t.amount), 0) >= sc.monthly_limit * 0.9`,
    [userId]
  );

  for (const cat of overspent.rows) {
    const percent = (cat.spent / cat.monthly_limit * 100).toFixed(0);
    const isOver = cat.spent >= cat.monthly_limit;

    alerts.push({
      type: isOver ? 'budget_exceeded' : 'budget_warning',
      title: isOver ? `Budget Exceeded: ${cat.category_name}` : `Budget Warning: ${cat.category_name}`,
      message: `You've spent $${cat.spent.toFixed(0)} of your $${cat.monthly_limit.toFixed(0)} ${cat.category_name} budget (${percent}%)`,
      priority: isOver ? 'high' : 'normal',
      actionUrl: '/budget',
      metadata: { category: cat.category_name, spent: cat.spent, limit: cat.monthly_limit }
    });
  }

  return alerts;
};

// Check and generate goal milestone alerts
const checkGoalMilestones = async (userId) => {
  const alerts = [];
  const milestones = [25, 50, 75, 90, 100];

  const goals = await query(
    `SELECT 
      id, name, target_amount, current_amount,
      ROUND((current_amount / target_amount * 100)::numeric, 0) as progress
    FROM financial_goals
    WHERE user_id = $1 AND is_completed = false AND target_amount > 0`,
    [userId]
  );

  for (const goal of goals.rows) {
    const progress = parseInt(goal.progress);
    
    for (const milestone of milestones) {
      if (progress >= milestone && progress < milestone + 5) {
        // Check if we already sent this milestone notification
        const existing = await query(
          `SELECT id FROM notifications 
           WHERE user_id = $1 AND type = 'goal_milestone'
           AND metadata->>'goalId' = $2
           AND metadata->>'milestone' = $3
           AND created_at > CURRENT_DATE - INTERVAL '30 days'`,
          [userId, goal.id, milestone.toString()]
        );

        if (existing.rows.length === 0) {
          alerts.push({
            type: milestone === 100 ? 'goal_achieved' : 'goal_milestone',
            title: milestone === 100 ? `🎉 Goal Achieved: ${goal.name}` : `Milestone: ${goal.name}`,
            message: milestone === 100 
              ? `Congratulations! You've reached your goal of $${goal.target_amount.toLocaleString()}!`
              : `You're ${milestone}% of the way to your ${goal.name} goal!`,
            priority: milestone === 100 ? 'high' : 'normal',
            actionUrl: `/goals/${goal.id}`,
            metadata: { goalId: goal.id, milestone: milestone.toString() }
          });
        }
        break;
      }
    }
  }

  return alerts;
};

// Generate all pending notifications for user
const generateNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get user preferences
  const prefs = await query(
    'SELECT * FROM notification_preferences WHERE user_id = $1',
    [userId]
  );

  const preferences = prefs.rows[0] || {};
  const generated = [];

  // Budget alerts
  if (preferences.budget_alerts !== false) {
    const budgetAlerts = await checkBudgetAlerts(userId);
    for (const alert of budgetAlerts) {
      const notification = await createNotification(userId, alert);
      generated.push(notification);
    }
  }

  // Goal milestones
  if (preferences.goal_updates !== false) {
    const goalAlerts = await checkGoalMilestones(userId);
    for (const alert of goalAlerts) {
      const notification = await createNotification(userId, alert);
      generated.push(notification);
    }
  }

  res.json({
    success: true,
    message: `Generated ${generated.length} notifications`,
    data: generated
  });
});

// Get notification counts by type
const getNotificationCounts = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    `SELECT 
      type,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_read = false) as unread
    FROM notifications
    WHERE user_id = $1
      AND (expires_at IS NULL OR expires_at > NOW())
    GROUP BY type`,
    [userId]
  );

  const totalUnread = await query(
    `SELECT COUNT(*) FROM notifications 
     WHERE user_id = $1 AND is_read = false
     AND (expires_at IS NULL OR expires_at > NOW())`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      byType: result.rows,
      totalUnread: parseInt(totalUnread.rows[0].count)
    }
  });
});

module.exports = {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  createNotification,
  getPreferences,
  updatePreferences,
  generateNotifications,
  getNotificationCounts,
  // Export for internal use
  checkBudgetAlerts,
  checkGoalMilestones
};
