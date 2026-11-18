// Rute stok: daftar stok dan ringkasannya, plus catat barang masuk/keluar
// dan riwayat mutasi. Semua rute dikunci login, sama seperti rute produk
// — stok adalah data toko, bukan etalase publik (etalase masuk Tahap M4).
const express = require('express');
const router = express.Router();
const stokController = require('../controllers/stokController');
const perluLogin = require('../middleware/perluLogin');

router.get('/ringkasan', perluLogin, stokController.ringkasan);
router.get('/perlu-dibeli', perluLogin, stokController.perluDibeli);
router.get('/riwayat', perluLogin, stokController.riwayat);
router.post('/masuk', perluLogin, stokController.barangMasuk);
router.post('/keluar', perluLogin, stokController.barangKeluar);
router.get('/', perluLogin, stokController.daftarStok);

module.exports = router;
