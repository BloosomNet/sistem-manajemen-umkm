// Keranjang belanja etalase: isinya disimpan di Local Storage, jadi tetap
// ada walau pelanggan pindah halaman atau menutup peramban sebentar.
// Satu barang di keranjang: { id, nama, harga, stok, jumlah }.
// Kuncinya dibedakan dari keranjang katalog repo asal, supaya tidak
// ketukar kalau pelanggan pernah membuka keduanya.
const KUNCI_KERANJANG = 'keranjang_etalase';

// Membaca isi keranjang dari Local Storage. Kalau belum ada atau datanya
// rusak, kembalikan daftar kosong supaya halaman tidak error.
function bacaKeranjang() {
  try {
    const mentah = localStorage.getItem(KUNCI_KERANJANG);
    const daftar = mentah ? JSON.parse(mentah) : [];
    return Array.isArray(daftar) ? daftar : [];
  } catch (err) {
    return [];
  }
}

// Menyimpan isi keranjang, lalu memperbarui lencana jumlah di kepala halaman.
function simpanKeranjang(daftar) {
  localStorage.setItem(KUNCI_KERANJANG, JSON.stringify(daftar));
  perbaruiLencana();
}

// Menambah produk ke keranjang. Kalau produknya sudah ada, jumlahnya ditambah.
// Jumlah tidak boleh melebihi stok — sisanya tidak ikut masuk.
function tambahKeKeranjang(produk, jumlah) {
  const daftar = bacaKeranjang();
  const mau = Math.max(1, Math.floor(jumlah) || 1);
  const ada = daftar.find((item) => item.id === produk.id);
  if (ada) {
    ada.jumlah = Math.min(ada.stok, ada.jumlah + mau);
  } else {
    daftar.push({
      id: produk.id,
      nama: produk.nama,
      harga: produk.harga,
      stok: produk.stok,
      jumlah: Math.min(produk.stok, mau),
    });
  }
  simpanKeranjang(daftar);
  return daftar;
}

// Mengubah jumlah satu barang. Kalau jumlah jadi 0 atau kurang, barangnya dihapus.
function ubahJumlah(id, jumlahBaru) {
  const daftar = bacaKeranjang();
  const item = daftar.find((x) => x.id === id);
  if (!item) return daftar;
  if (jumlahBaru <= 0) return hapusItem(id);
  item.jumlah = Math.min(item.stok, jumlahBaru);
  simpanKeranjang(daftar);
  return daftar;
}

// Menghapus satu barang dari keranjang.
function hapusItem(id) {
  const daftar = bacaKeranjang().filter((x) => x.id !== id);
  simpanKeranjang(daftar);
  return daftar;
}

// Mengosongkan seluruh keranjang.
function kosongkanKeranjang() {
  simpanKeranjang([]);
  return [];
}

// Jumlah total barang di keranjang (bukan jumlah jenis barang).
function totalItem() {
  return bacaKeranjang().reduce((total, item) => total + item.jumlah, 0);
}

// Total harga seluruh isi keranjang.
function totalHarga() {
  return bacaKeranjang().reduce((total, item) => total + item.harga * item.jumlah, 0);
}

// Lencana jumlah di kepala halaman: semua elemen [data-lencana-keranjang]
// diisi jumlah barang. Kosong kalau keranjang masih kosong.
function perbaruiLencana() {
  if (typeof document === 'undefined') return;
  const jumlah = totalItem();
  document.querySelectorAll('[data-lencana-keranjang]').forEach((el) => {
    el.textContent = jumlah > 0 ? ' (' + jumlah + ')' : '';
  });
}

// Mengubah angka menjadi format rupiah, misalnya 5000 menjadi Rp5.000.
function formatRupiah(angka) {
  return 'Rp' + Number(angka).toLocaleString('id-ID');
}

// Halaman keranjang (etalase-keranjang.html): menggambar daftar isi keranjang,
// tombol tambah/kurang jumlah, hapus per barang, dan total harga.
// Kalau bukan halaman keranjang, fungsi ini langsung berhenti.
function gambarKeranjang() {
  if (typeof document === 'undefined') return;
  const daftarEl = document.getElementById('daftar-keranjang');
  if (!daftarEl) return;

  const daftar = bacaKeranjang();
  const kosongEl = document.getElementById('keranjang-kosong');
  const ringkasanEl = document.getElementById('ringkasan-keranjang');

  daftarEl.innerHTML = '';
  kosongEl.hidden = daftar.length > 0;
  ringkasanEl.hidden = daftar.length === 0;

  daftar.forEach((item) => {
    const baris = document.createElement('div');
    baris.className = 'baris-keranjang';

    const info = document.createElement('div');
    const nama = document.createElement('strong');
    nama.textContent = item.nama;
    const harga = document.createElement('p');
    harga.className = 'harga-satuan';
    harga.textContent = formatRupiah(item.harga) + ' / pcs';
    info.append(nama, harga);

    const atur = document.createElement('div');
    atur.className = 'atur-jumlah';
    const kurang = document.createElement('button');
    kurang.type = 'button';
    kurang.textContent = '−';
    kurang.setAttribute('aria-label', 'Kurangi jumlah ' + item.nama);
    kurang.addEventListener('click', () => {
      ubahJumlah(item.id, item.jumlah - 1);
      gambarKeranjang();
    });
    const jumlah = document.createElement('span');
    jumlah.className = 'jumlah';
    jumlah.textContent = item.jumlah;
    const tambah = document.createElement('button');
    tambah.type = 'button';
    tambah.textContent = '+';
    tambah.setAttribute('aria-label', 'Tambah jumlah ' + item.nama);
    tambah.addEventListener('click', () => {
      ubahJumlah(item.id, item.jumlah + 1);
      gambarKeranjang();
    });
    atur.append(kurang, jumlah, tambah);

    const subtotal = document.createElement('p');
    subtotal.className = 'subtotal';
    subtotal.textContent = formatRupiah(item.harga * item.jumlah);

    const hapus = document.createElement('button');
    hapus.type = 'button';
    hapus.className = 'tombol-hapus';
    hapus.textContent = 'Hapus';
    hapus.addEventListener('click', () => {
      hapusItem(item.id);
      gambarKeranjang();
    });

    baris.append(info, atur, subtotal, hapus);
    daftarEl.append(baris);
  });

  document.getElementById('total-harga').textContent = formatRupiah(totalHarga());
}

// Menyusun isi pesan WhatsApp dari isi keranjang: daftar barang dengan
// jumlah dan subtotalnya, lalu total harga di baris terakhir.
function susunPesan(daftar) {
  const baris = daftar.map(
    (item) => '- ' + item.nama + ' x' + item.jumlah + ' = ' + formatRupiah(item.harga * item.jumlah)
  );
  const total = daftar.reduce((t, item) => t + item.harga * item.jumlah, 0);
  return ['Halo, saya mau pesan:', ...baris, '', 'Total: ' + formatRupiah(total)].join('\n');
}

// Mencocokkan isi keranjang dengan stok terbaru dari server. Barang yang
// sudah habis dikeluarkan, jumlah yang melebihi stok dipotong, harga ikut
// harga terbaru. Mengembalikan daftar baru dan catatan perubahannya.
function sesuaikanDenganStok(daftar, produkSegar) {
  const catatan = [];
  const segar = new Map(produkSegar.map((p) => [p.id, p]));
  const hasil = [];
  daftar.forEach((item) => {
    const p = segar.get(item.id);
    if (!p) {
      catatan.push(item.nama + ' sudah habis, dikeluarkan dari keranjang.');
      return;
    }
    if (item.jumlah > p.stok) {
      catatan.push('Jumlah ' + item.nama + ' disesuaikan jadi ' + p.stok + ' (stok tinggal segitu).');
      hasil.push({ ...item, harga: p.harga, stok: p.stok, jumlah: p.stok });
    } else {
      hasil.push({ ...item, harga: p.harga, stok: p.stok });
    }
  });
  return { daftar: hasil, catatan };
}

// Mengambil stok terbaru dari server, lalu menyesuaikan isi keranjang.
// Dipanggil sebelum pesan dibuat, supaya pesanan tidak berisi barang habis.
async function cekStokUlang() {
  const res = await fetch('/api/etalase');
  if (!res.ok) throw new Error('gagal mengambil stok terbaru');
  const data = await res.json();
  const { daftar, catatan } = sesuaikanDenganStok(bacaKeranjang(), data.produk || []);
  simpanKeranjang(daftar);
  return catatan;
}

// Tombol "Pesan via WhatsApp": cek stok ulang, ambil nomor warung dari
// server, lalu buka wa.me di tab baru dengan isi pesanan terisi otomatis.
async function pesanViaWhatsApp() {
  const pesanEl = document.getElementById('pesan');
  const tombol = document.getElementById('pesan-whatsapp');
  if (bacaKeranjang().length === 0) {
    pesanEl.textContent = 'Keranjang masih kosong.';
    pesanEl.hidden = false;
    return;
  }
  tombol.disabled = true;
  pesanEl.textContent = 'Menyiapkan pesanan...';
  pesanEl.hidden = false;
  try {
    const catatan = await cekStokUlang();
    const sesudah = bacaKeranjang();
    if (sesudah.length === 0) {
      pesanEl.textContent = 'Semua barang di keranjang sudah habis. Cek lagi etalasenya.';
      gambarKeranjang();
      return;
    }
    const res = await fetch('/api/wa-nomor');
    if (!res.ok) throw new Error('nomor belum diatur');
    const { nomor } = await res.json();
    const tautan =
      'https://wa.me/' + nomor + '?text=' + encodeURIComponent(susunPesan(sesudah));
    pesanEl.textContent = catatan.join(' ');
    window.open(tautan, '_blank');
    gambarKeranjang();
  } catch (err) {
    pesanEl.textContent =
      err.message === 'nomor belum diatur'
        ? 'Nomor WhatsApp warung belum diatur. Hubungi pemilik warung langsung.'
        : 'Tidak bisa menyiapkan pesanan sekarang, coba lagi sebentar lagi.';
  } finally {
    tombol.disabled = false;
  }
}

// Tombol "Kosongkan keranjang" hanya ada di halaman keranjang.
if (typeof document !== 'undefined') {
  const kosongkanBtn = document.getElementById('kosongkan-keranjang');
  if (kosongkanBtn) {
    kosongkanBtn.addEventListener('click', () => {
      kosongkanKeranjang();
      gambarKeranjang();
    });
  }
  const pesanBtn = document.getElementById('pesan-whatsapp');
  if (pesanBtn) {
    pesanBtn.addEventListener('click', pesanViaWhatsApp);
  }
  perbaruiLencana();
  gambarKeranjang();
}

// Supaya logika keranjang bisa diuji lewat Node tanpa peramban.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    bacaKeranjang,
    tambahKeKeranjang,
    ubahJumlah,
    hapusItem,
    kosongkanKeranjang,
    totalItem,
    totalHarga,
    susunPesan,
    sesuaikanDenganStok,
  };
}
