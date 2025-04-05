// pages/api/transactions.js
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
  if (req.method === 'GET') {
    
    const { portfolio_id } = req.query;
    if (!portfolio_id) {
      return res.status(400).json({ error: 'Missing portfolio_id query parameter' });
    }

    try {
     
      const query = `
        SELECT *
        FROM transactions
        WHERE portfolio_id = $1
        ORDER BY transaction_date DESC
      `;
      const values = [portfolio_id];
      const result = await pool.query(query, values);

      
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('DB error:', error);
      return res.status(500).json({ error: 'Database query failed', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
