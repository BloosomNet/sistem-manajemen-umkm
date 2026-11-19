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

## Tahap berikutnya

Tahap M6: dashboard ringkasan + poles — halaman ringkasan menampilkan angka gabungan (total produk, stok menipis, transaksi hari ini, nilai stok) + pencarian dan tampilan HP rapi di semua modul. Uji regresi semua modul.
