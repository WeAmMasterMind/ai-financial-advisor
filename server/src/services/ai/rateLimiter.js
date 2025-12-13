/**
 * AI Rate Limiter
 * Sprint 7-8: Message quota tracking with Redis + PostgreSQL fallback
 * 
 * Limits: 100 messages/day, 20 messages/hour
 */

const { query } = require('../../config/database');
const { cache } = require('../../config/redis');

const LIMITS = {
  DAILY: 100,
  HOURLY: 20
};

const KEYS = {
  daily: (userId) => `ai:quota:daily:${userId}`,
  hourly: (userId) => `ai:quota:hourly:${userId}`
};

/**
 * Check if user has remaining quota
 */
const checkQuota = async (userId) => {
  try {
    const [dailyCount, hourlyCount] = await Promise.all([
      cache.get(KEYS.daily(userId)),
      cache.get(KEYS.hourly(userId))
    ]);

    const daily = parseInt(dailyCount) || 0;
    const hourly = parseInt(hourlyCount) || 0;

    const [dailyTTL, hourlyTTL] = await Promise.all([
      cache.ttl(KEYS.daily(userId)),
      cache.ttl(KEYS.hourly(userId))
    ]);

    const allowed = daily < LIMITS.DAILY && hourly < LIMITS.HOURLY;

    return {
      allowed,
      remaining: {
        daily: Math.max(0, LIMITS.DAILY - daily),
        hourly: Math.max(0, LIMITS.HOURLY - hourly)
      },
      used: {
        daily,
        hourly
      },
      limits: LIMITS,
      resetIn: {
        daily: dailyTTL > 0 ? dailyTTL : getSecondsUntilMidnight(),
        hourly: hourlyTTL > 0 ? hourlyTTL : 3600
      }
    };
  } catch (error) {
    console.error('Redis quota check failed, falling back to DB:', error);
    return checkQuotaFromDB(userId);
  }
};

/**
 * Fallback quota check from PostgreSQL
 */
const checkQuotaFromDB = async (userId) => {
  const result = await query(
    `SELECT message_count FROM ai_usage 
     WHERE user_id = $1 AND date = CURRENT_DATE`,
    [userId]
  );

  const daily = result.rows[0]?.message_count || 0;

  return {
    allowed: daily < LIMITS.DAILY,
    remaining: {
      daily: Math.max(0, LIMITS.DAILY - daily),
      hourly: LIMITS.HOURLY
    },
    used: { daily, hourly: 0 },
    limits: LIMITS,
    resetIn: {
      daily: getSecondsUntilMidnight(),
      hourly: 3600
    }
  };
};

/**
 * Increment usage after a successful message
 */
const incrementUsage = async (userId, tokensUsed = 0) => {
  try {
    const dailyKey = KEYS.daily(userId);
    const hourlyKey = KEYS.hourly(userId);

    const pipeline = cache.multi();
    
    pipeline.incr(dailyKey);
    pipeline.incr(hourlyKey);
    
    const dailyExists = await cache.exists(dailyKey);
    const hourlyExists = await cache.exists(hourlyKey);
    
    if (!dailyExists) {
      pipeline.expire(dailyKey, getSecondsUntilMidnight());
    }
    if (!hourlyExists) {
      pipeline.expire(hourlyKey, 3600);
    }

    await pipeline.exec();

    await query(
      `INSERT INTO ai_usage (user_id, date, message_count, tokens_used)
       VALUES ($1, CURRENT_DATE, 1, $2)
       ON CONFLICT (user_id, date) 
       DO UPDATE SET 
         message_count = ai_usage.message_count + 1,
         tokens_used = ai_usage.tokens_used + $2,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, tokensUsed]
    );

    return true;
  } catch (error) {
    console.error('Failed to increment usage:', error);
    return false;
  }
};

/**
 * Get detailed usage stats for a user
 */
const getUsageStats = async (userId) => {
  try {
    const todayResult = await query(
      `SELECT message_count, tokens_used, created_at
       FROM ai_usage 
       WHERE user_id = $1 AND date = CURRENT_DATE`,
      [userId]
    );

    const weekResult = await query(
      `SELECT 
         SUM(message_count) as total_messages,
         SUM(tokens_used) as total_tokens,
         COUNT(*) as active_days
       FROM ai_usage 
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'`,
      [userId]
    );

    const allTimeResult = await query(
      `SELECT 
         SUM(message_count) as total_messages,
         SUM(tokens_used) as total_tokens,
         MIN(date) as first_use,
         COUNT(*) as total_days
       FROM ai_usage 
       WHERE user_id = $1`,
      [userId]
    );

    const quota = await checkQuota(userId);

    return {
      today: {
        messages: todayResult.rows[0]?.message_count || 0,
        tokens: todayResult.rows[0]?.tokens_used || 0
      },
      week: {
        messages: parseInt(weekResult.rows[0]?.total_messages) || 0,
        tokens: parseInt(weekResult.rows[0]?.total_tokens) || 0,
        activeDays: parseInt(weekResult.rows[0]?.active_days) || 0
      },
      allTime: {
        messages: parseInt(allTimeResult.rows[0]?.total_messages) || 0,
        tokens: parseInt(allTimeResult.rows[0]?.total_tokens) || 0,
        firstUse: allTimeResult.rows[0]?.first_use,
        totalDays: parseInt(allTimeResult.rows[0]?.total_days) || 0
      },
      quota
    };
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    throw error;
  }
};

/**
 * Reset user's daily quota (admin function)
 */
const resetDailyQuota = async (userId) => {
  try {
    await cache.del(KEYS.daily(userId));
    await cache.del(KEYS.hourly(userId));
    return true;
  } catch (error) {
    console.error('Failed to reset quota:', error);
    return false;
  }
};

/**
 * Helper: Get seconds until midnight UTC
 */
const getSecondsUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 1000);
};

/**
 * Middleware to check quota before processing AI requests
 */
const quotaMiddleware = async (req, res, next) => {
  try {
    const quota = await checkQuota(req.user.id);

    if (!quota.allowed) {
      const resetTime = Math.min(quota.resetIn.daily, quota.resetIn.hourly);
      return res.status(429).json({
        success: false,
        message: 'AI message quota exceeded',
        quota,
        retryAfter: resetTime
      });
    }

    req.aiQuota = quota;
    next();
  } catch (error) {
    console.error('Quota middleware error:', error);
    next();
  }
};

module.exports = {
  checkQuota,
  incrementUsage,
  getUsageStats,
  resetDailyQuota,
  quotaMiddleware,
  LIMITS
};