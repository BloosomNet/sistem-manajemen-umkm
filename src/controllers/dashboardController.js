// Pengatur dashboard: angka gabungan buat beranda — ringkasan stok,
// penjualan hari ini, dan barang yang perlu dibeli lagi. Satu alamat
// saja, supaya beranda tidak perlu memanggil tiga API terpisah.
const Produk = require('../models/Produk');
const Transaksi = require('../models/Transaksi');

// Tanggal hari ini dalam WIB, format YYYY-MM-DD. Laporan di repo ini
// memakai tanggal dari peramban (WIB), jadi dashboard ikut patokan
// yang sama, bukan tanggal server basis data.
function tanggalHariIniWIB() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

// Contoh: GET /api/dashboard
async function ringkasan(req, res) {
  try {
    const tanggal = tanggalHariIniWIB();
    const [stok, hariIni, perluDibeli] = await Promise.all([
      Produk.ringkasanStok(),
      Transaksi.ringkasanHariIni(tanggal),
      Produk.perluDibeli(),
    ]);
    res.json({
      tanggal,
      produk: stok,
      hari_ini: hariIni,
      // Beranda cuma menampilkan 5 yang paling mendesak;
      // daftar lengkapnya tetap di halaman stok.
      perlu_dibeli: perluDibeli.slice(0, 5),
    });
  } catch (kesalahan) {
    console.error(kesalahan);
    res.status(500).json({ pesan: 'Gagal mengambil ringkasan dashboard' });
  }
}

module.exports = { ringkasan };
