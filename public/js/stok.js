// Halaman stok: mengambil ringkasan, daftar stok, dan riwayat pergerakan
// dari server, lalu menampilkannya. Barang masuk/keluar dicatat lewat
// formulir — stoknya satu dan sama dengan yang dipakai kasir, jadi
// perubahan di sini langsung kelihatan di halaman kasir.
const daftarStok = document.getElementById('daftar-stok');
const pesan = document.getElementById('pesan');
const kosong = document.getElementById('kosong');
const saringan = document.getElementById('saringan');
const pilihProduk = document.getElementById('pilih-produk');
const pilihJenis = document.getElementById('pilih-jenis');
const kolomHargaBeli = document.getElementById('kolom-harga-beli');
const formPergerakan = document.getElementById('form-pergerakan');
const pesanForm = document.getElementById('pesan-form');
const daftarRiwayat = document.getElementById('daftar-riwayat');
const pesanRiwayat = document.getElementById('pesan-riwayat');
const riwayatKosong = document.getElementById('riwayat-kosong');
const kartuPeringatan = document.getElementById('kartu-peringatan');
const daftarPeringatan = document.getElementById('daftar-peringatan');
const stokAman = document.getElementById('stok-aman');
const kolomCari = document.getElementById('cari');

let saringAktif = '';
let cariAktif = '';

// Menampilkan atau menyembunyikan pesan. berhasil = true memakai kotak
// hijau (.berhasil), kalau tidak memakai kotak merah (.pesan).
function tampilkanPesan(el, teks, berhasil) {
  el.textContent = teks;
  el.hidden = !teks;
  el.classList.toggle('berhasil', !!berhasil);
  el.classList.toggle('pesan', !berhasil);
}

// Teks dari pengguna (nama barang, keterangan) jangan langsung ditempel
// ke halaman — diamankan dulu biar tanda < > nggak kebaca sebagai HTML.
function amankanTeks(teks) {
  return String(teks ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Harga ditampilkan dengan format rupiah, misal 5000 jadi Rp5.000.
function formatRupiah(nilai) {
  return 'Rp' + Number(nilai).toLocaleString('id-ID');
}

// Mengambil angka ringkasan (total produk, total stok, menipis, habis)
// dan menaruhnya di kartu atas.
async function muatRingkasan() {
  const res = await fetch('/api/stok/ringkasan');
  if (!res.ok) return;
  const data = await res.json();
  document.getElementById('total-produk').textContent = data.total_produk;
  document.getElementById('total-stok').textContent = data.total_stok;
  document.getElementById('stok-menipis').textContent = data.menipis;
  document.getElementById('stok-habis').textContent = data.habis;
}

// Mengambil daftar stok sesuai saringan yang aktif, lalu mengisi tabel.
// Stok 0 ditulis merah tebal, stok 1-5 kuning tebal, sisanya biasa.
async function muatStok() {
  tampilkanPesan(pesan, '');
  const parameter = new URLSearchParams();
  if (saringAktif) parameter.set('saring', saringAktif);
  if (cariAktif) parameter.set('cari', cariAktif);
  const alamat = parameter.toString() ? `/api/stok?${parameter}` : '/api/stok';
  const res = await fetch(alamat);
  if (!res.ok) {
    tampilkanPesan(pesan, 'Gagal mengambil daftar stok, coba muat ulang halaman.');
    return;
  }
  const data = await res.json();
  tampilkanPesan(pesan, '');
  daftarStok.innerHTML = '';
  kosong.hidden = data.produk.length > 0;
  kosong.textContent = cariAktif
    ? `Tidak ada barang yang cocok dengan "${cariAktif}".`
    : 'Belum ada barang di sini.';

  data.produk.forEach((p) => {
    const baris = document.createElement('tr');
    let kelasStok = '';
    if (p.stok === 0) kelasStok = 'stok-habis';
    else if (p.stok <= data.batasMenipis) kelasStok = 'stok-tipis';
    baris.innerHTML =
      `<td>${amankanTeks(p.nama)}</td>` +
      `<td>${amankanTeks(p.kategori || '–')}</td>` +
      `<td>${formatRupiah(p.harga)}</td>` +
      `<td class="${kelasStok}">${p.stok}</td>`;
    daftarStok.appendChild(baris);
  });
}

// Tombol saringan: ganti yang aktif, lalu muat ulang daftarnya.
saringan.addEventListener('click', (e) => {
  const tombol = e.target.closest('[data-saring]');
  if (!tombol) return;
  saringan.querySelectorAll('.tombol-saring').forEach((b) => b.classList.remove('aktif'));
  tombol.classList.add('aktif');
  saringAktif = tombol.dataset.saring;
  muatStok();
});

// Mengisi pilihan barang di formulir dari daftar stok (tanpa saringan,
// biar semua barang bisa dipilih walaupun stoknya lagi habis).
async function muatPilihanProduk() {
  const res = await fetch('/api/stok');
  if (!res.ok) return;
  const data = await res.json();
  const dipilih = pilihProduk.value;
  pilihProduk.innerHTML = '<option value="">Pilih barang dulu</option>';
  data.produk.forEach((p) => {
    const pilihan = document.createElement('option');
    pilihan.value = p.id;
    pilihan.textContent = `${p.nama} (stok ${p.stok})`;
    pilihProduk.appendChild(pilihan);
  });
  // Kalau barang yang tadi dipilih masih ada, tetap dipilih.
  if (dipilih) pilihProduk.value = dipilih;
}

// Harga beli cuma dipakai buat barang masuk — kalau jenisnya keluar,
// kolomnya disembunyiin aja biar nggak bingung.
function aturKolomHargaBeli() {
  const masuk = pilihJenis.value === 'masuk';
  kolomHargaBeli.hidden = !masuk;
  if (!masuk) document.getElementById('harga-beli').value = '';
}

pilihJenis.addEventListener('change', aturKolomHargaBeli);

// Kirim formulir: barang masuk ke /api/stok/masuk, barang keluar ke
// /api/stok/keluar. Kalau berhasil, daftar stok, ringkasan, dan riwayat
// dimuat ulang supaya angkanya langsung berubah.
formPergerakan.addEventListener('submit', async (e) => {
  e.preventDefault();
  tampilkanPesan(pesanForm, '');

  const jenis = pilihJenis.value;
  const badan = {
    produk_id: Number(pilihProduk.value),
    jumlah: Number(document.getElementById('jumlah').value),
    keterangan: document.getElementById('keterangan').value.trim() || null,
  };
  if (jenis === 'masuk') {
    const hargaBeli = document.getElementById('harga-beli').value;
    if (hargaBeli !== '') badan.harga_beli = Number(hargaBeli);
  }

  const res = await fetch(`/api/stok/${jenis}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(badan),
  });
  const data = await res.json();
  if (!res.ok) {
    tampilkanPesan(pesanForm, data.pesan || 'Gagal menyimpan, coba lagi.');
    return;
  }
  tampilkanPesan(pesanForm, `${data.pesan} — stok sekarang ${data.stok_baru}.`, true);
  formPergerakan.reset();
  aturKolomHargaBeli();
  muatRingkasan();
  muatPeringatan();
  muatStok();
  muatPilihanProduk();
  muatRiwayat();
});

// Mengambil riwayat pergerakan stok (paling baru dulu) lalu mengisi tabel.
// Waktu ditampilkan dengan format Indonesia, harga beli kosong ditulis "–".
async function muatRiwayat() {
  tampilkanPesan(pesanRiwayat, '');
  const res = await fetch('/api/stok/riwayat');
  if (!res.ok) {
    tampilkanPesan(pesanRiwayat, 'Gagal mengambil riwayat stok, coba muat ulang halaman.');
    return;
  }
  const data = await res.json();
  tampilkanPesan(pesanRiwayat, '');
  daftarRiwayat.innerHTML = '';
  riwayatKosong.hidden = data.riwayat.length > 0;

  data.riwayat.forEach((r) => {
    const baris = document.createElement('tr');
    const waktu = new Date(r.dibuat_pada).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const jenis = r.jenis === 'masuk'
      ? '<span class="jenis-masuk">Masuk</span>'
      : '<span class="jenis-keluar">Keluar</span>';
    baris.innerHTML =
      `<td>${waktu}</td>` +
      `<td>${amankanTeks(r.nama_produk)}</td>` +
      `<td>${jenis}</td>` +
      `<td>${r.jumlah}</td>` +
      `<td>${r.harga_beli === null ? '–' : formatRupiah(r.harga_beli)}</td>` +
      `<td>${r.keterangan ? amankanTeks(r.keterangan) : '–'}</td>`;
    daftarRiwayat.appendChild(baris);
  });
}

// Daftar perlu dibeli: barang habis/menipis ditampilkan menonjol di atas,
// dari yang stoknya paling kecil. Kalau tidak ada, tampilkan kabar aman.
async function muatPeringatan() {
  const res = await fetch('/api/stok/perlu-dibeli');
  if (!res.ok) return;
  const data = await res.json();
  daftarPeringatan.innerHTML = '';
  kartuPeringatan.hidden = data.produk.length === 0;
  stokAman.hidden = data.produk.length > 0;
  data.produk.forEach((p) => {
    const item = document.createElement('li');
    const habis = p.stok === 0;
    item.innerHTML =
      `<span class="lencana ${habis ? 'lencana-habis' : 'lencana-menipis'}">${habis ? 'Habis' : 'Menipis'}</span>` +
      `<strong>${amankanTeks(p.nama)}</strong>` +
      `<span class="sisa">sisa ${p.stok}</span>`;
    daftarPeringatan.appendChild(item);
  });
}

// Pencarian: permintaan baru dikirim 300 ms sesudah berhenti mengetik,
// supaya server tidak dibanjiri tiap ketikan. Sama seperti di kasir.
let jedaCari = null;
kolomCari.addEventListener('input', () => {
  clearTimeout(jedaCari);
  jedaCari = setTimeout(() => {
    cariAktif = kolomCari.value.trim();
    muatStok();
  }, 300);
});

muatRingkasan();
muatPeringatan();
muatStok();
muatPilihanProduk();
aturKolomHargaBeli();
muatRiwayat();
