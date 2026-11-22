// Pengaturan koneksi ke basis data MySQL.
// Nilai diambil dari berkas .env, supaya kata sandi tidak tertulis di kode.
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'umkm_warung',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  // Penyedia basis data awan tertentu (mis. TiDB Cloud) mewajibkan koneksi
  // terenkripsi. Aktifkan lewat DB_SSL=true di .env bila diperlukan.
  ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
});

module.exports = pool;
