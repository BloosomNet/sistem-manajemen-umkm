# Kemajuan — Sistem Manajemen UMKM

## Tahap M1 — Selesai: Fondasi sistem gabungan

Yang sudah dibuat:
- Repo ini dimulai dari aplikasi-kasir-warung sebagai basis (sudah ada login, kelola produk, transaksi kasir, riwayat & laporan), disalin utuh lalu identitasnya disesuaikan: nama paket, judul halaman, dan pesan server sekarang "Sistem Manajemen UMKM".
- Skema basis data GABUNGAN dalam satu database `umkm_warung` (`database/schema.sql`): `pengguna`, `produk`, `transaksi`, `detail_transaksi` dari kasir, ditambah `riwayat_stok`, `supplier`, `supplier_produk` dari inventaris. Tabel `produk` tetap satu dan sama — nanti dipakai bersama oleh kasir, inventaris, dan katalog.
- `src/config/siapkanTabel.js` diperluas: sekarang membuat ketujuh tabel itu otomatis pas server nyala (tetap dengan pola coba-lagi 12 kali jeda 5 detik), dan akun pemilik pertama tetap dibuat otomatis dari `.env`.
- `.env.example`: nama database `umkm_warung`, port bawaan 3003 (biar tidak bentrok dengan kasir 3000, katalog 3001, inventaris 3002 pas jalan bareng lokal).
- README baru: gambaran besar sistem, daftar modul dan rencana tahap M1–M7, cara menjalankan.
- Tiga repo asal (kasir, inventaris, katalog) TIDAK diubah sama sekali — mereka tetap berdiri sendiri dengan demonya masing-masing.

Cara kerja singkat:
- Server nyala → `siapkanTabel()` membuat 7 tabel gabungan kalau belum ada → akun pemilik dibuat kalau tabel pengguna masih kosong → server melayani halaman dan API kasir seperti sebelumnya, sekarang di atas skema gabungan.
- Tabel inventaris (`riwayat_stok`, `supplier`, `supplier_produk`) di tahap ini baru skemanya saja — endpoint dan halamannya masuk di Tahap M2 dan M3.

Yang sudah diuji (basis data MariaDB 10.11 lokal, server di port 3003):
- Server nyala dengan log baru "Server sistem manajemen UMKM berjalan"; log "Tabel sudah siap." dan akun pemilik "pemilik" terbuat otomatis
- `SHOW TABLES` di database `umkm_warung`: ketujuh tabel ada (pengguna, produk, transaksi, detail_transaksi, riwayat_stok, supplier, supplier_produk)
- `GET /api/sehat` mengembalikan {"status":"ok","pesan":"Server sistem manajemen UMKM berjalan"}
- Login jalan: `POST /api/masuk` dengan akun pemilik bawaan dijawab "Berhasil masuk"
- Regresi kasir: `POST /api/produk` (sesudah login) membuat Kopi Sachet Rp5.000 stok 20, `GET /api/produk` mengembalikannya
- Halaman `/`, `/masuk.html`, `/kasir.html` dimuat HTTP 200
- Data dan pengguna uji dihapus, server dimatikan sesudah uji

Kekurangan saat ini (jujur):
- Modul inventaris dan katalog belum berfungsi di sini — baru skema tabelnya. Itu Tahap M2–M4.
- Belum ter-deploy — itu Tahap M7.

## Tahap berikutnya

Tahap M2: modul stok dari inventaris (daftar stok, barang masuk, barang keluar, riwayat mutasi) menyatu di dashboard yang sama, memakai tabel produk yang sama dengan kasir.
