// pages/api/stocklist_items.js
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
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { stock_list_id } = req.query;
  if (!stock_list_id) {
    return res.status(400).json({ error: 'Missing stock_list_id query parameter.' });
  }
  
  try {
    const queryText = `
      SELECT *
      FROM StockListItems
      WHERE stock_list_id = $1;
    `;
    const result = await pool.query(queryText, [stock_list_id]);
    return res.status(200).json({ items: result.rows });
  } catch (error) {
    console.error('Error fetching stock list items:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
