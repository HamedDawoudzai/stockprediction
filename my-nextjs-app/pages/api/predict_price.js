// pages/api/predict_price.js
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

function linearRegression(xs, ys) {
  const n = xs.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumX2 += xs[i] * xs[i];
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function randomFluctuation() {
  const fluctuationPercent = Math.random() * 1 - 0.5;
  return 1 + fluctuationPercent / 100;
}

const futureSampleMapping = {
  week: 7,
  month: 30,
  "3months": 90,
  year: 365,
  "5years": 1825,
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, days, future_range } = req.query;
  if (!symbol || !days) {
    return res.status(400).json({ error: 'Missing required parameters: symbol and days' });
  }
  const numDays = Number(days);
  if (isNaN(numDays)) {
    return res.status(400).json({ error: 'Days must be a number' });
  }

  try {
    const queryText = `
      SELECT "Timestamp", "Close"
      FROM unifiedstockdata
      WHERE symbol = $1
      ORDER BY "Timestamp" ASC
    `;
    const result = await pool.query(queryText, [symbol]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No historical data found for symbol' });
    }
    let sampleSize = 10;
    if (future_range && futureSampleMapping[future_range]) {
      sampleSize = futureSampleMapping[future_range];
    }
    const availablePoints = result.rows.length;
    sampleSize = Math.min(sampleSize, availablePoints);
    const trainingRows = result.rows.slice(-sampleSize);
    const xs = [];
    const ys = [];
    for (let i = 0; i < trainingRows.length; i++) {
      xs.push(i);
      ys.push(Number(trainingRows[i].Close));
    }

    const { slope, intercept } = linearRegression(xs, ys);

    const anchorDateStr = result.rows[result.rows.length - 1].Timestamp;
    const anchorDate = new Date(anchorDateStr);

    const futureData = [];
    let hasHitZero = false;
    for (let i = sampleSize; i < sampleSize + numDays; i++) {
      const futureDate = new Date(anchorDate);
      futureDate.setDate(anchorDate.getDate() + (i - sampleSize + 1));

      let predicted = intercept + slope * i;
      predicted *= randomFluctuation();
      if (hasHitZero || predicted < 0) {
        predicted = 0;
        hasHitZero = true;
      }

      futureData.push({
        date: futureDate.toISOString().split("T")[0],
        predicted_close: predicted,
      });
    }

    return res.status(200).json(futureData);
  } catch (error) {
    console.error("Error in predict_price endpoint:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
