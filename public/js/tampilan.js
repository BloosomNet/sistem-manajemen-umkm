// Tampilan bersama semua halaman: tema terang/gelap, tombol pengalih
// tema di navigasi, ikon Lucide, dan pemberitahuan roti panggang
// (toast). Berkas ini dimuat di <head> supaya tema tersimpan langsung
// diterapkan sebelum halaman digambar — tidak ada kedipan tema.
(function () {
  const KUNCI = 'tema-umkm';
  let tema = 'terang';
  try {
    tema = localStorage.getItem(KUNCI) || 'terang';
  } catch (kesalahan) {
    // Penyimpanan tidak tersedia (mode privat dsb.) — pakai terang.
  }
  if (tema === 'gelap') document.documentElement.dataset.tema = 'gelap';

  function pasangTombolTema() {
    const navigasi = document.querySelector('.navigasi, .bar-atas');
    if (!navigasi || navigasi.querySelector('.tombol-tema')) return;
    const tombol = document.createElement('button');
    tombol.type = 'button';
    tombol.className = 'tombol-tema';
    tombol.title = 'Ganti tema terang/gelap';
    tombol.setAttribute('aria-label', 'Ganti tema terang/gelap');
    tombol.innerHTML =
      '<i data-lucide="' +
      (document.documentElement.dataset.tema === 'gelap' ? 'sun' : 'moon') +
      '"></i>';
    tombol.addEventListener('click', () => {
      const gelap = document.documentElement.dataset.tema === 'gelap';
      if (gelap) {
        delete document.documentElement.dataset.tema;
      } else {
        document.documentElement.dataset.tema = 'gelap';
      }
      try {
        localStorage.setItem(KUNCI, gelap ? 'terang' : 'gelap');
      } catch (kesalahan) {
        // Abaikan: tema tetap berganti untuk sesi ini saja.
      }
      tombol.innerHTML = '<i data-lucide="' + (gelap ? 'moon' : 'sun') + '"></i>';
      if (window.lucide) window.lucide.createIcons();
      document.dispatchEvent(new Event('tema-berubah'));
    });
    navigasi.appendChild(tombol);
  }

  // Pemberitahuan melayang di kanan bawah; dipakai halaman untuk
  // kabar singkat seperti "Produk tersimpan". Hilang sendiri.
  window.tampilkanRoti = function (teks) {
    let wadah = document.querySelector('.wadah-roti');
    if (!wadah) {
      wadah = document.createElement('div');
      wadah.className = 'wadah-roti';
      document.body.appendChild(wadah);
    }
    const roti = document.createElement('div');
    roti.className = 'roti';
    roti.textContent = teks;
    wadah.appendChild(roti);
    setTimeout(() => roti.classList.add('roti-masuk'), 10);
    setTimeout(() => {
      roti.classList.remove('roti-masuk');
      setTimeout(() => roti.remove(), 350);
    }, 3000);
  };

  document.addEventListener('DOMContentLoaded', () => {
    pasangTombolTema();
    if (window.lucide) window.lucide.createIcons();
  });
})();
