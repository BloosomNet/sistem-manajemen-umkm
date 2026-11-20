// Model Transaksi: menyimpan satu kali pembayaran di kasir.
// Semua langkah di bawah ini dijalankan dalam satu transaksi basis data:
// kalau ada satu langkah yang gagal, semua perubahan dibatalkan,
// supaya tidak ada transaksi yang tersimpan setengah-setengah.
// Penjualan juga dicatat sebagai barang keluar di riwayat_stok —
// kasir dan modul stok memakai SATU sumber stok yang sama, jadi
// riwayat mutasi lengkap: masuk dari supplier, keluar karena rusak,
// DAN keluar karena terjual di kasir. Etalase ikut berubah otomatis
// karena membaca stok dari tabel produk yang sama ini.
const pool = require('../config/database');

// Membuat transaksi baru dari keranjang.
// barang: [{ produk_id, jumlah }], bayar: jumlah uang yang diterima.
// Total dihitung ulang dari harga di basis data, bukan dari kiriman peramban.
async function buatTransaksi(barang, bayar) {
  const koneksi = await pool.getConnection();
  try {
    await koneksi.beginTransaction();

    let total = 0;
    const rincian = [];

    for (const item of barang) {
      // Baris produk dikunci selama transaksi, supaya dua kasir
      // tidak menjual stok terakhir yang sama di saat bersamaan.
      const [baris] = await koneksi.query(
        'SELECT * FROM produk WHERE id = ? FOR UPDATE',
        [item.produk_id]
      );
      const produk = baris[0];
      if (!produk) {
        throw new Error(`Produk dengan id ${item.produk_id} tidak ditemukan`);
      }
      if (item.jumlah > produk.stok) {
        throw new Error(`Stok ${produk.nama} tidak cukup, sisa ${produk.stok}`);
      }
      const subtotal = produk.harga * item.jumlah;
      total += subtotal;
      rincian.push({
        produk_id: produk.id,
        nama_produk: produk.nama,
        harga: produk.harga,
        jumlah: item.jumlah,
        subtotal,
      });
    }

    if (bayar < total) {
      throw new Error(`Uang bayar kurang Rp${(total - bayar).toLocaleString('id-ID')}`);
    }
    const kembalian = bayar - total;

    const [hasil] = await koneksi.query(
      'INSERT INTO transaksi (total, bayar, kembalian) VALUES (?, ?, ?)',
      [total, bayar, kembalian]
    );
    const transaksiId = hasil.insertId;

    for (const rincianItem of rincian) {
      await koneksi.query(
        'INSERT INTO detail_transaksi (transaksi_id, produk_id, nama_produk, harga, jumlah, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [transaksiId, rincianItem.produk_id, rincianItem.nama_produk, rincianItem.harga, rincianItem.jumlah, rincianItem.subtotal]
      );
      // Stok berkurang sebanyak jumlah yang dibeli, dan pergerakan
      // ini dicatat di riwayat_stok dalam transaksi yang sama —
      // jadi penjualan kasir kelihatan di halaman stok, dan kalau
      // ada yang gagal di tengah jalan, stok maupun catatannya
      // sama-sama batal, tidak ada yang ketinggalan.
      await koneksi.query(
        'UPDATE produk SET stok = stok - ? WHERE id = ?',
        [rincianItem.jumlah, rincianItem.produk_id]
      );
      await koneksi.query(
        `INSERT INTO riwayat_stok (produk_id, jenis, jumlah, harga_beli, keterangan)
         VALUES (?, 'keluar', ?, NULL, ?)`,
        [rincianItem.produk_id, rincianItem.jumlah, `Penjualan kasir #${transaksiId}`]
      );
    }

    await koneksi.commit();
    return { id: transaksiId, total, bayar, kembalian, barang: rincian };
  } catch (kesalahan) {
    await koneksi.rollback();
    throw kesalahan;
  } finally {
    koneksi.release();
  }
}

// Melihat daftar transaksi dalam rentang tanggal.
// Setiap baris berisi jumlah barang yang dibeli, supaya daftar tetap ringkas.
// dari dan sampai memakai format YYYY-MM-DD.
// Kalau diberi kata kunci, hanya transaksi yang menjual barang dengan
// nama cocok yang dikembalikan — polanya diamankan seperti di model
// Produk, supaya % dan _ dianggap huruf biasa.
async function lihatRiwayat(dari, sampai, kataKunci) {
  const kata = typeof kataKunci === 'string' ? kataKunci.trim() : '';
  const nilai = [dari, sampai];
  let syaratCari = '';
  if (kata) {
    const pola = '%' + kata.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_') + '%';
    // Cari di rincian barangnya: transaksi yang menjual barang itu saja.
    syaratCari = ' AND EXISTS (SELECT 1 FROM detail_transaksi d2 WHERE d2.transaksi_id = t.id AND d2.nama_produk LIKE ?)';
    nilai.push(pola);
  }
  const [baris] = await pool.query(
    // Tanggalnya digeser dulu ke WIB seperti di ringkasanHariIni —
    // kalau tidak, transaksi tengah malam WIB (00.00–07.00) jatuh ke
    // tanggal UTC kemarin dan tidak muncul di rentang yang diminta.
    `SELECT t.id, t.total, t.bayar, t.kembalian, t.dibuat_pada,
            COUNT(d.id) AS jumlah_item
       FROM transaksi t
       LEFT JOIN detail_transaksi d ON d.transaksi_id = t.id
      WHERE DATE(CONVERT_TZ(t.dibuat_pada, '+00:00', '+07:00')) BETWEEN ? AND ?${syaratCari}
      GROUP BY t.id
      ORDER BY t.dibuat_pada DESC, t.id DESC
      LIMIT 100`,
    nilai
  );
  return baris;
}

// Melihat satu transaksi beserta rincian barangnya.
// Mengembalikan null kalau nomor transaksi tidak ada.
async function lihatSatu(id) {
  const [baris] = await pool.query(
    'SELECT id, total, bayar, kembalian, dibuat_pada FROM transaksi WHERE id = ?',
    [id]
  );
  const transaksi = baris[0];
  if (!transaksi) {
    return null;
  }
  const [rincian] = await pool.query(
    `SELECT nama_produk, harga, jumlah, subtotal
       FROM detail_transaksi
      WHERE transaksi_id = ?
      ORDER BY id ASC`,
    [id]
  );
  transaksi.barang = rincian;
  return transaksi;
}

// Ringkasan hari ini buat dashboard beranda: berapa transaksi dan
// berapa omzet pada tanggal yang diberikan (format YYYY-MM-DD, WIB).
// dibuat_pada disimpan sebagai TIMESTAMP (UTC di server), jadi
// tanggalnya digeser dulu ke WIB — kalau tidak, penjualan tengah
// malam WIB (00.00–07.00) jatuh ke tanggal UTC kemarin dan tidak
// kehitung di "hari ini". Offset angka tidak butuh tabel zona waktu.
async function ringkasanHariIni(tanggal) {
  const [baris] = await pool.query(
    `SELECT COUNT(*) AS jumlah_transaksi,
            COALESCE(SUM(total), 0) AS omzet
       FROM transaksi
      WHERE DATE(CONVERT_TZ(dibuat_pada, '+00:00', '+07:00')) = ?`,
    [tanggal]
  );
  return baris[0];
}

// Laporan harian: untuk tiap tanggal, berapa transaksi dan berapa omzetnya.
// Tanggalnya WIB (lihat ringkasanHariIni) — penjualan tengah malam WIB
// harus masuk ke tanggal WIB-nya, bukan tanggal UTC kemarin.
async function laporanHarian(dari, sampai) {
  const [baris] = await pool.query(
    `SELECT DATE(CONVERT_TZ(dibuat_pada, '+00:00', '+07:00')) AS tanggal,
            COUNT(*) AS jumlah_transaksi,
            SUM(total) AS omzet
       FROM transaksi
      WHERE DATE(CONVERT_TZ(dibuat_pada, '+00:00', '+07:00')) BETWEEN ? AND ?
      GROUP BY DATE(CONVERT_TZ(dibuat_pada, '+00:00', '+07:00'))
      ORDER BY tanggal DESC`,
    [dari, sampai]
  );
  return baris;
}

// Produk terlaris dalam rentang tanggal, diurutkan dari yang paling banyak terjual.
async function produkTerlaris(dari, sampai) {
  const [baris] = await pool.query(
    `SELECT d.nama_produk,
            SUM(d.jumlah) AS terjual,
            SUM(d.subtotal) AS pendapatan
       FROM detail_transaksi d
       JOIN transaksi t ON t.id = d.transaksi_id
      WHERE DATE(CONVERT_TZ(t.dibuat_pada, '+00:00', '+07:00')) BETWEEN ? AND ?
      GROUP BY d.nama_produk
      ORDER BY terjual DESC, pendapatan DESC
      LIMIT 10`,
    [dari, sampai]
  );
  return baris;
}

module.exports = { buatTransaksi, lihatRiwayat, lihatSatu, ringkasanHariIni, laporanHarian, produkTerlaris };
