# Elang Tempur: Pertempuran Udara Nusantara ✈️🚀

Game Arcade Pertempuran Udara 2D Taktis dibangun dengan **React 19**, **Vite**, **TypeScript**, **Tailwind CSS v4**, **Three.js** (Peta Sektor 3D), **Framer Motion**, dan **Web Audio API**.

---

## 🛠️ Cara Menggunakan Project Ini di Visual Studio Code (VS Code)

### 1. Persyaratan Sistem (Prerequisites)
Pastikan komputer Anda sudah terinstall:
- [Node.js](https://nodejs.org/) (Versi **18.x** atau **20.x+** direkomendasikan)
- [Visual Studio Code](https://code.visualstudio.com/)

---

### 2. Langkah-Langkah Menjalankan Project

#### Langkah 1: Buka Folder Project di VS Code
1. Ekstrak atau salin semua file project ini ke komputer Anda.
2. Buka **Visual Studio Code**.
3. Pilih menu `File` -> `Open Folder...` (atau `Buka Folder...`).
4. Pilih folder utama project ini (`elang-tempur`).

#### Langkah 2: Buka Terminal di VS Code
- Tekan kombinasi tombol **`Ctrl + ~`** (atau `Cmd + ~` di Mac) untuk membuka Terminal terintegrasi VS Code.
- Atau pilih menu `Terminal` -> `New Terminal`.

#### Langkah 3: Install Semua Dependencies
Jalankan perintah berikut di terminal VS Code:
```bash
npm install
```
*Tunggu hingga proses instalasi paket npm selesai.*

#### Langkah 4: Jalankan Server Pengembang (Development Server)
Jalankan perintah:
```bash
npm run dev
```

Terminal akan menampilkan output seperti ini:
```bash
  VITE v8.3.0  ready in 300 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

#### Langkah 5: Buka Game di Browser
- Tahan tombol **`Ctrl`** (atau `Cmd` di Mac) dan klik link **`http://localhost:3000/`** di terminal VS Code, atau buka browser (Chrome, Edge, Firefox) dan ketik `http://localhost:3000/`.

---

## 📋 Perintah Utama (NPM Scripts)

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan server lokal pengembang di port `3000` |
| `npm run build` | Membuat file build produksi di folder `dist/` |
| `npm run preview` | Menjalankan preview hasil build produksi |
| `npm run lint` | Menjalankan tipe pengecekan TypeScript (`tsc --noEmit`) |

---

## 🎨 Fitur Utama Game
- **3 Pesawat Tempur Unik**: Garuda-X, Valkyrie, dan Titan.
- **Sistem Suara Radio Pilot (Chatter)**: Audio & Teks Bahasa Indonesia real-time.
- **Manajer Hangar (Upgrade Pesawat)**: Tingkatkan Mesin, Armor, dan Senjata menggunakan XP Karir.
- **Briefing Taktis Peta 3D**: Render Peta Topografi 3D Sektor menggunakan Three.js sebelum misi.
- **Berkas Profil Pilot (Dossier)**: Progresi XP, 10 Tingkat Pangkat Militer, Rentetan Misi Harian, & Grid 8 Statistik Karir Seumur Hidup.
- **Papan Peringkat Global & Siaran Ulang (Replay)**: Rekam & putar ulang aksi tempur gerak lambat.
