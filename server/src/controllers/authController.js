const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { cache } = require('../config/redis');

// Generate JWT token
const generateToken = (userId, type = 'access') => {
  const secret = type === 'refresh' 
    ? process.env.JWT_REFRESH_SECRET 
    : process.env.JWT_SECRET;
  
  const expiresIn = type === 'refresh'
    ? process.env.JWT_REFRESH_EXPIRE || '30d'
    : process.env.JWT_EXPIRE || '7d';

  return jwt.sign(
    { userId, type },
    secret,
    { expiresIn }
  );
};

// Register new user
const register = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  const { email, password, firstName, lastName } = req.body;

  // Check if user exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Create user in transaction
  const result = await transaction(async (client) => {
    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, verification_token)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, created_at`,
      [email.toLowerCase(), passwordHash, firstName, lastName, verificationToken]
    );

    const user = userResult.rows[0];

    // Create empty profile
    await client.query(
      'INSERT INTO user_profiles (user_id) VALUES ($1)',
      [user.id]
    );

    return user;
  });

  // Generate tokens
  const accessToken = generateToken(result.id);
  const refreshToken = generateToken(result.id, 'refresh');

  // Store refresh token in database
  await query(
    `INSERT INTO sessions (user_id, refresh_token, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      result.id,
      refreshToken,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      req.ip,
      req.get('user-agent')
    ]
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: result.id,
        email: result.email,
        firstName: result.first_name,
        lastName: result.last_name
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  const { email, password } = req.body;

  // Get user with password
  const userResult = await query(
    `SELECT id, email, password_hash, first_name, last_name, is_active, email_verified
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (userResult.rows.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const user = userResult.rows[0];

  // Check if account is active
  if (!user.is_active) {
    return res.status(403).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last login
  await query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  // Generate tokens
  const accessToken = generateToken(user.id);
  const refreshToken = generateToken(user.id, 'refresh');

  // Store refresh token
  await query(
    `INSERT INTO sessions (user_id, refresh_token, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      user.id,
      refreshToken,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      req.ip,
      req.get('user-agent')
    ]
  );

  // Cache user data for quick access
  await cache.set(`user:${user.id}`, {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name
  }, 3600); // 1 hour cache

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        emailVerified: user.email_verified
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

// Refresh token
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if token exists in database and is not expired
    const sessionResult = await query(
      `SELECT user_id FROM sessions 
       WHERE refresh_token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [refreshToken]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = generateToken(decoded.userId);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const userId = req.user.id;

  if (refreshToken) {
    // Remove specific session
    await query(
      'DELETE FROM sessions WHERE user_id = $1 AND refresh_token = $2',
      [userId, refreshToken]
    );
  } else {
    // Remove all sessions for the user
    await query(
      'DELETE FROM sessions WHERE user_id = $1',
      [userId]
    );
  }

  // Clear cache
  await cache.del(`user:${userId}`);

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Get current user
const getMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Try cache first
  let userData = await cache.get(`user:${userId}`);

  if (!userData) {
    // Fetch from database
    const userResult = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.email_verified, u.created_at,
              p.age, p.income_stability, p.risk_tolerance, p.life_stage
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    userData = userResult.rows[0];
    
    // Cache the result
    await cache.set(`user:${userId}`, userData, 3600);
  }

  res.json({
    success: true,
    data: {
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name || userData.firstName,
        lastName: userData.last_name || userData.lastName,
        emailVerified: userData.email_verified || userData.emailVerified,
        profile: {
          age: userData.age,
          incomeStability: userData.income_stability || userData.incomeStability,
          riskTolerance: userData.risk_tolerance || userData.riskTolerance,
          lifeStage: userData.life_stage || userData.lifeStage
        }
      }
    }
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe
};