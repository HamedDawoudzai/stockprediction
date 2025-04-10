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
    const { stock_list_id, user_id } = req.query;
    if (!stock_list_id || !user_id) {
      return res
        .status(400)
        .json({ error: 'Missing required query parameters: stock_list_id and user_id' });
    }

    try {
      // Fetch the creator's ID for the stock list.
      const creatorRes = await query(
        `SELECT creator_id FROM StockLists WHERE stock_list_id = $1`,
        [stock_list_id]
      );

      if (creatorRes.rowCount === 0) {
        return res.status(404).json({ error: 'Stock list not found' });
      }

      const creator_id = creatorRes.rows[0].creator_id;
      let reviewQuery;
      let values;

      if (user_id === creator_id) {
        // If the current user is the creator, return all reviews.
        reviewQuery = `
          SELECT reviewer_id, stock_list_id, subject, review_text, created_at
          FROM Reviews
          WHERE stock_list_id = $1
          ORDER BY created_at DESC
        `;
        values = [stock_list_id];
      } else {
        // Otherwise, return only the creator's review and the current user's review.
        reviewQuery = `
          SELECT reviewer_id, stock_list_id, subject, review_text, created_at
          FROM Reviews
          WHERE stock_list_id = $1 AND (reviewer_id = $2 OR reviewer_id = $3)
          ORDER BY created_at DESC
        `;
        values = [stock_list_id, user_id, creator_id];
      }

      const { rows } = await query(reviewQuery, values);
      return res.status(200).json({ reviews: rows });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Error fetching reviews' });
    }
  } else if (method === 'POST') {
    const { reviewer_id, stock_list_id, subject, review_text } = req.body;
    if (!reviewer_id || !stock_list_id || !subject || !review_text) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: reviewer_id, stock_list_id, subject, review_text' });
    }
    try {
      const insertQuery = `
        INSERT INTO Reviews (reviewer_id, stock_list_id, subject, review_text)
        VALUES ($1, $2, $3, $4)
      `;
      await query(insertQuery, [reviewer_id, stock_list_id, subject, review_text]);
      return res.status(201).json({ message: 'Review added successfully' });
    } catch (error) {
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
