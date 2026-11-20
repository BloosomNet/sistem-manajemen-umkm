// Membaca dan memeriksa rentang tanggal dari permintaan.
// Dipakai halaman riwayat dan laporan, supaya aturannya sama di semua tempat.
// Kalau tanggal tidak diisi, dipakai 7 hari terakhir sampai hari ini.
// Mengembalikan { dari, sampai } atau { galat } kalau tanggal tidak sah.
function bacaRentangTanggal(query) {
  // Tanggal bawaan dihitung dalam WIB, sama seperti dashboard — kalau
  // memakai tanggal UTC server, di pagi hari WIB (00.00–07.00) rentang
  // bawaannya masih tanggal kemarin dan transaksi hari ini tidak ikut.
  const keTeksWIB = (tanggal) =>
    tanggal.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

  const hariIniWIB = keTeksWIB(new Date());
  const tujuhHariLalu = new Date(hariIniWIB + 'T00:00:00Z');
  tujuhHariLalu.setUTCDate(tujuhHariLalu.getUTCDate() - 6);

  const dari = query.dari || keTeksWIB(tujuhHariLalu);
  const sampai = query.sampai || hariIniWIB;

  const polaTanggal = /^\d{4}-\d{2}-\d{2}$/;
  if (!polaTanggal.test(dari) || !polaTanggal.test(sampai)) {
    return { galat: 'Tanggal harus memakai format YYYY-MM-DD' };
  }
  if (dari > sampai) {
    return { galat: 'Tanggal awal tidak boleh sesudah tanggal akhir' };
  }
  return { dari, sampai };
}

module.exports = { bacaRentangTanggal };
