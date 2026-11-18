// Pengatur stok: menerima permintaan dari rute, memanggil model,
// lalu mengirim hasilnya sebagai JSON.
// Modul stok (Tahap M2): daftar stok, barang masuk/keluar, dan riwayat
// mutasi — memakai tabel produk yang sama dengan kasir.
// Barang masuk boleh membawa supplier (Tahap M3), lihat barangMasuk.
const Produk = require('../models/Produk');
const RiwayatStok = require('../models/RiwayatStok');
const Supplier = require('../models/Supplier');

// Mengambil angka dari badan permintaan; kalau bukan bilangan bulat
// positif, hasilnya null supaya pengatur bisa menolaknya.
function jumlahValid(nilai) {
  const jumlah = Number(nilai);
  if (!Number.isInteger(jumlah) || jumlah <= 0) return null;
  return jumlah;
}

// id produk dari badan permintaan; kalau bukan bilangan bulat, hasilnya null.
function produkIdValid(nilai) {
  const id = Number(nilai);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

// GET /api/stok — daftar produk beserta stoknya.
// Boleh disaring dengan ?saring=menipis atau ?saring=habis, dan boleh
// dicari dengan ?cari=kopi — keduanya boleh dipakai bareng,
// misalnya /api/stok?saring=menipis&cari=kopi
async function daftarStok(req, res) {
  try {
    const cari = String(req.query.cari || '').trim().slice(0, 100) || null;
    const produk = await Produk.semuaProduk(cari, req.query.saring);
    res.json({ produk, batasMenipis: Produk.BATAS_MENIPIS });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil daftar stok' });
  }
}

// GET /api/stok/perlu-dibeli — daftar belanja: barang yang stoknya habis
// atau menipis, dari yang paling mendesak.
async function perluDibeli(req, res) {
  try {
    const produk = await Produk.perluDibeli();
    res.json({ produk, batasMenipis: Produk.BATAS_MENIPIS });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil daftar perlu dibeli' });
  }
}

// GET /api/stok/ringkasan — angka ringkasan buat kartu di halaman stok.
async function ringkasan(req, res) {
  try {
    const data = await Produk.ringkasanStok();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil ringkasan stok' });
  }
}

// POST /api/stok/masuk — barang masuk: stok produk nambah, pergerakannya
// dicatat di riwayat. Badannya: produk_id, jumlah, harga_beli (boleh
// kosong), keterangan (boleh kosong), supplier_id (boleh kosong).
// Kalau supplier_id diisi, supplier itu langsung dihubungkan dengan
// produknya (tautan supplier–produk, Tahap M3) dan namanya dipakai
// sebagai keterangan kalau keterangan dikosongkan.
async function barangMasuk(req, res) {
  try {
    const produkId = produkIdValid(req.body.produk_id);
    const jumlah = jumlahValid(req.body.jumlah);
    if (produkId === null || jumlah === null) {
      return res.status(400).json({ pesan: 'produk_id dan jumlah harus diisi dengan angka yang benar' });
    }
    let hargaBeli = null;
    if (req.body.harga_beli !== undefined && req.body.harga_beli !== '' && req.body.harga_beli !== null) {
      hargaBeli = Number(req.body.harga_beli);
      if (!Number.isInteger(hargaBeli) || hargaBeli < 0) {
        return res.status(400).json({ pesan: 'harga_beli harus angka nol atau lebih' });
      }
    }
    // Supplier boleh kosong; kalau diisi, harus supplier yang memang ada.
    let supplier = null;
    if (req.body.supplier_id !== undefined && req.body.supplier_id !== '' && req.body.supplier_id !== null) {
      const supplierId = Number(req.body.supplier_id);
      if (!Number.isInteger(supplierId) || supplierId <= 0) {
        return res.status(400).json({ pesan: 'supplier_id harus diisi dengan angka yang benar' });
      }
      supplier = await Supplier.cariBerdasarkanId(supplierId);
      if (!supplier) {
        return res.status(404).json({ pesan: 'Supplier tidak ditemukan' });
      }
    }
    const keterangan = req.body.keterangan
      ? String(req.body.keterangan).trim().slice(0, 255) || null
      : (supplier ? supplier.nama : null);
    const hasil = await RiwayatStok.catat({
      produk_id: produkId,
      jenis: 'masuk',
      jumlah,
      harga_beli: hargaBeli,
      keterangan,
    });
    if (supplier) {
      await Supplier.tautkan(supplier.id, produkId);
    }
    res.status(201).json({ pesan: 'Barang masuk dicatat', ...hasil });
  } catch (err) {
    if (err.kode === 'PRODUK_TIDAK_ADA') {
      return res.status(404).json({ pesan: 'Produk tidak ditemukan' });
    }
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mencatat barang masuk' });
  }
}

// POST /api/stok/keluar — barang keluar (rusak, hilang, atau dipakai
// sendiri): stok produk berkurang, pergerakannya dicatat di riwayat.
// Badannya: produk_id, jumlah, keterangan (boleh kosong, misal "rusak").
// Jumlah keluar nggak boleh lebih dari stok yang ada.
async function barangKeluar(req, res) {
  try {
    const produkId = produkIdValid(req.body.produk_id);
    const jumlah = jumlahValid(req.body.jumlah);
    if (produkId === null || jumlah === null) {
      return res.status(400).json({ pesan: 'produk_id dan jumlah harus diisi dengan angka yang benar' });
    }
    const hasil = await RiwayatStok.catat({
      produk_id: produkId,
      jenis: 'keluar',
      jumlah,
      harga_beli: null,
      keterangan: req.body.keterangan || null,
    });
    res.status(201).json({ pesan: 'Barang keluar dicatat', ...hasil });
  } catch (err) {
    if (err.kode === 'PRODUK_TIDAK_ADA') {
      return res.status(404).json({ pesan: 'Produk tidak ditemukan' });
    }
    if (err.kode === 'STOK_KURANG') {
      return res.status(400).json({ pesan: 'Stok tidak cukup untuk barang keluar' });
    }
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mencatat barang keluar' });
  }
}

// GET /api/stok/riwayat — daftar pergerakan stok, paling baru dulu.
// Boleh disaring per produk: /api/stok/riwayat?produk_id=1
async function riwayat(req, res) {
  try {
    const produkId = req.query.produk_id ? Number(req.query.produk_id) : null;
    const data = await RiwayatStok.daftar(produkId);
    res.json({ riwayat: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil riwayat stok' });
  }
}

module.exports = { daftarStok, ringkasan, perluDibeli, barangMasuk, barangKeluar, riwayat };
