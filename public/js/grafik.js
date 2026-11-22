// Grafik omzet tujuh hari terakhir di beranda, digambar Chart.js dari
// data yang sama dengan kartu ringkasan (dikirim dashboard.js lewat
// window.gambarGrafik). Bila Chart.js gagal dimuat, bagian grafik
// disembunyikan saja — angka ringkasannya tetap tampil seperti biasa.
let grafikOmzet = null;
let dataTerakhir = null;

window.gambarGrafik = function (omzet7Hari) {
  dataTerakhir = omzet7Hari;
  const bagian = document.getElementById('bagian-grafik');
  const kanvas = document.getElementById('grafik-omzet');
  if (!bagian || !kanvas || typeof Chart === 'undefined' || !Array.isArray(omzet7Hari)) {
    if (bagian) bagian.hidden = true;
    return;
  }
  bagian.hidden = false;
  const gelap = document.documentElement.dataset.tema === 'gelap';
  const warnaTeks = gelap ? '#a9b3a6' : '#6b6f66';
  const warnaGaris = gelap ? 'rgba(255,255,255,0.08)' : 'rgba(35,40,35,0.07)';
  const data = {
    labels: omzet7Hari.map((h) => h.label),
    datasets: [
      {
        label: 'Omzet',
        data: omzet7Hari.map((h) => h.omzet),
        borderColor: '#2f6b4f',
        backgroundColor: 'rgba(47, 107, 79, 0.14)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#2f6b4f',
        pointRadius: 3.5,
      },
    ],
  };
  const pilihan = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (isi) => 'Rp' + Number(isi.parsed.y).toLocaleString('id-ID'),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: warnaTeks,
          callback: (nilai) => 'Rp' + (nilai / 1000).toLocaleString('id-ID') + 'rb',
        },
        grid: { color: warnaGaris },
      },
      x: { ticks: { color: warnaTeks }, grid: { display: false } },
    },
  };
  if (grafikOmzet) {
    grafikOmzet.data = data;
    grafikOmzet.options = pilihan;
    grafikOmzet.update();
  } else {
    grafikOmzet = new Chart(kanvas, { type: 'line', data, options: pilihan });
  }
};

// Tema terang/gelap berganti: gambar ulang dengan warna sumbu yang pas.
document.addEventListener('tema-berubah', () => {
  if (dataTerakhir) window.gambarGrafik(dataTerakhir);
});
