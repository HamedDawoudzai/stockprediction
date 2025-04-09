// pages/api/withdraw.js
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

  const withdrawAmount = parseFloat(amount);
  if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
    res.status(400).json({ error: 'Invalid withdraw amount' });
    return;
  }

  const client = await pool.connect();
  try {
    
    await client.query('BEGIN');

   
    const portfolioQuery = 'SELECT cash_balance FROM portfolios WHERE portfolio_id = $1';
    const portfolioResult = await client.query(portfolioQuery, [portfolio_id]);
    if (portfolioResult.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    const currentCash = parseFloat(portfolioResult.rows[0].cash_balance);
    if (withdrawAmount > currentCash) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Insufficient funds for withdrawal' });
      return;
    }

 
    const updatePortfolioQuery = `
      UPDATE portfolios
      SET cash_balance = cash_balance - $1
      WHERE portfolio_id = $2
      RETURNING cash_balance
    `;
    const updateValues = [withdrawAmount, portfolio_id];
    const updateResult = await client.query(updatePortfolioQuery, updateValues);
    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }


    const insertTransactionQuery = `
      INSERT INTO transactions 
        (portfolio_id, transaction_type, symbol, shares, price, amount)
      VALUES
        ($1, 'withdraw', NULL, 0, 0, $2)
      RETURNING transaction_id
    `;
    const insertValues = [portfolio_id, withdrawAmount];
    const insertResult = await client.query(insertTransactionQuery, insertValues);
    console.log('Inserted transaction ID:', insertResult.rows[0].transaction_id);


    await client.query('COMMIT');

    res.status(200).json({ cash_balance: updateResult.rows[0].cash_balance });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('DB error:', error);
    res.status(500).json({ error: 'Database update failed', details: error.message });
  } finally {
    client.release();
  }
}
