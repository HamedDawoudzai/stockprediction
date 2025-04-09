// pages/api/transfer.js
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

  const { from_portfolio_id, to_portfolio_id, amount } = req.body;
  if (!from_portfolio_id || !to_portfolio_id || amount === undefined) {
    res.status(400).json({ error: 'Missing required parameters.' });
    return;
  }
  if (from_portfolio_id === to_portfolio_id) {
    res.status(400).json({ error: 'From and To portfolio IDs must be different.' });
    return;
  }

  const transferAmount = parseFloat(amount);
  if (isNaN(transferAmount) || transferAmount <= 0) {
    res.status(400).json({ error: 'Invalid transfer amount.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');


    const fromQuery = 'SELECT cash_balance FROM portfolios WHERE portfolio_id = $1';
    const fromResult = await client.query(fromQuery, [from_portfolio_id]);
    if (fromResult.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Source portfolio not found.' });
      return;
    }
    const fromCash = parseFloat(fromResult.rows[0].cash_balance);
    if (transferAmount > fromCash) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Insufficient funds in source portfolio.' });
      return;
    }

    const toQuery = 'SELECT cash_balance FROM portfolios WHERE portfolio_id = $1';
    const toResult = await client.query(toQuery, [to_portfolio_id]);
    if (toResult.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Destination portfolio not found.' });
      return;
    }

    const updateFromQuery = `
      UPDATE portfolios
      SET cash_balance = cash_balance - $1
      WHERE portfolio_id = $2
      RETURNING cash_balance
    `;
    const updateFromResult = await client.query(updateFromQuery, [transferAmount, from_portfolio_id]);


    const updateToQuery = `
      UPDATE portfolios
      SET cash_balance = cash_balance + $1
      WHERE portfolio_id = $2
      RETURNING cash_balance
    `;
    const updateToResult = await client.query(updateToQuery, [transferAmount, to_portfolio_id]);

    const insertWithdrawTx = `
      INSERT INTO transactions
        (portfolio_id, transaction_type, symbol, shares, price, amount)
      VALUES
        ($1, 'transfer', NULL, 0, 0, $2)
      RETURNING transaction_id
    `;
    await client.query(insertWithdrawTx, [from_portfolio_id, transferAmount]);

    const insertDepositTx = `
      INSERT INTO transactions
        (portfolio_id, transaction_type, symbol, shares, price, amount)
      VALUES
        ($1, 'transfer', NULL, 0, 0, $2)
      RETURNING transaction_id
    `;
    await client.query(insertDepositTx, [to_portfolio_id, transferAmount]);

    await client.query('COMMIT');

    res.status(200).json({
      from_cash_balance: updateFromResult.rows[0].cash_balance,
      to_cash_balance: updateToResult.rows[0].cash_balance,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('DB error in transfer:', error);
    res.status(500).json({ error: 'Transfer failed.', details: error.message });
  } finally {
    client.release();
  }
}
