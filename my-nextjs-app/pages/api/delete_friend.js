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
    // Delete the friendship from the friendships table.
    const deleteQuery = `
      DELETE FROM friendships 
      WHERE (user_id = $1 AND friend_id = $2)
         OR (user_id = $2 AND friend_id = $1)
    `;
    await query(deleteQuery, [user_id, friend_id]);

    // Insert or update a record in friend_deletion_cache.
    // This records the deletion time in local time (America/Toronto)
    // so that the deleted user (friend_id) will not be allowed to send a new friend request
    // to user_id for 5 minutes.
    const insertDeletionQuery = `
      INSERT INTO friend_deletion_cache (user_id, friend_id, deletion_time)
      VALUES ($1, $2, NOW() AT TIME ZONE 'America/Toronto')
      ON CONFLICT (user_id, friend_id)
      DO UPDATE SET deletion_time = NOW() AT TIME ZONE 'America/Toronto';
    `;
    // Here, we assume that when a friendship is deleted, the friend being removed
    // (friend_id) is the one we want to block from sending a new request to user_id.
    await query(insertDeletionQuery, [user_id, friend_id]);

    return res.status(200).json({ message: 'Friendship deleted successfully.' });
  } catch (err) {
    console.error('Error deleting friendship:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
