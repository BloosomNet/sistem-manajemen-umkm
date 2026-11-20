# Sistem Manajemen UMKM

Satu sistem terpadu untuk warung dan UMKM kecil: **kasir, inventaris, dan katalog online dalam satu aplikasi, satu login, dan satu basis data.** Pemilik warung tidak perlu memasang tiga aplikasi terpisah — jualan lewat kasir, stok tercatat otomatis, barang masuk dari supplier terlacak, dan pelanggan bisa melihat katalog dari HP lalu memesan lewat WhatsApp.

Project ini adalah penggabungan tiga project yang sebelumnya berdiri sendiri — [aplikasi-kasir-warung](https://github.com/BloosomNet/aplikasi-kasir-warung), [inventaris-barang-warung](https://github.com/BloosomNet/inventaris-barang-warung), dan [katalog-produk-warung](https://github.com/BloosomNet/katalog-produk-warung) — yang memang sejak awal dirancang dengan stack, struktur, dan skema tabel yang sama supaya bisa disatukan.

## Fitur

- **Dashboard** — beranda menampilkan ringkasan hari ini: total produk, total stok, nilai stok, stok menipis, stok habis, jumlah transaksi dan omzet hari ini (tanggal WIB), plus kartu peringatan barang yang perlu dibeli lagi beserta suppliernya.
- **Kasir** — jualan dengan hitung kembalian otomatis; setiap penjualan tercatat di riwayat transaksi dan langsung mengurangi stok.
- **Kelola produk** — tambah, ubah, dan hapus produk dengan nama, harga, stok, dan kategori.
- **Stok** — daftar stok dengan pencarian dan saringan (semua / menipis / habis), catat barang masuk dan keluar, dan riwayat mutasi lengkap — termasuk penjualan kasir yang tercatat sebagai barang keluar.
- **Peringatan stok + supplier** — kartu "Perlu dibeli lagi" menampilkan barang habis dan menipis dari yang paling mendesak, lengkap dengan nama suppliernya; modul supplier dengan tautan supplier–produk.
- **Etalase publik** — katalog untuk pelanggan tanpa login: daftar produk, detail, keranjang, dan pesan via WhatsApp dengan stok dicek ulang ke server sebelum pesan dikirim. Terpisah jelas dari halaman admin.
- **Riwayat & laporan** — daftar transaksi dengan pencarian nama barang, laporan harian, dan produk terlaris.
- **Login pemilik** — semua halaman admin dan data toko dikunci login; kata sandi disimpan sebagai hash scrypt, sesi memakai cookie bertanda tangan, dan kata sandi bisa diganti dari aplikasi.

Satu sumber stok untuk semuanya: kasir, modul stok, dan etalase membaca tabel `produk` yang sama, jadi stok yang terjual di kasir langsung terlihat berkurang di etalase.

## Arsitektur singkat

```
peramban ──> Express (server.js)
               ├─ halaman admin (dikunci login) ──> /api/produk, /api/transaksi,
               │     /api/stok, /api/supplier, /api/laporan, /api/dashboard
               └─ etalase publik (tanpa login) ──> /api/etalase, /api/wa-nomor
                          │
                          ▼
                    MySQL (satu basis data, 7 tabel)
                    pengguna · produk · transaksi · detail_transaksi
                    riwayat_stok · supplier · supplier_produk
```

Kode mengikuti pola MVC sederhana: `src/routes` (rute), `src/controllers` (logika permintaan), `src/models` (akses tabel), `src/middleware` (login dan penjaga halaman), `src/config` (koneksi dan pembuatan tabel otomatis). Tabel dibuat otomatis saat server pertama kali nyala, jadi tidak wajib menjalankan `database/schema.sql` manual.

## Teknologi yang dipakai

- Node.js dan Express.js — server dan REST API
- MySQL — satu basis data untuk semua modul
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

Belum ada — demo online menyusul setelah deploy di Tahap M7 dikonfirmasi. Tiga project asalnya masing-masing sudah punya demo sendiri (lihat repo mereka).

## Deploy ke Railway (rencana Tahap M7)

Pola yang sama seperti deploy kasir: service Node.js dari repo ini + MySQL. Sebelum deploy, siapkan di panel Railway:

- Variabel lingkungan: `PORT` (diisi Railway), `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=umkm_warung`, `OWNER_USER`, `OWNER_PASS` (ganti dari bawaan), `SESSION_SECRET` (teks acak yang panjang), dan `WA_NOMOR` (nomor WhatsApp warung, format internasional tanpa `+`).
- Basis data: paket Trial Railway menolak service MySQL baru ("Free plan resource provision limit exceeded") — seperti deploy inventaris dulu, pakai instance MySQL yang sudah ada (milik katalog) dengan database terpisah `umkm_warung`.
- Setelah service jalan, cek: `/api/sehat` mengembalikan `{"status":"ok"}`, halaman masuk bisa dibuka, dan `/etalase.html` bisa dibuka tanpa login.

## Kemajuan

Lihat `PROGRESS.md` untuk catatan tiap tahap: apa yang sudah selesai, apa yang belum, dan apa tahap berikutnya.
