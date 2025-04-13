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
  const { symbol, from_date, to_date } = req.query;
  if (!symbol || !from_date || !to_date) {
    return res.status(400).json({
      error: 'Missing required query parameters: symbol, from_date, and to_date',
    });
  }

  try {
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
        avgClose: parseFloat(parseFloat(cachedRow.avg_close).toFixed(2)),
        stddevClose: parseFloat(parseFloat(cachedRow.stddev_close).toFixed(2)),
        coefficientOfVariation: cachedRow.coefficient_of_variation !== null
          ? parseFloat(parseFloat(cachedRow.coefficient_of_variation).toFixed(2))
          : null,
        beta: cachedRow.beta !== null ? parseFloat(parseFloat(cachedRow.beta).toFixed(2)) : null,
        cached: true 
      });
    }
    
    const queryText = `
      WITH
     
      prices AS ( 
        SELECT "Timestamp" AS time, "Close"
        FROM unifiedstockdata
        WHERE symbol = $1
          AND "Timestamp" BETWEEN $2 AND $3
        
      ),
	  
      -- VARIATION COEFFICIENT CALCULATION.
      varcalc AS ( 
        SELECT 
          AVG("Close") AS avg_close,
          STDDEV_POP("Close") AS stddev_close,
          STDDEV_POP("Close") / AVG("Close") AS coefficient_of_variation
        FROM prices
      ),
      
	  
      -- PREV DAY PRICES
      prev_prices AS (
        SELECT time, "Close",
               LAG("Close") OVER (ORDER BY time) AS prev_close
        FROM prices
      ),

    -- EXPECTED RETURN (r_i)
      expected_stocks AS ( 
        SELECT time, ("Close" - prev_close) / prev_close AS expected_stock
        FROM prev_prices
        WHERE prev_close IS NOT NULL -- accounts for first stock recorded
      ),

     
      sp_500 AS ( --Takes the sum of all of the stocks in the market each day between timestamp of $2 and $3
        SELECT DATE("Timestamp") AS time, SUM("Close") AS market_close
        FROM unifiedstockdata
        WHERE "Timestamp" BETWEEN $2 AND $3
        GROUP BY DATE("Timestamp")
        ORDER BY time
      ),

  
      prev_sp_500 AS ( -- Gives previous market close for each day in the market
        SELECT time, market_close,
               LAG(market_close) OVER (ORDER BY time) AS prev_market_close
        FROM sp_500
      ),



      market_returns AS ( --For each of these rows, we calculate the market return with current close and previous close
        SELECT time, (market_close - prev_market_close) / prev_market_close AS market_return
        FROM prev_sp_500
        WHERE prev_market_close IS NOT NULL
      ),
	
  
      -- Calculate covariance and variance for Beta
      beta_calc AS ( -- Covariance and Variance are calculated over time period specified in our prev. tables of $t2 and $t3
        SELECT 
          COVAR_POP(expected_stock, market_return) AS covar,
          VAR_POP(market_return) AS var_market
        FROM expected_stocks es JOIN market_returns mr ON es.time = mr.time
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
      FROM varcalc s, beta_calc b;
    `;


    const values = [symbol, from_date, to_date];
    const result = await query(queryText, values);

    if (result.rows.length === 0 || result.rows[0].avg_close === null) {
      return res.status(404).json({
        error: 'No data found for the given parameters',
      });
    }

    const row = result.rows[0];
    const avgClose = parseFloat(parseFloat(row.avg_close).toFixed(2));
    const stddevClose = parseFloat(parseFloat(row.stddev_close).toFixed(2));
    const coefficientOfVariation = row.coefficient_of_variation !== null
      ? parseFloat(parseFloat(row.coefficient_of_variation).toFixed(2))
      : null;
    const beta = row.beta !== null ? parseFloat(parseFloat(row.beta).toFixed(2)) : null;

    const insertCacheQuery = `
      INSERT INTO cache_for_stock_statistics
        (symbol, from_date, to_date, avg_close, stddev_close, coefficient_of_variation, beta)
      VALUES
        (
          $1,
          $2,
          $3,
          ROUND($4::numeric, 2),
          ROUND($5::numeric, 2),
          ROUND($6::numeric, 2),
          ROUND($7::numeric, 2)
        )
      ON CONFLICT (symbol, from_date, to_date)
      DO UPDATE SET
        avg_close = ROUND(EXCLUDED.avg_close::numeric, 2),
        stddev_close = ROUND(EXCLUDED.stddev_close::numeric, 2),
        coefficient_of_variation = ROUND(EXCLUDED.coefficient_of_variation::numeric, 2),
        beta = ROUND(EXCLUDED.beta::numeric, 2),
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
      cached: false
    });
  } catch (err) {
    console.error('Error in /api/stock_stats:', err);
    return res.status(500).json({
      error: 'Internal server error',
      details: err.message,
    });
  }
}
