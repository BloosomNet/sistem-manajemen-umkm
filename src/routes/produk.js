// Rute produk: alamat-alamat yang berhubungan dengan data produk.
const express = require('express');
const router = express.Router();
const produkController = require('../controllers/produkController');
const perluLogin = require('../middleware/perluLogin');

// Semua rute produk dikunci login. Aplikasi ini dipakai pemilik warung,
// bukan etalase publik — jadi melihat produk pun harus sudah masuk.
router.get('/', perluLogin, produkController.daftarProduk);
router.get('/:id', perluLogin, produkController.detailProduk);
router.post('/', perluLogin, produkController.tambahProduk);
router.put('/:id', perluLogin, produkController.ubahProduk);
router.delete('/:id', perluLogin, produkController.hapusProduk);

module.exports = router;
