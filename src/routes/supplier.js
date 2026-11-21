// Rute supplier: daftar, tambah, ubah, hapus supplier, dan hubungkan
// supplier dengan produk yang disuplainya. Semua rute dikunci login, sama
// seperti rute stok — supplier adalah data toko, bukan etalase publik.
const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const perluLogin = require('../middleware/perluLogin');

router.get('/', perluLogin, supplierController.daftarSupplier);
router.post('/', perluLogin, supplierController.tambahSupplier);
router.put('/:id', perluLogin, supplierController.ubahSupplier);
router.delete('/:id', perluLogin, supplierController.hapusSupplier);
router.post('/:id/produk', perluLogin, supplierController.tautkanProduk);

module.exports = router;
