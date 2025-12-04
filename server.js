const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Kết nối Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// API Lấy dữ liệu
app.get('/api/data/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query('SELECT data FROM user_storage WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      res.json(result.rows[0].data);
    } else {
      res.json(null);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi Database' });
  }
});

// API Lưu dữ liệu
app.post('/api/data', async (req, res) => {
  const { email, data } = req.body;
  if (!email || !data) return res.status(400).json({ error: 'Thiếu email hoặc data' });

  try {
    const query = `
      INSERT INTO user_storage (email, data, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (email)
      DO UPDATE SET data = $2, updated_at = NOW();
    `;
    await pool.query(query, [email, data]);
    res.json({ success: true, message: 'Đã lưu thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi Database' });
  }
});

// --- CODE TẠO BẢNG (MỚI THÊM) ---
pool.query(`
  CREATE TABLE IF NOT EXISTS user_storage (
    email VARCHAR(255) PRIMARY KEY,
    data TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => {
  console.log("✅ Đã tạo bảng user_storage thành công!");
});
// -------------------------------

app.listen(port, () => {
  console.log(`Server đang chạy tại port ${port}`);
});
