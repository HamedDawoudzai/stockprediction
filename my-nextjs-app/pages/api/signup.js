import { Pool } from 'pg';

const pool = new Pool({
  user: 'myuser',
  host: '34.29.111.220',
  database: 'stock_prediction',
  password: 'abc123',
  port: 5432,
  ssl: false,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password, firstName, lastName } = req.body;
  if (!username || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Generate a default portfolio ID (you can modify this logic as needed)
  const defaultPortfolioId = `${username}_base`;

  try {
    // Start a transaction
    await pool.query('BEGIN');

    // Insert the new user into the Users table.
    const insertUserQuery = `
      INSERT INTO Users (user_id, password, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const userValues = [username, password, firstName, lastName];
    const userResult = await pool.query(insertUserQuery, userValues);
    const newUser = userResult.rows[0];

    // Create the default portfolio for the new user.
    const insertPortfolioQuery = `
      INSERT INTO Portfolios (portfolio_id, user_id, cash_balance)
      VALUES ($1, $2, 0)
      RETURNING *;
    `;
    const portfolioValues = [defaultPortfolioId, username];
    const portfolioResult = await pool.query(insertPortfolioQuery, portfolioValues);
    const newPortfolio = portfolioResult.rows[0];

    // Commit the transaction.
    await pool.query('COMMIT');

    return res.status(201).json({ 
      message: 'User and default portfolio created successfully',
      user: newUser,
      portfolio: newPortfolio 
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database query failed', details: error.message });
  }
}
