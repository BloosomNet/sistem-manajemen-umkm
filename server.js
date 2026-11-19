// Titik masuk aplikasi: menjalankan server Express dan melayani halaman utama.
// Sistem gabungan: basisnya dari aplikasi kasir warung, modul inventaris dan
// katalog publik digabung bertahap di tahap berikutnya (lihat PROGRESS.md).
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Membaca data JSON dari permintaan (dipakai saat simpan produk dan transaksi nanti)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Halaman aplikasi dikunci: yang belum masuk diarahkan ke halaman masuk.
// Penjaga ini dipasang SEBELUM berkas statis dilayani.
app.use(require('./src/middleware/kunciHalaman'));

// Melayani file statis dari folder public (HTML, CSS, dan JavaScript)
app.use(express.static(path.join(__dirname, 'public')));

// Rute pemeriksaan: memastikan server dan basis data masih bisa dihubungi
app.get('/api/sehat', async (req, res) => {
  res.json({ status: 'ok', pesan: 'Server sistem manajemen UMKM berjalan' });
});

// Rute produk, kasir, stok, supplier, laporan, dan login.
app.use('/api/produk', require('./src/routes/produk'));
app.use('/api/transaksi', require('./src/routes/transaksi'));
app.use('/api/stok', require('./src/routes/stok'));
app.use('/api/supplier', require('./src/routes/supplier'));
app.use('/api/laporan', require('./src/routes/laporan'));
// Etalase publik: tanpa login, terpisah dari rute admin di atas.
app.use('/api/etalase', require('./src/routes/etalase'));
app.get('/api/wa-nomor', require('./src/controllers/etalaseController').waNomor);
app.use('/api', require('./src/routes/auth'));

// Bikin tabel kalau belum ada, biar langsung jalan pas deploy.
require('./src/config/siapkanTabel')();

app.listen(PORT, () => {
  console.log(`Server sistem manajemen UMKM berjalan di http://localhost:${PORT}`);
});
