// pages/api/sell_button.js
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
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { portfolio_id, symbol, amount, price, calculatedShares } = req.body;

  if (
    !portfolio_id ||
    !symbol ||
    !amount ||
    !price ||
    !calculatedShares ||
    isNaN(amount) ||
    isNaN(price) ||
    isNaN(calculatedShares)
  ) {
    res.status(400).json({ error: 'Missing or invalid required fields' });
    return;
  }

  try {
    // Check that the portfolio exists.
    const portfolioQuery = `SELECT cash_balance FROM portfolios WHERE portfolio_id = $1`;
    const portfolioResult = await query(portfolioQuery, [portfolio_id]);
    if (!portfolioResult.rows.length) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }
    
    // Check that the stock exists in the portfolio.
    const stockQuery = `
      SELECT shares 
      FROM portfoliostocks 
      WHERE portfolio_id = $1 AND symbol = $2
    `;
    const stockResult = await query(stockQuery, [portfolio_id, symbol]);
    if (!stockResult.rows.length) {
      res.status(404).json({ error: 'Stock not found in portfolio' });
      return;
    }

    const currentShares = parseFloat(stockResult.rows[0].shares);
    if (calculatedShares > currentShares) {
      res.status(400).json({ error: 'Insufficient shares available to sell' });
      return;
    }

    // Fetch the latest close price from the Stocks_Price table.
    const priceQuery = `
      SELECT price 
      FROM Stocks_Price 
      WHERE symbol = $1
      LIMIT 1
    `;
    const priceResult = await query(priceQuery, [symbol]);
    let latestPrice = price;
    if (priceResult.rows.length) {
      latestPrice = parseFloat(priceResult.rows[0].price);
    }

    // Update the portfolio's cash_balance by adding the sale amount.
    const updatePortfolioQuery = `
      UPDATE portfolios 
      SET cash_balance = cash_balance + $1 
      WHERE portfolio_id = $2
    `;
    await query(updatePortfolioQuery, [amount, portfolio_id]);

    // Insert a record into the transactions table for the sale.
    const insertTransactionQuery = `
      INSERT INTO transactions 
      (portfolio_id, transaction_type, symbol, shares, price, amount, transaction_date)
      VALUES ($1, 'sell', $2, $3, $4, $5, NOW())
    `;
    await query(insertTransactionQuery, [
      portfolio_id,
      symbol,
      calculatedShares,
      latestPrice,
      amount,
    ]);

    // Update portfoliostocks: subtract the sold shares.
    const remainingShares = currentShares - calculatedShares;
    if (remainingShares > 0) {
      // Update the value (recalculate based on the latest close price)
      const newValue = parseFloat((remainingShares * latestPrice).toFixed(2));
      const updateStockQuery = `
        UPDATE portfoliostocks 
        SET shares = $1, value = $2 
        WHERE portfolio_id = $3 AND symbol = $4
      `;
      await query(updateStockQuery, [remainingShares, newValue, portfolio_id, symbol]);
    } else {
      // If all shares are sold, remove the stock from the portfolio.
      const deleteStockQuery = `
        DELETE FROM portfoliostocks 
        WHERE portfolio_id = $1 AND symbol = $2
      `;
      await query(deleteStockQuery, [portfolio_id, symbol]);
    }

    res.status(200).json({ message: 'Stock sale successful' });
  } catch (err) {
    console.error('Error processing sell:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
