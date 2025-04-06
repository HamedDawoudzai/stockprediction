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
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // You can filter by sender_id or receiver_id via query parameters.
  const { sender_id, receiver_id } = req.query;
  let baseQuery = 'SELECT * FROM friendrequests';
  const conditions = [];
  const params = [];

  if (sender_id) {
    conditions.push(`sender_id = $${conditions.length + 1}`);
    params.push(sender_id);
  }
  if (receiver_id) {
    conditions.push(`receiver_id = $${conditions.length + 1}`);
    params.push(receiver_id);
  }
  if (conditions.length > 0) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }

  try {
    const result = await query(baseQuery, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching friend requests:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
