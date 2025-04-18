import { Pool } from 'pg';

const pool = new Pool({
  user: "myuser",
  host: "34.29.111.220",
  database: "stock_prediction",
  password: "abc123",
  port: 5432,
  ssl: false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error("Query error:", err);
    throw err;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  
  const { stock_list_id, from_date, to_date } = req.query;
  if (!stock_list_id || !from_date || !to_date) {
    return res.status(400).json({
      error: "Missing required query parameters: stock_list_id, from_date, and to_date",
    });
  }
  
  try {
  
    const symbolsQuery = `
      SELECT DISTINCT symbol
      FROM stocklistitems
      WHERE stock_list_id = $1;
    `;
    const symbolsResult = await query(symbolsQuery, [stock_list_id]);
    if (symbolsResult.rows.length === 0) {
      return res.status(404).json({ error: "No symbols found in this stock list" });
    }
    
  
    const comparisonQuery = `
      WITH stocklist_symbols AS (
        SELECT DISTINCT symbol
        FROM stocklistitems
        WHERE stock_list_id = $1
      ),

      rate_returns AS ( -- rate of return for every symbol in the stock list
        SELECT symbol,
               "Timestamp" AS dt,
               ( "Close" - LAG("Close") OVER (PARTITION BY symbol ORDER BY "Timestamp") )
                 / LAG("Close") OVER (PARTITION BY symbol ORDER BY "Timestamp") AS rate
        FROM unifiedstockdata
        WHERE symbol IN (SELECT symbol FROM stocklist_symbols)
          AND "Timestamp" BETWEEN $2 AND $3
      ),

      pairwise AS ( -- Correlation and covariance calculation per pairs of stocks
        SELECT 
          r1.symbol AS symbol1,
          r2.symbol AS symbol2,
          CORR(r1.rate, r2.rate) AS correlation,
          COVAR_POP(r1.rate, r2.rate) AS covariance,
          CASE 
            WHEN CORR(r1.rate, r2.rate) > 0 THEN 'Stock list is more volatile with these stocks.'
            WHEN CORR(r1.rate, r2.rate) < 0 THEN 'Stock list is less volatile with these stocks.'
            ELSE 'No significant correlation found.'
          END AS analysis
        FROM rate_returns r1
        JOIN rate_returns r2 ON r1.dt = r2.dt
        WHERE r1.symbol < r2.symbol
        GROUP BY r1.symbol, r2.symbol
      )
      SELECT * FROM pairwise;
    `;

    const compValues = [stock_list_id, from_date, to_date];
    const compResult = await query(comparisonQuery, compValues);
    return res.status(200).json(compResult.rows);
  } catch (err) {
    console.error("Error in /api/stocklist_comparison:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
}
