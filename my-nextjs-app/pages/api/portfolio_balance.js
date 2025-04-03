// pages/api/portfolio_balance.js
import { Pool } from 'pg';

const pool = new Pool({
  user: 'myuser',
  host: '34.29.111.220',
  database: 'stock_prediction',
  password: 'abc123',
  port: 5432,
  ssl: false,
  connectionTimeoutMillis: 10000, 
  idleTimeoutMillis: 10000,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let { portfolio_id } = req.query;
  if (!portfolio_id) {
    return res.status(400).json({ error: 'Missing portfolio_id parameter' });
  }

  portfolio_id = portfolio_id.trim(); // 🔧 Ensure no whitespace issues

  try {
    const result = await pool.query(
      'SELECT cash_balance FROM Portfolios WHERE portfolio_id = $1',
      [portfolio_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    return res.status(200).json({ cash_balance: result.rows[0].cash_balance });
  } catch (error) {
    console.error('DB error:', error);
    return res.status(500).json({ error: 'Database query failed', details: error.message });
  }
}
