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

// Helper function to execute queries with logging.
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export default async function handler(req, res) {
  // Only allow DELETE method.
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { stock_list_id, user_id } = req.body;

  if (!stock_list_id || !user_id) {
    return res.status(400).json({ error: 'Missing stock_list_id or user_id.' });
  }

  try {
    // Start transaction.
    await query('BEGIN');

    // Verify the stock list exists and is owned by the current user.
    const fetchQuery = `SELECT creator_id FROM StockLists WHERE stock_list_id = $1;`;
    const fetchResult = await query(fetchQuery, [stock_list_id]);
    if (fetchResult.rowCount === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Stock list not found.' });
    }
    const list = fetchResult.rows[0];
    if (list.creator_id !== user_id) {
      await query('ROLLBACK');
      return res.status(403).json({ error: 'Not authorized: only the owner can delete the stock list.' });
    }

    // Delete records from StockListShares.
    const deleteSharesQuery = `DELETE FROM StockListShares WHERE stock_list_id = $1;`;
    await query(deleteSharesQuery, [stock_list_id]);

    // Delete records from StockListItems.
    const deleteItemsQuery = `DELETE FROM StockListItems WHERE stock_list_id = $1;`;
    await query(deleteItemsQuery, [stock_list_id]);

    // Delete all reviews associated with this stock list.
    const deleteReviewsQuery = `DELETE FROM Reviews WHERE stock_list_id = $1;`;
    await query(deleteReviewsQuery, [stock_list_id]);

    // Delete the stock list record.
    const deleteListQuery = `DELETE FROM StockLists WHERE stock_list_id = $1;`;
    await query(deleteListQuery, [stock_list_id]);

    // Commit transaction.
    await query('COMMIT');
    return res.status(200).json({ message: 'Stock list and all associated reviews deleted successfully.' });
  } catch (error) {
    console.error('Error deleting stock list:', error);
    await query('ROLLBACK');
    return res.status(500).json({ error: 'Internal server error.', details: error.message });
  }
}
