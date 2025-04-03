// pages/api/login.js
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  try {
    const queryText = 'SELECT * FROM Users WHERE user_id = $1 AND password = $2';
    const values = [username, password];
    const result = await pool.query(queryText, values);

    if (result.rows.length > 0) {
      return res.status(200).json({ message: 'Login successful', user: result.rows[0] });
    } else {
      return res.status(401).json({ error: 'Invalid username or password. Please sign up if you do not have an account.' });
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database query failed', details: error.message });
  }
}
