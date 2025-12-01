require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'financial_advisor',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seeding...');
    
    await client.query('BEGIN');

    // Create demo user
    const hashedPassword = await bcrypt.hash('Demo123!', 10);
    
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING id
    `, ['demo@example.com', hashedPassword, 'Demo', 'User', true]);

    const userId = userResult.rows[0].id;
    console.log('Demo user created/updated');

    // Create user profile
    await client.query(`
      INSERT INTO user_profiles (user_id, age, income_stability, risk_tolerance, life_stage, financial_knowledge_level, investment_horizon)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        age = EXCLUDED.age,
        income_stability = EXCLUDED.income_stability,
        risk_tolerance = EXCLUDED.risk_tolerance,
        life_stage = EXCLUDED.life_stage,
        financial_knowledge_level = EXCLUDED.financial_knowledge_level,
        investment_horizon = EXCLUDED.investment_horizon
    `, [userId, 30, 'stable', 'moderate', 'growth', 3, 'long_term']);

    console.log('User profile created/updated');

    // Create sample budget
    await client.query(`
        INSERT INTO budgets (user_id, month, monthly_income, planned_expenses, savings_goal)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, month) DO NOTHING
        `, [
        userId, 
        '2025-12-01',  // month as date
        5000.00,       // monthly_income
        JSON.stringify({ housing: 1500, food: 500, transportation: 300, utilities: 200, entertainment: 200 }),  // planned_expenses as JSONB
        800.00         // savings_goal
    ]);

    console.log('Sample budget created');

    // Create sample spending categories
    const categories = [
      { name: 'Housing', monthly_limit: 1500 },
      { name: 'Food', monthly_limit: 500 },
      { name: 'Transportation', monthly_limit: 300 },
      { name: 'Utilities', monthly_limit: 200 },
      { name: 'Entertainment', monthly_limit: 200 },
      { name: 'Savings', monthly_limit: 500 }
    ];

    for (const cat of categories) {
      await client.query(`
        INSERT INTO spending_categories (user_id, category_name, monthly_limit)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [userId, cat.name, cat.monthly_limit]);
    }

    console.log('Spending categories created');

    // Create sample portfolio
    const portfolioResult = await client.query(`
        INSERT INTO portfolios (user_id, portfolio_name, risk_level, target_allocation, current_value, is_primary)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
        RETURNING id
        `, [
        userId, 
        'Main Portfolio',      // portfolio_name
        'moderate',            // risk_level
        JSON.stringify({ stocks: 60, bonds: 30, alternatives: 10 }),  // target_allocation
        5000.00,               // current_value
        true                   // is_primary
    ]);

    if (portfolioResult.rows.length > 0) {
      const portfolioId = portfolioResult.rows[0].id;

      // Create sample holdings
      const holdings = [
        { asset_type: 'ETF', symbol: 'VTI', quantity: 10, purchase_price: 220.00 },
        { asset_type: 'ETF', symbol: 'BND', quantity: 15, purchase_price: 75.00 },
        { asset_type: 'Stock', symbol: 'AAPL', quantity: 5, purchase_price: 175.00 }
      ];

      for (const holding of holdings) {
        await client.query(`
          INSERT INTO holdings (portfolio_id, asset_type, symbol, quantity, purchase_price)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT DO NOTHING
        `, [portfolioId, holding.asset_type, holding.symbol, holding.quantity, holding.purchase_price]);
      }

      console.log('Portfolio and holdings created');
    }

    await client.query('COMMIT');
    
    console.log('\nDatabase seeding completed successfully!');
    console.log('\nDemo Account:');
    console.log('  Email: demo@example.com');
    console.log('  Password: Demo123!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));