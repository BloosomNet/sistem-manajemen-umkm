// Rute dashboard: angka gabungan buat beranda.
// Dikunci login, sama seperti ringkasan stok — angka toko bukan
// untuk dilihat siapa saja.
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const perluLogin = require('../middleware/perluLogin');

router.get('/', perluLogin, dashboardController.ringkasan);

module.exports = router;
