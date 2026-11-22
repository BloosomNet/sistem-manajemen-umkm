// Pengatur dashboard: angka gabungan buat beranda — ringkasan stok,
// penjualan hari ini, barang yang perlu dibeli lagi, dan omzet tujuh
// hari terakhir buat grafik. Satu alamat saja, supaya beranda tidak
// perlu memanggil banyak API terpisah.
const Produk = require('../models/Produk');
const Transaksi = require('../models/Transaksi');

// Tanggal hari ini dalam WIB, format YYYY-MM-DD. Laporan di repo ini
// memakai tanggal dari peramban (WIB), jadi dashboard ikut patokan
// yang sama, bukan tanggal server basis data.
function tanggalHariIniWIB() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

// Daftar tujuh tanggal WIB berakhir hari ini, dari yang paling lama.
// Dihitung dengan menggeser tanggal UTC-nya: tanggal WIB didapat dari
// string en-CA di atas, lalu aritmetika harinya dilakukan di UTC
// supaya tidak terpengaruh zona waktu server.
function tujuhTanggalTerakhir() {
  const [tahun, bulan, tanggal] = tanggalHariIniWIB().split('-').map(Number);
  const hasil = [];
  for (let mundur = 6; mundur >= 0; mundur--) {
    const d = new Date(Date.UTC(tahun, bulan - 1, tanggal - mundur));
    hasil.push(d.toISOString().slice(0, 10));
  }
  return hasil;
}

// Contoh: GET /api/dashboard
async function ringkasan(req, res) {
  try {
    const tanggal = tanggalHariIniWIB();
    const daftarTanggal = tujuhTanggalTerakhir();
    const [stok, hariIni, perluDibeli, omzetMentah] = await Promise.all([
      Produk.ringkasanStok(),
      Transaksi.ringkasanHariIni(tanggal),
      Produk.perluDibeli(),
      Transaksi.omzetPerHari(daftarTanggal[0], tanggal),
    ]);
    // Hari tanpa penjualan diisi nol, supaya grafiknya utuh tujuh hari.
    const omzetPerTanggal = new Map(
      omzetMentah.map((baris) => [baris.tanggal, Number(baris.omzet)])
    );
    const omzet7Hari = daftarTanggal.map((tgl) => {
      const d = new Date(tgl + 'T00:00:00Z');
      return {
        tanggal: tgl,
        label: d.toLocaleDateString('id-ID', {
          weekday: 'short',
          timeZone: 'UTC',
        }),
        omzet: omzetPerTanggal.get(tgl) || 0,
      };
    });
    res.json({
      tanggal,
      produk: stok,
      hari_ini: hariIni,
      // Beranda cuma menampilkan 5 yang paling mendesak;
      // daftar lengkapnya tetap di halaman stok.
      perlu_dibeli: perluDibeli.slice(0, 5),
      omzet_7_hari: omzet7Hari,
    });
  } catch (kesalahan) {
    console.error(kesalahan);
    res.status(500).json({ pesan: 'Gagal mengambil ringkasan dashboard' });
  }
}

module.exports = { ringkasan };
