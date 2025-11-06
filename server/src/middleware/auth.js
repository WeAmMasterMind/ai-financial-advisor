const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const { cache } = require('../config/redis');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is blacklisted (optional security feature)
    const isBlacklisted = await cache.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated'
      });
    }

    // Get user from cache or database
    let user = await cache.get(`user:${decoded.userId}`);

    if (!user) {
      const userResult = await query(
        'SELECT id, email, first_name, last_name, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      user = userResult.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Cache user data
      await cache.set(`user:${user.id}`, user, 3600);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
});

// Optional auth - doesn't fail if no token, but attaches user if valid token
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user = await cache.get(`user:${decoded.userId}`);
    
    if (!user) {
      const userResult = await query(
        'SELECT id, email, first_name, last_name FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );
      
      if (userResult.rows.length > 0) {
        user = userResult.rows[0];
        await cache.set(`user:${user.id}`, user, 3600);
      }
    }
    
    req.user = user;
  } catch (error) {
    // Silently fail - user just won't be attached
    console.log('Optional auth failed silently:', error.message);
  }
  
  next();
});

module.exports = { protect, optionalAuth };