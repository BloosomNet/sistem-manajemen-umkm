// Penjaga halaman: halaman aplikasi (selain halaman masuk) hanya boleh
// dibuka sesudah login — yang belum masuk diarahkan ke halaman masuk.
// Pengecualian: halaman ETALASE (/etalase*.html) memang buat umum, jadi
// dibuka tanpa login — sama seperti halaman masuk. Rute API etalase juga
// publik (dijaga di rutenya sendiri, bukan di sini).
// Berkas CSS dan JS tidak dikunci, karena halaman masuk membutuhkannya
// dan isinya bukan data. Data sendiri dijaga di rute API (perluLogin).
const { ambilCookie, periksaToken } = require('../utils/sesi');

const HALAMAN_PUBLIK = ['/masuk.html', '/etalase.html', '/etalase-detail.html', '/etalase-keranjang.html'];

function kunciHalaman(req, res, next) {
  const halaman = req.path === '/' || req.path.endsWith('.html');
  if (!halaman || HALAMAN_PUBLIK.includes(req.path)) return next();
  if (periksaToken(ambilCookie(req, 'sesi'))) return next();
  return res.redirect('/masuk.html');
}

module.exports = kunciHalaman;
