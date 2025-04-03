// pages/api/create_portfolio.js
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

  const { portfolioName, user } = req.body;
  if (!portfolioName || !user) {
    return res.status(400).json({ error: 'Missing portfolio name or user parameter' });
  }

  try {
    const queryText = `
      INSERT INTO Portfolios (portfolio_id, user_id, cash_balance)
      VALUES ($1, $2, 0)
      RETURNING *;
    `;
    const values = [portfolioName, user];
    const result = await pool.query(queryText, values);
    return res.status(201).json({ message: 'Portfolio created successfully', portfolio: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database query failed', details: error.message });
  }
}
