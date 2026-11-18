// Penjaga halaman: halaman aplikasi (selain halaman masuk) hanya boleh
// dibuka sesudah login — yang belum masuk diarahkan ke halaman masuk.
// Berkas CSS dan JS tidak dikunci, karena halaman masuk membutuhkannya
// dan isinya bukan data. Data sendiri dijaga di rute API (perluLogin).
const { ambilCookie, periksaToken } = require('../utils/sesi');

function kunciHalaman(req, res, next) {
  const halaman = req.path === '/' || req.path.endsWith('.html');
  if (!halaman || req.path === '/masuk.html') return next();
  if (periksaToken(ambilCookie(req, 'sesi'))) return next();
  return res.redirect('/masuk.html');
}

module.exports = kunciHalaman;
