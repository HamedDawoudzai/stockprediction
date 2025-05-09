// pages/api/stocks_for_adding.js
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
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const query = `
      SELECT DISTINCT ON (symbol) symbol AS symbol, "Close" AS price
      FROM daystock
      ORDER BY symbol, "Timestamp" DESC;
    `;
    const result = await pool.query(query);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching stocks for adding:', error);
    return res.status(500).json({ error: 'Database query failed', details: error.message });
  }
}
