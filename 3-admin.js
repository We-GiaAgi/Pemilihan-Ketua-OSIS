// ============================================================
// 3-ADMIN.JS — PANEL ADMIN
// Dimuat SETELAH 2-aplikasi.js.
// Fitur: hasil voting rapi, duplikat, hitung per bilik, reset, export.
// ============================================================

// ---------- STATE ----------
let bilikTerbuka = {};   // menyimpan bilik mana yang sudah dibuka
let timerAutoRefresh = null;

// ---------- LOGIN ----------
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

    // Auto-refresh tiap 5 detik (real-time)
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

// ---------- MUAT DATA ADMIN ----------
async function muatAdmin() {
  document.getElementById("adminTotal").textContent = dataSaya.totalSuara || 0;
  document.getElementById("adminPending").textContent = dataSaya.daftarSuara.length;

  try {
    const jawaban = await fetch(ALAMAT_SERVER, {
      method: "POST",
      body: JSON.stringify({ kunci: KUNCI_SERVER, aksi: "ambilRingkasan" })
    });
    const hasil = await jawaban.json();
    if (!hasil.ok) throw new Error("Gagal ambil data");

    document.getElementById("adminTotal").textContent = hasil.total;
    document.getElementById("adminAktif").textContent = hasil.total - hasil.golput;
    document.getElementById("adminGolput").textContent = hasil.golput;
    document.getElementById("adminDuplikatJumlah").textContent = hasil.duplikat || 0;
    document.getElementById("adminLogCount").textContent = hasil.total + (hasil.duplikat || 0);
    document.getElementById("adminLastUpdate").textContent =
      new Date().toLocaleTimeString("id-ID");

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
    document.getElementById("adminHasil").innerHTML =
      '<div class="result-card">Gagal muat data server. Cek koneksi.</div>';
  }
}

// ---------- HASIL PER KANDIDAT (dengan progress bar) ----------
function tampilkanHasilServer(data) {
  const wadah = document.getElementById("adminHasil");
  const urut = [...(data.kandidat || [])].sort((a, b) => b.suara - a.suara);

  // Winner card
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

  // Kartu hasil dengan progress bar
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

  // Kartu golput (kalau ada)
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

// ---------- DAFTAR BILIK ----------
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
          <span>📍 Bilik ${b.bilik}</span>
          <span>${b.totalSuara || 0} / ${KAPASITAS_PER_BILIK} (${persen}%)</span>
        </div>
      `;
    }).join("");
}

// ---------- LOG DUPLIKAT ----------
function tampilkanDuplikat(daftarDuplikat) {
  const wadah = document.getElementById("adminDuplikat");

  if (!daftarDuplikat || daftarDuplikat.length === 0) {
    wadah.innerHTML = '<div class="log-entry">Tidak ada suara duplikat ✓</div>';
    return;
  }

  wadah.innerHTML = daftarDuplikat.map(d => {
    const tgl = new Date(d.waktu);
    return `
      <div class="duplikat-kartu">
        <div>
          <div class="duplikat-baris">📄 Baris #${d.baris}</div>
          <div class="duplikat-info">
            Bilik ${d.bilik} · ${tgl.toLocaleDateString("id-ID")} ${tgl.toLocaleTimeString("id-ID")}
          </div>
          <div class="duplikat-info">
            Pilihan: ${d.namaKandidat} (${d.jenisSuara})
          </div>
        </div>
        <div class="duplikat-label">🚨 DUPLIKAT</div>
      </div>
    `;
  }).join("");
}

// ---------- LOG VOTING TERBARU (10 terakhir) ----------
function tampilkanLogTerbaru(daftarDuplikat, daftarBilik) {
  const wadah = document.getElementById("adminRecentLogs");
  if (!wadah) return;

  const entri = [];

  (daftarBilik || []).forEach(b => {
    if (b.totalSuara > 0) {
      entri.push({
        waktu: b.terakhirAktif || b.waktuDaftar || Date.now(),
        bilik: b.bilik,
        info: `${b.totalSuara} suara dari bilik ini`,
        tipe: "BILIK"
      });
    }
  });

  (daftarDuplikat || []).slice(-5).forEach(d => {
    entri.push({
      waktu: d.waktu,
      bilik: d.bilik,
      info: `Duplikat: ${d.namaKandidat}`,
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
        <div class="log-candidate">Bilik ${e.bilik} · ${e.info}</div>
        <div class="log-type" style="${gayaTipe}">${e.tipe}</div>
      </div>
    `;
  }).join("");
}

// ---------- STATISTIK PERFORMA ----------
function perbaruiStatistikPerforma(data) {
  // Suara per menit (perkiraan)
  const now = Date.now();
  const suaraMenit = (data.total || 0) > 0
    ? Math.round(data.total / Math.max(1, (now - (data.waktuMulai || now)) / 60000))
    : 0;
  const elPerMin = document.getElementById("adminVotesPerMinute");
  if (elPerMin) elPerMin.textContent = suaraMenit || 0;

  // Storage lokal
  const ukuran = new Blob([JSON.stringify(dataSaya)]).size;
  const elStorage = document.getElementById("adminStorage");
  if (elStorage) elStorage.textContent = (ukuran / 1024).toFixed(1) + "KB";

  // Belum terkirim
  const elPending = document.getElementById("adminPending");
  if (elPending) elPending.textContent = dataSaya.daftarSuara.length;

  // Bilik aktif
  const elBilik = document.getElementById("adminTotalBilik");
  if (elBilik) elBilik.textContent = (data.bilik || []).length;
}

// ---------- RESET BILIK ----------
async function resetBilik() {
  const konfirmasi = prompt(
    'Ketik "RESET" untuk konfirmasi.\n\n' +
    'Semua bilik akan dilepas dan minta daftar ulang.\n' +
    'DATA SUARA TIDAK AKAN HILANG.'
  );
  if (konfirmasi !== "RESET") return;

  try {
    const jawaban = await fetch(ALAMAT_SERVER, {
      method: "POST",
      body: JSON.stringify({ kunci: KUNCI_SERVER, aksi: "resetBilik" })
    });
    const hasil = await jawaban.json();

    if (hasil.ok) {
      notif("✅ Bilik direset. Suara tetap aman.");
      bilikTerbuka = {};
      muatAdmin();
    } else {
      notif("Gagal reset: " + hasil.error, "error");
    }
  } catch (e) {
    notif("Error: " + e.message, "error");
  }
}

// ---------- EXPORT CSV ----------
function exportCSV() {
  fetch(ALAMAT_SERVER, {
    method: "POST",
    body: JSON.stringify({ kunci: KUNCI_SERVER, aksi: "ambilSemuaSuara" })
  })
  .then(r => r.json())
  .then(hasil => {
    if (!hasil.ok || !hasil.suara || hasil.suara.length === 0) {
      notif("Belum ada data", "warning");
      return;
    }

    let csv = "WAKTU,TANGGAL,BILIK,KANDIDAT,TIPE,STATUS\n";
    hasil.suara.forEach(s => {
      const d = new Date(s.waktu);
      csv += `${s.waktu},${d.toLocaleDateString("id-ID")},`
           + `${s.bilik},"${s.namaKandidat}",${s.jenisSuara},${s.status}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "data_pilketos_" + Date.now() + ".csv";
    link.click();
    notif("Export berhasil ✓");
  })
  .catch(e => notif("Gagal export: " + e.message, "error"));
}

// ============================================================
// FITUR: HITUNG SUARA MANUAL PER BILIK
// ============================================================

// ---------- TAMPILKAN GRID BILIK ----------
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
          <div class="bilik-hitung-nomor">📍 Bilik ${b.bilik}</div>
          <div class="bilik-hitung-jumlah">${b.totalSuara || 0} suara</div>
          <div class="bilik-hitung-status">
            ${terbuka ? '✅ Sudah dibuka' : '🔒 Klik untuk buka'}
          </div>
        </div>
      `;
    }).join("");

  cekSemuaBilikTerbuka(daftarBilik);
}

// ---------- BUKA BUKTI SATU BILIK ----------
async function bukaBuktiBilik(bilik) {
  document.getElementById("judulBuktiBilik").textContent = "Bukti Suara Bilik " + bilik;
  document.getElementById("buktiList").innerHTML =
    '<div class="bilik-kartu">Memuat bukti suara...</div>';
  tampilkan("popupBuktiBilik");

  try {
    const jawaban = await fetch(ALAMAT_SERVER, {
      method: "POST",
      body: JSON.stringify({
        kunci: KUNCI_SERVER,
        aksi: "ambilSuaraBilik",
        bilik: bilik
      })
    });
    const hasil = await jawaban.json();
    if (!hasil.ok) throw new Error(hasil.error || "Gagal ambil data");

    tampilkanBuktiBilik(hasil.suara || []);

    bilikTerbuka[bilik] = true;

    // Refresh grid
    try {
      const ulang = await fetch(ALAMAT_SERVER, {
        method: "POST",
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

// ---------- TAMPILKAN ISI BUKTI ----------
function tampilkanBuktiBilik(daftarSuara) {
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

  wadah.innerHTML = daftarSuara.map((s, i) => {
    const d = new Date(s.waktu);
    const kelasDup = s.status === "DUPLIKAT" ? "duplikat" : "";
    return `
      <div class="bukti-baris ${kelasDup}">
        <div class="bukti-nomor">#${i + 1}</div>
        <div class="bukti-waktu">
          ${d.toLocaleDateString("id-ID")} ${d.toLocaleTimeString("id-ID")}
        </div>
        <div class="bukti-pilihan">${s.namaKandidat}</div>
        <div class="bukti-status ${kelasDup}">${s.status}</div>
      </div>
    `;
  }).join("");
}

function tutupBuktiBilik() {
  sembunyikan("popupBuktiBilik");
}

// ---------- CEK SEMUA BILIK SUDAH DIBUKA ----------
function cekSemuaBilikTerbuka(daftarBilik) {
  const tombol = document.getElementById("tombolHitungTotal");
  if (!tombol) return;

  const semuaTerbuka = daftarBilik.length > 0 &&
                       daftarBilik.every(b => bilikTerbuka[b.bilik]);

  if (semuaTerbuka) {
    tombol.disabled = false;
    tombol.textContent = "🧮 Hitung Total Keseluruhan";
    tombol.classList.remove("terkunci");
  } else {
    const sisa = daftarBilik.filter(b => !bilikTerbuka[b.bilik]).length;
    tombol.disabled = true;
    tombol.textContent = `🔒 Buka ${sisa} bilik lagi`;
    tombol.classList.add("terkunci");
  }
}

// ---------- HITUNG TOTAL KESELURUHAN ----------
async function hitungTotalKeseluruhan() {
  const wadah = document.getElementById("hitungTotalIsi");
  wadah.innerHTML = "<p>Menghitung total...</p>";
  tampilkan("popupHitungTotal");

  try {
    const jawaban = await fetch(ALAMAT_SERVER, {
      method: "POST",
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

  let html = "";

  if (urut[0] && urut[0].suara > 0) {
    const seri = urut[1] && urut[0].suara === urut[1].suara;
    if (!seri) {
      const persen = ((urut[0].suara / data.total) * 100).toFixed(1);
      html += `
        <div class="pemenang-total">
          🏆 <b>PEMENANG:</b> ${urut[0].nama}
          <div style="font-size:0.9rem;margin-top:5px;color:#6E0D4D;">
            ${urut[0].suara} suara (${persen}%)
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="peringatan" style="margin-bottom:15px;">
          ⚖️ <b>HASIL SERI!</b> ${urut[0].nama} dan ${urut[1].nama}
          sama-sama ${urut[0].suara} suara
        </div>
      `;
    }
  }

  html += `
    <div class="hitung-total-statistik">
      <div class="stat-box">
        <div class="stat-angka">${data.total}</div>
        <div class="stat-label">Total Suara (ASLI)</div>
      </div>
      <div class="stat-box">
        <div class="stat-angka">${data.total - data.golput}</div>
        <div class="stat-label">Memilih Kandidat</div>
      </div>
      <div class="stat-box">
        <div class="stat-angka">${data.golput}</div>
        <div class="stat-label">Golput</div>
      </div>
      <div class="stat-box merah">
        <div class="stat-angka">${data.duplikat || 0}</div>
        <div class="stat-label">Duplikat</div>
      </div>
    </div>
  `;

  html += `
    <h4 style="color:#380864;margin:20px 0 10px;">Hasil per Kandidat</h4>
    <table class="tabel-total">
      <thead>
        <tr>
          <th>Peringkat</th>
          <th>Nama Kandidat</th>
          <th>Jumlah</th>
          <th>Persentase</th>
        </tr>
      </thead>
      <tbody>
  `;

  urut.forEach((k, i) => {
    const persen = data.total > 0 ? ((k.suara / data.total) * 100).toFixed(1) : "0.0";
    const kelas = (i === 0 && k.suara > 0) ? "baris-pemenang" : "";
    html += `
      <tr class="${kelas}">
        <td>${i + 1}</td>
        <td><b>${k.nama}</b></td>
        <td>${k.suara}</td>
        <td>${persen}%</td>
      </tr>
    `;
  });

  if (data.golput > 0) {
    const persen = data.total > 0 ? ((data.golput / data.total) * 100).toFixed(1) : "0.0";
    html += `
      <tr>
        <td>-</td>
        <td><b>GOLPUT</b></td>
        <td>${data.golput}</td>
        <td>${persen}%</td>
      </tr>
    `;
  }

  html += `</tbody></table>`;
  wadah.innerHTML = html;
}

function tutupHitungTotal() {
  sembunyikan("popupHitungTotal");
}