# Pilketos - Sistem Pemilihan Ketua OSIS

Aplikasi web untuk pemilihan ketua OSIS secara digital.
Data suara otomatis tersimpan di Google Sheets.

## Fitur

- Maksimal 10 bilik
- Kapasitas 1000 suara per bilik
- Anti duplikat otomatis
- Data dikirim ke Google Sheets
- Panel admin untuk lihat hasil dan hitung manual
- Laporan bisa di-download sebagai CSV atau HTML (untuk print PDF)

## Struktur File

Semua file ada di root repository:

- index.html - halaman utama pemilihan
- style.css - semua tampilan
- 1-pengaturan.js - pusat pengaturan, semua data di sini
- 2-aplikasi.js - logika voting
- 3-admin.js - logika panel admin
- server.gs - kode untuk Google Apps Script
- kandidat-1.png, kandidat-2.png, kandidat-3.png - foto kandidat
- logo-mpk.png, logo-osis.jpeg, logo-pemilos.png - logo sponsor

## Cara Pasang

### 1. Siapkan Google Sheets

1. Buka sheets.google.com, buat spreadsheet baru
2. Nama file bebas
3. Buat dua sheet (tab di bawah) dengan nama persis:
   - Suara
   - Bilik

4. Di sheet Suara, isi baris pertama (A sampai I):
   waktu | idPerangkat | bilik | idKandidat | namaKandidat | jenisSuara | bilikTeks | idSesi | status

5. Di sheet Bilik, isi baris pertama (A sampai E):
   idPerangkat | bilik | waktuDaftar | terakhirAktif | totalSuara

### 2. Setup Apps Script

1. Di spreadsheet, klik menu Extensions, lalu Apps Script
2. Hapus kode default
3. Copy seluruh isi file server.gs, paste ke editor
4. Ganti baris paling atas:
   const KUNCI_SERVER = "GANTI_DENGAN_KATA_SANDI_RAHASIA";
   Ganti dengan kata sandi rahasia Anda, contoh: pilketos2025rahasia
5. Klik Ctrl+S untuk simpan
6. Klik Deploy, lalu New Deployment
7. Klik ikon gerigi, pilih Web app
8. Isi form:
   - Description: terserah
   - Execute as: Me (email Anda)
   - Who has access: Anyone
9. Klik Deploy
10. Muncul popup minta izin, klik Authorize access
11. Pilih akun Google Anda
12. Kalau muncul peringatan "Google hasn't verified this app", klik Advanced, lalu Go to project (unsafe)
13. Klik Allow
14. Copy URL yang muncul. Bentuknya seperti:
    https://script.google.com/macros/s/AKfycb.../exec
15. Simpan URL ini

### 3. Isi Pengaturan Website

Buka file 1-pengaturan.js, ubah 4 baris berikut:

    const KODE_AKSES = "PILKET25";
    const KODE_ADMIN = "ADMINMPK25";
    const ALAMAT_SERVER = "paste URL dari langkah 14";
    const KUNCI_SERVER = "sama persis dengan yang di server.gs";

Penting: KUNCI_SERVER di file ini harus sama persis
dengan KUNCI_SERVER di server.gs. Kalau beda, data tidak
akan masuk ke Google Sheets.

### 4. Upload ke GitHub

1. Buka github.com, login
2. Klik tombol plus di kanan atas, pilih New repository
3. Isi nama repository, contoh: pilketos
4. Pilih Public
5. Klik Create repository
6. Upload semua file ke repository
7. Setelah selesai, buka Settings, lalu Pages
8. Di bagian Source, pilih Deploy from a branch
9. Pilih branch main, folder / (root), klik Save
10. Tunggu 1 sampai 2 menit
11. Refresh halaman, akan muncul URL website Anda

### 5. Hari Pemilihan

1. Buka website di setiap perangkat (HP atau tablet)
2. Satu perangkat untuk satu bilik
3. Masukkan kode akses
4. Pilih nomor bilik (1 sampai 10)
5. Pemilih klik kandidat, konfirmasi, selesai
6. Data otomatis terkirim ke Google Sheets

## Cara Ganti Foto Kandidat

1. Siapkan foto dengan ketentuan:
   - Format JPG atau PNG
   - Ukuran 400 x 400 pixel
   - Berat maksimal 500 KB
   - Wajah di tengah (karena ditampilkan bulat)
   - Nama file huruf kecil, tanpa spasi

2. Beri nama file: kandidat-1.png, kandidat-2.png, kandidat-3.png

3. Upload ke repository, ganti file lama

4. Kalau mau ganti nama file, edit juga di 1-pengaturan.js
   pada bagian KANDIDAT, cari baris foto

Cara kompres foto: buka squoosh.app, drag foto, pilih MozJPEG,
atur Quality sekitar 75%, download.

## Cara Ganti Warna Tema

Semua warna diatur di file style.css, di bagian paling atas:

    :root {
      --warna-utama:       #6D28D9;
      --warna-utama-gelap: #4C1D95;
      --warna-utama-muda:  #EDE9FE;
      --warna-aksen:       #F97316;
      --warna-aksen-gelap: #EA580C;
      ...
    }

Ganti 5 baris di atas dengan warna pilihan Anda. Simpan, refresh.

Contoh kombinasi tema:

Tema Biru Navy:
  --warna-utama:       #1E3A8A;
  --warna-utama-gelap: #1E40AF;
  --warna-utama-muda:  #DBEAFE;
  --warna-aksen:       #F59E0B;
  --warna-aksen-gelap: #D97706;

Tema Hijau:
  --warna-utama:       #059669;
  --warna-utama-gelap: #047857;
  --warna-utama-muda:  #D1FAE5;
  --warna-aksen:       #F97316;
  --warna-aksen-gelap: #EA580C;

Tema Merah Marun:
  --warna-utama:       #991B1B;
  --warna-utama-gelap: #7F1D1D;
  --warna-utama-muda:  #FEE2E2;
  --warna-aksen:       #F59E0B;
  --warna-aksen-gelap: #D97706;

Tema Hitam Emas:
  --warna-utama:       #111827;
  --warna-utama-gelap: #030712;
  --warna-utama-muda:  #F3F4F6;
  --warna-aksen:       #D4AF37;
  --warna-aksen-gelap: #B8860B;

## Panel Admin

Klik tombol Admin Panel di bagian bawah website.
Masukkan kode admin. Di panel admin ada:

- Ringkasan total suara
- Statistik performa
- Pemenang sementara
- Hasil per kandidat dengan progress bar
- Daftar bilik terdaftar
- Hitung suara manual per bilik
- Log suara duplikat
- 10 data voting terbaru

## Fitur Hitung Manual per Bilik

Untuk verifikasi hasil, admin bisa cek bukti per bilik:

1. Login admin
2. Scroll ke bagian Hitung Suara Manual per Bilik
3. Klik salah satu kartu bilik
4. Muncul popup dengan rekap suara dan detail setiap suara
5. Suara duplikat ditandai merah
6. Tutup popup, kartu bilik berubah hijau
7. Ulangi untuk semua bilik
8. Setelah semua dibuka, tombol Hitung Total Keseluruhan aktif
9. Klik tombol itu, hasil total muncul dengan pemenang dan tabel lengkap

## Reset Total

Untuk mengosongkan semua data (bilik dan suara):

1. Login admin
2. Klik tombol Reset Total
3. Ketik RESET TOTAL (huruf besar semua)
4. Semua bilik dan suara dihapus
5. Perangkat yang terdaftar akan otomatis minta daftar ulang
   dalam 15 detik

Peringatan: Reset Total tidak bisa dibatalkan.
Pastikan sudah download laporan atau CSV terlebih dahulu.

## Download Data

Dua tombol di panel admin:

1. Laporan Lengkap
   Buka laporan HTML di tab baru, bisa di-print jadi PDF.
   Kalau popup diblokir, otomatis download sebagai file HTML.

2. Download CSV
   Download data mentah dalam format CSV, bisa dibuka
   di Excel atau Google Sheets.

## Tentang Deteksi Duplikat

Suara dianggap duplikat kalau:

1. ID sesi sama (jaringan bermasalah kirim ulang), atau
2. Perangkat sama, kandidat sama, dan selisih waktu kurang dari 5 detik

Suara duplikat tetap disimpan di sheet dengan status DUPLIKAT,
tapi tidak dihitung di total suara.

Untuk ubah batas waktu, edit di server.gs:
  const JEDA_DUPLIKAT_MS = 5000;

Ubah 5000 jadi angka lain (dalam milidetik).
Setelah ubah, deploy ulang Apps Script dengan version baru.

## Masalah Umum

Kode akses salah:
Cek KODE_AKSES di 1-pengaturan.js

Data tidak masuk Sheets:
Pastikan ALAMAT_SERVER dan KUNCI_SERVER sama persis
di 1-pengaturan.js dan server.gs.

Bilik sudah dipakai:
Satu nomor bilik hanya bisa dipakai satu perangkat.
Admin bisa klik Reset Total untuk mengosongkan.

CSS atau JS tidak terpanggil:
Pastikan nama file di HTML sama persis dengan nama file asli.
Android Chrome tidak bisa buka website dari file lokal,
harus diakses via URL (GitHub Pages).

Muncul status DUPLIKAT:
Cek baris di sheet Suara, bandingkan waktu dengan suara asli.
Kalau memang pemilih sah tapi ke-detect duplikat, naikkan
JEDA_DUPLIKAT_MS di server.gs.

## Catatan Hari-H

- Kuota Google Apps Script: 20.000 request per hari
- Untuk 10.000 suara, aman
- Backup: buka sheet Suara, klik File, Download, pilih Excel atau CSV
- Jangan hapus atau rename sheet Suara dan Bilik saat acara berlangsung
- Kalau internet bilik mati, suara tetap tersimpan di HP
  dan akan terkirim saat online lagi
