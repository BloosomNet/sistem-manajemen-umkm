// Pengatur supplier: menerima permintaan dari rute, memanggil model,
// lalu mengirim hasilnya sebagai JSON.
// Modul supplier (Tahap M3): daftar, tambah, dan hubungkan supplier
// dengan produk yang disuplainya. Diambil dari inventaris-barang-warung.
const Supplier = require('../models/Supplier');

// GET /api/supplier — semua supplier beserta barang yang disuplai.
async function daftarSupplier(req, res) {
  try {
    const supplier = await Supplier.semua();
    res.json({ supplier });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil daftar supplier' });
  }
}

// POST /api/supplier — tambah supplier baru.
// Badannya: nama (wajib), kontak dan alamat (boleh kosong).
async function tambahSupplier(req, res) {
  try {
    const nama = String(req.body.nama || '').trim().slice(0, 100);
    if (!nama) {
      return res.status(400).json({ pesan: 'Nama supplier wajib diisi' });
    }
    const kontak = String(req.body.kontak || '').trim().slice(0, 100) || null;
    const alamat = String(req.body.alamat || '').trim().slice(0, 255) || null;
    const supplier = await Supplier.tambah({ nama, kontak, alamat });
    res.status(201).json({ pesan: 'Supplier ditambahkan', supplier });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal menambah supplier' });
  }
}

// POST /api/supplier/:id/produk — hubungkan supplier ini dengan produk.
// Badannya: produk_id.
async function tautkanProduk(req, res) {
  try {
    const supplierId = Number(req.params.id);
    const produkId = Number(req.body.produk_id);
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return res.status(400).json({ pesan: 'id supplier tidak benar' });
    }
    if (!Number.isInteger(produkId) || produkId <= 0) {
      return res.status(400).json({ pesan: 'produk_id harus diisi dengan angka yang benar' });
    }
    const supplier = await Supplier.cariBerdasarkanId(supplierId);
    if (!supplier) {
      return res.status(404).json({ pesan: 'Supplier tidak ditemukan' });
    }
    await Supplier.tautkan(supplierId, produkId);
    res.status(201).json({ pesan: 'Produk dihubungkan ke supplier' });
  } catch (err) {
    if (err.kode === 'PRODUK_TIDAK_ADA') {
      return res.status(404).json({ pesan: 'Produk tidak ditemukan' });
    }
    console.error(err);
    res.status(500).json({ pesan: 'Gagal menghubungkan produk ke supplier' });
  }
}

module.exports = { daftarSupplier, tambahSupplier, tautkanProduk };
