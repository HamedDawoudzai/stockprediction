// pages/api/total_balance.js
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
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { portfolio_id } = req.query;
  if (!portfolio_id) {
    res.status(400).json({ error: 'Missing portfolio_id query parameter' });
    return;
  }

  try {
    // Query the portfolio for the cash_balance
    const portfolioQuery = `
      SELECT cash_balance
      FROM portfolios
      WHERE portfolio_id = $1
    `;
    const portfolioResult = await pool.query(portfolioQuery, [portfolio_id]);
    if (!portfolioResult.rows.length) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    const cashBalance = parseFloat(portfolioResult.rows[0].cash_balance);

    // Calculate total stock value using the latest close price from stocks_price
    const stocksQuery = `
      SELECT COALESCE(SUM(ps.shares * sp.price), 0) AS stocks_total
      FROM portfoliostocks ps
      JOIN stocks_price sp ON ps.symbol = sp.symbol
      WHERE ps.portfolio_id = $1
    `;
    const stocksResult = await pool.query(stocksQuery, [portfolio_id]);
    const stocksTotal = parseFloat(stocksResult.rows[0].stocks_total);

    // Sum the cash balance + total stock value
    const totalBalance = cashBalance + stocksTotal;
    
    // Return as a string to two decimal places
    res.status(200).json({
      total_balance: totalBalance.toFixed(2),
      cash_balance: cashBalance.toFixed(2),
      stocks_total: stocksTotal.toFixed(2)
    });
  } catch (error) {
    console.error('Error calculating total balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
