// Panel admin
// Lihat hasil, hitung per bilik, reset, laporan, download CSV

let bilikTerbuka = {};
let timerAutoRefresh = null;

function bukaLoginAdmin() {
  document.getElementById("inputKodeAdmin").value = "";
  document.getElementById("errorAdmin").classList.add("hidden");
  tampilkan("popupLoginAdmin");
}

function tutupLoginAdmin() {
  sembunyikan("popupLoginAdmin");
}

function cobaLoginAdmin() {
  const kode = document.getElementById("inputKodeAdmin").value;
  if (kode === KODE_ADMIN) {
    sembunyikan("popupLoginAdmin");
    document.getElementById("panelAdmin").classList.remove("hidden");
    muatAdmin();

    if (timerAutoRefresh) clearInterval(timerAutoRefresh);
    timerAutoRefresh = setInterval(muatAdmin, 5000);
  } else {
    document.getElementById("errorAdmin").classList.remove("hidden");
    document.getElementById("inputKodeAdmin").value = "";
  }
}

function keluarAdmin() {
  if (timerAutoRefresh) clearInterval(timerAutoRefresh);
  timerAutoRefresh = null;
  document.getElementById("panelAdmin").classList.add("hidden");
  bilikTerbuka = {};
}

async function muatAdmin() {
  document.getElementById("adminTotal").textContent = dataSaya.totalSuara || 0;
  document.getElementById("adminPending").textContent = dataSaya.daftarSuara.length;

  try {
    const jawaban = await fetch(ALAMAT_SERVER, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ kunci: KUNCI_SERVER, aksi: "ambilRingkasan" })
    });
    const hasil = await jawaban.json();
    if (!hasil.ok) throw new Error("Gagal ambil data");

    document.getElementById("adminTotal").textContent = hasil.total;
    document.getElementById("adminAktif").textContent = hasil.total - hasil.golput;
    document.getElementById("adminGolput").textContent = hasil.golput;
    document.getElementById("adminDuplikatJumlah").textContent = hasil.duplikat || 0;
    document.getElementById("adminLogCount").textContent = hasil.total + (hasil.duplikat || 0);
    document.getElementById("adminLastUpdate").textContent = new Date().toLocaleTimeString("id-ID");

    if (hasil.duplikat > 0) {
      document.getElementById("peringatanDuplikat").classList.remove("hidden");
    } else {
      document.getElementById("peringatanDuplikat").classList.add("hidden");
    }

    tampilkanHasilServer(hasil);
    tampilkanBilikServer(hasil.bilik);
    tampilkanDuplikat(hasil.daftarDuplikat || []);
    muatHitungBilik(hasil.bilik || []);
    tampilkanLogTerbaru(hasil.daftarDuplikat || [], hasil.bilik || []);
    perbaruiStatistikPerforma(hasil);
  } catch (e) {
    console.log("Gagal muat data:", e);
  }
}

function tampilkanHasilServer(data) {
  const wadah = document.getElementById("adminHasil");
  const urut = [...(data.kandidat || [])].sort((a, b) => b.suara - a.suara);

  if (urut[0] && urut[0].suara > 0) {
    const seri = urut[1] && urut[0].suara === urut[1].suara;
    if (!seri) {
      document.getElementById("adminPemenang").classList.remove("hidden");
      document.getElementById("adminPemenangNama").textContent = urut[0].nama;
      document.getElementById("adminPemenangVotes").textContent = urut[0].suara + " suara";
    } else {
      document.getElementById("adminPemenang").classList.add("hidden");
    }
  } else {
    document.getElementById("adminPemenang").classList.add("hidden");
  }

  wadah.innerHTML = urut.map((k, i) => {
    const persen = data.total > 0 ? (k.suara / data.total) * 100 : 0;
    const kelasWinner = (i === 0 && k.suara > 0) ? "winner" : "";
    return `
      <div class="result-card">
        <div class="result-header">
          <div class="result-info">
            <div class="result-rank ${kelasWinner}">${i + 1}</div>
            <div class="result-name">${k.nama}</div>
          </div>
          <div class="result-votes">
            <div class="vote-count">${k.suara}</div>
            <div class="vote-label">suara</div>
          </div>
        </div>
        <div class="progress-section">
          <div class="progress-info">
            <span>${persen.toFixed(1)}%</span>
            <span>${k.suara} dari ${data.total} suara</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${persen}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (data.golput > 0) {
    const persen = data.total > 0 ? (data.golput / data.total) * 100 : 0;
    wadah.innerHTML += `
      <div class="result-card">
        <div class="result-header">
          <div class="result-info">
            <div class="result-rank">-</div>
            <div class="result-name">Golput</div>
          </div>
          <div class="result-votes">
            <div class="vote-count">${data.golput}</div>
            <div class="vote-label">suara</div>
          </div>
        </div>
        <div class="progress-section">
          <div class="progress-info">
            <span>${persen.toFixed(1)}%</span>
            <span>${data.golput} dari ${data.total} suara</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${persen}%"></div>
          </div>
        </div>
      </div>
    `;
  }
}

function tampilkanBilikServer(daftarBilik) {
  const wadah = document.getElementById("adminBilik");
  if (!daftarBilik || daftarBilik.length === 0) {
    wadah.innerHTML = '<div class="log-entry">Belum ada bilik terdaftar</div>';
    return;
  }

  wadah.innerHTML = daftarBilik
    .sort((a, b) => String(a.bilik).localeCompare(String(b.bilik)))
    .map(b => {
      const persen = Math.min(100, Math.round((b.totalSuara || 0) / KAPASITAS_PER_BILIK * 100));
      return `
        <div class="bilik-kartu">
          <span>Bilik ${b.bilik}</span>
          <span>${b.totalSuara || 0} / ${KAPASITAS_PER_BILIK} (${persen}%)</span>
        </div>
      `;
    }).join("");
}

function tampilkanDuplikat(daftarDuplikat) {
  const wadah = document.getElementById("adminDuplikat");

  if (!daftarDuplikat || daftarDuplikat.length === 0) {
    wadah.innerHTML = '<div class="log-entry">Tidak ada suara duplikat</div>';
    return;
  }

  wadah.innerHTML = daftarDuplikat.map(d => {
    const tgl = new Date(d.waktu);
    return `
      <div class="duplikat-kartu">
        <div>
          <div class="duplikat-baris">Baris #${d.baris}</div>
          <div class="duplikat-info">
            Bilik ${d.bilik} - ${tgl.toLocaleDateString("id-ID")} ${tgl.toLocaleTimeString("id-ID")}
          </div>
          <div class="duplikat-info">
            Pilihan: ${d.namaKandidat} (${d.jenisSuara})
          </div>
        </div>
        <div class="duplikat-label">DUPLIKAT</div>
      </div>
    `;
  }).join("");
}

function tampilkanLogTerbaru(daftarDuplikat, daftarBilik) {
  const wadah = document.getElementById("adminRecentLogs");
  if (!wadah) return;

  const entri = [];

  (daftarBilik || []).forEach(b => {
    if (b.totalSuara > 0) {
      entri.push({
        waktu: b.terakhirAktif || b.waktuDaftar || Date.now(),
        bilik: b.bilik,
        info: b.totalSuara + " suara dari bilik ini",
        tipe: "BILIK"
      });
    }
  });

  (daftarDuplikat || []).slice(-5).forEach(d => {
    entri.push({
      waktu: d.waktu,
      bilik: d.bilik,
      info: "Duplikat: " + d.namaKandidat,
      tipe: "DUPLIKAT"
    });
  });

  if (entri.length === 0) {
    wadah.innerHTML = '<div class="log-entry">Belum ada data voting</div>';
    return;
  }

  entri.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));
  const tampil = entri.slice(0, 10);

  wadah.innerHTML = tampil.map(e => {
    const d = new Date(e.waktu);
    const gayaTipe = e.tipe === "DUPLIKAT" ? "background:#dc2626;" : "";
    return `
      <div class="log-entry">
        <div class="log-time">${d.toLocaleDateString("id-ID")} ${d.toLocaleTimeString("id-ID")}</div>
        <div class="log-candidate">Bilik ${e.bilik} - ${e.info}</div>
        <div class="log-type" style="${gayaTipe}">${e.tipe}</div>
      </div>
    `;
  }).join("");
}

function perbaruiStatistikPerforma(data) {
  const ukuran = new Blob([JSON.stringify(dataSaya)]).size;
  const elStorage = document.getElementById("adminStorage");
  if (elStorage) elStorage.textContent = (ukuran / 1024).toFixed(1) + "KB";

  const elPending = document.getElementById("adminPending");
  if (elPending) elPending.textContent = dataSaya.daftarSuara.length;

  const elBilik = document.getElementById("adminTotalBilik");
  if (elBilik) elBilik.textContent = (data.bilik || []).length;

  const elPerMin = document.getElementById("adminVotesPerMinute");
  if (elPerMin) elPerMin.textContent = data.total > 0 ? Math.round(data.total / 60) : 0;
}

async function resetBilik() {
  const konfirmasi = prompt(
    "KONFIRMASI RESET TOTAL\n\n" +
    "Ketik RESET TOTAL (huruf besar) untuk menghapus:\n" +
    "Semua bilik terdaftar\n" +
    "SEMUA DATA SUARA\n\n" +
    "Tindakan ini TIDAK BISA DIBATALKAN!"
  );
  if (konfirmasi !== "RESET TOTAL") {
    notif("Reset dibatalkan", "warning");
    return;
  }

  try {
    const jawaban = await fetch(ALAMAT_SERVER, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ kunci: KUNCI_SERVER, aksi: "resetTotal" })
    });
    const hasil = await jawaban.json();

    if (hasil.ok) {
      notif("Semua data direset total");
      bilikTerbuka = {};

      dataSaya.bilik = null;
      dataSaya.idPerangkat = null;
      dataSaya.daftarSuara = [];
      dataSaya.totalSuara = 0;
      simpanData();

      keluarAdmin();
      setTimeout(() => location.reload(), 1500);
    } else {
      notif("Gagal reset: " + hasil.error, "error");
    }
  } catch (e) {
    notif("Error: " + e.message, "error");
  }
}

async function exportCSV() {
  try {
    const jawaban = await fetch(ALAMAT_SERVER, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ kunci: KUNCI_SERVER, aksi: "ambilSemuaSuara" })
    });
    const hasil = await jawaban.json();
    if (!hasil.ok) throw new Error(hasil.error || "Gagal ambil data");

    const html = buatLaporanHTML(hasil);
    const tab = window.open("", "_blank");

    if (!tab || tab.closed || typeof tab.closed === "undefined") {
      unduhFile(html, "laporan-pilketos.html", "text/html");
      notif("Popup diblokir. Laporan didownload sebagai file");
    } else {
      tab.document.write(html);
      tab.document.close();
      notif("Laporan siap! Klik Cetak atau Save PDF");
    }
  } catch (e) {
    notif("Gagal buat laporan: " + e.message, "error");
  }
}

async function downloadCSV() {
  try {
    const jawaban = await fetch(ALAMAT_SERVER, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ kunci: KUNCI_SERVER, aksi: "ambilSemuaSuara" })
    });
    const hasil = await jawaban.json();
    if (!hasil.ok) throw new Error(hasil.error || "Gagal ambil data");

    const suara = hasil.suara || [];
    if (suara.length === 0) {
      notif("Belum ada data suara", "warning");
      return;
    }

    let csv = "No,Waktu,Tanggal,Jam,Bilik,Pilihan,Tipe,Status\n";

    suara.forEach((s, i) => {
      const d = new Date(s.waktu);
      const tgl = d.toLocaleDateString("id-ID");
      const jam = d.toLocaleTimeString("id-ID");
      const pilihan = String(s.namaKandidat).replace(/,/g, ";");
      csv += `${i + 1},${s.waktu},${tgl},${jam},${s.bilik},"${pilihan}",${s.jenisSuara},${s.status}\n`;
    });

    const ringkasan = [
      "# LAPORAN PEMILIHAN KETUA OSIS",
      "# Dicetak: " + new Date().toLocaleString("id-ID"),
      "# Total Suara: " + hasil.total,
      "# Golput: " + hasil.golput,
      "# Duplikat: " + hasil.duplikat,
      "# Pemilih Aktif: " + (hasil.total - hasil.golput),
      "",
      csv
    ].join("\n");

    unduhFile(ringkasan, "data-pilketos-" + Date.now() + ".csv", "text/csv");
    notif("Data CSV berhasil didownload");
  } catch (e) {
    notif("Gagal download: " + e.message, "error");
  }
}

function unduhFile(isi, namaFile, tipeMime) {
  try {
    const blob = new Blob(["\uFEFF" + isi], { type: tipeMime + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = namaFile;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 500);
  } catch (e) {
    const tab = window.open();
    tab.document.write("<pre>" + isi + "</pre>");
  }
}

function buatLaporanHTML(hasil) {
  const sekarang = new Date().toLocaleString("id-ID");
  const total = hasil.total || 0;
  const golput = hasil.golput || 0;
  const duplikat = hasil.duplikat || 0;
  const aktif = total - golput;
  const partisipasi = total > 0 ? Math.round((aktif / total) * 100) : 0;

  const urut = [...(hasil.kandidat || [])].sort((a, b) => b.suara - a.suara);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Pemilihan Ketua OSIS</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family: Arial, sans-serif; }
        body { background:#f0f0f0; padding:20px; }
        .laporan { background:white; max-width:900px; margin:0 auto; padding:30px; box-shadow:0 5px 20px rgba(0,0,0,0.15); }
        h1 { text-align:center; color:#380864; margin-bottom:5px; font-size:22px; }
        .sub { text-align:center; color:#666; font-size:13px; margin-bottom:25px; }
        .header-bar { background:#380864; color:white; padding:10px 15px; font-weight:bold; margin:20px 0 15px; font-size:14px; border-radius:4px; }
        .grid { display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px; }
        .box { background:#f8f9fa; padding:15px; border-radius:8px; border-left:4px solid #380864; text-align:center; }
        .box-label { color:#666; font-size:12px; margin-bottom:5px; }
        .box-value { color:#380864; font-size:22px; font-weight:bold; }
        table { width:100%; border-collapse:collapse; font-size:13px; margin-bottom:15px; }
        th { background:#380864; color:white; padding:10px 8px; text-align:left; }
        td { padding:10px 8px; border-bottom:1px solid #eee; }
        tr.pemenang { background:#fef3c7; }
        tr.pemenang td { font-weight:bold; color:#6E0D4D; }
        .footer { text-align:center; margin-top:30px; padding-top:15px; border-top:1px solid #ddd; color:#999; font-size:11px; }
        .aksi { text-align:center; margin-top:20px; }
        .aksi button { padding:12px 25px; background:#380864; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; margin:5px; font-size:14px; }
        .aksi button:hover { background:#6E0D4D; }
        @media print { body { background:white; padding:0; } .laporan { box-shadow:none; padding:15px; } .aksi { display:none; } }
      </style>
    </head>
    <body>
      <div class="laporan">
        <h1>LAPORAN LENGKAP PEMILIHAN KETUA OSIS</h1>
        <div class="sub">Sistem Voting Digital</div>
        <div class="sub">Dicetak: ${sekarang}</div>

        <div class="header-bar">RINGKASAN HASIL</div>
        <div class="grid">
          <div class="box"><div class="box-label">Total Suara</div><div class="box-value">${total}</div></div>
          <div class="box"><div class="box-label">Pemilih Aktif</div><div class="box-value">${aktif}</div></div>
          <div class="box"><div class="box-label">Golput</div><div class="box-value">${golput}</div></div>
          <div class="box"><div class="box-label">Partisipasi</div><div class="box-value">${partisipasi}%</div></div>
        </div>

        <div class="header-bar">HASIL PER KANDIDAT</div>
        <table>
          <thead>
            <tr>
              <th>No</th><th>Nama Kandidat</th><th>Kelas</th>
              <th>Jumlah Suara</th><th>Persentase</th><th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
  `;

  urut.forEach((k, i) => {
    const persen = total > 0 ? ((k.suara / total) * 100).toFixed(1) : "0.0";
    const kelas = (i === 0 && k.suara > 0) ? "pemenang" : "";
    const ket = (i === 0 && k.suara > 0) ? "PEMENANG" : "";
    html += `
      <tr class="${kelas}">
        <td>${i + 1}</td>
        <td>${k.nama}</td>
        <td>${cariKelas(k.nama)}</td>
        <td>${k.suara}</td>
        <td>${persen}%</td>
        <td>${ket}</td>
      </tr>
    `;
  });

  if (golput > 0) {
    const persen = total > 0 ? ((golput / total) * 100).toFixed(1) : "0.0";
    html += `
      <tr>
        <td>-</td><td>GOLPUT</td><td>-</td>
        <td>${golput}</td><td>${persen}%</td><td>Abstain</td>
      </tr>
    `;
  }

  if (duplikat > 0) {
    html += `
      <tr style="background:#fee2e2;color:#991b1b;">
        <td colspan="3"><b>Suara Duplikat (tidak dihitung)</b></td>
        <td>${duplikat}</td>
        <td colspan="2">Tidak masuk perhitungan</td>
      </tr>
    `;
  }

  html += `
          </tbody>
        </table>

        <div class="header-bar">DAFTAR BILIK</div>
        <table>
          <thead>
            <tr>
              <th>No</th><th>Bilik</th><th>Jumlah Suara</th>
              <th>Kapasitas</th><th>Terpakai</th>
            </tr>
          </thead>
          <tbody>
  `;

  (hasil.bilik || [])
    .sort((a, b) => String(a.bilik).localeCompare(String(b.bilik)))
    .forEach((b, i) => {
      const persen = Math.round((b.totalSuara || 0) / KAPASITAS_PER_BILIK * 100);
      html += `
        <tr>
          <td>${i + 1}</td>
          <td>Bilik ${b.bilik}</td>
          <td>${b.totalSuara || 0}</td>
          <td>${KAPASITAS_PER_BILIK}</td>
          <td>${persen}%</td>
        </tr>
      `;
    });

  html += `
          </tbody>
        </table>

        <div class="footer">
          Dokumen ini dicetak otomatis dari Sistem Pemilihan Ketua OSIS<br>
          ${sekarang}
        </div>

        <div class="aksi">
          <button onclick="window.print()">Cetak / Save PDF</button>
          <button onclick="window.close()">Tutup</button>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

function cariKelas(nama) {
  const k = KANDIDAT.find(x => x.nama === nama);
  return k ? k.kelas : "-";
}

function muatHitungBilik(daftarBilik) {
  const wadah = document.getElementById("hitungBilikGrid");
  if (!wadah) return;

  const info = document.getElementById("infoJumlahBilik");
  if (info) info.textContent = (daftarBilik?.length || 0) + " bilik terdaftar";

  if (!daftarBilik || daftarBilik.length === 0) {
    wadah.innerHTML = '<div class="bilik-kartu">Belum ada bilik terdaftar</div>';
    document.getElementById("tombolHitungTotal").disabled = true;
    return;
  }

  wadah.innerHTML = daftarBilik
    .sort((a, b) => String(a.bilik).localeCompare(String(b.bilik)))
    .map(b => {
      const terbuka = bilikTerbuka[b.bilik];
      return `
        <div class="bilik-hitung-kartu ${terbuka ? 'terbuka' : ''}"
             onclick="bukaBuktiBilik('${b.bilik}')">
          <div class="bilik-hitung-nomor">Bilik ${b.bilik}</div>
          <div class="bilik-hitung-jumlah">${b.totalSuara || 0} suara</div>
          <div class="bilik-hitung-status">
            ${terbuka ? 'Sudah dibuka' : 'Klik untuk buka'}
          </div>
        </div>
      `;
    }).join("");

  cekSemuaBilikTerbuka(daftarBilik);
}

async function bukaBuktiBilik(bilik) {
  document.getElementById("judulBuktiBilik").textContent = "Bukti Suara Bilik " + bilik;
  document.getElementById("buktiList").innerHTML = '<div class="bilik-kartu">Memuat bukti suara...</div>';
  tampilkan("popupBuktiBilik");

  try {
    const jawaban = await fetch(ALAMAT_SERVER, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        kunci: KUNCI_SERVER,
        aksi: "ambilSuaraBilik",
        bilik: bilik
      })
    });
    const hasil = await jawaban.json();
    if (!hasil.ok) throw new Error(hasil.error || "Gagal ambil data");

    tampilkanBuktiBilik(hasil.suara || [], bilik);
    bilikTerbuka[bilik] = true;

    try {
      const ulang = await fetch(ALAMAT_SERVER, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ kunci: KUNCI_SERVER, aksi: "ambilRingkasan" })
      });
      const dataBaru = await ulang.json();
      if (dataBaru.ok) muatHitungBilik(dataBaru.bilik || []);
    } catch (_) {}

  } catch (e) {
    document.getElementById("buktiList").innerHTML =
      '<div class="duplikat-info">Gagal memuat bukti: ' + e.message + '</div>';
  }
}

function tampilkanBuktiBilik(daftarSuara, bilik) {
  const asli = daftarSuara.filter(s => s.status === "ASLI").length;
  const duplikat = daftarSuara.filter(s => s.status === "DUPLIKAT").length;

  document.getElementById("buktiAsli").textContent = asli;
  document.getElementById("buktiDuplikat").textContent = duplikat;
  document.getElementById("buktiTotal").textContent = daftarSuara.length;

  const wadah = document.getElementById("buktiList");

  if (!daftarSuara.length) {
    wadah.innerHTML = '<div class="bilik-kartu">Belum ada suara dari bilik ini</div>';
    return;
  }

  const rekap = {};
  daftarSuara.filter(s => s.status === "ASLI").forEach(s => {
    rekap[s.namaKandidat] = (rekap[s.namaKandidat] || 0) + 1;
  });

  let html = `
    <div class="bukti-header-bilik">
      <h4>Rekap Suara Bilik ${bilik}</h4>
      <table class="tabel-bukti">
        <thead>
          <tr>
            <th>Pilihan</th>
            <th>Jumlah</th>
          </tr>
        </thead>
        <tbody>
  `;

  Object.entries(rekap).forEach(([nama, jumlah]) => {
    html += `<tr><td>${nama}</td><td><b>${jumlah}</b></td></tr>`;
  });

  html += `
        </tbody>
      </table>
    </div>

    <h4 style="margin-top:15px;color:#380864;">Detail Suara (Bukti Asli)</h4>
    <table class="tabel-bukti">
      <thead>
        <tr>
          <th>No</th>
          <th>Waktu</th>
          <th>Pilihan</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  daftarSuara.forEach((s, i) => {
    const d = new Date(s.waktu);
    const merah = s.status === "DUPLIKAT" ? "background:#fee2e2;color:#991b1b;" : "";
    html += `
      <tr style="${merah}">
        <td>${i + 1}</td>
        <td>${d.toLocaleDateString("id-ID")} ${d.toLocaleTimeString("id-ID")}</td>
        <td>${s.namaKandidat}</td>
        <td>${s.status}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  wadah.innerHTML = html;
}

function tutupBuktiBilik() {
  sembunyikan("popupBuktiBilik");
}

function cekSemuaBilikTerbuka(daftarBilik) {
  const tombol = document.getElementById("tombolHitungTotal");
  if (!tombol) return;

  const semuaTerbuka = daftarBilik.length > 0 &&
                       daftarBilik.every(b => bilikTerbuka[b.bilik]);

  if (semuaTerbuka) {
    tombol.disabled = false;
    tombol.textContent = "Hitung Total Keseluruhan";
    tombol.classList.remove("terkunci");
  } else {
    const sisa = daftarBilik.filter(b => !bilikTerbuka[b.bilik]).length;
    tombol.disabled = true;
    tombol.textContent = "Buka " + sisa + " bilik lagi";
    tombol.classList.add("terkunci");
  }
}

async function hitungTotalKeseluruhan() {
  const wadah = document.getElementById("hitungTotalIsi");
  wadah.innerHTML = "<p>Menghitung total...</p>";
  tampilkan("popupHitungTotal");

  try {
    const jawaban = await fetch(ALAMAT_SERVER, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ kunci: KUNCI_SERVER, aksi: "ambilRingkasan" })
    });
    const hasil = await jawaban.json();
    if (!hasil.ok) throw new Error(hasil.error || "Gagal");

    tampilkanHitungTotal(hasil);
  } catch (e) {
    wadah.innerHTML = '<p class="error">Gagal hitung: ' + e.message + '</p>';
  }
}

function tampilkanHitungTotal(data) {
  const wadah = document.getElementById("hitungTotalIsi");
  const urut = [...(data.kandidat || [])].sort((a, b) => b.suara - a.suara);

  const sekarang = new Date().toLocaleString("id-ID");
  const aktif = data.total - data.golput;
  const partisipasi = data.total > 0 ? Math.round((aktif / data.total) * 100) : 0;

  let html = "";

  if (urut[0] && urut[0].suara > 0) {
    const seri = urut[1] && urut[0].suara === urut[1].suara;
    if (!seri) {
      const persen = ((urut[0].suara / data.total) * 100).toFixed(1);
      html += `
        <div class="pemenang-total">
          PEMENANG: ${urut[0].nama}
          <div style="font-size:0.9rem;margin-top:5px;color:#6E0D4D;">
            ${urut[0].suara} suara (${persen}%)
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="peringatan" style="margin-bottom:15px;">
          HASIL SERI! ${urut[0].nama} dan ${urut[1].nama}
          sama-sama ${urut[0].suara} suara
        </div>
      `;
    }
  }

  html += `
    <div class="header-bar-laporan">RINGKASAN HASIL PEMILIHAN</div>
    <div class="grid-laporan">
      <div class="box-laporan">
        <div class="box-label">Total Suara Masuk</div>
        <div class="box-value">${data.total}</div>
      </div>
      <div class="box-laporan">
        <div class="box-label">Total Pemilih Aktif</div>
        <div class="box-value">${aktif}</div>
      </div>
      <div class="box-laporan">
        <div class="box-label">Golput</div>
        <div class="box-value">${data.golput}</div>
      </div>
      <div class="box-laporan">
        <div class="box-label">Persentase Partisipasi</div>
        <div class="box-value">${partisipasi}%</div>
      </div>
    </div>

    <div class="header-bar-laporan">HASIL PER KANDIDAT</div>
    <table class="tabel-laporan">
      <thead>
        <tr>
          <th>No</th>
          <th>Nama Kandidat</th>
          <th>Kelas</th>
          <th>Jumlah</th>
          <th>Persentase</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody>
  `;

  urut.forEach((k, i) => {
    const persen = data.total > 0 ? ((k.suara / data.total) * 100).toFixed(1) : "0.0";
    const kelas = (i === 0 && k.suara > 0) ? "baris-pemenang" : "";
    const ket = (i === 0 && k.suara > 0) ? "PEMENANG" : "";
    html += `
      <tr class="${kelas}">
        <td>${i + 1}</td>
        <td><b>${k.nama}</b></td>
        <td>${cariKelas(k.nama)}</td>
        <td>${k.suara}</td>
        <td>${persen}%</td>
        <td>${ket}</td>
      </tr>
    `;
  });

  if (data.golput > 0) {
    const persen = data.total > 0 ? ((data.golput / data.total) * 100).toFixed(1) : "0.0";
    html += `
      <tr>
        <td>-</td>
        <td><b>GOLPUT</b></td>
        <td>-</td>
        <td>${data.golput}</td>
        <td>${persen}%</td>
        <td>Abstain</td>
      </tr>
    `;
  }

  if (data.duplikat > 0) {
    html += `
      <tr style="background:#fee2e2;color:#991b1b;">
        <td colspan="3"><b>Suara Duplikat (tidak dihitung)</b></td>
        <td>${data.duplikat}</td>
        <td colspan="2">Tidak masuk perhitungan</td>
      </tr>
    `;
  }

  html += `
      </tbody>
    </table>
    <div class="footer-laporan">
      Dicetak otomatis dari Sistem Pemilihan Ketua OSIS - ${sekarang}
    </div>
    <div style="text-align:center;margin-top:15px;">
      <button class="tb-hitung" onclick="window.print()" style="font-size:0.9rem;padding:12px 25px;">
        Cetak / Save PDF
      </button>
    </div>
  `;

  wadah.innerHTML = html;
}

function tutupHitungTotal() {
  sembunyikan("popupHitungTotal");
}