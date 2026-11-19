// JavaScript halaman etalase: mengambil daftar produk dari server,
// lalu menampilkannya sebagai kartu dan tombol saringan kategori.
// Rute yang dipakai di sini rute PUBLIK (/api/etalase) — tanpa login,
// dan yang keluar cuma produk yang stoknya masih ada.
const daftarEl = document.getElementById('daftar-produk');
const saringanEl = document.getElementById('saringan');
const pesanEl = document.getElementById('pesan');
const kosongEl = document.getElementById('kosong');
const cariEl = document.getElementById('cari');

// Kategori dan kata kunci yang sedang aktif — keduanya dikirim bareng
// tiap kali daftar dimuat, jadi cari di dalam kategori tetap jalan.
let kategoriAktif = '';
let kataKunci = '';
let jedaCari = null;

// Mengubah angka menjadi format rupiah, misalnya 5000 menjadi Rp5.000.
function formatRupiah(angka) {
  return 'Rp' + Number(angka).toLocaleString('id-ID');
}

// Membuat satu kartu produk: nama, harga, stok, dan kategori.
function buatKartuProduk(produk) {
  const kartu = document.createElement('div');
  kartu.className = 'kartu-produk';

  const nama = document.createElement('h2');
  nama.textContent = produk.nama;

  const harga = document.createElement('p');
  harga.className = 'harga';
  harga.textContent = formatRupiah(produk.harga);

  const stok = document.createElement('p');
  stok.className = 'stok';
  stok.textContent = 'Stok: ' + produk.stok;

  kartu.append(nama, harga, stok);

  if (produk.kategori) {
    const label = document.createElement('span');
    label.className = 'kategori';
    label.textContent = produk.kategori;
    kartu.append(label);
  }

  // Mengetuk kartu membuka halaman detail produk itu.
  const tautan = document.createElement('a');
  tautan.className = 'tautan-detail';
  tautan.href = '/etalase-detail.html?id=' + produk.id;
  tautan.textContent = 'Lihat detail →';
  kartu.append(tautan);

  kartu.addEventListener('click', () => {
    window.location.href = '/etalase-detail.html?id=' + produk.id;
  });

  return kartu;
}

// Mengisi tombol saringan dari daftar kategori yang dikirim server.
function tampilkanSaringan(kategoriList, kategoriAktif) {
  saringanEl.innerHTML = '';
  const semua = [''].concat(kategoriList);
  semua.forEach((kategori) => {
    const tombol = document.createElement('button');
    tombol.className = 'tombol-saring' + (kategori === kategoriAktif ? ' aktif' : '');
    tombol.dataset.kategori = kategori;
    tombol.textContent = kategori || 'Semua';
    tombol.addEventListener('click', () => pilihKategori(kategori));
    saringanEl.append(tombol);
  });
}

// Meminta daftar produk ke server, lalu menampilkannya.
// Kategori dan kata kunci yang aktif dikirim bareng sebagai parameter.
async function muatProduk() {
  pesanEl.textContent = '';
  pesanEl.hidden = true;
  try {
    const param = new URLSearchParams();
    if (kategoriAktif) param.set('kategori', kategoriAktif);
    if (kataKunci) param.set('cari', kataKunci);
    const tambahan = param.toString();
    const tanggapan = await fetch('/api/etalase' + (tambahan ? '?' + tambahan : ''));
    if (!tanggapan.ok) throw new Error('Server menjawab ' + tanggapan.status);
    const data = await tanggapan.json();

    tampilkanSaringan(data.kategori, kategoriAktif);

    daftarEl.innerHTML = '';
    data.produk.forEach((produk) => daftarEl.append(buatKartuProduk(produk)));
    kosongEl.hidden = data.produk.length > 0;
    if (data.produk.length === 0 && kataKunci) {
      kosongEl.hidden = false;
      kosongEl.textContent = 'Tidak ada produk yang cocok dengan "' + kataKunci + '".';
    } else if (data.produk.length === 0) {
      kosongEl.textContent = 'Belum ada produk dalam kategori ini.';
    }
  } catch (err) {
    pesanEl.textContent = 'Gagal memuat etalase. Periksa server lalu muat ulang halaman.';
    pesanEl.hidden = false;
  }
}

// Pindah kategori: simpan yang aktif, lalu muat ulang daftar.
function pilihKategori(kategori) {
  kategoriAktif = kategori || '';
  muatProduk();
}

// Mengetik di kolom cari: tunggu 300 ms sesudah berhenti mengetik baru
// minta ke server, supaya tidak dibanjiri tiap ketikan.
cariEl.addEventListener('input', () => {
  clearTimeout(jedaCari);
  jedaCari = setTimeout(() => {
    kataKunci = cariEl.value.trim();
    muatProduk();
  }, 300);
});

muatProduk();
