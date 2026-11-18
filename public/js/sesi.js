// Dipakai di semua halaman: cek siapa yang sedang masuk,
// lalu tampilkan namanya dan tombol keluar di navigasi.
// Kalau belum masuk, tampilkan tautan ke halaman Masuk.
const infoMasuk = document.getElementById('info-masuk');

if (infoMasuk) {
  fetch('/api/saya')
    .then((tanggapan) => {
      if (!tanggapan.ok) throw new Error('belum masuk');
      return tanggapan.json();
    })
    .then((data) => {
      // Sudah masuk: tampilkan nama pengguna, tautan ganti kata sandi, dan tombol keluar.
      const teksNama = document.createElement('span');
      teksNama.textContent = `Masuk sebagai ${data.pengguna.nama_pengguna}`;
      const tautanGantiSandi = document.createElement('a');
      tautanGantiSandi.href = '/ganti-kata-sandi.html';
      tautanGantiSandi.textContent = 'Ganti kata sandi';
      const tombolKeluar = document.createElement('button');
      tombolKeluar.type = 'button';
      tombolKeluar.textContent = 'Keluar';
      tombolKeluar.className = 'tombol-kecil tombol-keluar';
      tombolKeluar.addEventListener('click', async () => {
        try {
          await fetch('/api/keluar', { method: 'POST' });
        } catch (kesalahan) {
          // Cookie gagal dihapus di server, tetap muat ulang halamannya.
        }
        window.location.reload();
      });
      infoMasuk.append(teksNama, tautanGantiSandi, tombolKeluar);
    })
    .catch(() => {
      // Belum masuk. Di halaman aplikasi, langsung arahkan ke halaman
      // masuk (penjaga server sebenarnya sudah menahan halaman ini,
      // ini pengaman tambahan kalau sesi habis di tengah pemakaian).
      // Di halaman masuk sendiri, cukup tampilkan tautan Masuk.
      if (window.location.pathname !== '/masuk.html') {
        window.location.href = '/masuk.html';
        return;
      }
      const tautanMasuk = document.createElement('a');
      tautanMasuk.href = '/masuk.html';
      tautanMasuk.textContent = 'Masuk';
      infoMasuk.appendChild(tautanMasuk);
    });
}
