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

## Tahap M3 — Selesai: Peringatan stok dan supplier

Yang sudah dibuat:
- `src/models/Supplier.js` (baru, diambil dari inventaris-barang-warung): daftar supplier lengkap dengan jumlah dan nama barang yang disuplai, cari berdasarkan id, tambah supplier, dan tautkan supplier dengan produk (tidak dobel kalau tautan yang sama dikirim dua kali).
- `src/controllers/supplierController.js` (baru) + `src/routes/supplier.js` (baru): `GET /api/supplier`, `POST /api/supplier`, `POST /api/supplier/:id/produk`. Semua rute dikunci `perluLogin` — supplier adalah data toko, bukan etalase publik.
- `server.js`: rute `/api/supplier` didaftarkan. Skema tidak berubah — tabel `supplier` dan `supplier_produk` sudah ada sejak M1.
- `public/supplier.html` (baru) + `public/js/supplier.js` (baru): formulir tambah supplier (nama wajib, kontak dan alamat boleh kosong), daftar supplier dalam bentuk kartu (nama, kontak, alamat, barang yang disuplai), dan formulir hubungkan supplier dengan barang.
- Navigasi: tautan "Supplier" ditambahkan di semua halaman (`index.html`, `kasir.html`, `stok.html`, `riwayat.html`, `ganti-kata-sandi.html`); di `supplier.html` sendiri tampil sebagai pil aktif.
- `src/models/Produk.js`: `perluDibeli()` sekarang ikut membawa `nama_supplier` (nama-nama supplier dipisah koma, null kalau belum ada supplier yang dihubungkan). Pemakaian lama tidak berubah — baris yang dikembalikan sama, cuma tambah satu kolom.
- Kartu peringatan di halaman stok sekarang menampilkan suppliernya: tiap barang di daftar "Perlu dibeli lagi" tertulis "dari Toko Sinar" atau "belum ada suppliernya" — ini menutup kekurangan M2 yang mencatat peringatan belum menampilkan supplier.
- Formulir barang masuk di halaman stok sekarang punya pilihan supplier (cuma muncul kalau jenisnya masuk): supplier yang dipilih langsung dihubungkan dengan barangnya, dan namanya dipakai sebagai keterangan kalau kolom keterangan dikosongkan. Kalau keterangan diisi sendiri, yang dipakai tetap keterangan itu. Ini menutup kekurangan M2 yang lain — keterangan barang masuk tadinya masih teks bebas, belum terhubung ke data supplier.
- `public/css/style.css`: gaya kartu supplier (`.kartu-supplier`, `.kontak`, `.suplai`) dan nama supplier di kartu peringatan (`.sumber`), mengikuti variabel warna yang sudah ada; di HP formulir supplier ikut jadi satu kolom seperti formulir stok.

Cara kerja singkat:
- Tambah supplier: `POST /api/supplier` → baris baru di tabel `supplier` → daftar supplier dimuat ulang.
- Hubungkan: `POST /api/supplier/:id/produk` → baris di `supplier_produk` (kunci unik menjaga tidak dobel) → daftar supplier menampilkan barangnya.
- Barang masuk dengan supplier: `POST /api/stok/masuk` dengan `supplier_id` → supplier dicek dulu (tidak ada = 404) → stok dicatat seperti biasa → supplier ditautkan ke produknya → kalau keterangan kosong, nama supplier dipakai sebagai keterangan.
- Kartu peringatan: `GET /api/stok/perlu-dibeli` → tiap barang membawa `nama_supplier` dari `GROUP_CONCAT` → halaman stok menampilkannya di samping sisa stok.

Yang sudah diuji (basis data MariaDB 10.11 lokal — dipasang ulang di VM ini karena VM ter-reset, mirror apt cogentco yang menggantung dibersihkan dulu — server di port 3003, 39 cek, semua lulus):
- Server nyala: log "Tabel sudah siap." dan akun pemilik dibuat otomatis; `GET /api/sehat` ok
- Tanpa login: `GET /api/supplier` 401, `/supplier.html` 302 ke `/masuk.html`
- Data uji: Kopi Sachet Rp5.000 (stok 20), Gula 1kg Rp17.000 (stok 3), Teh Melati Rp4.000 (stok 0)
- `GET /api/stok/perlu-dibeli` sebelum ada supplier: Teh Melati (0) dulu, lalu Gula 1kg (3), `nama_supplier` null di keduanya
- `POST /api/supplier` nama kosong ditolak 400; tambah "Toko Sinar" (kontak + alamat) dan "Pasar Induk" (nama saja) 201; `GET /api/supplier` 2 baris, `jumlah_produk` 0
- `POST /api/supplier/1/produk` tautkan Gula 201; tautkan yang sama lagi tetap 201 dan tidak dobel (jumlah_produk tetap 1); produk 999 ditolak 404; supplier 999 ditolak 404; produk_id "abc" ditolak 400
- `GET /api/supplier` sesudah tautan: Toko Sinar `jumlah_produk` 1, `nama_produk` "Gula 1kg"; `GET /api/stok/perlu-dibeli`: Gula membawa `nama_supplier` "Toko Sinar", Teh tetap null
- `POST /api/stok/masuk` Kopi +10 (harga beli 4500, supplier Toko Sinar, tanpa keterangan) 201, stok_baru 30 — riwayat keterangannya jadi "Toko Sinar" dan Toko Sinar otomatis menyuplai Kopi juga (2 barang); masuk supplier 999 ditolak 404; supplier_id "x" ditolak 400; masuk +2 via Pasar Induk dengan keterangan "kulakan pagi" 201, stok_baru 32, keterangan tetap "kulakan pagi"
- Regresi kasir: `GET /api/produk` menampilkan stok Kopi 32; `POST /api/transaksi` jual Kopi 2 (bayar 20000, kembali 10000) 201 — stok Kopi jadi 30; `GET /api/laporan/harian` 200
- Halaman: `/`, `/kasir.html`, `/stok.html`, `/supplier.html`, `/riwayat.html`, `/js/supplier.js`, `/js/stok.js`, `/css/style.css` semua 200 sesudah login; `supplier.html` memuat `supplier.js` dan navigasi aktif "Supplier"; `stok.html` memuat pilihan supplier; beranda menaut ke `/supplier.html`; `stok.js` memakai `nama_supplier` di peringatan
- Tidak ada error di log server; data uji dibersihkan (produk, supplier, tautan, riwayat, transaksi kembali 0), server dimatikan sesudah uji

Kekurangan saat ini (jujur):
- Supplier belum bisa diubah atau dihapus — baru tambah dan hubungkan. Kalau nama supplier salah ketik, perbaikannya baru bisa lewat basis data langsung.
- Klik formulir di peramban sungguhan belum diuji — yang diuji endpointnya lewat skrip dan elemen halamannya; alur kirim formulirnya memakai fetch yang sama seperti kode tahap sebelumnya.

## Tahap M4 — Selesai: Etalase katalog publik

Yang sudah dibuat:
- `src/models/Produk.js`: tiga fungsi baru khusus etalase — `semuaProdukTersedia(kategori, kataKunci)` (cuma stok > 0, boleh disaring kategori + dicari, pola LIKE diamankan seperti fungsi admin), `semuaKategori()` (kategori yang masih punya produk tersedia), dan `cariTersediaBerdasarkanId(id)` (null kalau stok habis). Fungsi admin tidak berubah — daftar admin tetap menampilkan semua produk termasuk yang habis.
- `src/controllers/etalaseController.js` (baru) + `src/routes/etalase.js` (baru): `GET /api/etalase` (daftar + kategori), `GET /api/etalase/:id` (detail), dan `GET /api/wa-nomor` (nomor WhatsApp dari `.env`, dibersihkan dulu supaya langsung bisa dipakai di wa.me; 404 kalau belum diatur). Rute ini SENGAJA tanpa `perluLogin` — terpisah jelas dari `/api/produk` admin yang tetap dikunci. Tidak ada rute tulis di etalase: tambah/ubah/hapus tetap lewat `/api/produk` sesudah masuk.
- `server.js`: rute `/api/etalase` dan `/api/wa-nomor` didaftarkan.
- `src/middleware/kunciHalaman.js`: tiga halaman etalase (`/etalase.html`, `/etalase-detail.html`, `/etalase-keranjang.html`) dibuka tanpa login, seperti `/masuk.html`. Halaman admin tetap diarahkan ke halaman masuk.
- `public/etalase.html` (baru) + `public/js/etalase.js` (baru): daftar produk sebagai kartu (nama, harga, stok, kategori), pencarian (debounce 300 ms), tombol saringan kategori, ketuk kartu membuka detail. Diambil dari katalog-produk-warung, disesuaikan ke rute `/api/etalase`.
- `public/etalase-detail.html` (baru) + `public/js/etalase-detail.js` (baru): nama, harga besar, stok tersedia, kategori, kolom jumlah (maksimal setinggi stok) + tombol "+ Keranjang".
- `public/etalase-keranjang.html` (baru) + `public/js/etalase-keranjang.js` (baru): keranjang di Local Storage (kunci `keranjang_etalase`, dibedakan dari keranjang katalog repo asal), tambah/kurang/hapus per barang, jumlah mentok di stok, total harga, tombol "Pesan via WhatsApp" yang cek stok ulang ke server dulu (barang habis dikeluarkan, jumlah berlebih dipotong, harga ikut harga terbaru), lalu membuka wa.me dengan pesan pesanan terisi otomatis; tombol "Kosongkan keranjang". Lencana jumlah keranjang tampil di kepala halaman etalase dan detail.
- `public/css/style.css`: gaya etalase (`.grid-produk`, `.kartu-produk`, `.tautan-detail`, `.harga-besar`, `.beli`, `.baris-keranjang`, `.atur-jumlah`, `.tombol-whatsapp`, `.tombol-kosongkan`, `.bar-atas`, `.tautan-keranjang`, `.info`) memakai variabel warna repo ini; kelas `.saringan`/`.tombol-saring`, `.total`, `.tombol-hapus`, dan `.tautan-kembali` yang sudah ada dipakai ulang, tidak dibuat dobel. Di HP: saringan digeser ke samping, beli jadi satu kolom selebar kartu, baris keranjang ditumpuk (nama di atas, pengatur jumlah + subtotal sebaris, Hapus selebar kartu); dua kartu berdampingan mulai layar 600px.
- Navigasi admin: tautan "Etalase" ditambahkan di semua halaman admin (`index.html`, `kasir.html`, `stok.html`, `supplier.html`, `riwayat.html`, `ganti-kata-sandi.html`); halaman etalase sendiri menaut balik ke "Masuk pemilik".
- `.env.example`: tambahan `WA_NOMOR` (format internasional tanpa +, contoh 6281234567890) dengan penjelasan. README: M4 dicentang.

Cara kerja singkat:
- Pelanggan buka `/etalase.html` tanpa login → `GET /api/etalase` mengembalikan cuma produk stok > 0 + daftar kategori → kartu produk tampil; saring/cari dikirim sebagai parameter.
- Ketuk kartu → `/etalase-detail.html?id=...` → `GET /api/etalase/:id` → jumlah dibatasi stok → "+ Keranjang" menyimpan ke Local Storage.
- Di keranjang → "Pesan via WhatsApp" → `GET /api/etalase` (stok terbaru) → keranjang disesuaikan → `GET /api/wa-nomor` → buka `https://wa.me/<nomor>?text=<pesan pesanan>` di tab baru.
- Admin tetap lewat `/` dan `/api/produk` sesudah masuk; stok yang sama dipakai kasir dan etalase karena tabel `produk`-nya satu.

Yang sudah diuji (basis data MariaDB 10.11 lokal — dipasang ulang di VM ini karena VM ter-reset, mirror apt cogentco yang menggantung dibersihkan dulu — server di port 3003, 35 cek curl + 12 cek Node, semua lulus):
- Tanpa login: `/etalase.html`, `/etalase-detail.html`, `/etalase-keranjang.html`, `/js/etalase*.js`, `/css/style.css`, `/api/etalase`, `/api/wa-nomor` (nomor 6281234567890) semua 200; `/` dan `/kasir.html` 302 ke `/masuk.html`; `GET /api/produk` dan `/api/stok` 401
- Data uji: Kopi Sachet Rp5.000 (stok 20, Minuman), Gula 1kg Rp17.000 (stok 3, Bahan), Teh Melati Rp4.000 (stok 0, Minuman)
- `GET /api/etalase`: 2 produk (Teh habis tidak tampil), kategori `['Bahan', 'Minuman']`; `?kategori=Minuman` 1 produk; `?cari=gula` 1 produk; `?cari=%` 0 produk (tanda pola diamankan)
- `GET /api/etalase/1` (Kopi) 200 stok 20; detail Teh 404; id 999 404
- Regresi admin: `GET /api/produk` sesudah login menampilkan 3 produk (termasuk Teh habis); `GET /api/laporan/harian` dan `/api/stok/ringkasan` 200; semua halaman admin 200 sesudah login
- Satu sumber stok: jual Kopi 2 + 1 lewat kasir (`POST /api/transaksi` 201, 201; laporan harian mencatat 2 transaksi omzet Rp15.000) → `GET /api/etalase/1` stok jadi 17
- Logika keranjang diuji lewat Node (12 cek, semua lolos): tambah/numpuk mentok di stok, ubah jumlah, hapus pas jumlah 0, kosongkan, susun pesan WA ("Gula 1kg x3 = Rp51.000 ... Total: Rp51.000"), sesuaikan dengan stok segar (barang habis dikeluarkan, jumlah dipotong ke stok, harga ikut harga terbaru)
- Catatan jujur soal 2 cek awal yang sempat gagal: skrip uji pertama memakai bentuk `items`/`id` buat `POST /api/transaksi`, dijawab 400 — bentuk yang benar di repo ini `barang`/`produk_id` (lihat `kasir.js`); sesudah skrip diperbaiki, kedua cek itu lolos (201, stok 17). Bukan cacat aplikasi.
- `etalase.html` memuat `etalase.js` dan tautan "Masuk pemilik"; `etalase-detail.html` memuat `etalase-detail.js`; tidak ada error di log server; data uji dibersihkan (produk, transaksi, riwayat, supplier kembali 0), server dimatikan sesudah uji

Kekurangan saat ini (jujur):
- Klik tombol "+ Keranjang" dan "Pesan via WhatsApp" di peramban sungguhan belum diuji — yang diuji endpointnya lewat curl, logika keranjangnya lewat Node, dan elemen halamannya; alur kirimnya memakai fetch yang sama seperti kode tahap sebelumnya. Pesan WhatsApp baru terbuka beneran kalau `WA_NOMOR` di `.env` sudah nomor warung asli (di `.env.example` masih contoh).
- Keranjang cuma tersimpan di peramban pelanggan itu sendiri (Local Storage) — ganti HP atau peramban, keranjangnya tidak ikut.
- Supplier belum bisa diubah atau dihapus — baru tambah dan hubungkan (kekurangan dari M3, belum disentuh tahap ini).

## Tahap M5 — Selesai: Alur stok menyatu

Yang sudah dibuat:
- `src/models/Transaksi.js`: tiap barang yang terjual di kasir sekarang juga dicatat sebagai barang keluar di `riwayat_stok` (jenis `keluar`, keterangan `Penjualan kasir #<id transaksi>`, harga_beli NULL) — di dalam transaksi basis data yang SAMA dengan pencatatan penjualan dan pengurangan stoknya. Sebelum tahap ini penjualan cuma mengurangi `produk.stok` tanpa jejak di riwayat mutasi, jadi halaman stok tidak tahu stok berkurang karena terjual; sekarang riwayatnya lengkap: masuk dari supplier, keluar karena rusak, dan keluar karena terjual. Tidak ada rute atau halaman baru: halaman stok yang sudah ada langsung menampilkan baris penjualan ini (lencana "Keluar" + keterangannya), dan etalase tidak disentuh karena memang sudah membaca tabel `produk` yang sama.
- README: M5 dicentang.

Cara kerja singkat:
- Jual di kasir → `POST /api/transaksi` → `buatTransaksi` dalam satu transaksi basis data: cek stok (baris dikunci `FOR UPDATE`), simpan transaksi + rincian, kurangi `produk.stok`, lalu sisipkan baris `riwayat_stok` per barang terjual → commit. Kalau ada satu langkah gagal (stok kurang, uang kurang), semuanya batal: tidak ada transaksi, stok tidak berkurang, dan tidak ada baris riwayat yatim.
- Alur ujung-ke-ujung yang sama: buat produk → stok masuk lewat `/api/stok/masuk` → jual lewat kasir → stok berkurang di admin dan di etalase (satu tabel `produk`) → riwayat stok menampilkan masuk dan penjualan.

Yang sudah diuji (basis data MariaDB 10.11 lokal — dipasang ulang di VM ini karena VM ter-reset, mirror apt cogentco yang menggantung dibersihkan dulu seperti catatan lama — server di port 3003, 22 cek, semua lulus):
- Server nyala: log "Tabel sudah siap." dan akun pemilik dibuat otomatis; `GET /api/sehat` ok; login pemilik jalan
- Alur ujung-ke-ujung: buat "Kopi Sachet Uji M5" Rp5.000 stok 0 (201) → stok masuk +20 (201, stok_baru 20) → `GET /api/etalase/:id` stok 20 → jual 3 lewat kasir bayar Rp20.000 (201, total Rp15.000, kembali Rp5.000) → `GET /api/produk/:id` stok 17 → `GET /api/etalase/:id` ikut jadi 17 (tanpa login, satu sumber stok terbukti)
- Riwayat stok produk itu: 2 baris — masuk 20 ("Toko Sinar") dan keluar 3 dengan keterangan "Penjualan kasir #<id>" (id-nya cocok dengan transaksi yang baru dibuat)
- Atomisitas: jual 100 (stok 17) ditolak 400, bayar kurang (Rp1.000 untuk Rp5.000) ditolak 400 — sesudah keduanya riwayat tetap 2 baris dan stok tetap 17, tidak ada baris riwayat yatim
- Batas publik/admin: tanpa login `/api/etalase` dan `/etalase.html` 200, `/api/produk` dan `/api/stok/riwayat` 401
- Regresi: `GET /api/stok/ringkasan` dan `/api/laporan/harian` 200, `/stok.html` 200 sesudah login; tidak ada error di log server selain jejak `console.error` dari dua penolakan jual yang memang disengaja
- Data uji dibersihkan (produk, transaksi, riwayat kembali 0), server dimatikan sesudah uji

Kekurangan saat ini (jujur):
- Klik tombol jual di peramban sungguhan belum diuji — yang diuji endpointnya lewat curl dan alurnya lewat API; alur kirimnya memakai fetch yang sama seperti kode tahap sebelumnya.
- Supplier belum bisa diubah atau dihapus — baru tambah dan hubungkan (kekurangan dari M3, belum disentuh tahap ini).
- Baris "Penjualan kasir #N" di halaman stok belum bisa diklik untuk melihat rincian transaksinya — itu jembatan kecil yang bisa masuk Tahap M6 kalau diperlukan.

## Tahap M6 — Selesai: Dashboard ringkasan + poles

Yang sudah dibuat:
- `src/models/Produk.js`: `ringkasanStok()` sekarang ikut menghitung `nilai_stok` (jumlah stok dikali harga jualnya). Pemakaian lama di halaman stok tidak berubah — cuma tambah satu kolom.
- `src/models/Transaksi.js`: fungsi baru `ringkasanHariIni(tanggal)` (jumlah transaksi + omzet pada satu tanggal) dan `lihatRiwayat()` sekarang menerima kata kunci ketiga — kalau diisi, daftar disaring ke transaksi yang menjual barang dengan nama itu (pola LIKE diamankan seperti di model Produk). `lihatRiwayat` tanpa kata kunci berperilaku sama seperti sebelumnya.
- `src/controllers/dashboardController.js` (baru) + `src/routes/dashboard.js` (baru): `GET /api/dashboard` (dikunci `perluLogin` — angka toko bukan untuk publik) mengembalikan ringkasan stok, penjualan hari ini, dan 5 barang paling mendesak dari `perluDibeli()` beserta nama suppliernya. `server.js`: rute `/api/dashboard` didaftarkan.
- `public/index.html` + `public/js/dashboard.js` (baru): beranda sekarang membuka dengan kartu "Ringkasan Hari Ini" (jenis produk, total stok, nilai stok, stok menipis, stok habis, transaksi hari ini, omzet hari ini) dan kartu peringatan "Perlu dibeli lagi" (5 teratas, kata-katanya disamakan dengan halaman stok: "dari ..." / "belum ada suppliernya", tautan ke halaman stok). `public/js/app.js`: sesudah produk ditambah, diubah, atau dihapus, angka dashboard ikut dimuat ulang.
- Pencarian di modul yang belum punya: `public/supplier.html` + `public/js/supplier.js` — kolom "Cari supplier" menyaring kartu yang tampil (nama, kontak, alamat, barang yang disuplai) di sisi peramban dengan debounce 300 ms, pilihan di formulir tautan tetap menampilkan semua supplier. `public/riwayat.html` + `public/js/riwayat.js` — kolom "Cari barang di daftar transaksi" mengirim `&cari=` ke `/api/transaksi`; laporan harian, produk terlaris, dan ringkasan tetap memakai rentang tanggal saja.
- `src/controllers/transaksiController.js`: `lihatRiwayat` meneruskan `req.query.cari` ke model.
- `public/css/style.css`: grid kartu angka dipakai bersama halaman stok dan dashboard (`.ringkasan-stok, .ringkasan-dashboard`); di HP keduanya jadi dua kolom. Tidak ada gaya baru yang dobel — kartu angka, kartu peringatan, dan daftar peringatan yang sudah ada dipakai ulang.
- README: M6 dicentang.

Cara kerja singkat:
- Buka beranda sesudah masuk → `GET /api/dashboard` → kartu angka terisi dari satu panggilan: `ringkasanStok()` (termasuk nilai stok), `ringkasanHariIni()` (tanggal hari ini WIB), dan `perluDibeli()` (5 teratas).
- "Hari ini" memakai tanggal WIB: `dibuat_pada` disimpan sebagai TIMESTAMP (UTC di server), jadi tanggalnya digeser dulu ke WIB dengan `CONVERT_TZ(dibuat_pada, '+00:00', '+07:00')` — kalau tidak, penjualan tengah malam WIB (00.00–07.00) jatuh ke tanggal UTC kemarin dan tidak kehitung. Offset angka tidak butuh tabel zona waktu.
- Cari supplier: disaring di peramban dari daftar yang sudah dimuat. Cari transaksi: disaring di server lewat `EXISTS` di rincian barangnya, jadi transaksi yang menjual barang itu saja yang kembali.

Yang sudah diuji (basis data MariaDB 10.11 lokal, server di port 3003, 42 cek, semua lulus):
- Server nyala: log "Tabel sudah siap." dan akun pemilik dibuat otomatis; `GET /api/sehat` ok; login pemilik jalan
- Tanpa login: `GET /api/dashboard` 401, `/` 302 ke `/masuk.html`; etalase tetap 200 tanpa login
- Data uji: Kopi Sachet Rp5.000 (stok 20, Minuman), Gula 1kg Rp17.000 (stok 3, Bahan), Teh Melati Rp4.000 (stok 0, Minuman)
- `GET /api/dashboard` sebelum jualan: total_produk 3, total_stok 23, nilai_stok Rp151.000, menipis 1, habis 1, hari ini 0 transaksi omzet Rp0, perlu_dibeli 2 barang (Teh Melati dulu), `nama_supplier` null, tanggal = hari ini WIB
- Supplier: tambah "Toko Sinar" 201, tautkan Gula 201 → dashboard: Gula membawa `nama_supplier` "Toko Sinar"
- Jualan kasir: `POST /api/transaksi` jual Kopi 2 (bayar 20000, kembali 10000) 201 → dashboard hari ini jadi 1 transaksi omzet Rp10.000 (terhitung benar walau uji jalan tengah malam WIB — ini yang diuji CONVERT_TZ-nya), total_stok 21, nilai_stok Rp141.000
- Pencarian riwayat: `?cari=kopi` 1 transaksi, `?cari=gula` 0, `?cari=%` 0 (tanda pola diamankan), tanpa cari 1 transaksi (regresi)
- Logika saring supplier diuji lewat Node (5 cek, semua lolos): tanpa kata kunci 2, "sinar" 1, "kopi" 1 (lewat barang yang disuplai), "0812" 1, "tidakada" 0
- Regresi: `GET /api/stok/ringkasan` nilai_stok Rp141.000; `GET /api/produk` 3 barang (termasuk Teh habis); `GET /api/laporan/harian` 200; `GET /api/etalase` tanpa login 2 produk (Teh habis tidak tampil)
- Halaman: `/`, `/kasir.html`, `/stok.html`, `/supplier.html`, `/riwayat.html`, `/js/dashboard.js`, `/js/supplier.js`, `/js/riwayat.js`, `/css/style.css` semua 200 sesudah login; beranda memuat kartu dashboard (`dash-omzet`, "Perlu dibeli lagi", tautan ke stok); `supplier.html` memuat `cari-supplier`; `riwayat.html` memuat `cari-transaksi`
- Catatan jujur soal 4 cek awal yang sempat gagal: skrip uji pertama membandingkan angka hasil SUM/COUNT dengan `===` padahal mysql2 mengembalikannya sebagai string ("23"), dan mengira `/api/etalase` mengembalikan array padahal bentuknya `{produk, kategori}` — sesudah skrip diperbaiki, keempat cek itu lolos. Bukan cacat aplikasi. Pembersihan data uji sempat gagal dua kali karena skrip di `/tmp` tidak menemukan `mysql2`/`dotenv` (jalur require-nya relatif ke skrip, bukan ke repo) — dibersihkan manual sesudahnya, terverifikasi produk/transaksi/riwayat/supplier kembali 0.
- Tidak ada error di log server; data uji dibersihkan, server dimatikan sesudah uji

Kekurangan saat ini (jujur):
- Klik kartu dan formulir di peramban sungguhan belum diuji — yang diuji endpointnya lewat curl/Node, logika saringnya lewat Node, dan elemen halamannya; alur kirimnya memakai fetch yang sama seperti kode tahap sebelumnya.
- Pencarian di riwayat cuma menyaring daftar transaksi — laporan harian dan produk terlaris tetap menampilkan seluruh rentang tanggal, jadi angkanya bisa terlihat tidak cocok dengan daftar yang tersaring kalau sedang mencari. Itu sengaja (biar ringkasan tetap utuh), tapi perlu dijelaskan ke pemilik kalau ditanya.
- "Hari ini" di dashboard sudah WIB, tapi laporan harian dan riwayat masih memakai `DATE(dibuat_pada)` mentah (UTC server) — penjualan tengah malam WIB bisa jatuh ke tanggal yang berbeda di laporan dibanding di dashboard. Perlu diselaraskan di tahap poles berikutnya kalau pemilik merasa angkanya janggal.
- Supplier belum bisa diubah atau dihapus — baru tambah dan hubungkan (kekurangan dari M3, belum disentuh tahap ini).

## Tahap M7 — Persiapan deploy (sebagian): README final + siap deploy

Deploy sungguhan ke Railway BELUM dilakukan di potongan ini — deploy tetap menunggu konfirmasi Farid di chat (perintah user 19 Nov: gerbang push dicabut, gerbang deploy tidak). Yang disiapkan di sini: README final yang menjual project ini, perbaikan kecil yang ketinggalan dari fondasi, daftar cek deploy, dan uji regresi penuh supaya begitu Farid bilang gas, deploy tinggal jalan.

Yang sudah dibuat:
- README ditulis ulang jadi README final: ringkasan satu paragraf, daftar fitur lengkap per modul (dashboard, kasir, kelola produk, stok, peringatan + supplier, etalase publik, riwayat & laporan, login pemilik), penekanan satu sumber stok, diagram arsitektur singkat (peramban → Express → MySQL 7 tabel), teknologi, cara menjalankan, bagian "Demo" (belum ada link — ditulis sesudah deploy dikonfirmasi), dan bagian "Deploy ke Railway" berisi variabel lingkungan yang harus diisi + catatan basis data.
- `src/config/database.js`: nama basis data bawaan kalau `DB_NAME` tidak diisi diperbaiki dari `kasir_warung` (sisa salinan kasir dari M1) menjadi `umkm_warung`. Selama ini tidak pernah terasa karena `.env` selalu mengisi `DB_NAME`, tapi di Railway yang lupa isi variabelnya bisa fatal — server akan menulis ke database yang salah.
- Daftar cek deploy (ditulis di README): variabel `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=umkm_warung`, `OWNER_USER`, `OWNER_PASS` (ganti dari bawaan), `SESSION_SECRET` (acak panjang), `WA_NOMOR`. Basis data: paket Trial Railway menolak service MySQL baru — seperti deploy inventaris dulu, pakai instance MySQL yang sudah ada (milik katalog) dengan database terpisah `umkm_warung`. Cek sesudah deploy: `/api/sehat` ok, halaman masuk bisa dibuka, `/etalase.html` bisa dibuka tanpa login.

Cara kerja singkat:
- Server sudah siap deploy dari sisi kode: `PORT` diambil dari environment (Railway mengisinya sendiri), `npm start` menjalankan `server.js`, tabel dibuat otomatis pas server nyala (`siapkanTabel`), dan akun pemilik dibuat otomatis dari `.env`. Tidak ada berkas konfigurasi Railway tambahan yang dibutuhkan — deploy kasir dulu juga jalan dengan pola yang sama.

Yang sudah diuji (basis data MariaDB 10.11 lokal — dipasang ulang di VM ini karena VM ter-reset, mirror apt cogentco yang menggantung dibersihkan dulu seperti catatan lama — server di port 3003, 31 cek, semua lulus):
- Server nyala: log "Tabel sudah siap." dan akun pemilik dibuat otomatis; `GET /api/sehat` ok; login pemilik jalan
- Tanpa login: `/` 302 ke `/masuk.html`; `GET /api/dashboard` 401; `/etalase.html` dan `GET /api/etalase` 200
- Alur ujung-ke-ujung: buat "Kopi Sachet Uji M7" Rp5.000 stok 20 (201) → stok masuk +10 (201) → jual 2 lewat kasir bayar Rp20.000 (201) → `GET /api/etalase/:id` stok 28 (satu sumber stok, terbukti sesudah perbaikan database.js)
- Dashboard: total_produk 1, total_stok 20, nilai_stok Rp100.000 sebelum stok masuk; sesudah jual, angka ikut berubah
- Regresi halaman: `/`, `/kasir.html`, `/stok.html`, `/supplier.html`, `/riwayat.html`, `/etalase.html`, `/etalase-detail.html`, `/etalase-keranjang.html`, `/masuk.html`, `/css/style.css`, dan semua JS modul (app, dashboard, kasir, stok, supplier, riwayat, etalase, etalase-detail, etalase-keranjang) semua 200 sesudah login
- Regresi API: `GET /api/laporan/harian`, `/api/stok/ringkasan`, `/api/supplier` semua 200
- Tidak ada baris "error" di log server; data uji dibersihkan (produk, transaksi, riwayat, supplier kembali 0), server dimatikan sesudah uji

Kekurangan saat ini (jujur):
- Deploy sungguhan belum jalan — butuh konfirmasi Farid, lalu dibuat service-nya di panel Railway dan variabel di atas diisi. Link demo di README masih kosong sampai deploy itu selesai dan dicek.
- Perbaikan nama database bawaan diuji lewat alur lengkap dengan `DB_NAME` terisi (seperti biasa); jalur "DB_NAME tidak diisi sama sekali" belum diuji langsung — cuma dibaca kodenya (`|| 'umkm_warung'`).
- Kekurangan lama yang belum disentuh: supplier belum bisa diubah/dihapus, dan klik di peramban sungguhan belum diuji.

## Perbaikan poles — Selesai: laporan dan riwayat memakai tanggal WIB

Menutup kekurangan M6 yang dicatat di atas: laporan harian dan riwayat masih memakai `DATE(dibuat_pada)` mentah (UTC server), sementara dashboard sudah WIB — penjualan tengah malam WIB (00.00–07.00) jatuh ke tanggal yang berbeda di laporan dibanding di dashboard. Deploy M7 masih menunggu konfirmasi Farid, jadi selagi menunggu, potongan ini merapikan tanggalnya.

Yang sudah dibuat:
- `src/models/Transaksi.js`: `laporanHarian`, `produkTerlaris`, dan `lihatRiwayat` sekarang memakai `DATE(CONVERT_TZ(dibuat_pada, '+00:00', '+07:00'))` — pola yang sama seperti `ringkasanHariIni` di dashboard, jadi tidak butuh tabel zona waktu. Tidak ada perubahan skema dan tidak ada perubahan bentuk respons.
- `src/utils/rentangTanggal.js`: rentang bawaan (7 hari terakhir sampai hari ini) sekarang dihitung dalam WIB lewat `toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })` — pola yang sama seperti dashboard. Sebelumnya memakai `toISOString()` (UTC server), jadi di pagi hari WIB rentang bawaannya masih tanggal kemarin.

Cara kerja singkat:
- Semua tanggal yang masuk laporan dan riwayat adalah tanggal WIB: transaksi dicatat dengan `dibuat_pada` UTC seperti biasa, tapi saat dikelompokkan atau disaring, tanggalnya digeser dulu +7 jam. Dashboard, laporan harian, terlaris, dan riwayat sekarang sepakat soal "hari ini".

Yang sudah diuji (basis data MariaDB 10.11 lokal — dipasang ulang di VM ini karena VM ter-reset, mirror apt cogentco yang menggantung dibersihkan dulu seperti catatan lama — server di port 3003, 13 cek, semua lulus):
- Server nyala: log "Tabel sudah siap." dan akun pemilik dibuat otomatis; `GET /api/sehat` ok; login pemilik jalan
- Transaksi uji dibuat lewat kasir (Kopi Uji WIB Rp5.000, jual 2 bayar Rp20.000, omzet Rp10.000), lalu `dibuat_pada`-nya digeser di basis data uji ke 2026-11-19 20:00 UTC (= 2026-11-20 03:00 WIB) untuk menguji batas tanggal
- `GET /api/laporan/harian?dari=2026-11-20&sampai=2026-11-20`: 1 transaksi, omzet Rp10.000, tanggal 2026-11-20; rentang 2026-11-19 kosong — sebelum perbaikan, transaksi ini jatuh ke 19 Nov
- `GET /api/laporan/terlaris` rentang 20 Nov: Kopi Uji WIB terjual 2; `GET /api/transaksi` rentang 20 Nov berisi transaksi, rentang 19 Nov tidak
- `GET /api/dashboard`: tanggal 2026-11-20, jumlah_transaksi 1, omzet Rp10.000 — dashboard dan laporan sekarang cocok
- `GET /api/laporan/harian` tanpa parameter: rentang bawaan 2026-11-14 sampai 2026-11-20 (WIB), berisi transaksi uji
- Regresi: `GET /api/stok/ringkasan` 200; halaman `/etalase.html`, `/kasir.html`, `/stok.html`, `/riwayat.html`, `/supplier.html` semua 200
- Tidak ada baris "error" di log server; data uji dibersihkan (produk, transaksi, riwayat kembali 0), server dimatikan sesudah uji

Kekurangan saat ini (jujur):
- Deploy sungguhan belum jalan — butuh konfirmasi Farid (lihat Tahap berikutnya).
- Kekurangan lama yang belum disentuh: supplier belum bisa diubah/dihapus, dan klik di peramban sungguhan belum diuji.

## Tahap M8 — Selesai: sistem-manajemen-umkm jadi project andalan di profil

Yang dibuat (di repo profil BloosomNet, bukan di repo ini):
- `sistem-manajemen-umkm` ditambahkan sebagai project andalan di bagian atas "Featured Projects" README profil, di atas tiga repo asal (kasir, katalog, inventaris), dengan penanda ⭐ Flagship dan deskripsi singkat: kasir + inventaris stok + etalase publik dalam satu aplikasi, satu sumber stok, plus dashboard ringkasan harian.
- Entrinya jujur soal status: tertulis "Live demo coming soon — deployment in progress", karena deploy M7 masih menunggu konfirmasi Farid dan belum ada link demo yang bisa ditulis.
- Baris "About Me" di profil disesuaikan sedikit: sekarang menyebut kasir, inventaris, dan katalog sudah digabung jadi satu sistem manajemen.
- Tiga repo asal tetap tampil di bawahnya sebagai project pendukung, tidak dihapus dan tidak diubah.

Cara kerja singkat:
- README profil dibaca dari GitHub dulu (head 0385648) dan dibandingkan dengan clone lokal — isinya sama persis, jadi tidak ada perubahan orang lain yang ketimpa.
- Entri flagship ditulis mengikuti gaya entri yang sudah ada (judul + deskripsi + baris badge shields.io yang sama), hanya ditambah penanda flagship dan catatan demo menyusul.

Yang sudah diuji (perubahan README saja, tidak ada kode):
- Struktur markdown diperiksa lokal: jumlah tag `<div>` buka/tutup tetap seimbang, tidak ada tag yang ketinggalan; pola URL badge dicek sama persis dengan tiga entri lama (hanya nama repo yang diganti).
- Tautan repo tujuan sudah terbukti ada — `list_commits` GitHub mengembalikan head 128bb0a untuk repo ini.
- Tidak ada server yang perlu dinyalakan: tidak ada endpoint, halaman, atau skema yang berubah.

Kekurangan saat ini (jujur):
- Deploy M7 belum jalan — butuh konfirmasi Farid; sesudah deploy, link demo ditambahkan ke entri profil ini dan ke README repo ini.
- Kekurangan lama yang belum disentuh: supplier belum bisa diubah/dihapus, dan klik di peramban sungguhan belum diuji.

## Perbaikan poles — Selesai: supplier bisa diubah dan dihapus

Menutup kekurangan M3 yang dicatat di atas: supplier belum bisa diubah atau dihapus — kalau nama supplier salah ketik, perbaikannya baru bisa lewat basis data langsung. Deploy M7 masih menunggu konfirmasi Farid, jadi selagi menunggu, potongan ini merapikan suppliernya.

Yang sudah dibuat:
- `src/models/Supplier.js`: `ubah(id, ...)` (UPDATE lalu mengembalikan baris sesudah diubah, null kalau id-nya tidak ada) dan `hapus(id)` (hapus tautan di `supplier_produk` dulu lalu suppliernya, dalam satu transaksi — tabel itu tidak punya foreign key, jadi tanpa langkah ini tautannya jadi baris yatim; riwayat stok tidak ikut berubah karena keterangannya cuma teks nama supplier).
- `src/controllers/supplierController.js`: `PUT /api/supplier/:id` (nama wajib, kontak dan alamat boleh kosong, pola potong 100/100/255 sama seperti tambah) dan `DELETE /api/supplier/:id`; keduanya 404 kalau id tidak ada, 400 kalau id bukan angka.
- `src/routes/supplier.js`: kedua rute didaftarkan dengan `perluLogin` — ubah dan hapus supplier tetap data toko, bukan etalase publik.
- `public/supplier.html` + `public/js/supplier.js`: tiap kartu supplier sekarang punya tombol "Ubah" dan "Hapus"; Ubah mengisi formulir yang sama (judul jadi "Ubah supplier", tombol jadi "Simpan perubahan", ada tombol "Batal ubah") lalu menyimpan lewat PUT; Hapus menanyakan dulu lewat confirm (dijelaskan tautannya ikut lepas, riwayat tetap) lalu DELETE. Kalau supplier yang sedang diubah ikut dihapus, mode ubahnya ikut dibatalkan.
- `public/css/style.css`: baris tombol `.aksi-supplier` (flex, mengikuti gaya tombol kecil yang sudah ada — `.tombol-kecil` dan `.tombol-hapus` dipakai ulang, tidak ada gaya baru yang dobel).

Cara kerja singkat:
- Ubah: klik "Ubah" di kartu → formulir terisi data lama → simpan → `PUT /api/supplier/:id` → daftar dimuat ulang; tautan ke produknya tidak berubah.
- Hapus: klik "Hapus" → confirm → `DELETE /api/supplier/:id` → tautan di `supplier_produk` ikut terhapus dalam transaksi yang sama → daftar dimuat ulang; kartu peringatan stok langsung kehilangan nama suppliernya (kembali "belum ada suppliernya") karena `perluDibeli()` membaca tautan yang sama.

Yang sudah diuji (basis data MariaDB 10.11 lokal — dipasang ulang di VM ini karena VM ter-reset, database + user dibuat ulang dengan kata sandi acak baru di `.env` lokal — server di port 3003, 41 cek, semua lulus):
- Server nyala: log "Tabel sudah siap." dan akun pemilik dibuat otomatis; `GET /api/sehat` ok; login pemilik jalan
- Tanpa login: `PUT /api/supplier/1` dan `DELETE /api/supplier/1` 401
- Data uji: Kopi Sachet Rp5.000 (stok 20), Gula 1kg Rp17.000 (stok 3); tambah "Toko Sinar" dan "Pasar Induk" 201; nama kosong ditolak 400; tautkan Gula ke Toko Sinar 201
- `GET /api/supplier`: Toko Sinar `jumlah_produk` 1, `nama_produk` "Gula 1kg Uji"; `GET /api/stok/perlu-dibeli`: Gula membawa `nama_supplier` "Toko Sinar"
- `PUT /api/supplier/1` ubah jadi "Toko Sinar Baru" + kontak baru 200, alamat kosong jadi null; `GET /api/supplier` sesudahnya: nama + kontak baru, tautan tetap 1; nama kosong 400; id 999 404; id "x" 400
- `DELETE /api/supplier/1` 200; `GET /api/supplier` tinggal Pasar Induk; `GET /api/stok/perlu-dibeli`: Gula `nama_supplier` null (tautan ikut bersih); hapus lagi 404; id 999 404; id "x" 400
- Regresi: `GET /api/stok/ringkasan`, `/api/dashboard`, `/api/laporan/harian` 200; `GET /api/etalase` 200 tanpa login; halaman `/`, `/kasir.html`, `/stok.html`, `/supplier.html`, `/etalase.html`, `/css/style.css`, `/js/supplier.js` semua 200
- Cek statis: `supplier.html` memuat id judul/tombol simpan/batal; `supplier.js` memuat `data-ubah`/`data-hapus`/confirm/PUT; `style.css` memuat `.aksi-supplier`
- Catatan jujur soal 5 cek awal yang sempat gagal: skrip uji pertama membaca id produk dari `data.produk.id`, padahal `POST /api/produk` mengembalikan produknya langsung (`data.id`) — sesudah skrip diperbaiki, kelima cek itu lolos. Bukan cacat aplikasi.
- Tidak ada error di log server; data uji dibersihkan (produk, supplier, tautan, transaksi, riwayat kembali 0), server dimatikan sesudah uji

Kekurangan saat ini (jujur):
- Deploy sungguhan belum jalan — butuh konfirmasi Farid (lihat Tahap berikutnya).
- Kekurangan lama yang belum disentuh: klik tombol Ubah/Hapus di peramban sungguhan belum diuji — yang diuji endpointnya lewat curl, logikanya lewat skrip, dan elemen halamannya; alur kirimnya memakai fetch yang sama seperti kode tahap sebelumnya.

## Perbaikan poles — Selesai: tombol Ubah/Hapus supplier teruji di peramban sungguhan

Menutup kekurangan yang dicatat di dua entri sebelumnya: klik tombol Ubah/Hapus supplier di peramban sungguhan belum pernah diuji — yang diuji baru endpointnya lewat curl, logikanya lewat skrip, dan elemen halamannya. Potongan ini tidak mengubah kode apa pun (tidak ada cacat yang ketemu), hanya membuktikan alur kliknya beneran jalan di peramban. Deploy M7 masih menunggu konfirmasi Farid, jadi selagi menunggu, potongan ini menutup kekurangan itu.

Yang sudah dibuat:
- Skrip uji peramban `uji_supplier_peramban.py` (Camoufox headless, Playwright) — disimpan di luar repo, di catatan kerja goal, supaya tidak ikut ter-push: masuk lewat formulir login sungguhan, tambah supplier lewat formulir, klik Ubah, simpan perubahan nama, klik Hapus (dialog confirm diterima otomatis), lalu cek regresi halaman kasir dan etalase. Kredensial pemilik dibaca dari `.env` lokal, tidak ditulis di skrip.
- Tiga bukti screenshot dari peramban: sesudah tambah (`1-sesudah-tambah.png`), mode ubah (`2-mode-ubah.png`), sesudah hapus (`3-sesudah-hapus.png`) — tersimpan bersama skripnya di catatan kerja goal.

Cara kerja singkat:
- Peramban membuka `http://localhost:3003/masuk.html`, mengisi nama pengguna dan kata sandi lalu mengklik tombol masuk (pindah ke beranda); lanjut ke `/supplier.html`, mengisi formulir tambah supplier lalu mengklik simpan; mengklik tombol Ubah di kartu (formulir berubah jadi mode ubah dan terisi data lama), mengganti nama lalu menyimpan; mengklik Hapus dan menerima dialog confirm — semuanya lewat klik dan ketikan sungguhan, bukan panggilan API langsung.

Yang sudah diuji (basis data MariaDB 10.11 lokal yang sudah jalan sejak run sebelumnya — server di port 3003, 8 cek, semua lulus):
- Masuk lewat formulir login: pindah ke beranda
- Halaman supplier kosong di awal ("Belum ada supplier")
- Tambah supplier lewat formulir: kartu "Toko Uji Peramban" muncul di daftar
- Klik Ubah membuka mode ubah: judul jadi "Ubah supplier", kolom nama terisi "Toko Uji Peramban", tombol "Batal ubah" kelihatan
- Simpan perubahan: daftar menampilkan "Toko Uji Peramban Baru", nama lama hilang
- Klik Hapus + confirm: daftar kembali kosong ("Belum ada supplier")
- Regresi: halaman kasir terbuka sesudah uji, etalase publik terbuka tanpa login
- Data uji dibersihkan: sesudah uji `GET /api/supplier` mengembalikan daftar kosong dan ringkasan stok kembali 0 semua; tidak ada baris "error" di log server; server dimatikan sesudah uji

Kekurangan saat ini (jujur):
- Deploy sungguhan belum jalan — butuh konfirmasi Farid (lihat Tahap berikutnya).
- Kekurangan lama yang belum disentuh: klik di peramban sungguhan untuk modul lain (kasir, stok, riwayat, etalase) masih belum diuji — yang diuji di potongan ini baru alur supplier; halaman kasir dan etalase baru dicek terbukanya saja, belum alur kliknya.

## Perbaikan poles — Selesai: alur klik kasir + etalase teruji di peramban sungguhan

Menutup kekurangan terakhir yang dicatat di dua entri sebelumnya: klik di peramban sungguhan untuk modul lain (kasir, stok, riwayat, etalase) belum pernah diuji — yang diuji baru alur supplier. Potongan ini tidak mengubah kode apa pun (tidak ada cacat yang ketemu), hanya membuktikan alur kliknya beneran jalan di peramban. Deploy M7 masih menunggu konfirmasi Farid, jadi selagi menunggu, potongan ini menutup kekurangan itu.

Yang sudah dibuat:
- Skrip uji peramban `uji_kasir_etalase_peramban.py` (Camoufox headless, Playwright) — disimpan di luar repo, di catatan kerja goal, supaya tidak ikut ter-push: masuk lewat formulir login, tambah produk lewat formulir beranda, jual 2 lewat kasir (klik Tambah, isi bayar, klik Selesaikan Transaksi), cek stok berkurang di kasir/stok/etalase, lalu di konteks tanpa login buka etalase publik, klik kartu ke detail, tambah ke keranjang, dan cek tombol Pesan via WhatsApp. Kredensial pemilik dibaca dari `.env` lokal, tidak ditulis di skrip.
- Empat bukti screenshot dari peramban: keranjang kasir (`1-kasir-keranjang.png`), pesan berhasil sesudah bayar (`2-kasir-berhasil.png`), kartu etalase stok 18 (`3-etalase-stok-18.png`), keranjang etalase + tombol WhatsApp (`4-etalase-keranjang.png`) — tersimpan bersama skripnya di catatan kerja goal.

Cara kerja singkat:
- Kasir (login): tambah "Kopi Uji Peramban" Rp5.000 stok 20 lewat formulir beranda → di kasir klik Tambah 2× (total Rp10.000) → isi bayar Rp20.000 (kembalian terhitung Rp10.000) → klik Selesaikan Transaksi → pesan "Transaksi #3 berhasil. Total Rp10.000, kembalian Rp10.000." → daftar kasir menulis stok 18; halaman stok dan riwayat ikut menampilkan produk/transaksi itu.
- Etalase (tanpa login, konteks baru): kartu produk menampilkan "Stok: 18" → klik kartu membuka detail ("Stok tersedia: 18") → klik "+ Keranjang" → keranjang menampilkan produk 1 pcs Rp5.000 dan tombol "Pesan via WhatsApp" (tidak diklik sampai membuka wa.me — cukup dibuktikan kelihatan).

Yang sudah diuji (basis data MariaDB 10.11 lokal — dipasang ulang di VM ini karena VM ter-reset, mirror apt cogentco yang menggantung dibersihkan dulu seperti perbaikan 18 Nov; database + user dibuat ulang sesuai `.env` lokal — server di port 3003, 14 cek, semua lulus):
- Masuk lewat formulir login: pindah ke beranda
- Tambah produk lewat formulir: produk muncul di daftar
- Klik Tambah 2× di kasir: total Rp10.000; kembalian terhitung otomatis Rp10.000
- Selesaikan transaksi lewat tombol bayar: "Transaksi #3 berhasil. Total Rp10.000, kembalian Rp10.000."
- Stok berkurang sesudah jualan (20 → 18), terlihat di daftar kasir, halaman stok, dan etalase publik
- Halaman riwayat menampilkan transaksi uji (Rp10.000)
- Etalase publik tanpa login ikut stok 18; klik kartu membuka detail; tambah ke keranjang jalan; keranjang berisi produk uji; tombol Pesan via WhatsApp kelihatan
- Data uji dibersihkan: sesudah uji produk, transaksi, riwayat stok, dan supplier kembali 0 semua; tidak ada baris "error" di log server; server dimatikan sesudah uji

Catatan jujur soal perjalanan uji ini (bukan cacat aplikasi):
- Percobaan pertama skrip ini gagal total di langkah tambah produk (klik Simpan tidak mengirim apa-apa), lalu debug berlapis menunjukkan alurnya kadang jalan kadang tidak di lingkungan yang baru saja di-reset — API lewat curl selalu 201, dan skrip debug yang sama persis lolos begitu dijalankan ulang tanpa perubahan apa pun. Dugaan: kondisi balapan sesaat sesudah MariaDB + server baru dinyalakan di VM yang baru ter-reset. Tidak ada kode yang diubah untuk "memperbaiki" ini; sesudah lingkungan hangat, tiga jalankan ulang skrip penuh semuanya lolos (13/14 lalu 14/14).
- Satu kali navigasi ke halaman riwayat dibatalkan peramban (`NS_BINDING_ABORTED`) — bukan galat aplikasi; skrip diberi percobaan ulang sekali untuk navigasi, sesudah itu tidak terulang.
- Satu asersi skrip sempat salah (halaman detail menulis "Stok tersedia: 18", bukan "Stok: 18") — diperbaiki di skripnya, bukan di aplikasi.

Kekurangan saat ini (jujur):
- Deploy sungguhan belum jalan — butuh konfirmasi Farid (lihat Tahap berikutnya).
- Semua alur klik modul di peramban sungguhan sekarang sudah teruji (kasir, stok, riwayat, etalase, supplier) — tidak ada lagi kekurangan modul yang tercatat dan belum disentuh.

## Tahap berikutnya

Tahap M7 (lanjutan): deploy gabungan ke Railway sesudah konfirmasi Farid di chat — buat service dari repo ini, isi variabel lingkungan sesuai daftar di README, pakai instance MySQL katalog dengan database `umkm_warung`, lalu cek demo publik (etalase, login, /api/sehat) dan tulis link demo di README repo ini serta di entri profil (M8 sudah selesai, tinggal tambah link demo). Sesudah deploy selesai, antrean penggabungan habis — run berikutnya masuk ke riset ide project baru (langkah 7 antrean).

## Poles UI menyeluruh (22 November 2026, sesudah M8)

Atas arahan Farid, seluruh halaman dipoles tanpa mengubah fungsi:

- Animasi GSAP di beranda: kartu angka muncul bertahap, angka ringkasan menghitung naik, bagian bawah muncul saat digulir, kartu terangkat saat hover. GSAP disimpan lokal di `public/js/vendor/`; halaman tetap utuh bila animasi dimatikan sistem (prefers-reduced-motion).
- Font Plus Jakarta Sans (dimuat dari Google Fonts, fallback system-ui).
- Grafik "Omzet 7 Hari Terakhir" (Chart.js) di beranda; data dari tambahan `omzet_7_hari` di `GET /api/dashboard` (model `Transaksi.omzetPerHari`, tanggal DATE_FORMAT supaya bebas geseran zona waktu, hari kosong diisi nol di pengatur).
- Ikon Lucide di semua tautan navigasi + tombol pengalih tema terang/gelap (tersimpan di localStorage, diterapkan dari <head> supaya tidak berkedip; variabel warna yang sama dipakai, tema gelap menimpa variabelnya).
- Detail kecil: kerangka berkedip selama ringkasan dimuat, toast "Produk tersimpan/diperbarui/dihapus", keadaan kosong daftar produk berkotak garis putus-putus, fokus papan ketik yang jelas.
- Responsivitas diverifikasi ulang dengan screenshot 390/768/1440px: tablet dan desktop sudah rapi; cacat HP yang ditemukan (tombol Hapus terpotong di kolom Aksi) diperbaiki — tombol Ubah/Hapus kini ditumpuk di layar ≤600px.
- Uji lokal: server + MariaDB, API dashboard dicocokkan dengan isi basis data, alur tambah/hapus produk memicu toast dan bersih kembali, screenshot terang/gelap di tiga lebar layar. Bukti di folder QC lokal (tidak ikut repo).
