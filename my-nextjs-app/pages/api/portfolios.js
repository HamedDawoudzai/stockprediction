// pages/api/portfolios.js
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
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { user } = req.query;
  if (!user) {
    res.status(400).json({ error: 'Missing user parameter' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM Portfolios WHERE user_id = $1',
      [user]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database query failed', details: err.message });
  }
}
