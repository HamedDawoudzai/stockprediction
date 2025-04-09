// pages/api/delete_review.js
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

  const { reviewer_id, stock_list_id, user_id } = req.body;
  if (!reviewer_id || !stock_list_id || !user_id) {
    return res.status(400).json({
      error: 'Missing required fields: reviewer_id, stock_list_id, user_id',
    });
  }

  try {
    // Retrieve the creator of the stock list from the StockLists table.
    const stockListQuery = `
      SELECT creator_id
      FROM StockLists
      WHERE stock_list_id = $1
    `;
    const result = await query(stockListQuery, [stock_list_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Stock list not found' });
    }
    const { creator_id } = result.rows[0];

    // Authorization: Allow deletion if the requester is either the reviewer or the creator of the stock list.
    if (user_id !== reviewer_id && user_id !== creator_id) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    // Delete the review
    const deleteQuery = `
      DELETE FROM Reviews
      WHERE reviewer_id = $1 AND stock_list_id = $2
    `;
    await query(deleteQuery, [reviewer_id, stock_list_id]);

    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
