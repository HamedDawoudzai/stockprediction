// pages/api/stocks_comparison.js
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

  const { portfolio_id, from_date, to_date } = req.query;
  if (!portfolio_id || !from_date || !to_date) {
    return res.status(400).json({
      error: 'Missing required query parameters: portfolio_id, from_date, and to_date',
    });
  }

  try {
    const queryText = `
      WITH portfolio_symbols AS (
        SELECT DISTINCT symbol
        FROM PortfolioStocks
        WHERE portfolio_id = $1
      ),
      stock_returns AS (
        SELECT symbol, "Timestamp" AS time,
                ( "Close" - LAG("Close") OVER (PARTITION BY symbol ORDER BY "Timestamp") )
                / LAG("Close") OVER (PARTITION BY symbol ORDER BY "Timestamp") AS return
        FROM unifiedstockdata
        WHERE symbol IN (SELECT symbol FROM portfolio_symbols)
          AND "Timestamp" BETWEEN $2 AND $3
      ),
      pairwise AS (
        SELECT 
          sr1.symbol AS symbol1,
          sr2.symbol AS symbol2,
          CORR(sr1.return, sr2.return) AS correlation,
          COVAR_POP(sr1.return, sr2.return) AS covariance,
          CASE 
            WHEN CORR(sr1.return, sr2.return) > 0 THEN 'Portfolio is more volatile when holding both these stocks.'
            WHEN CORR(sr1.return, sr2.return) < 0 THEN 'Portfolio is less volatile when holding both these stocks.'
            ELSE 'These stocks have no significant correlation.'
          END AS analysis
        FROM stock_returns sr1
        JOIN stock_returns sr2 ON sr1.time = sr2.time
        WHERE sr1.symbol < sr2.symbol
        GROUP BY sr1.symbol, sr2.symbol
      )
      SELECT * FROM pairwise;
    `;
    const values = [portfolio_id, from_date, to_date];
    const result = await query(queryText, values);

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error in /api/stocks_comparison:', err);
    return res.status(500).json({
      error: 'Internal server error',
      details: err.message,
    });
  }
}
