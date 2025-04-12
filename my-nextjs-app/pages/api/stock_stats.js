// pages/api/stock_stats.js

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
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract query parameters: symbol, from_date, to_date
  const { symbol, from_date, to_date } = req.query;
  if (!symbol || !from_date || !to_date) {
    return res.status(400).json({
      error: 'Missing required query parameters: symbol, from_date, and to_date',
    });
  }

  try {
    // First, check the cache for existing results:
    const cacheQueryText = `
      SELECT * FROM cache_for_stock_statistics
      WHERE symbol = $1 AND from_date = $2 AND to_date = $3;
    `;
    const cacheResult = await query(cacheQueryText, [symbol, from_date, to_date]);

    if (cacheResult.rows.length > 0) {
      const cachedRow = cacheResult.rows[0];
      return res.status(200).json({
        symbol,
        from_date,
        to_date,
        avgClose: parseFloat(cachedRow.avg_close),
        stddevClose: parseFloat(cachedRow.stddev_close),
        coefficientOfVariation: cachedRow.coefficient_of_variation !== null
          ? parseFloat(cachedRow.coefficient_of_variation)
          : null,
        beta: cachedRow.beta !== null ? parseFloat(cachedRow.beta) : null,
        cached: true // Indicate that the result was served from the cache
      });
    }

    /*
      This query performs two main calculations:
      
      1. stock_stats: Aggregates the stock’s closing prices over the given interval
         to compute avg_close, stddev_close, and the coefficient of variation.
      
      2. beta_calc: Computes the Beta coefficient for the stock.
         It calculates:
           - The stock’s daily returns over the interval.
           - The market’s daily returns (using the sum of all stocks’ close prices per day)
           - Beta as Cov(stock_return, market_return) / Var(market_return)
      
      Finally, we return both sets of results in one row.
    */
    const queryText = `
      WITH
      -- Get closing prices for the selected stock
      stock_prices AS (
        SELECT "Timestamp" AS dt, "Close"
        FROM unifiedstockdata
        WHERE symbol = $1
          AND "Timestamp" BETWEEN $2 AND $3
        ORDER BY dt
      ),
      -- Aggregate stock statistics
      stock_stats AS (
        SELECT 
          AVG("Close") AS avg_close,
          STDDEV_POP("Close") AS stddev_close,
          CASE WHEN AVG("Close") <> 0 THEN STDDEV_POP("Close") / AVG("Close") ELSE NULL END AS coefficient_of_variation
        FROM stock_prices
      ),
      -- Compute daily returns for the stock using LAG
      stock_returns_raw AS (
        SELECT dt, "Close",
               LAG("Close") OVER (ORDER BY dt) AS prev_close
        FROM stock_prices
      ),
      stock_returns AS (
        SELECT dt, ("Close" - prev_close) / prev_close AS stock_return
        FROM stock_returns_raw
        WHERE prev_close IS NOT NULL
      ),
      -- Compute market proxy by summing the close prices of all stocks (per day)
      market_values AS (
        SELECT "Timestamp"::date AS dt, SUM("Close") AS market_close
        FROM unifiedstockdata
        WHERE "Timestamp" BETWEEN $2 AND $3
        GROUP BY "Timestamp"::date
        ORDER BY dt
      ),
      -- Compute daily market returns using LAG on the market proxy
      market_returns_raw AS (
        SELECT dt, market_close,
               LAG(market_close) OVER (ORDER BY dt) AS prev_market_close
        FROM market_values
      ),
      market_returns AS (
        SELECT dt, (market_close - prev_market_close) / prev_market_close AS market_return
        FROM market_returns_raw
        WHERE prev_market_close IS NOT NULL
      ),
      -- Join stock and market returns on date
      joined_returns AS (
        SELECT sr.stock_return, mr.market_return
        FROM stock_returns sr
        JOIN market_returns mr ON sr.dt = mr.dt
      ),
      -- Calculate covariance and variance for Beta
      beta_calc AS (
        SELECT 
          COVAR_POP(stock_return, market_return) AS covar,
          VAR_POP(market_return) AS var_market
        FROM joined_returns
      )
      SELECT
        $1 AS symbol,
        $2 AS from_date,
        $3 AS to_date,
        s.avg_close,
        s.stddev_close,
        s.coefficient_of_variation,
        CASE 
          WHEN b.var_market <> 0 THEN b.covar / b.var_market
          ELSE NULL
        END AS beta
      FROM stock_stats s, beta_calc b;
    `;
    const values = [symbol, from_date, to_date];
    const result = await query(queryText, values);

    if (result.rows.length === 0 || result.rows[0].avg_close === null) {
      return res.status(404).json({
        error: 'No data found for the given parameters',
      });
    }

    const row = result.rows[0];
    const avgClose = parseFloat(row.avg_close);
    const stddevClose = parseFloat(row.stddev_close);
    const coefficientOfVariation = row.coefficient_of_variation !== null
      ? parseFloat(row.coefficient_of_variation)
      : null;
    const beta = row.beta !== null ? parseFloat(row.beta) : null;

    // After computing, insert the values into the cache table for future requests.
    const insertCacheQuery = `
      INSERT INTO cache_for_stock_statistics
        (symbol, from_date, to_date, avg_close, stddev_close, coefficient_of_variation, beta)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (symbol, from_date, to_date)
      DO UPDATE SET
        avg_close = EXCLUDED.avg_close,
        stddev_close = EXCLUDED.stddev_close,
        coefficient_of_variation = EXCLUDED.coefficient_of_variation,
        beta = EXCLUDED.beta,
        cached_at = NOW();
    `;
    await query(insertCacheQuery, [symbol, from_date, to_date, avgClose, stddevClose, coefficientOfVariation, beta]);

    return res.status(200).json({
      symbol,
      from_date,
      to_date,
      avgClose,
      stddevClose,
      coefficientOfVariation,
      beta,
      cached: false // Indicates that these values were freshly computed
    });
  } catch (err) {
    console.error('Error in /api/stock_stats:', err);
    return res.status(500).json({
      error: 'Internal server error',
      details: err.message,
    });
  }
}
