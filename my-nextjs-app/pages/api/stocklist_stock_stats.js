// pages/api/stocklist_stock_stats.js

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
  const { stock_list_id, symbol, from_date, to_date } = req.query;
  if (!stock_list_id || !symbol || !from_date || !to_date) {
    return res.status(400).json({
      error:
        "Missing required query parameters: stock_list_id, symbol, from_date, and to_date",
    });
  }

  try {
   
    const checkQuery = `
      SELECT COUNT(*) AS cnt
      FROM stocklistitems
      WHERE stock_list_id = $1 AND symbol = $2;
    `;
    const checkRes = await query(checkQuery, [stock_list_id, symbol]);
    if (parseInt(checkRes.rows[0].cnt, 10) === 0) {
      return res
        .status(404)
        .json({ error: "Symbol not found in the specified stock list" });
    }

    const cacheQueryText = `
      SELECT * FROM cache_for_stock_statistics
      WHERE symbol = $1 AND from_date = $2 AND to_date = $3;
    `;
    const cacheResult = await query(cacheQueryText, [symbol, from_date, to_date]);
    if (cacheResult.rows.length > 0) {
      const cachedRow = cacheResult.rows[0];
      return res.status(200).json({
        stock_list_id,
        symbol,
        from_date,
        to_date,
        avgClose: parseFloat(parseFloat(cachedRow.avg_close).toFixed(2)),
        stddevClose: parseFloat(parseFloat(cachedRow.stddev_close).toFixed(2)),
        coefficientOfVariation:
          cachedRow.coefficient_of_variation !== null
            ? parseFloat(
                parseFloat(cachedRow.coefficient_of_variation).toFixed(2)
              )
            : null,
        beta:
          cachedRow.beta !== null
            ? parseFloat(parseFloat(cachedRow.beta).toFixed(2))
            : null,
        cached: true,
      });
    }

    const statsQuery = `
      WITH
      stock_prices AS (
        SELECT "Timestamp" AS dt, "Close"
        FROM unifiedstockdata
        WHERE symbol = $1
          AND "Timestamp" BETWEEN $2 AND $3
        ORDER BY dt
      ),
      stock_stats AS (
        SELECT 
          AVG("Close") AS avg_close,
          STDDEV_POP("Close") AS stddev_close,
          CASE WHEN AVG("Close") <> 0 THEN STDDEV_POP("Close") / AVG("Close") ELSE NULL END AS coefficient_of_variation
        FROM stock_prices
      ),
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
      market_values AS (
        SELECT "Timestamp"::date AS dt, SUM("Close") AS market_close
        FROM unifiedstockdata
        WHERE "Timestamp" BETWEEN $2 AND $3
        GROUP BY "Timestamp"::date
        ORDER BY dt
      ),
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
      joined_returns AS (
        SELECT sr.stock_return, mr.market_return
        FROM stock_returns sr
        JOIN market_returns mr ON sr.dt = mr.dt
      ),
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
    const statsValues = [symbol, from_date, to_date];
    const statsRes = await query(statsQuery, statsValues);
    if (statsRes.rows.length === 0 || statsRes.rows[0].avg_close === null) {
      return res
        .status(404)
        .json({ error: "No data found for the given parameters" });
    }

    const row = statsRes.rows[0];
    const avgClose = parseFloat(parseFloat(row.avg_close).toFixed(2));
    const stddevClose = parseFloat(parseFloat(row.stddev_close).toFixed(2));
    const coefficientOfVariation =
      row.coefficient_of_variation !== null
        ? parseFloat(parseFloat(row.coefficient_of_variation).toFixed(2))
        : null;
    const beta =
      row.beta !== null ? parseFloat(parseFloat(row.beta).toFixed(2)) : null;

   
    const insertCacheQuery = `
      INSERT INTO cache_for_stock_statistics
        (symbol, from_date, to_date, avg_close, stddev_close, coefficient_of_variation, beta)
      VALUES (
          $1, $2, $3, ROUND($4::numeric, 2), ROUND($5::numeric, 2),
          ROUND($6::numeric, 2), ROUND($7::numeric, 2)
      )
      ON CONFLICT (symbol, from_date, to_date)
      DO UPDATE SET
        avg_close = ROUND(EXCLUDED.avg_close::numeric, 2),
        stddev_close = ROUND(EXCLUDED.stddev_close::numeric, 2),
        coefficient_of_variation = ROUND(EXCLUDED.coefficient_of_variation::numeric, 2),
        beta = ROUND(EXCLUDED.beta::numeric, 2),
        cached_at = NOW();
    `;
    await query(insertCacheQuery, [
      symbol,
      from_date,
      to_date,
      avgClose,
      stddevClose,
      coefficientOfVariation,
      beta,
    ]);

    return res.status(200).json({
      stock_list_id,
      symbol,
      from_date,
      to_date,
      avgClose,
      stddevClose,
      coefficientOfVariation,
      beta,
      cached: false,
    });
  } catch (err) {
    console.error("Error in /api/stocklist_stock_stats:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
}
