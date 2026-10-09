// Logika utama voting
// Kode akses, daftar bilik, pilih kandidat, kirim suara

let dataSaya = {
  bilik: null,
  idPerangkat: null,
  daftarSuara: [],
  totalSuara: 0,
  pilihanSekarang: null
};

let timerCekStatus = null;

document.addEventListener("DOMContentLoaded", () => {
  const simpan = localStorage.getItem("pilketos");
  if (simpan) {
    try { dataSaya = { ...dataSaya, ...JSON.parse(simpan) }; } catch (e) {}
  }

  tampilkanKandidat();
  tampilkanSponsor();

  document.getElementById("inputKodeAkses").addEventListener("keypress", e => {
    if (e.key === "Enter") cobaMasuk();
  });
  document.getElementById("inputNomorBilik").addEventListener("keypress", e => {
    if (e.key === "Enter") daftarkanBilik();
  });

  if (localStorage.getItem("aksesDiberikan") === "true") {
    bukaHalamanUtama();
  } else {
    tampilkan("popupKodeAkses");
  }
});

function cobaMasuk() {
  const kode = document.getElementById("inputKodeAkses").value;
  if (kode === KODE_AKSES) {
    localStorage.setItem("aksesDiberikan", "true");
    sembunyikan("popupKodeAkses");
    bukaHalamanUtama();
    notif("Akses diterima");
  } else {
    document.getElementById("errorKode").classList.remove("hidden");
    document.getElementById("inputKodeAkses").value = "";
  }
}

function bukaHalamanUtama() {
  document.querySelector(".header").classList.remove("hidden");
  document.getElementById("sectionSponsor").classList.remove("hidden");
  document.getElementById("sectionKandidat").classList.remove("hidden");
  document.querySelector(".section-admin").classList.remove("hidden");
  document.querySelector(".footer").classList.remove("hidden");

  if (!dataSaya.bilik) {
    tampilkan("popupDaftarBilik");
  } else {
    document.getElementById("labelBilik").textContent = "Bilik " + dataSaya.bilik;
  }

  perbaruiTotal();
  mulaiKirimOtomatis();
  mulaiCekStatusBilik();
}

async function daftarkanBilik() {
  const input = document.getElementById("inputNomorBilik");
  const nomor = parseInt(input.value, 10);

  if (!nomor || nomor < 1 || nomor > MAKS_BILIK) {
    document.getElementById("errorBilik").textContent = "Nomor bilik harus 1 sampai " + MAKS_BILIK;
    document.getElementById("errorBilik").classList.remove("hidden");
    return;
  }

  const idUnik = buatIdUnik();

  try {
    const jawaban = await fetch(ALAMAT_SERVER, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        kunci: KUNCI_SERVER,
        aksi: "daftarBilik",
        idPerangkat: idUnik,
        bilik: nomor
      })
    });
    const hasil = await jawaban.json();

    if (!hasil.ok) {
      document.getElementById("errorBilik").textContent = hasil.error;
      document.getElementById("errorBilik").classList.remove("hidden");
      return;
    }
  } catch (e) {
    notif("Offline, bilik diverifikasi saat online", "warning");
  }

  dataSaya.bilik = String(nomor).padStart(2, "0");
  dataSaya.idPerangkat = idUnik;
  simpanData();

  sembunyikan("popupDaftarBilik");
  document.getElementById("labelBilik").textContent = "Bilik " + dataSaya.bilik;
  notif("Bilik " + dataSaya.bilik + " siap");
}

function mulaiCekStatusBilik() {
  if (timerCekStatus) clearInterval(timerCekStatus);

  timerCekStatus = setInterval(async () => {
    if (!dataSaya.bilik || !dataSaya.idPerangkat) return;
    if (!navigator.onLine) return;

    try {
      const jawaban = await fetch(ALAMAT_SERVER, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          kunci: KUNCI_SERVER,
          aksi: "cekBilik",
          idPerangkat: dataSaya.idPerangkat,
          bilik: dataSaya.bilik
        })
      });
      const hasil = await jawaban.json();

      if (hasil.ok && hasil.terdaftar === false) {
        dataSaya.bilik = null;
        dataSaya.idPerangkat = null;
        simpanData();

        document.getElementById("labelBilik").textContent = "";
        notif("Bilik direset admin. Silakan daftar ulang.", "warning");
        tampilkan("popupDaftarBilik");
      }
    } catch (_) {}
  }, 15000);
}

function tampilkanKandidat() {
  const wadah = document.getElementById("kandidatGrid");
  wadah.innerHTML = KANDIDAT.map(k => `
    <div class="kandidat-kartu">
      <div class="kandidat-nomor">#${k.id}</div>
      <img class="kandidat-foto" src="${k.foto}" alt="${k.nama}"
           onerror="this.src='foto-kosong.png'" />
      <h3 class="kandidat-nama">${k.nama}</h3>
      <p class="kandidat-kelas">${k.kelas}</p>
      <p class="kandidat-visi">${k.visi}</p>
      <button class="tombol-pilih" onclick="pilihKandidat(${k.id}, '${k.nama}')">
        PILIH KANDIDAT
      </button>
    </div>
  `).join("");
}

function tampilkanSponsor() {
  const wadah = document.getElementById("sponsorGrid");
  wadah.innerHTML = SPONSOR.map(s => `
    <div class="sponsor">
      <img src="${s.logo}" alt="${s.nama}" onerror="this.style.display='none'" />
      <p>${s.nama}</p>
    </div>
  `).join("");
}

function pilihKandidat(id, nama) {
  if (!dataSaya.bilik) {
    notif("Daftarkan bilik dulu", "error");
    tampilkan("popupDaftarBilik");
    return;
  }

  const kandidat = KANDIDAT.find(k => k.id === id);
  const foto = kandidat ? kandidat.foto : "";

  dataSaya.pilihanSekarang = { id, nama, foto, jenis: "KANDIDAT" };
  document.getElementById("namaDipilih").textContent = nama;
  document.getElementById("fotoDipilih").src = foto;
  document.getElementById("fotoDipilih").alt = nama;
  tampilkan("popupKonfirmasi");
}

function pilihGolput() {
  if (!dataSaya.bilik) {
    notif("Daftarkan bilik dulu", "error");
    tampilkan("popupDaftarBilik");
    return;
  }
  dataSaya.pilihanSekarang = { id: 0, nama: "GOLPUT", jenis: "GOLPUT" };
  tampilkan("popupKonfirmasiGolput");
}

function batalPilih() {
  dataSaya.pilihanSekarang = null;
  document.getElementById("fotoDipilih").src = "";
  sembunyikan("popupKonfirmasi");
  sembunyikan("popupKonfirmasiGolput");
}

function konfirmasiPilih() {
  sembunyikan("popupKonfirmasi");
  simpanSuara();
}

function konfirmasiGolput() {
  sembunyikan("popupKonfirmasiGolput");
  simpanSuara();
}

function simpanSuara() {
  const pilihan = dataSaya.pilihanSekarang;
  if (!pilihan) return;

  tampilkan("popupProses");

  const suara = {
    idSesi: buatIdUnik(),
    waktu: Date.now(),
    bilik: dataSaya.bilik,
    idPerangkat: dataSaya.idPerangkat,
    idKandidat: pilihan.id,
    namaKandidat: pilihan.nama,
    jenisSuara: pilihan.jenis
  };

  dataSaya.daftarSuara.push(suara);
  dataSaya.totalSuara++;
  simpanData();
  perbaruiTotal();

  setTimeout(() => {
    sembunyikan("popupProses");
    tampilkan("popupSukses");
    kirimKeServer();

    setTimeout(() => {
      sembunyikan("popupSukses");
      dataSaya.pilihanSekarang = null;
    }, 2000);
  }, 800);
}

async function kirimKeServer() {
  if (dataSaya.daftarSuara.length === 0) return;
  if (!dataSaya.bilik || !dataSaya.idPerangkat) return;

  try {
    const jawaban = await fetch(ALAMAT_SERVER, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        kunci: KUNCI_SERVER,
        aksi: "kirimSuara",
        idPerangkat: dataSaya.idPerangkat,
        bilik: dataSaya.bilik,
        suara: dataSaya.daftarSuara
      })
    });
    const hasil = await jawaban.json();

    if (hasil.ok) {
      dataSaya.daftarSuara = [];
      simpanData();
      console.log("Suara terkirim:", hasil.masuk, "asli,", hasil.duplikat, "duplikat");
    }
  } catch (e) {
    console.log("Koneksi gagal, coba lagi nanti");
  }
}

function mulaiKirimOtomatis() {
  setInterval(kirimKeServer, JEDA_KIRIM_MS);

  window.addEventListener("beforeunload", () => {
    if (dataSaya.daftarSuara.length === 0) return;
    navigator.sendBeacon(
      ALAMAT_SERVER,
      JSON.stringify({
        kunci: KUNCI_SERVER,
        aksi: "kirimSuara",
        idPerangkat: dataSaya.idPerangkat,
        bilik: dataSaya.bilik,
        suara: dataSaya.daftarSuara
      })
    );
  });
}

function perbaruiTotal() {
  const total = dataSaya.totalSuara || 0;
  document.getElementById("teksTotal").textContent = "Total Pemilih: " + total;
  document.getElementById("totalPemilihAtas").textContent = "Total Pemilih: " + total;
  if (total > 0) {
    document.getElementById("barTotal").classList.remove("hidden");
  }
}

function simpanData() {
  localStorage.setItem("pilketos", JSON.stringify(dataSaya));
}

function buatIdUnik() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}

function tampilkan(id) { document.getElementById(id).classList.remove("hidden"); }
function sembunyikan(id) { document.getElementById(id).classList.add("hidden"); }

function notif(pesan, jenis) {
  const el = document.getElementById("notif");
  document.getElementById("notifTeks").textContent = pesan;
  el.className = "notif" + (jenis === "error" ? " error" : jenis === "warning" ? " warning" : "");
  el.classList.remove("hidden");
  clearTimeout(notif._t);
  notif._t = setTimeout(() => el.classList.add("hidden"), 3000);
}