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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { portfolio_id } = req.query;
  if (!portfolio_id) {
    return res.status(400).json({ error: 'Missing portfolio_id query parameter' });
  }

  try {
    const queryText = `
      SELECT cash_balance
      FROM portfolios
      WHERE portfolio_id = $1
    `;
    const result = await pool.query(queryText, [portfolio_id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const cashBalance = parseFloat(result.rows[0].cash_balance).toFixed(2);
    return res.status(200).json({ cash_balance: cashBalance });
  } catch (error) {
    console.error('Error fetching cash balance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
