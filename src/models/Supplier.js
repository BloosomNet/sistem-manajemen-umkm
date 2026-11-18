// Model Supplier: siapa yang menyuplai barang apa.
// Supplier disimpan di tabel supplier, hubungannya dengan produk di
// tabel supplier_produk — satu supplier bisa menyuplai banyak barang,
// dan satu barang bisa disuplai lebih dari satu supplier. Tabel produk
// sendiri tidak diubah, supaya tetap sama dengan kasir dan katalog.
// Diambil dari inventaris-barang-warung (Tahap M3).
const pool = require('../config/database');

// Semua supplier, diurutkan berdasarkan nama, lengkap dengan jumlah
// barang yang disuplai dan nama-nama barangnya (dipisah koma).
async function semua() {
  const [baris] = await pool.query(
    `SELECT s.*,
      COUNT(sp.produk_id) AS jumlah_produk,
      GROUP_CONCAT(p.nama ORDER BY p.nama SEPARATOR ', ') AS nama_produk
     FROM supplier s
     LEFT JOIN supplier_produk sp ON sp.supplier_id = s.id
     LEFT JOIN produk p ON p.id = sp.produk_id
     GROUP BY s.id
     ORDER BY s.nama ASC`
  );
  return baris;
}

// Satu supplier berdasarkan id; null kalau tidak ada.
async function cariBerdasarkanId(id) {
  const [baris] = await pool.query('SELECT * FROM supplier WHERE id = ?', [id]);
  return baris[0] || null;
}

// Menambah supplier baru. Kontak dan alamat boleh kosong.
async function tambah({ nama, kontak, alamat }) {
  const [hasil] = await pool.query(
    'INSERT INTO supplier (nama, kontak, alamat) VALUES (?, ?, ?)',
    [nama, kontak || null, alamat || null]
  );
  return cariBerdasarkanId(hasil.insertId);
}

// Menghubungkan satu supplier dengan satu produk. Kalau hubungan itu
// sudah ada, tidak didobel — dijawab apa adanya saja.
async function tautkan(supplierId, produkId) {
  const [produk] = await pool.query('SELECT id FROM produk WHERE id = ?', [produkId]);
  if (produk.length === 0) {
    const galat = new Error('Produk tidak ditemukan');
    galat.kode = 'PRODUK_TIDAK_ADA';
    throw galat;
  }
  await pool.query(
    'INSERT IGNORE INTO supplier_produk (supplier_id, produk_id) VALUES (?, ?)',
    [supplierId, produkId]
  );
}

module.exports = { semua, cariBerdasarkanId, tambah, tautkan };
