// pages/api/stocks.js
import { Pool } from 'pg';

const pool = new Pool({
  user: 'user',
  host: '34.29.111.220',
  database: 'mydb',
  password: 'abc123',
  port: 5432,
  ssl: false, 
});

export default async function handler(req, res) {
  try {
    const result = await pool.query('SELECT * FROM testtbl;');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
}