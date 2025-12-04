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
