// Model Produk: semua perintah ke tabel produk dikumpulkan di sini.
// Tabel ini dipakai bersama oleh kasir dan modul stok — satu sumber stok,
// jadi barang masuk di halaman stok langsung kelihatan di kasir.
const pool = require('../config/database');

// Batas stok menipis: 5 ke bawah (tapi masih di atas nol) dianggap menipis.
// Angka ini dipakai di mana-mana, jadi ditaruh di sini saja.
const BATAS_MENIPIS = 5;

// Mengambil semua produk, diurutkan berdasarkan nama.
// Kalau diberi kata kunci, hanya produk yang nama atau kategorinya cocok yang dikembalikan.
// Tanda % dan _ di kata kunci diamankan supaya dianggap huruf biasa, bukan pola LIKE.
// Saringan kedua (boleh kosong): 'menipis' (stok 1 sampai 5) atau 'habis'
// (stok 0) — dipakai halaman stok, boleh digabung dengan kata kunci.
async function semuaProduk(kataKunci, saringan) {
  const kata = typeof kataKunci === 'string' ? kataKunci.trim() : '';
  const syarat = [];
  const nilai = [];
  if (saringan === 'menipis') {
    syarat.push('stok > 0 AND stok <= ?');
    nilai.push(BATAS_MENIPIS);
  } else if (saringan === 'habis') {
    syarat.push('stok = 0');
  }
  if (kata) {
    const pola = '%' + kata.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_') + '%';
    // Tanda \ di pola sudah diamankan di atas; LIKE MySQL memakai \ sebagai
    // karakter pelindung bawaan, jadi tidak perlu klausa ESCAPE.
    syarat.push('(nama LIKE ? OR kategori LIKE ?)');
    nilai.push(pola, pola);
  }
  const klausa = syarat.length ? ' WHERE ' + syarat.join(' AND ') : '';
  const [baris] = await pool.query(
    'SELECT * FROM produk' + klausa + ' ORDER BY nama ASC',
    nilai
  );
  return baris;
}

// Mengambil satu produk berdasarkan id. Hasilnya null kalau tidak ditemukan.
async function cariBerdasarkanId(id) {
  const [baris] = await pool.query('SELECT * FROM produk WHERE id = ?', [id]);
  return baris[0] || null;
}

// Menambah produk baru, lalu mengembalikan data produk yang baru dibuat.
async function tambahProduk(data) {
  const [hasil] = await pool.query(
    'INSERT INTO produk (nama, harga, stok, kategori) VALUES (?, ?, ?, ?)',
    [data.nama, data.harga, data.stok, data.kategori || null]
  );
  return cariBerdasarkanId(hasil.insertId);
}

// Mengubah produk yang sudah ada. Mengembalikan data terbaru, atau null kalau tidak ditemukan.
async function ubahProduk(id, data) {
  const [hasil] = await pool.query(
    'UPDATE produk SET nama = ?, harga = ?, stok = ?, kategori = ? WHERE id = ?',
    [data.nama, data.harga, data.stok, data.kategori || null, id]
  );
  if (hasil.affectedRows === 0) return null;
  return cariBerdasarkanId(id);
}

// Menghapus produk. Mengembalikan true kalau ada baris yang terhapus.
async function hapusProduk(id) {
  const [hasil] = await pool.query('DELETE FROM produk WHERE id = ?', [id]);
  return hasil.affectedRows > 0;
}

// Daftar belanja: produk yang perlu dibeli lagi — stoknya habis atau
// menipis — diurutkan dari yang paling mendesak (stok paling kecil dulu).
// Tiap barang ikut membawa nama suppliernya (dipisah koma, null kalau
// belum ada supplier yang dihubungkan), supaya kartu peringatan di
// halaman stok langsung tahu mau pesan ke siapa.
async function perluDibeli() {
  const [baris] = await pool.query(
    `SELECT p.*,
      GROUP_CONCAT(s.nama ORDER BY s.nama SEPARATOR ', ') AS nama_supplier
     FROM produk p
     LEFT JOIN supplier_produk sp ON sp.produk_id = p.id
     LEFT JOIN supplier s ON s.id = sp.supplier_id
     WHERE p.stok <= ?
     GROUP BY p.id
     ORDER BY p.stok ASC, p.nama ASC`,
    [BATAS_MENIPIS]
  );
  return baris;
}

// Ringkasan stok buat kartu di halaman stok dan dashboard beranda:
// jumlah produk, total stok, berapa yang menipis, berapa yang habis,
// dan nilai stok (jumlah stok dikali harga jualnya). Dihitung sekali
// jalan dari tabel produk.
async function ringkasanStok() {
  const [baris] = await pool.query(
    `SELECT
      COUNT(*) AS total_produk,
      COALESCE(SUM(stok), 0) AS total_stok,
      COALESCE(SUM(CASE WHEN stok > 0 AND stok <= ? THEN 1 ELSE 0 END), 0) AS menipis,
      COALESCE(SUM(CASE WHEN stok = 0 THEN 1 ELSE 0 END), 0) AS habis,
      COALESCE(SUM(stok * harga), 0) AS nilai_stok
     FROM produk`,
    [BATAS_MENIPIS]
  );
  return baris[0];
}

// --- Etalase publik (Tahap M4) ---
// Yang tampil di etalase cuma produk yang masih ada stoknya — pelanggan
// tidak boleh memesan barang habis. Fungsi-fungsi ini dipakai rute
// /api/etalase saja, terpisah dari daftar admin yang menampilkan semua produk.
// Pola amankan kata kunci LIKE sama seperti semuaProduk di atas.
async function semuaProdukTersedia(kategori, kataKunci) {
  const kat = typeof kategori === 'string' ? kategori.trim() : '';
  const kata = typeof kataKunci === 'string' ? kataKunci.trim() : '';
  const syarat = ['stok > 0'];
  const nilai = [];
  if (kat) {
    syarat.push('kategori = ?');
    nilai.push(kat);
  }
  if (kata) {
    const pola = '%' + kata.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_') + '%';
    syarat.push('(nama LIKE ? OR kategori LIKE ?)');
    nilai.push(pola, pola);
  }
  const [baris] = await pool.query(
    'SELECT * FROM produk WHERE ' + syarat.join(' AND ') + ' ORDER BY nama ASC',
    nilai
  );
  return baris;
}

// Daftar kategori yang masih punya produk tersedia, buat tombol saringan etalase.
async function semuaKategori() {
  const [baris] = await pool.query(
    'SELECT DISTINCT kategori FROM produk WHERE stok > 0 AND kategori IS NOT NULL AND kategori <> "" ORDER BY kategori ASC'
  );
  return baris.map((b) => b.kategori);
}

// Satu produk berdasarkan id, tapi cuma kalau stoknya masih ada —
// barang habis tidak bisa dibuka detailnya dari etalase.
async function cariTersediaBerdasarkanId(id) {
  const [baris] = await pool.query(
    'SELECT * FROM produk WHERE id = ? AND stok > 0',
    [id]
  );
  return baris[0] || null;
}

module.exports = { semuaProduk, cariBerdasarkanId, tambahProduk, ubahProduk, hapusProduk, perluDibeli, ringkasanStok, BATAS_MENIPIS, semuaProdukTersedia, semuaKategori, cariTersediaBerdasarkanId };
