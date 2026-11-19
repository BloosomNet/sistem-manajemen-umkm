// Dashboard beranda: mengambil angka gabungan dari server, lalu
// menampilkan kartu ringkasan dan barang yang perlu dibeli lagi.
// Kata-katanya disamakan dengan halaman stok ("dari ..." /
// "belum ada suppliernya"), supaya pemilik tidak bingung.
const tanggalDashboardEl = document.getElementById('dashboard-tanggal');
const pesanDashboardEl = document.getElementById('pesan-dashboard');
const daftarPeringatanDashboardEl = document.getElementById('dashboard-peringatan');
const peringatanKosongEl = document.getElementById('dashboard-peringatan-kosong');

// Teks dari pengguna (nama barang, nama supplier) jangan langsung
// ditempel ke halaman — diamankan dulu biar tanda < > nggak kebaca
// sebagai HTML. Pola yang sama seperti di halaman stok.
function amankanTeks(teks) {
  return String(teks ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Mengubah angka menjadi format rupiah, contoh: 5000 menjadi Rp5.000
function formatRupiah(angka) {
  return 'Rp' + Number(angka).toLocaleString('id-ID');
}

function isiKartu(id, teks) {
  document.getElementById(id).textContent = teks;
}

function tampilkanPeringatan(perluDibeli) {
  daftarPeringatanDashboardEl.innerHTML = '';
  peringatanKosongEl.hidden = perluDibeli.length > 0;
  for (const barang of perluDibeli) {
    const sumber = barang.nama_supplier
      ? `dari ${amankanTeks(barang.nama_supplier)}`
      : 'belum ada suppliernya';
    const baris = document.createElement('li');
    baris.innerHTML =
      `<strong>${amankanTeks(barang.nama)}</strong>` +
      `<span class="sisa">sisa ${barang.stok}</span>` +
      `<span class="sumber">${sumber}</span>`;
    daftarPeringatanDashboardEl.appendChild(baris);
  }
}

async function muatDashboard() {
  try {
    const tanggapan = await fetch('/api/dashboard');
    if (!tanggapan.ok) throw new Error('gagal memuat');
    const data = await tanggapan.json();
    const tanggal = new Date(data.tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    tanggalDashboardEl.textContent = `Angka per ${tanggal}.`;
    pesanDashboardEl.hidden = true;
    isiKartu('dash-produk', data.produk.total_produk);
    isiKartu('dash-stok', data.produk.total_stok);
    isiKartu('dash-nilai', formatRupiah(data.produk.nilai_stok));
    isiKartu('dash-menipis', data.produk.menipis);
    isiKartu('dash-habis', data.produk.habis);
    isiKartu('dash-transaksi', `${data.hari_ini.jumlah_transaksi} transaksi`);
    isiKartu('dash-omzet', formatRupiah(data.hari_ini.omzet));
    tampilkanPeringatan(data.perlu_dibeli);
  } catch (kesalahan) {
    pesanDashboardEl.textContent = 'Ringkasan tidak bisa dimuat. Periksa server dan basis data.';
    pesanDashboardEl.hidden = false;
  }
}

// Dipakai app.js juga: sesudah produk ditambah, diubah, atau dihapus,
// angka ringkasannya dimuat ulang supaya tidak ketinggalan.
window.muatDashboard = muatDashboard;

muatDashboard();
