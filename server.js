
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Tăng giới hạn để lưu dữ liệu lớn

// PostgreSQL Connection
// Đảm bảo bạn đã set biến môi trường DATABASE_URL trên Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Cần thiết cho Render PostgreSQL
  }
});

// API Routes

// 1. Lấy dữ liệu (GET)
app.get('/api/data/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query('SELECT data FROM user_storage WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      res.json(result.rows[0].data);
    } else {
      res.json(null); // Chưa có dữ liệu
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 2. Lưu dữ liệu (POST - Upsert)
app.post('/api/data', async (req, res) => {
  const { email, data } = req.body;
  
  if (!email || !data) {
    return res.status(400).json({ error: 'Missing email or data' });
  }

  try {
    const query = `
      INSERT INTO user_storage (email, data, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (email)
      DO UPDATE SET data = $2, updated_at = NOW();
    `;
    await pool.query(query, [email, data]);
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// db.js (Phiên bản chuẩn cho Project của bạn)
import express from 'express';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

// Cấu hình đường dẫn (do dùng module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// --- 1. KẾT NỐI DATABASE ---
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => console.log('✅ Đã kết nối Database Render!'))
  .catch(err => console.error('❌ Lỗi DB:', err));
// --- 2. CẤU HÌNH ĐỂ CHẠY GIAO DIỆN REACT (QUAN TRỌNG) ---
// Phục vụ các file tĩnh trong thư mục dist (nơi vite build ra)
app.use(express.static(path.join(__dirname, 'dist')));

// API test database (để bạn kiểm tra)
app.get('/api/test', async (req, res) => {
  try {
    const result = await client.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chuyển mọi truy cập khác về trang chủ React (để không bị lỗi 404 khi F5)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- 3. KHỞI ĐỘNG SERVER ---
app.listen(port, () => {
  console.log(`Server đang chạy tại port ${port}`);
});
