// pages/api/share_stocklist.js
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
  
  const { stock_list_id, shared_with_user_id } = req.body;
  
  if (!stock_list_id || !shared_with_user_id) {
    return res.status(400).json({ error: 'Missing required fields: stock_list_id and shared_with_user_id are required.' });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate that the user exists.
    const userQuery = 'SELECT user_id FROM Users WHERE user_id = $1';
    const userResult = await client.query(userQuery, [shared_with_user_id]);
    if (userResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'The user you are trying to share with does not exist.' });
    }
    
    // Validate that the stock list exists and get its creator and visibility.
    const stockListQuery = 'SELECT creator_id, visibility FROM StockLists WHERE stock_list_id = $1';
    const stockListResult = await client.query(stockListQuery, [stock_list_id]);
    if (stockListResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Stock list not found.' });
    }
    const { creator_id, visibility } = stockListResult.rows[0];
    
    // Prevent sharing with oneself.
    if (creator_id === shared_with_user_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You cannot share a stock list with yourself.' });
    }
    
    // Prevent sharing a public stock list.
    if (visibility === 'public') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'The stock list is public; everyone has access.' });
    }
    
    // Check if already shared to avoid duplicates.
    const duplicateQuery = `
      SELECT 1 FROM StockListShares
      WHERE stock_list_id = $1 AND shared_with_user_id = $2
    `;
    const duplicateResult = await client.query(duplicateQuery, [stock_list_id, shared_with_user_id]);
    if (duplicateResult.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This stock list is already shared with that user.' });
    }
    
    // Insert the record into StockListShares.
    const insertShareQuery = `
      INSERT INTO StockListShares (stock_list_id, shared_with_user_id)
      VALUES ($1, $2)
    `;
    await client.query(insertShareQuery, [stock_list_id, shared_with_user_id]);
    
    // Update the stock list's visibility to 'shared'.
    const updateVisibilityQuery = `
      UPDATE StockLists
      SET visibility = 'shared'
      WHERE stock_list_id = $1;
    `;
    await client.query(updateVisibilityQuery, [stock_list_id]);
    
    await client.query('COMMIT');
    
    return res.status(200).json({ 
      message: 'Stock list shared successfully',
      stock_list_id,
      shared_with_user_id 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sharing stock list:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    client.release();
  }
}
