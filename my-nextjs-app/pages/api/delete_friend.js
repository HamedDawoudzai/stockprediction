// pages/api/delete_friend.js
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
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, friend_id } = req.body;
  if (!user_id || !friend_id) {
    return res.status(400).json({ error: 'Missing required fields: user_id and friend_id.' });
  }

  try {
 
    const deleteQuery = `
      DELETE FROM friendships 
      WHERE (user_id = $1 AND friend_id = $2)
         OR (user_id = $2 AND friend_id = $1)
    `;
    await query(deleteQuery, [user_id, friend_id]);
    return res.status(200).json({ message: 'Friendship deleted successfully.' });
  } catch (err) {
    console.error('Error deleting friendship:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
