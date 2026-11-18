// Model RiwayatStok: mencatat tiap barang masuk dan keluar, sekaligus
// mengubah stok produknya. Dua-duanya jalan dalam satu transaksi, jadi
// kalau salah satu gagal, stok nggak berubah setengah-setengah.
// Dipakai modul stok (Tahap M2) — tabel produknya SAMA dengan yang
// dipakai kasir, jadi barang masuk di sini langsung kelihatan di kasir.
const pool = require('../config/database');

// Mencatat satu pergerakan stok.
// jenis: 'masuk' (stok nambah) atau 'keluar' (stok berkurang).
// harga_beli dan keterangan boleh kosong — keterangan biasanya diisi nama
// supplier kalau masuk, atau alasan (misal "rusak") kalau keluar.
async function catat({ produk_id, jenis, jumlah, harga_beli, keterangan }) {
  const koneksi = await pool.getConnection();
  try {
    await koneksi.beginTransaction();

    // Kunci baris produknya dulu biar dua permintaan barengan nggak
    // rebutan ngubah stok yang sama.
    const [produk] = await koneksi.query(
      'SELECT * FROM produk WHERE id = ? FOR UPDATE',
      [produk_id]
    );
    if (produk.length === 0) {
      const galat = new Error('Produk tidak ditemukan');
      galat.kode = 'PRODUK_TIDAK_ADA';
      throw galat;
    }

    const stokBaru = jenis === 'masuk'
      ? produk[0].stok + jumlah
      : produk[0].stok - jumlah;
    if (stokBaru < 0) {
      const galat = new Error('Stok tidak cukup untuk barang keluar');
      galat.kode = 'STOK_KURANG';
      throw galat;
    }

    await koneksi.query('UPDATE produk SET stok = ? WHERE id = ?', [stokBaru, produk_id]);
    const [hasil] = await koneksi.query(
      `INSERT INTO riwayat_stok (produk_id, jenis, jumlah, harga_beli, keterangan)
       VALUES (?, ?, ?, ?, ?)`,
      [produk_id, jenis, jumlah, harga_beli || null, keterangan || null]
    );

    await koneksi.commit();
    return { id: hasil.insertId, produk_id, jenis, jumlah, stok_baru: stokBaru };
  } catch (err) {
    await koneksi.rollback();
    throw err;
  } finally {
    koneksi.release();
  }
}

// Daftar pergerakan stok, paling baru dulu. Boleh disaring per produk
// dengan produk_id, kalau kosong tampil semua (paling banyak 100 baris).
async function daftar(produk_id) {
  if (produk_id) {
    const [baris] = await pool.query(
      `SELECT r.*, p.nama AS nama_produk FROM riwayat_stok r
       JOIN produk p ON p.id = r.produk_id
       WHERE r.produk_id = ? ORDER BY r.dibuat_pada DESC, r.id DESC LIMIT 100`,
      [produk_id]
    );
    return baris;
  }
  const [baris] = await pool.query(
    `SELECT r.*, p.nama AS nama_produk FROM riwayat_stok r
     JOIN produk p ON p.id = r.produk_id
     ORDER BY r.dibuat_pada DESC, r.id DESC LIMIT 100`
  );
  return baris;
}

module.exports = { catat, daftar };
