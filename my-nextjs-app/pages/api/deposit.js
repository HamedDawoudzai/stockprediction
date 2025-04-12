// pages/api/deposit.js
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
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { portfolio_id, amount } = req.body;
  if (!portfolio_id || amount === undefined) {
    res.status(400).json({ error: 'Missing portfolio_id or amount parameter' });
    return;
  }
  
  const depositAmount = parseFloat(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    res.status(400).json({ error: 'Invalid deposit amount' });
    return;
  }

  try {
   
    const updatePortfolioQuery = `
      UPDATE portfolios
      SET cash_balance = cash_balance + $1
      WHERE portfolio_id = $2
      RETURNING cash_balance
    `;
    const updateValues = [depositAmount, portfolio_id];
    const updateResult = await pool.query(updatePortfolioQuery, updateValues);
    
    if (updateResult.rowCount === 0) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }
    
    const insertTransactionQuery = `
      INSERT INTO transactions (portfolio_id, transaction_type, symbol, shares, price, amount)
      VALUES($1, 'deposit', NULL, 0, 0, $2)
      RETURNING transaction_id
    `;
    const insertValues = [portfolio_id, depositAmount];
    const insertResult = await pool.query(insertTransactionQuery, insertValues);
    console.log('Inserted transaction ID:', insertResult.rows[0].transaction_id);

    
    res.status(200).json({ cash_balance: updateResult.rows[0].cash_balance });
  } catch (error) {
    console.error('DB error:', error);
    res.status(500).json({ error: 'Database update failed', details: error.message });
  }
}
