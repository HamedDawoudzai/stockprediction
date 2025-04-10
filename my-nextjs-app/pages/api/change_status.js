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
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { stock_list_id, new_status, user_id } = req.body;
  
  if (!stock_list_id || !new_status || !user_id) {
    return res.status(400).json({ error: 'Missing stock_list_id, new_status, or user_id.' });
  }
  
  
  if (new_status !== 'public' && new_status !== 'private') {
    return res.status(400).json({ error: 'Invalid new_status. Must be "public" or "private".' });
  }
  
  try {
    const fetchQuery = `SELECT creator_id FROM StockLists WHERE stock_list_id = $1;`;
    const fetchResult = await query(fetchQuery, [stock_list_id]);
    if (fetchResult.rowCount === 0) {
      return res.status(404).json({ error: 'Stock list not found.' });
    }
    
    const list = fetchResult.rows[0];
    if (list.creator_id !== user_id) {
      return res.status(403).json({ error: 'Not authorized: only the owner can change the status.' });
    }
    
    const updateQuery = `
      UPDATE StockLists 
      SET visibility = $1 
      WHERE stock_list_id = $2 
      RETURNING *;
    `;
    const updateResult = await query(updateQuery, [new_status, stock_list_id]);
    
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Stock list not found during update.' });
    }
    if (new_status === 'public') {
      const deleteSharesQuery = `
        DELETE FROM StockListShares
        WHERE stock_list_id = $1;
      `;
      await query(deleteSharesQuery, [stock_list_id]);
      console.log(`Removed shared entries for stock_list_id: ${stock_list_id}`);
    }
    
    return res.status(200).json({ 
      message: 'Status updated successfully.', 
      list: updateResult.rows[0] 
    });
  } catch (error) {
    console.error('Error updating stock list status:', error);
    return res.status(500).json({ error: 'Internal server error.', details: error.message });
  }
}
