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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, start_date, end_date } = req.query;
  if (!symbol || !start_date || !end_date) {
    return res.status(400).json({ error: 'Missing required parameters: symbol, start_date, end_date' });
  }

  try {
    const queryText = `
      SELECT "Timestamp", "Open", "High", "Low", "Close", "Volume"
      FROM unifiedstockdata
      WHERE symbol = $1 AND "Timestamp" BETWEEN $2 AND $3
      ORDER BY "Timestamp" ASC
    `;
    const result = await pool.query(queryText, [symbol, start_date, end_date]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
