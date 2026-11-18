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

## Perbaikan fondasi — Selesai: semua halaman dan data dikunci login

Perbaikan yang sama seperti yang diterapkan di aplikasi-kasir-warung sesudah M1, supaya fondasi gabungan tidak mewarisi kekurangan yang sama: login di basis kasir awalnya baru mengunci aksi menulis, sementara halaman dan data bacaan masih terbuka tanpa login.

Yang dibuat kali ini:
- Penjaga halaman `src/middleware/kunciHalaman.js` dipasang di `server.js` sebelum berkas statis: halaman aplikasi (kecuali `/masuk.html`) diarahkan ke halaman masuk bila belum ada sesi. CSS/JS tidak dikunci (bukan data, dan dibutuhkan halaman masuk).
- Rute bacaan dikunci `perluLogin`: `GET /api/produk` dan `/:id`, `GET /api/transaksi` dan `/:id`, `GET /api/laporan/harian` dan `/terlaris`.
- `public/js/sesi.js`: sesi tidak ada/habis di halaman aplikasi = diarahkan ke halaman masuk.
- Tetap terbuka: `POST /api/masuk` dan `GET /api/sehat` (tanpa data, buat pemeriksaan deploy).

Yang sudah diuji (basis data MariaDB 10.11 lokal, server di port 3003):
- Tanpa login: `/` 302 ke `/masuk.html`; `GET /api/produk` dan `/api/laporan/harian` 401
- Sesudah masuk sebagai pemilik: `/` 200 dan `GET /api/produk` 200
- Data dan pengguna uji dihapus, server dimatikan sesudah uji

Lanjutan (umpan balik pemilik, hari yang sama): halaman masuk ikut dibersihkan seperti di kasir — bar navigasi dan tautan "Kembali ke Beranda" dihapus dari `masuk.html`, karena sebelum masuk keduanya tidak ada gunanya. Navigasi hanya muncul di halaman sesudah masuk.

## Tahap M2 — Selesai: Modul stok dari inventaris

Yang sudah dibuat:
- `src/models/RiwayatStok.js` (baru): mencatat tiap barang masuk/keluar sekaligus mengubah stok produknya dalam satu transaksi — kalau salah satu gagal, stok tidak berubah setengah-setengah. Baris produk dikunci dulu (`FOR UPDATE`) supaya dua permintaan barengan tidak rebutan.
- `src/models/Produk.js` diperluas: batas stok menipis `BATAS_MENIPIS = 5`, `semuaProduk` sekarang menerima saringan kedua (`menipis`/`habis`, boleh digabung dengan kata kunci cari), ditambah `perluDibeli()` (barang habis/menipis dari yang paling mendesak) dan `ringkasanStok()` (total produk, total stok, menipis, habis). Pemakaian lama di kasir (`semuaProduk(cari)`) tidak berubah perilakunya.
- `src/controllers/stokController.js` (baru) + `src/routes/stok.js` (baru): `GET /api/stok` (daftar + saringan + cari), `GET /api/stok/ringkasan`, `GET /api/stok/perlu-dibeli`, `GET /api/stok/riwayat` (boleh disaring per produk), `POST /api/stok/masuk`, `POST /api/stok/keluar`. Semua rute dikunci `perluLogin` — stok adalah data toko, bukan etalase publik.
- `server.js`: rute `/api/stok` didaftarkan. Skema tidak berubah — tabel `riwayat_stok` sudah ada sejak M1.
- `public/stok.html` (baru) + `public/js/stok.js` (baru): kartu ringkasan (jenis barang, total stok, menipis, habis), kartu peringatan "Perlu dibeli lagi" (habis/menipis dari yang paling mendesak), daftar stok dengan pencarian (debounce 300 ms) dan saringan Semua/Menipis/Habis, formulir catat barang masuk/keluar (kolom harga beli cuma muncul buat barang masuk), dan tabel riwayat mutasi. Bagian supplier sengaja TIDAK ikut — itu Tahap M3.
- Navigasi: tautan "Stok" ditambahkan di semua halaman (`index.html`, `kasir.html`, `riwayat.html`, `ganti-kata-sandi.html`); di `stok.html` sendiri tampil sebagai pil aktif.
- `public/css/style.css`: gaya halaman stok mengikuti variabel yang sudah ada (`.ringkasan-stok`, `.kartu-angka`, `.kartu-peringatan`, `.daftar-peringatan`, `.lencana`, `.jenis-masuk`/`.jenis-keluar`, `.saringan`/`.tombol-saring`, `.formulir`/`.kolom`); di HP kartu angka jadi dua kolom dan formulir jadi satu kolom. Kelas `.ringkasan` lama (halaman laporan) tidak disentuh — namanya sengaja dibedakan supaya tidak bentrok.

Cara kerja singkat:
- Barang masuk: `POST /api/stok/masuk` → `RiwayatStok.catat` menambah stok di tabel `produk` yang sama dengan kasir dan mencatat baris di `riwayat_stok` → `GET /api/produk` di kasir langsung menampilkan stok barunya.
- Barang keluar: sama, tapi stok berkurang; kalau jumlah keluar melebihi stok, ditolak 400 dan tidak ada yang berubah.
- Halaman stok memuat ringkasan, peringatan, daftar, dan riwayat lewat Fetch API, lalu memuat ulang semuanya sesudah formulir berhasil disimpan.

Yang sudah diuji (basis data MariaDB 10.11 lokal — dipasang ulang di VM ini karena VM ter-reset — server di port 3003, 35 cek, semua lulus):
- Server nyala: log "Tabel sudah siap." dan akun pemilik dibuat otomatis; `GET /api/sehat` ok
- Tanpa login: `GET /api/stok` dan `/api/stok/riwayat` 401, `/stok.html` 302 ke `/masuk.html`
- Data uji: Kopi Sachet Rp5.000 (stok 20), Gula 1kg Rp17.000 (stok 3), Teh Melati Rp4.000 (stok 0)
- `GET /api/stok/ringkasan`: total_produk 3, total_stok 23, menipis 1, habis 1; `GET /api/stok/perlu-dibeli`: Teh Melati (0) dulu, lalu Gula 1kg (3)
- Saringan + cari: `?saring=habis` 1 barang, `?cari=kopi` 1 barang, `?cari=%` 0 barang (tanda pola diamankan), `?saring=menipis&cari=gula` 1 barang
- `POST /api/stok/masuk` Kopi +10 (harga beli 4500, ket. "Toko Sinar") 201, stok_baru 30 — dan `GET /api/produk` di kasir menampilkan stok 30 (satu tabel, terbukti)
- `POST /api/stok/keluar` Kopi 5 (ket. "rusak") 201, stok_baru 25; keluar 100 ditolak 400; masuk produk 999 ditolak 404; masuk jumlah 0 dan harga_beli -5 ditolak 400
- Jualan kasir: `POST /api/transaksi` jual Kopi 2 (bayar 20000, kembali 10000) 201 — stok Kopi jadi 23, kasir dan stok memakai sumber stok yang sama
- `GET /api/stok/riwayat`: 2 baris, terbaru dulu (keluar 5 "rusak", lalu masuk 10 harga_beli 4500 "Toko Sinar")
- Halaman: `/stok.html`, `/js/stok.js`, `/css/style.css`, `/`, `/kasir.html`, `/riwayat.html` semua 200 sesudah login; `/api/laporan/harian` 200 (regresi); `stok.html` memuat `stok.js` dan navigasi aktif "Stok"; `index.html` menaut ke `/stok.html`
- Tidak ada error di log server; data uji dibersihkan (produk, transaksi, riwayat kembali 0), server dimatikan sesudah uji

Kekurangan saat ini (jujur):
- Supplier belum ada — keterangan barang masuk masih teks bebas, belum terhubung ke data supplier. Itu Tahap M3.
- Klik formulir di peramban sungguhan belum diuji — yang diuji endpointnya lewat curl dan elemen halamannya; alur kirim formulirnya memakai fetch yang sama seperti kode tahap sebelumnya.
- Peringatan stok belum menampilkan supplier-nya sekalian; pemilik masih perlu cek bagian Supplier sendiri (M3).

## Tahap berikutnya

Tahap M3: peringatan stok dan supplier — kartu peringatan stok menipis/habis + modul supplier dan tautan supplier–produk (dari inventaris).
