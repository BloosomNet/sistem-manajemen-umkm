// Rute laporan: alamat yang berhubungan dengan laporan penjualan.
const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanController');
const perluLogin = require('../middleware/perluLogin');

// Laporan penjualan dikunci login, sama seperti riwayat transaksi.
router.get('/harian', perluLogin, laporanController.laporanHarian);
router.get('/terlaris', perluLogin, laporanController.produkTerlaris);

module.exports = router;
