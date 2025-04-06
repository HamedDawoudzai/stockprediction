// pages/api/accept_request.js
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
  // Only accept PUT requests.
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { request_id, receiver_id } = req.body;
  if (!request_id || !receiver_id) {
    return res
      .status(400)
      .json({ error: 'Missing required fields: request_id and receiver_id.' });
  }

  try {
    // Retrieve the friend request to ensure it exists and is still pending.
    const selectQuery = `
      SELECT sender_id 
      FROM friendrequests 
      WHERE request_id = $1 AND receiver_id = $2 AND status = 'pending'
    `;
    const selectResult = await query(selectQuery, [request_id, receiver_id]);
    if (!selectResult.rows.length) {
      return res.status(400).json({ error: 'Friend request not found or already processed.' });
    }
    const sender_id = selectResult.rows[0].sender_id;
    const now = new Date();

    // Update the friend request record to "accepted" and set response_time.
    const updateQuery = `
      UPDATE friendrequests
      SET status = 'accepted', response_time = $2
      WHERE request_id = $1
      RETURNING request_id, sender_id, receiver_id, status, request_time, response_time;
    `;
    const updateResult = await query(updateQuery, [request_id, now]);

    // Insert mutual friendship records (both directions).
    const insertFriendshipQuery = `
      INSERT INTO friendships (user_id, friend_id, established_at)
      VALUES ($1, $2, $3), ($2, $1, $3)
    `;
    await query(insertFriendshipQuery, [receiver_id, sender_id, now]);

    return res.status(200).json({
      message: 'Friend request accepted. Friendship established.',
      request: updateResult.rows[0],
    });
  } catch (err) {
    console.error('Error accepting friend request:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
