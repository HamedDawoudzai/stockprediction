// pages/api/portfolio_stocks.js
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
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { portfolio_id } = req.query;
  if (!portfolio_id) {
    res.status(400).json({ error: 'Missing portfolio_id query parameter' });
    return;
  }

  try {
    const queryText = `SELECT * FROM portfoliostocks WHERE portfolio_id = $1`;
    const result = await pool.query(queryText, [portfolio_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching portfolio stocks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
