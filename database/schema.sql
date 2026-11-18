-- Skema basis data sistem manajemen UMKM.
-- Jalankan berkas ini di MySQL untuk membuat semua tabel yang dibutuhkan.
-- Ini skema GABUNGAN dari tiga project: aplikasi-kasir-warung (pengguna,
-- produk, transaksi, detail_transaksi), inventaris-barang-warung
-- (riwayat_stok, supplier, supplier_produk), dan katalog-produk-warung
-- (memakai tabel produk yang sama). Satu basis data untuk semua modul.
CREATE DATABASE IF NOT EXISTS umkm_warung;
USE umkm_warung;

-- Akun pemilik warung untuk login.
-- Kata sandi disimpan sebagai hash scrypt, bukan teks aslinya.
CREATE TABLE IF NOT EXISTS pengguna (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_pengguna VARCHAR(50) NOT NULL UNIQUE,
  kata_sandi VARCHAR(255) NOT NULL,
  dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Produk: satu tabel ini dipakai bersama oleh kasir, inventaris, dan katalog.
CREATE TABLE IF NOT EXISTS produk (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  harga INT NOT NULL,
  stok INT NOT NULL DEFAULT 0,
  kategori VARCHAR(50),
  dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Satu baris transaksi untuk satu kali pembayaran di kasir.
CREATE TABLE IF NOT EXISTS transaksi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  total INT NOT NULL,
  bayar INT NOT NULL,
  kembalian INT NOT NULL,
  dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rincian barang yang dibeli dalam satu transaksi.
-- Nama dan harga disalin ke sini, supaya riwayat tetap benar
-- walaupun nama atau harga produk diubah di kemudian hari.
CREATE TABLE IF NOT EXISTS detail_transaksi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaksi_id INT NOT NULL,
  produk_id INT NOT NULL,
  nama_produk VARCHAR(100) NOT NULL,
  harga INT NOT NULL,
  jumlah INT NOT NULL,
  subtotal INT NOT NULL,
  FOREIGN KEY (transaksi_id) REFERENCES transaksi(id),
  FOREIGN KEY (produk_id) REFERENCES produk(id)
);

-- Tiap barang masuk/keluar dicatat di sini, supaya ketahuan stok
-- berubah karena apa dan kapan. jenis cuma 'masuk' atau 'keluar'.
CREATE TABLE IF NOT EXISTS riwayat_stok (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produk_id INT NOT NULL,
  jenis ENUM('masuk', 'keluar') NOT NULL,
  jumlah INT NOT NULL,
  harga_beli INT NULL,
  keterangan VARCHAR(255) NULL,
  dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier: siapa yang menyuplai barang ke warung.
CREATE TABLE IF NOT EXISTS supplier (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  kontak VARCHAR(100) NULL,
  alamat VARCHAR(255) NULL,
  dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hubungan supplier dengan produk yang disuplainya. Satu pasangan
-- cuma boleh sekali, makanya ada kunci uniknya.
CREATE TABLE IF NOT EXISTS supplier_produk (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  produk_id INT NOT NULL,
  dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unik_supplier_produk (supplier_id, produk_id)
);
