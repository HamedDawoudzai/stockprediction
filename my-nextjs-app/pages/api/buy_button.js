// pages/api/buy_button.js
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
   
    const portfolioQuery = `SELECT cash_balance FROM portfolios WHERE portfolio_id = $1`;
    const portfolioResult = await query(portfolioQuery, [portfolio_id]);
    
    if (!portfolioResult.rows.length) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }
    
    const currentCash = parseFloat(portfolioResult.rows[0].cash_balance);
    if (currentCash < amount) {
      res.status(400).json({ error: 'Insufficient funds for this purchase' });
      return;
    }

   
    const updatePortfolioQuery = `
      UPDATE portfolios 
      SET cash_balance = cash_balance - $1 
      WHERE portfolio_id = $2
    `;
    await query(updatePortfolioQuery, [amount, portfolio_id]);

   
    const insertTransactionQuery = `
      INSERT INTO transactions 
      (portfolio_id, transaction_type, symbol, shares, price, amount, transaction_date)
      VALUES ($1, 'buy', $2, $3, $4, $5, NOW())
    `;
    await query(insertTransactionQuery, [
      portfolio_id,
      symbol,
      calculatedShares,
      price,
      amount,
    ]);

   
    const totalValue = parseFloat((calculatedShares * price).toFixed(2));
    const updatePortfolioStocksQuery = `
      INSERT INTO portfoliostocks (portfolio_id, symbol, shares, value)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (portfolio_id, symbol) DO UPDATE 
      SET shares = portfoliostocks.shares + EXCLUDED.shares,
          value = (portfoliostocks.shares + EXCLUDED.shares) * $5
    `;
    await query(updatePortfolioStocksQuery, [
      portfolio_id,
      symbol,
      calculatedShares,
      totalValue,
      price,
    ]);

    res.status(200).json({ message: 'Stock purchase successful' });
  } catch (err) {
    console.error('Error processing buy:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
