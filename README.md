# IZIN KELUAR LINETOGEL — Vercel + Google Apps Script + Google Sheets

## Arsitektur

```text
Browser Staff
     |
     v
Vercel
  index.html
     |
     v
/api/apps-script
(Vercel Function)
     |
     v
Google Apps Script Web App
  Code.gs
     |
     v
Google Sheets
  STAFF
  PENGATURAN
  IZIN
```

**Semua data tetap disimpan di Google Sheets.**

Vercel tidak menyimpan database staff/izin.

---

## Isi paket Vercel

- `index.html`
- `api/apps-script.js`
- `vercel.json`
- `.env.example`
- `.gitignore`
- `README.md`

`Code.gs` TIDAK dimasukkan ke paket Vercel.

File backend diberikan terpisah:
`Code_GS_Backend_API_Vercel.txt`

---

# BAGIAN A — Google Apps Script

## 1. Ganti Code.gs

Buka project Google Apps Script yang terhubung ke Google Sheets lama.

Ganti isi `Code.gs` dengan file:

`Code_GS_Backend_API_Vercel.txt`

Data Google Sheets tidak perlu dihapus atau dibuat ulang.

## 2. Buat secret

Di Apps Script Editor pilih fungsi:

`buatSecretVercel`

Klik **Run**.

Setujui permission Google bila diminta.

Setelah selesai, buka **Execution log**.

Akan tampil:

`APPS_SCRIPT_SECRET=xxxxxxxxxxxxxxxx`

Copy bagian secret setelah tanda `=`.

Fungsi tersebut juga otomatis menyimpan secret ke:

**Project Settings → Script Properties → VERCEL_API_SECRET**

## 3. Deploy sebagai Web App

Apps Script:

**Deploy → New deployment → Web app**

Gunakan konfigurasi:

- Execute as: **Me**
- Who has access: **Anyone** / akses publik yang memungkinkan Vercel memanggil Web App

Klik Deploy.

Copy URL yang berakhir dengan:

`/exec`

Contoh:

`https://script.google.com/macros/s/XXXXXXXXXXXXXXXX/exec`

URL `/dev` jangan dipakai di Vercel.

## 4. Tes backend

Buka URL `/exec` di browser.

Jika backend benar, akan muncul JSON yang berisi:

`"service":"IZIN KELUAR LINETOGEL API"`

---

# BAGIAN B — Vercel

## 1. Upload project Vercel

Upload semua isi folder Vercel ke GitHub/repository Anda:

```text
index.html
api/
  apps-script.js
vercel.json
.env.example
.gitignore
README.md
```

## 2. Import ke Vercel

Di Vercel:

- Add New → Project
- Import repository
- Deploy

Framework dapat dibiarkan sebagai project static/Other bila terdeteksi otomatis.

## 3. Tambahkan Environment Variables

Vercel:

**Project → Settings → Environment Variables**

Tambahkan:

### APPS_SCRIPT_URL

Nilai:

URL Apps Script `/exec`

### APPS_SCRIPT_SECRET

Nilai:

secret yang dibuat oleh `buatSecretVercel()`.

Aktifkan minimal untuk:

- Production
- Preview (jika ingin preview bekerja)

Setelah menambah/mengubah Environment Variables, lakukan **Redeploy**.

---

# BAGIAN C — Alur kerja

## Login

```text
index.html
   -> /api/apps-script
   -> action: login
   -> Code.gs
   -> Sheet STAFF
```

## START

```text
index.html
   -> /api/apps-script
   -> action: mulaiIzin
   -> Code.gs
   -> Sheet IZIN
```

## END

```text
index.html
   -> /api/apps-script
   -> action: sudahKembali
   -> Code.gs
   -> Sheet IZIN
```

Pengaturan CS LINE, ganti password, riwayat, batas harian, durasi,
Tambah Data, Set Jabatan, dan Hapus Jam Izin memakai alur yang sama.

---

# DATA GOOGLE SHEETS TETAP SAMA

## STAFF

`USERNAME | PASSWORD | NAMA | STATUS`

## PENGATURAN

`STATUS | BATAS_BERSAMAAN | BATAS_MENIT | BATAS_HARIAN`

## IZIN

`TANGGAL | USERNAME | NAMA | STATUS | JAM_KELUAR | BATAS_KEMBALI | JAM_KEMBALI | DURASI | HASIL`

Tidak perlu memindahkan data ke Vercel.

---

# PENTING

1. Jangan taruh `APPS_SCRIPT_SECRET` di `index.html`.
2. Jangan commit `.env` ke GitHub.
3. `APPS_SCRIPT_SECRET` hanya berada di:
   - Vercel Environment Variables
   - Apps Script Script Properties
4. Jangan upload `Code.gs` ke Vercel bila memang ingin backend tetap terpisah.
5. Setiap perubahan `Code.gs`, buat deployment/version Apps Script terbaru.
6. Setiap perubahan frontend/API Vercel, deploy ulang Vercel.

---

# Jika muncul error

## "Environment Variable Vercel belum lengkap"

Periksa:
- APPS_SCRIPT_URL
- APPS_SCRIPT_SECRET
- lalu Redeploy Vercel.

## "Akses API ditolak"

Secret Vercel tidak sama dengan `VERCEL_API_SECRET` di Apps Script.

## "Backend Google Apps Script mengembalikan respons yang tidak valid"

Biasanya:
- URL salah
- menggunakan URL `/dev`
- deployment belum versi terbaru
- Web App tidak dapat diakses oleh Vercel

## Login gagal / data tidak muncul

Periksa data di Sheet `STAFF` dan pastikan project Apps Script masih terhubung ke spreadsheet database yang sama.
