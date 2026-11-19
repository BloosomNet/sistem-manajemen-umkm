// JavaScript halaman detail etalase: membaca id dari alamat (?id=...),
// lalu meminta detail produk itu ke server dan menampilkannya.
// Rute yang dipakai rute publik (/api/etalase) — tanpa login.
const pesanEl = document.getElementById('pesan');
const detailEl = document.getElementById('detail-produk');
const jumlahInput = document.getElementById('jumlah-beli');
const infoKeranjangEl = document.getElementById('info-keranjang');

// Produk yang sedang ditampilkan — dipakai saat tombol keranjang diketuk.
let produkSekarang = null;

// Mengubah angka menjadi format rupiah, misalnya 5000 menjadi Rp5.000.
function formatRupiah(angka) {
  return 'Rp' + Number(angka).toLocaleString('id-ID');
}

async function muatDetail() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    pesanEl.textContent = 'Tidak ada produk yang dipilih. Balik ke etalase dulu, lalu ketuk salah satu produk.';
    pesanEl.hidden = false;
    return;
  }

  try {
    const tanggapan = await fetch('/api/etalase/' + encodeURIComponent(id));
    if (tanggapan.status === 404) {
      pesanEl.textContent = 'Produk tidak ditemukan, atau stoknya sudah habis.';
      pesanEl.hidden = false;
      return;
    }
    if (!tanggapan.ok) throw new Error('Server menjawab ' + tanggapan.status);
    const produk = await tanggapan.json();

    document.getElementById('detail-nama').textContent = produk.nama;
    document.getElementById('detail-harga').textContent = formatRupiah(produk.harga);
    document.getElementById('detail-stok').textContent = 'Stok tersedia: ' + produk.stok;

    // Simpan produknya dan batasi jumlah beli maksimal setinggi stok.
    produkSekarang = produk;
    jumlahInput.max = produk.stok;
    jumlahInput.value = 1;

    const kategoriEl = document.getElementById('detail-kategori');
    if (produk.kategori) {
      kategoriEl.textContent = produk.kategori;
      kategoriEl.hidden = false;
    }

    document.title = produk.nama + ' — Etalase Warung';
    detailEl.hidden = false;
  } catch (err) {
    pesanEl.textContent = 'Gagal memuat detail produk. Periksa server lalu muat ulang halaman.';
    pesanEl.hidden = false;
  }
}

muatDetail();

// Tombol "+ Keranjang": memasukkan produk ini ke keranjang sesuai jumlah
// yang ditulis, lalu memberi tahu pelanggan lewat baris info di bawahnya.
document.getElementById('tambah-keranjang').addEventListener('click', () => {
  if (!produkSekarang) return;
  const jumlah = Number(jumlahInput.value) || 1;
  tambahKeKeranjang(produkSekarang, jumlah);
  infoKeranjangEl.textContent = 'Masuk keranjang. Cek isinya lewat tautan Keranjang di atas, atau lanjut belanja dulu.';
});
