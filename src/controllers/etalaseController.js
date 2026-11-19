// Pengatur etalase: menerima permintaan dari rute publik, memanggil model,
// lalu mengirim hasilnya sebagai JSON.
// Etalase ini SENGAJA tanpa login — pelanggan melihat katalog tanpa harus
// masuk. Yang dijaga: cuma produk yang stoknya masih ada yang keluar,
// dan nomor WhatsApp warung cuma nomornya saja, bukan data toko lain.
const Produk = require('../models/Produk');

// GET /api/etalase — daftar produk yang masih tersedia.
// Boleh disaring dengan ?kategori= dan dicari dengan ?cari=, boleh bareng.
async function daftarEtalase(req, res) {
  try {
    const kataKunci = typeof req.query.cari === 'string'
      ? req.query.cari.trim().slice(0, 100)
      : '';
    const kategori = typeof req.query.kategori === 'string'
      ? req.query.kategori.trim().slice(0, 50)
      : '';
    const produk = await Produk.semuaProdukTersedia(kategori, kataKunci);
    const daftarKategori = await Produk.semuaKategori();
    res.json({ produk, kategori: daftarKategori });
  } catch (kesalahan) {
    console.error(kesalahan);
    res.status(500).json({ pesan: 'Gagal mengambil daftar produk' });
  }
}

// GET /api/etalase/:id — detail satu produk, dipakai halaman detail etalase.
async function detailEtalase(req, res) {
  try {
    const produk = await Produk.cariTersediaBerdasarkanId(req.params.id);
    if (!produk) {
      return res.status(404).json({ pesan: 'Produk tidak ditemukan atau stok habis' });
    }
    res.json(produk);
  } catch (kesalahan) {
    console.error(kesalahan);
    res.status(500).json({ pesan: 'Gagal mengambil detail produk' });
  }
}

// GET /api/wa-nomor — nomor WhatsApp warung dari .env, dibersihkan dulu
// (spasi, tanda +, dan strip dibuang) supaya bisa langsung dipakai di wa.me.
// Kalau belum diatur, dijawab 404 supaya peramban bisa menampilkan pesan yang jelas.
function waNomor(req, res) {
  const mentah = (process.env.WA_NOMOR || '').replace(/[^0-9]/g, '');
  if (!mentah) {
    return res.status(404).json({ pesan: 'Nomor WhatsApp warung belum diatur' });
  }
  res.json({ nomor: mentah });
}

module.exports = { daftarEtalase, detailEtalase, waNomor };
