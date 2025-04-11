// pages/api/unified_prices.js
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
  
  const { symbol, start_date, end_date } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'Missing required parameter: symbol.' });
  }
  
  try {
    // Build query conditionally if a date range is provided.
    let queryText = `
      SELECT "Timestamp", "Close", symbol
      FROM unifiedstockdata
      WHERE symbol = $1
    `;
    const params = [symbol];
    if (start_date && end_date) {
      queryText += ` AND "Timestamp" BETWEEN $2 AND $3 `;
      params.push(start_date, end_date);
    }
    queryText += ` ORDER BY "Timestamp" ASC `;
    
    const { rows } = await query(queryText, params);
    // Format Timestamp to a YYYY-MM-DD string.
    const formattedRows = rows.map(row => ({
      symbol: row.symbol,
      close: row.Close,
      date: new Date(row.Timestamp).toISOString().split('T')[0],
    }));
    
    return res.status(200).json(formattedRows);
  } catch (error) {
    console.error('Error retrieving unified price data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
