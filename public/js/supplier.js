// Halaman supplier: mengambil daftar supplier dari server, lalu
// menampilkannya. Tambah supplier dan hubungkan supplier dengan barang
// dicatat lewat formulir — tautannya dipakai kartu peringatan di halaman
// stok, supaya pas stok menipis langsung tahu mau pesan ke siapa.
const daftarSupplier = document.getElementById('daftar-supplier');
const supplierKosong = document.getElementById('supplier-kosong');
const inputCariSupplier = document.getElementById('cari-supplier');

// Daftar supplier terakhir dari server, disimpan supaya pencarian
// bisa menyaring tanpa memanggil server lagi.
let supplierTerakhir = [];
// Penanda jeda supaya pencarian tidak menyaring di setiap ketikan.
let jedaCari = null;
const formSupplier = document.getElementById('form-supplier');
const pesanSupplier = document.getElementById('pesan-supplier');
const formTautan = document.getElementById('form-tautan');
const pesanTautan = document.getElementById('pesan-tautan');
const tautanSupplier = document.getElementById('tautan-supplier');
const tautanProduk = document.getElementById('tautan-produk');

// Menampilkan atau menyembunyikan pesan. berhasil = true memakai kotak
// hijau (.berhasil), kalau tidak memakai kotak merah (.pesan).
function tampilkanPesan(el, teks, berhasil) {
  el.textContent = teks;
  el.hidden = !teks;
  el.classList.toggle('berhasil', !!berhasil);
  el.classList.toggle('pesan', !berhasil);
}

// Teks dari pengguna (nama supplier, kontak) jangan langsung ditempel
// ke halaman — diamankan dulu biar tanda < > nggak kebaca sebagai HTML.
function amankanTeks(teks) {
  return String(teks ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Daftar supplier beserta barang yang disuplai masing-masing.
// Sekalian mengisi pilihan supplier di formulir tautan.
async function muatSupplier() {
  const res = await fetch('/api/supplier');
  if (!res.ok) return;
  const data = await res.json();
  supplierTerakhir = data.supplier;
  tampilkanSupplier();
  const dipilih = tautanSupplier.value;
  tautanSupplier.innerHTML = '<option value="">Pilih supplier dulu</option>';
  data.supplier.forEach((s) => {
    const pilihan = document.createElement('option');
    pilihan.value = s.id;
    pilihan.textContent = s.nama;
    tautanSupplier.appendChild(pilihan);
  });
  // Kalau supplier yang tadi dipilih masih ada, tetap dipilih.
  if (dipilih) tautanSupplier.value = dipilih;
}

// Menampilkan supplier, disaring kata kunci kalau ada — dicocokkan
// ke nama, kontak, alamat, dan barang yang disuplai. Pilihan di
// formulir tautan tidak ikut disaring, tetap menampilkan semuanya.
function tampilkanSupplier() {
  const kataKunci = inputCariSupplier.value.trim().toLowerCase();
  daftarSupplier.innerHTML = '';
  const cocok = supplierTerakhir.filter((s) => {
    if (!kataKunci) return true;
    const gabungan = [s.nama, s.kontak, s.alamat, s.nama_produk]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return gabungan.includes(kataKunci);
  });
  supplierKosong.hidden = cocok.length > 0;
  // Kalau sedang mencari tapi tidak ada yang cocok, beri tahu dengan jelas.
  supplierKosong.textContent = kataKunci
    ? `Tidak ada supplier yang cocok dengan "${inputCariSupplier.value.trim()}".`
    : 'Belum ada supplier. Tambahkan lewat formulir di atas.';
  cocok.forEach((s) => {
    const kartu = document.createElement('div');
    kartu.className = 'kartu-supplier';
    kartu.innerHTML =
      `<strong>${amankanTeks(s.nama)}</strong>` +
      (s.kontak ? `<span class="kontak">${amankanTeks(s.kontak)}</span>` : '') +
      (s.alamat ? `<span class="kontak">${amankanTeks(s.alamat)}</span>` : '') +
      `<span class="suplai">${s.nama_produk ? 'Menyuplai: ' + amankanTeks(s.nama_produk) : 'Belum ada barang yang dihubungkan.'}</span>`;
    daftarSupplier.appendChild(kartu);
  });
}

// Pencarian: tunggu 300 ms setelah pengguna berhenti mengetik, baru saring.
inputCariSupplier.addEventListener('input', () => {
  clearTimeout(jedaCari);
  jedaCari = setTimeout(tampilkanSupplier, 300);
});

// Pilihan barang di formulir tautan: semua barang dari daftar stok.
async function muatPilihanTautan() {
  const res = await fetch('/api/stok');
  if (!res.ok) return;
  const data = await res.json();
  tautanProduk.innerHTML = '<option value="">Pilih barang dulu</option>';
  data.produk.forEach((p) => {
    const pilihan = document.createElement('option');
    pilihan.value = p.id;
    pilihan.textContent = p.nama;
    tautanProduk.appendChild(pilihan);
  });
}

// Tambah supplier baru lewat POST /api/supplier.
formSupplier.addEventListener('submit', async (e) => {
  e.preventDefault();
  tampilkanPesan(pesanSupplier, '');
  const res = await fetch('/api/supplier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nama: document.getElementById('supplier-nama').value.trim(),
      kontak: document.getElementById('supplier-kontak').value.trim() || null,
      alamat: document.getElementById('supplier-alamat').value.trim() || null,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    tampilkanPesan(pesanSupplier, data.pesan || 'Gagal menambah supplier.');
    return;
  }
  tampilkanPesan(pesanSupplier, `${data.pesan}: ${data.supplier.nama}.`, true);
  formSupplier.reset();
  muatSupplier();
});

// Hubungkan supplier dengan barang yang disuplai lewat
// POST /api/supplier/:id/produk.
formTautan.addEventListener('submit', async (e) => {
  e.preventDefault();
  tampilkanPesan(pesanTautan, '');
  const res = await fetch(`/api/supplier/${tautanSupplier.value}/produk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ produk_id: Number(tautanProduk.value) }),
  });
  const data = await res.json();
  if (!res.ok) {
    tampilkanPesan(pesanTautan, data.pesan || 'Gagal menghubungkan.');
    return;
  }
  tampilkanPesan(pesanTautan, `${data.pesan}.`, true);
  formTautan.reset();
  muatSupplier();
});

muatSupplier();
muatPilihanTautan();
