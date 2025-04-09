// pages/api/reviews.js
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
  const { method } = req;

  if (method === 'GET') {
    // Retrieve reviews for a specific stock_list_id
    const { stock_list_id } = req.query;
    if (!stock_list_id) {
      return res.status(400).json({ error: 'Missing required query parameter: stock_list_id' });
    }
    try {
      const queryText = `
        SELECT reviewer_id, stock_list_id, subject, review_text, created_at
        FROM Reviews
        WHERE stock_list_id = $1
        ORDER BY created_at DESC
      `;
      const { rows } = await query(queryText, [stock_list_id]);
      return res.status(200).json({ reviews: rows });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Error fetching reviews' });
    }
  } else if (method === 'POST') {
    // Add or update a review for a given reviewer_id and stock_list_id.
    const { reviewer_id, stock_list_id, subject, review_text } = req.body;
    if (!reviewer_id || !stock_list_id || !subject || !review_text) {
      return res.status(400).json({ error: 'Missing required fields: reviewer_id, stock_list_id, subject, review_text' });
    }
    try {
      const insertQuery = `
        INSERT INTO Reviews (reviewer_id, stock_list_id, subject, review_text)
        VALUES ($1, $2, $3, $4)
      `;
      await query(insertQuery, [reviewer_id, stock_list_id, subject, review_text]);
      return res.status(201).json({ message: 'Review added successfully' });
    } catch (error) {
      // PostgreSQL duplicate key error
      if (error.code === '23505') {
        try {
          const updateQuery = `
            UPDATE Reviews
            SET subject = $3,
                review_text = $4,
                created_at = CURRENT_TIMESTAMP
            WHERE reviewer_id = $1 AND stock_list_id = $2
          `;
          await query(updateQuery, [reviewer_id, stock_list_id, subject, review_text]);
          return res.status(200).json({ message: 'Review updated successfully' });
        } catch (updateError) {
          console.error('Error updating review:', updateError);
          return res.status(500).json({ error: 'Error updating review' });
        }
      }
      console.error('Error adding review:', error);
      return res.status(500).json({ error: 'Error adding review' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}
