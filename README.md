# Sistem Manajemen UMKM

Satu sistem terpadu untuk warung dan UMKM kecil: **kasir, inventaris, dan katalog online dalam satu aplikasi dengan satu login dan satu basis data.** Project ini adalah penggabungan tiga project yang sebelumnya berdiri sendiri — [aplikasi-kasir-warung](https://github.com/BloosomNet/aplikasi-kasir-warung), [inventaris-barang-warung](https://github.com/BloosomNet/inventaris-barang-warung), dan [katalog-produk-warung](https://github.com/BloosomNet/katalog-produk-warung) — yang memang sejak awal dirancang dengan stack, struktur, dan skema tabel yang sama supaya bisa disatukan.

## Siapa penggunanya

Pemilik warung atau toko kecil. Semua urusan toko di satu tempat: jualan lewat kasir, stok tercatat otomatis, barang masuk dari supplier terlacak, dan pelanggan bisa melihat katalog produk dari HP lalu memesan lewat WhatsApp — tanpa pemilik harus memasang tiga aplikasi terpisah.

## Modul dan rencana tahap

Penggabungan dikerjakan bertahap (satu tahap per potongan, selalu diuji sebelum lanjut):

- [x] Tahap M1: Fondasi — basis aplikasi kasir (login, kelola produk, transaksi, riwayat & laporan) disalin ke repo ini, skema basis data digabung jadi satu (7 tabel), nama dan identitas disesuaikan jadi sistem terpadu
- [x] Tahap M2: Modul stok — daftar stok, barang masuk, barang keluar, dan riwayat mutasi dari inventaris menyatu di dashboard yang sama, memakai tabel produk yang sama dengan kasir
- [x] Tahap M3: Peringatan stok dan supplier — kartu peringatan stok menipis/habis menampilkan suppliernya, modul supplier dan hubungannya dengan produk
- [x] Tahap M4: Etalase katalog publik — katalog produk untuk pelanggan (daftar, detail, keranjang, pesan via WhatsApp) tanpa login, terpisah jelas dari halaman admin
- [x] Tahap M5: Alur stok menyatu — penjualan di kasir dan mutasi stok memakai satu sumber stok yang sama; etalase ikut berubah otomatis
- [ ] Tahap M6: Dashboard ringkasan — total produk, stok menipis, transaksi hari ini, dan nilai stok di satu halaman, plus poles tampilan HP di semua modul
- [ ] Tahap M7: Deploy online — demo publik yang bisa dicoba langsung

## Teknologi yang dipakai

- Node.js dan Express.js — server dan REST API
- MySQL — satu basis data untuk semua modul (tabel produk dipakai bersama kasir, inventaris, dan katalog)
- HTML5, CSS3, dan JavaScript — tampilan dan interaksi di peramban
- Fetch API — mengambil data dari server
- Kata sandi login disimpan sebagai hash scrypt; sesi login memakai cookie bertanda tangan

## Cara menjalankan

1. Salin berkas `.env.example` menjadi `.env`, lalu isi pengaturannya:

   ```bash
   cp .env.example .env
   ```

2. Buat basis data dari berkas `database/schema.sql` di MySQL — atau biarkan server membuatnya sendiri: tabel dibuat otomatis pas server nyala (`src/config/siapkanTabel.js`), jadi langkah ini boleh dilewati kalau basis datanya masih kosong.
3. Buat pengguna basis data yang sama dengan isi `.env` (misalnya pengguna `kasir` dengan kata sandi yang kamu tulis di `.env`):

   ```sql
   CREATE USER 'kasir'@'localhost' IDENTIFIED BY 'kata-sandi-di-.env';
   GRANT ALL PRIVILEGES ON umkm_warung.* TO 'kasir'@'localhost';
   ```

4. Pasang paket yang dibutuhkan:

   ```bash
   npm install
   ```

5. Jalankan server:

   ```bash
   npm start
   ```

6. Buka di peramban: http://localhost:3003 — akun pemilik pertama dibuat otomatis dari `OWNER_USER`/`OWNER_PASS` di `.env` (bawaan: `pemilik` / `warung123`, ganti sebelum dipakai beneran).

## Demo

Belum ada — demo online menyusul di Tahap M7. Tiga project asalnya masing-masing sudah punya demo sendiri (lihat repo mereka).

## Kemajuan

Lihat `PROGRESS.md` untuk catatan tiap tahap: apa yang sudah selesai, apa yang belum, dan apa tahap berikutnya.
