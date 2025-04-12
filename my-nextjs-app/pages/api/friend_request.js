// pages/api/friend_request.js
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sender_id, receiver_id } = req.body;
  if (!sender_id || !receiver_id) {
    return res.status(400).json({ error: 'Missing required fields: sender_id and receiver_id.' });
  }

  if (sender_id === receiver_id) {
    return res.status(400).json({ 
      error: "You can't add yourself", 
      popupType: "custom" 
    });
  }

  try {
    // Check if the receiver exists.
    const checkUserQuery = `SELECT * FROM users WHERE user_id = $1`;
    const userResult = await query(checkUserQuery, [receiver_id]);
    if (!userResult.rows.length) {
      return res.status(400).json({ 
        error: "User doesn't exist", 
        popupType: "custom" 
      });
    }

    // Check if they are already friends.
    const friendshipQuery = `
      SELECT * FROM friendships
      WHERE user_id = $1 AND friend_id = $2
    `;
    const friendshipResult = await query(friendshipQuery, [sender_id, receiver_id]);
    if (friendshipResult.rows.length > 0) {
      return res.status(400).json({
        error: `${receiver_id} is already your friend`,
        popupType: "custom"
      });
    }

    // Check for duplicate pending friend requests.
    const duplicateQuery = `
      SELECT * FROM friendrequests 
      WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'
    `;
    const duplicateResult = await query(duplicateQuery, [sender_id, receiver_id]);
    if (duplicateResult.rows.length > 0) {
      return res.status(400).json({ error: "Duplicate request exists" });
    }

    // Use the current time in local format.
    const nowStr = new Date().toLocaleString('sv', { timeZone: 'America/Toronto' });
    const now = new Date(nowStr);

    // Check if a friend deletion has occurred recently.
    // We assume that when a friendship is deleted, an entry is inserted into friend_deletion_cache
    // with user_id = receiver_id and friend_id = sender_id.
    const deletionQuery = `
      SELECT deletion_time 
      FROM friend_deletion_cache 
      WHERE user_id = $1 AND friend_id = $2
      ORDER BY deletion_time DESC
      LIMIT 1
    `;
    const deletionResult = await query(deletionQuery, [receiver_id, sender_id]);
    if (deletionResult.rows.length > 0) {
      const lastDeletionTime = new Date(deletionResult.rows[0].deletion_time);
      const diffMsDeletion = now - lastDeletionTime;
      const fiveMinutesMs = 5 * 60 * 1000;
      if (diffMsDeletion < fiveMinutesMs) {
        const remainingSec = Math.ceil((fiveMinutesMs - diffMsDeletion) / 1000);
        return res.status(400).json({ 
          error: `You have been recently deleted. Wait ${remainingSec} more seconds before sending another friend request.`,
          popupType: "custom"
        });
      }
    }

    // Check for a recent rejection.
    const rejectedQuery = `
      SELECT response_time 
      FROM friendrequests 
      WHERE sender_id = $1 AND receiver_id = $2 AND status = 'rejected'
      ORDER BY response_time DESC
      LIMIT 1
    `;
    const rejectedResult = await query(rejectedQuery, [sender_id, receiver_id]);
    if (rejectedResult.rows.length > 0) {
      const lastResponseTime = new Date(rejectedResult.rows[0].response_time);
      const diffMs = now - lastResponseTime;
      const fiveMinutesMs = 5 * 60 * 1000;
      if (diffMs < fiveMinutesMs) {
        const remainingSec = Math.ceil((fiveMinutesMs - diffMs) / 1000);
        return res.status(400).json({ 
          error: `You have been rejected. Wait ${remainingSec} more seconds before sending another friend request.`,
          popupType: "custom"
        });
      }
    }

    // All checks passed, now insert the friend request.
    const insertQuery = `
      INSERT INTO friendrequests (sender_id, receiver_id, status, request_time)
      VALUES ($1, $2, 'pending', $3)
      RETURNING request_id, sender_id, receiver_id, status, request_time, response_time;
    `;
    const result = await query(insertQuery, [sender_id, receiver_id, nowStr]);
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting friend request:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
