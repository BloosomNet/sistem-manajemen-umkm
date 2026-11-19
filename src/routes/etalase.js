// Rute etalase publik: daftar dan detail produk buat pelanggan.
// SENGAJA TANPA perluLogin — etalase memang buat umum, bukan buat pemilik.
// Rute ini terpisah jelas dari /api/produk (admin, dikunci login): yang
// keluar dari sini cuma produk yang stoknya masih ada, dan tidak ada
// rute tulis apa pun — tambah/ubah/hapus tetap lewat /api/produk sesudah masuk.
const express = require('express');
const router = express.Router();
const etalaseController = require('../controllers/etalaseController');

router.get('/', etalaseController.daftarEtalase);
router.get('/:id', etalaseController.detailEtalase);

module.exports = router;
