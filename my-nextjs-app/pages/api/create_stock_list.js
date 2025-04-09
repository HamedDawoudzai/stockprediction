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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Expecting the request body to include:
  // - title (which will be used as stock_list_id)
  // - description
  // - visibility
  // - user (the creator's id)
  // - stocks: an array of objects { symbol, shares }
  const { title, description, visibility, user, stocks } = req.body;

  if (!title || !user) {
    return res.status(400).json({ error: 'Missing required fields: title or user' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Use the title as stock_list_id.
    const insertStockListQuery = `
      INSERT INTO StockLists (stock_list_id, description, visibility, creator_id)
      VALUES ($1, $2, $3, $4)
      RETURNING stock_list_id;
    `;
    const stockListResult = await client.query(insertStockListQuery, [
      title,
      description,
      visibility,
      user,
    ]);

    const stock_list_id = stockListResult.rows[0].stock_list_id;

    // Aggregate stocks by symbol and sum the shares.
    if (stocks && Array.isArray(stocks)) {
      const aggregatedStocks = {};
      for (const stock of stocks) {
        if (stock.symbol && stock.shares) {
          // If the symbol already exists in our map, sum up the shares.
          if (aggregatedStocks[stock.symbol]) {
            aggregatedStocks[stock.symbol] += Number(stock.shares);
          } else {
            aggregatedStocks[stock.symbol] = Number(stock.shares);
          }
        }
      }

      // Insert the aggregated stock values into StockListItems.
      for (const symbol in aggregatedStocks) {
        const shares = aggregatedStocks[symbol];
        const insertItemQuery = `
          INSERT INTO StockListItems (stock_list_id, symbol, shares)
          VALUES ($1, $2, $3);
        `;
        await client.query(insertItemQuery, [stock_list_id, symbol, shares]);
      }
    }

    await client.query('COMMIT');
    return res.status(200).json({
      message: 'Stock list created successfully',
      stock_list_id,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating stock list:', error);
    return res.status(500).json({ error: 'Database query failed', details: error.message });
  } finally {
    client.release();
  }
}
