// Halaman supplier: mengambil daftar supplier dari server, lalu
// menampilkannya. Tambah, ubah, dan hapus supplier serta hubungkan
// supplier dengan barang dicatat lewat formulir — tautannya dipakai
// kartu peringatan di halaman stok, supaya pas stok menipis langsung
// tahu mau pesan ke siapa.
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
const judulFormSupplier = document.getElementById('judul-form-supplier');
const tombolSimpanSupplier = document.getElementById('tombol-simpan-supplier');
const tombolBatalUbah = document.getElementById('tombol-batal-ubah');

// Supplier yang sedang diubah lewat formulir yang sama — null kalau
// formulirnya lagi dipakai menambah supplier baru.
let supplierSedangDiubah = null;
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
      `<span class="suplai">${s.nama_produk ? 'Menyuplai: ' + amankanTeks(s.nama_produk) : 'Belum ada barang yang dihubungkan.'}</span>` +
      `<span class="aksi-supplier">` +
      `<button type="button" class="tombol-kecil" data-ubah="${s.id}">Ubah</button>` +
      `<button type="button" class="tombol-kecil tombol-hapus" data-hapus="${s.id}">Hapus</button>` +
      `</span>`;
    daftarSupplier.appendChild(kartu);
  });
}

// Klik tombol Ubah atau Hapus di kartu supplier — pakai satu pendengar
// di daftarnya, karena kartunya dibuat ulang tiap kali dimuat.
daftarSupplier.addEventListener('click', (e) => {
  const tombolUbah = e.target.closest('[data-ubah]');
  if (tombolUbah) {
    const supplier = supplierTerakhir.find((s) => s.id === Number(tombolUbah.dataset.ubah));
    if (supplier) mulaiUbahSupplier(supplier);
    return;
  }
  const tombolHapus = e.target.closest('[data-hapus]');
  if (tombolHapus) {
    const supplier = supplierTerakhir.find((s) => s.id === Number(tombolHapus.dataset.hapus));
    if (supplier) hapusSupplier(supplier);
  }
});

// Mengisi formulir dengan data supplier lama dan mengubahnya jadi
// mode ubah: judul dan tombol ikut berubah, ada tombol batal.
function mulaiUbahSupplier(s) {
  supplierSedangDiubah = s.id;
  document.getElementById('supplier-nama').value = s.nama;
  document.getElementById('supplier-kontak').value = s.kontak || '';
  document.getElementById('supplier-alamat').value = s.alamat || '';
  judulFormSupplier.textContent = 'Ubah supplier';
  tombolSimpanSupplier.textContent = 'Simpan perubahan';
  tombolBatalUbah.hidden = false;
  tampilkanPesan(pesanSupplier, '');
  formSupplier.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Mengembalikan formulir ke mode tambah supplier baru.
function batalUbahSupplier() {
  supplierSedangDiubah = null;
  formSupplier.reset();
  judulFormSupplier.textContent = 'Tambah supplier';
  tombolSimpanSupplier.textContent = 'Tambah supplier';
  tombolBatalUbah.hidden = true;
}

tombolBatalUbah.addEventListener('click', () => {
  batalUbahSupplier();
  tampilkanPesan(pesanSupplier, '');
});

// Hapus supplier lewat DELETE /api/supplier/:id — ditanya dulu,
// karena tautannya ke barang ikut lepas.
async function hapusSupplier(s) {
  if (!confirm(`Hapus supplier "${s.nama}"? Barang yang dihubungkan ikut dilepas, tapi riwayat stoknya tetap.`)) {
    return;
  }
  const res = await fetch(`/api/supplier/${s.id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) {
    tampilkanPesan(pesanSupplier, data.pesan || 'Gagal menghapus supplier.');
    return;
  }
  if (supplierSedangDiubah === s.id) batalUbahSupplier();
  tampilkanPesan(pesanSupplier, `${data.pesan}.`, true);
  muatSupplier();
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

// Tambah supplier baru lewat POST /api/supplier, atau simpan perubahan
// lewat PUT /api/supplier/:id kalau formulirnya lagi mode ubah.
formSupplier.addEventListener('submit', async (e) => {
  e.preventDefault();
  tampilkanPesan(pesanSupplier, '');
  const sedangUbah = supplierSedangDiubah !== null;
  const res = await fetch(
    sedangUbah ? `/api/supplier/${supplierSedangDiubah}` : '/api/supplier',
    {
      method: sedangUbah ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama: document.getElementById('supplier-nama').value.trim(),
        kontak: document.getElementById('supplier-kontak').value.trim() || null,
        alamat: document.getElementById('supplier-alamat').value.trim() || null,
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    tampilkanPesan(pesanSupplier, data.pesan || 'Gagal menyimpan supplier.');
    return;
  }
  if (sedangUbah) batalUbahSupplier();
  else formSupplier.reset();
  tampilkanPesan(pesanSupplier, `${data.pesan}: ${data.supplier.nama}.`, true);
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
