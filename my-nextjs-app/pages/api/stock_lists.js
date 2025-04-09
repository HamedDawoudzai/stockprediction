// pages/api/stock_lists.js
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

// Helper function to execute SQL queries with basic logging.
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
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { filter, user_id } = req.query;

  // For private and shared lists, user_id is required.
  if ((filter === 'private' || filter === 'shared') && !user_id) {
    return res.status(400).json({
      error: 'Missing user_id query parameter for this filter.'
    });
  }

  try {
    let queryText = '';
    let queryParams = [];

    // We'll use a correlated subquery with string_agg to fetch the shared user IDs as a
    // comma-separated string for each stock list.
    if (filter === 'public') {
      queryText = `
        SELECT 
          sl.stock_list_id,
          sl.description,
          sl.visibility,
          sl.creator_id,
          COALESCE(
            (SELECT string_agg(ss.shared_with_user_id, ', ')
             FROM StockListShares ss
             WHERE ss.stock_list_id = sl.stock_list_id),
            ''
          ) AS shared_with
        FROM StockLists sl
        WHERE sl.visibility = 'public'
      `;
    } else if (filter === 'private') {
      queryText = `
        SELECT 
          sl.stock_list_id,
          sl.description,
          sl.visibility,
          sl.creator_id,
          COALESCE(
            (SELECT string_agg(ss.shared_with_user_id, ', ')
             FROM StockListShares ss
             WHERE ss.stock_list_id = sl.stock_list_id),
            ''
          ) AS shared_with
        FROM StockLists sl
        WHERE sl.visibility = 'private'
          AND sl.creator_id = $1
      `;
      queryParams = [user_id];
    } else if (filter === 'shared') {
      // For shared lists, we want stock lists where:
      // - The list has visibility 'shared'
      // - AND either the current user is the creator OR the list is shared with the current user.
      queryText = `
        SELECT 
          sl.stock_list_id,
          sl.description,
          sl.visibility,
          sl.creator_id,
          COALESCE(
            (SELECT string_agg(ss.shared_with_user_id, ', ')
             FROM StockListShares ss
             WHERE ss.stock_list_id = sl.stock_list_id),
            ''
          ) AS shared_with
        FROM StockLists sl
        WHERE sl.visibility = 'shared'
          AND (
            sl.creator_id = $1
            OR EXISTS (
              SELECT 1 FROM StockListShares ss 
              WHERE ss.stock_list_id = sl.stock_list_id AND ss.shared_with_user_id = $1
            )
          )
      `;
      queryParams = [user_id];
    } else {
      return res.status(400).json({
        error: 'Invalid filter parameter. Use "public", "private", or "shared".'
      });
    }

    const result = await query(queryText, queryParams);

    // Map the rows to a consistent structure for the front end.
    const lists = result.rows.map((row) => ({
      stock_list_id: row.stock_list_id,
      description: row.description,
      visibility: row.visibility,
      creator_id: row.creator_id,
      shared_with: row.shared_with, // this is now a comma-separated string (or empty string)
    }));

    return res.status(200).json({ lists });
  } catch (error) {
    console.error('Error fetching stock lists:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
