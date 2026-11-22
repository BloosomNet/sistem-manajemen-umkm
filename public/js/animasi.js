// Animasi halaman beranda memakai GSAP: elemen masuk bertahap dan
// angka ringkasan menghitung naik dari nol. Murni lapisan tampilan —
// bila GSAP gagal dimuat atau pengguna memilih gerak dikurangi di
// sistemnya, halaman tetap tampil utuh seperti biasa tanpa animasi.
(function () {
  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Kepala halaman: navigasi, judul, dan keterangan muncul berurutan.
  gsap.from('.navigasi', { y: -14, opacity: 0, duration: 0.5, ease: 'power2.out' });
  gsap.from('main.wadah > h1, main.wadah > .keterangan', {
    y: 12,
    opacity: 0,
    duration: 0.55,
    stagger: 0.08,
    delay: 0.1,
    ease: 'power2.out',
  });

  // Kartu ringkasan angka: muncul satu-satu dengan sedikit memantul.
  gsap.from('.kartu-angka', {
    y: 16,
    opacity: 0,
    scale: 0.96,
    duration: 0.5,
    stagger: 0.07,
    delay: 0.25,
    ease: 'back.out(1.6)',
    clearProps: 'scale',
  });

  // Bagian-bagian di bawah lipatan layar: muncul saat digulir ke sana.
  const pengamat = new IntersectionObserver(
    (entri) => {
      for (const e of entri) {
        if (e.isIntersecting) {
          gsap.fromTo(
            e.target,
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
          );
          pengamat.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll('section.kartu').forEach((bagian, i) => {
    // Bagian pertama (ringkasan) sudah dianimasikan lewat kartu angkanya.
    if (i > 0) pengamat.observe(bagian);
  });

  // Angka ringkasan menghitung naik: dashboard.js mengisi angka lewat
  // textContent, jadi perubahan teksnya diawasi lalu dianimasikan dari
  // nol ke nilai aslinya. Format rupiah dan akhiran kata dipertahankan.
  function uraikanAngka(teks) {
    const cocok = teks.match(/^(\D*?)([\d.]+)(.*)$/);
    if (!cocok) return null;
    const nilai = parseInt(cocok[2].replace(/\./g, ''), 10);
    if (Number.isNaN(nilai)) return null;
    return { awalan: cocok[1], nilai, akhiran: cocok[3] };
  }

  function formatSeperti(awalan, nilai, akhiran) {
    return awalan + Math.round(nilai).toLocaleString('id-ID') + akhiran;
  }

  const sedangAnimasi = new WeakSet();
  const keadaanElemen = new WeakMap();
  const pengamatAngka = new MutationObserver((daftar) => {
    for (const perubahan of daftar) {
      const el = perubahan.target;
      if (sedangAnimasi.has(el)) continue;
      const teks = el.textContent.trim();
      if (!teks || teks === '—') continue;
      // Nilai yang sama dengan yang barusan dianimasikan tidak diulang:
      // penulisan teks hasil akhir oleh animasi sendiri juga memicu
      // pengamat ini, dan dashboard yang memuat ulang nilai yang sama
      // tidak perlu dihitung naik lagi.
      if (el.dataset.nilaiAnimasi === teks) continue;
      const bagian = uraikanAngka(teks);
      if (!bagian || bagian.nilai === 0) continue;
      const lama = keadaanElemen.get(el);
      if (lama) gsap.killTweensOf(lama);
      const keadaan = { nilai: 0 };
      keadaanElemen.set(el, keadaan);
      sedangAnimasi.add(el);
      el.dataset.nilaiAnimasi = teks;
      gsap.to(keadaan, {
        nilai: bagian.nilai,
        duration: 0.9,
        ease: 'power1.out',
        onUpdate() {
          el.textContent = formatSeperti(bagian.awalan, keadaan.nilai, bagian.akhiran);
        },
        onComplete() {
          el.textContent = teks;
          // Penjaga dilepas belakangan: mutasi dari penulisan teks di
          // atas sampai ke pengamat secara tak serempak, jadi elemennya
          // ditahan dulu supaya tidak dianggap nilai baru.
          setTimeout(() => sedangAnimasi.delete(el), 100);
        },
      });
    }
  });
  document.querySelectorAll('.kartu-angka .angka').forEach((el) => {
    pengamatAngka.observe(el, { childList: true, characterData: true, subtree: true });
  });
})();
