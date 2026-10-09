// Pusat pengaturan aplikasi
// Semua angka, kode, dan nama di sini

// Kode rahasia
const KODE_AKSES = "PILKET25";
const KODE_ADMIN = "ADMINMPK25";

// Alamat server dari Google Apps Script
const ALAMAT_SERVER = "https://script.google.com/macros/s/AKfycbxmeFVVK2fs2vYk_-Hr3PGYJhEJtCM4Eb_CPvQW46HuXkFB8qDQOOUw8Hk67ObRBGqkOA/exec";
const KUNCI_SERVER  = "MPKSman1.PLN";

// Aturan pemilihan
const MAKS_BILIK          = 10;
const KAPASITAS_PER_BILIK = 1000;

// Waktu kirim ke server
const JEDA_KIRIM_MS = 20000;

// Daftar kandidat
const KANDIDAT = [
  {
    id: 1,
    nama: "Alika Nurul Fadilah",
    kelas: "XI A2",
    foto: "kandidat-1.png",
    visi: "TRANSFORM into a good way, Membangun generasi unggul SMAN 1 Pangalengan yang berkarakter Tangguh, Responsif, Adaptif, ber-Nalar Kritis, Solid, Fleksibel, Optimis, Revolutioner dan Motivatif melalui pendidikan berkualitas."
  },
  {
    id: 2,
    nama: "Akmaludin Nur Fadillah",
    kelas: "XI D2",
    foto: "kandidat-2.png",
    visi: "Mewujudkan OSIS SMAN 1 PANGALENGAN yang RAMAH (Responsif, Aktif, Menghargai, Adaptif dan Harmonis)."
  },
  {
    id: 3,
    nama: "Karina Zahra Alqonita",
    kelas: "XI B3",
    foto: "kandidat-3.png",
    visi: "Mewujudkan Organisasi Siswa Intra Sekolah (OSIS) sebagai wadah yang aktif, kreatif, dan kolaboratif untuk mengembangkan potensi seluruh siswa, serta menjadikan sekolah sebagai lingkungan yang nyaman dan inspiratif bagi semua."
  }
];

// Daftar sponsor
const SPONSOR = [
  { nama: "MPK",     logo: "logo-mpk.png"     },
  { nama: "PEMILOS", logo: "logo-pemilos.png" },
  { nama: "OSIS",    logo: "logo-osis.jpeg"   }
];