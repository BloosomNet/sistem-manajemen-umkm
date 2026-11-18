// Rute transaksi: alamat yang berhubungan dengan pembayaran di kasir.
const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksiController');
const perluLogin = require('../middleware/perluLogin');

// Semua rute transaksi dikunci login, termasuk melihat riwayat —
// angka penjualan warung bukan untuk dilihat siapa saja.
router.post('/', perluLogin, transaksiController.buatTransaksi);
router.get('/', perluLogin, transaksiController.lihatRiwayat);
router.get('/:id', perluLogin, transaksiController.lihatSatu);

module.exports = router;
