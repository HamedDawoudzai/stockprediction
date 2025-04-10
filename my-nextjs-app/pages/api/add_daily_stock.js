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
  if (req.method === 'POST') {
    const { timestamp, symbol, open, high, low, close, volume } = req.body;
    if (!timestamp || !symbol || open === undefined || high === undefined || low === undefined || close === undefined || volume === undefined) {
      return res.status(400).json({ error: 'Missing required fields: timestamp, symbol, open, high, low, close, volume' });
    }
    try {
      const checkQuery = 'SELECT symbol FROM stocks_price WHERE symbol = $1';
      const checkResult = await query(checkQuery, [symbol]);
      if (checkResult.rowCount === 0) {
        return res.status(400).json({ error: 'Symbol does not exist in stocks_price' });
      }
    } catch (error) {
      console.error('Error checking symbol existence:', error);
      return res.status(500).json({ error: 'Error checking symbol existence' });
    }
    try {
      const insertQuery = `
        INSERT INTO newdailystock ("Timestamp", "Open", "High", "Low", "Close", "Volume", symbol)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await query(insertQuery, [timestamp, open, high, low, close, volume, symbol]);
      return res.status(201).json({ message: 'New daily stock data recorded successfully.' });
    } catch (error) {
      console.error('Error recording new daily stock data:', error);
      return res.status(500).json({ error: 'Error recording new daily stock data.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
