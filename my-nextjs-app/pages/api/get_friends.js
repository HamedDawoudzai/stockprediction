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

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: 'Missing required query parameter: user_id' });
  }
  
  try {
    // Join friendships with users to retrieve friend details.
    const queryText = `
      SELECT f.friend_id, u.first_name, u.last_name, f.established_at
      FROM friendships f
      JOIN users u ON f.friend_id = u.user_id
      WHERE f.user_id = $1
      ORDER BY f.established_at DESC
    `;
    const result = await query(queryText, [user_id]);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching friends:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
