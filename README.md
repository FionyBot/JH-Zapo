# JH-Base WhatsApp Bot with Zapo-JS

Base bot WhatsApp custom di atas [Zapo-JS](https://github.com/vinikjkkj/zapo)
(`zapo-js`) — plain JavaScript (ESM, tanpa TypeScript), feature-based, dengan
dukungan **richMessage** (bentuk tombol & list terbaru WhatsApp).

Bot berjalan sebagai *companion device* (setara WhatsApp Web/Desktop): pairing
cukup sekali lewat QR atau pairing code, kredensial tersimpan, dan sesi
otomatis dipakai ulang di run berikutnya tanpa pairing ulang.

> Base ini adalah mesin di balik bot **FionyVerse** dan masih dalam
> pengembangan aktif — struktur serta dokumentasinya dirancang biar enak
> dibaca, enak dikembangkan, dan enak di-deploy.

---

## Kenapa ini bukan "base bot Zapo-JS" pada umumnya

Kebanyakan base cuma membungkus connect + kirim pesan. Base ini membangun
lapisan aplikasi sendiri di atas library, dengan pembeda yang konkret:

- **QR custom, bukan print terminal polos.** Banner custom + opsi auto-simpan
  QR menjadi PNG (`session/qr.png`) — berguna kalau server gak punya terminal
  yang enak buat scan langsung.

- **richMessage, bukan button/list versi lama.** `buttonsMessage` dan
  `listMessage` klasik makin dibatasi WhatsApp (banyak yang cuma jalan penuh
  di akun Business API). Base ini memakai `interactiveMessage` +
  `nativeFlowMessage` (quick_reply & single_select) — bentuk terbaru yang
  jalan di akun biasa — lengkap dengan pembaca respons tap dari semua jalur
  klien, termasuk `templateButtonReplyMessage` yang dipakai klien Android.

- **Pairing code dengan code custom milik kita.** Bukan code acak server:
  code 8 karakter diset sendiri di config sehingga origin benar-benar
  terlihat milik kita, mengikuti charset resmi WhatsApp (`1-9`, `A-Z` tanpa
  `I O U 0`). Tersedia mode interaktif (ditanya di terminal) dan mode
  non-interaktif untuk PM2.

- **Resolusi identitas LID ↔ nomor.** WhatsApp sedang migrasi identitas ke
  `@lid` demi privasi, terutama di grup. Base ini membaca field alt
  (`participantAlt` / `remoteJidAlt`) dan memetakan LID staff lewat
  `getLidsByPhoneNumbers`, sehingga role berbasis nomor dan mention tetap
  akurat walau pengirim datang sebagai LID.

- **Struktur modular yang tegas.** `auth/`, `core/`, `lib/`, `handlers/`,
  `feat/` — fitur baru gak akan mengacak-acak inti bot. Loader memindai
  `feat/` secara rekursif dan mendaftarkan command + alias otomatis.

- **Sistem role & permission dua lapis.** Owner/admin di level bot (config),
  ditambah deteksi admin grup untuk command grup. User biasa tidak bisa
  menyentuh pengaturan istimewa.

- **Pengaturan per-grup + sistem nyala/mati fitur.** Berbasis SQLite; fitur
  yang butuh izin (welcome/bye hari ini, fitur advanced seperti game/antilink
  ke depannya) hanya bisa di-toggle per grup oleh admin grup/staff —
  anti-spam secara desain, bukan tambalan.

- **Mesin stiker karya sendiri.** Konversi gambar/GIF/video menjadi WebP
  dengan **identitas pack (EXIF)** yang disuntik langsung ke container RIFF
  (TIFF strict, tanpa re-encode) — stiker punya pack name & publisher, bukan
  stiker polos tanpa asal.

- **Keandalan sebagai default.** Reconnect dengan exponential backoff,
  error handler terpusat (satu fitur error tidak mematikan bot), graceful
  shutdown, serta proteksi anti-spam & cooldown bawaan.

- **PM2-ready sejak awal.** Mode auth non-interaktif, log yang bersih dan
  informatif, sesi persisten lintas restart.

---

## Sorotan zapo-js yang base ini manfaatkan

Ringkasan library yang jadi fondasi — biar paham kenapa base ini dibangun
di atasnya:

| Aspek | Penjelasan |
| --- | --- |
| Companion device | Terhubung seperti WhatsApp Web; kredensial Noise tersimpan dan dipakai ulang. |
| API berbasis coordinator | Domain terpisah dan fokus: `client.auth`, `client.message`, `client.group`, `client.profile`, `client.presence`, dll. |
| Typed events | `message`, `receipt`, `group`, `connection`, dan lainnya dengan payload yang jelas — routing pesan jadi presisi. |
| Store fleksibel | State per-session lewat provider; base ini memakai SQLite (`@zapo-js/store-sqlite`). |
| Media & protokol modern | Upload/download media, read receipt, reaction, hingga decrypt addon (poll vote, reaction terenkripsi). |

---

## Struktur folder

```
BotZapo/
├── app.js                 # Entry point: pilihan auth, wiring handler, bootstrap
├── config.js              # Seluruh pengaturan bot, terpusat satu file
├── auth/                  # QR handler, pairing code, connection manager
├── core/                  # Logger, database, cooldown, staff, context,
│                          #   presence, group settings, permission
├── lib/                   # Rich message builder/reader, media, mesin stiker
├── handlers/              # Routing pesan, event grup (welcome/bye), error
├── feat/                  # Fitur (auto-load; terorganisir per kategori)
└── session/               # Kredensial & database (gitignored)
```

Prinsipnya: **`auth/`, `core/`, `lib/`, `handlers/` adalah dapur** — jarang
disentuh; **`feat/` adalah etalase** — tempat fitur baru ditambah tanpa
risiko merusak bagian lain.

---

## Requirements

- Node.js >= 20
- FFmpeg — dipakai mesin stiker untuk konversi video ke WebP animasi
  (`apt install -y ffmpeg` di Debian/Ubuntu)

## Instalasi

```bash
git clone https://github.com/JamvanHax0r/BotZapo.git
cd BotZapo
npm install
```

Sesuaikan `config.js` (identitas bot, nomor staff, metode auth, identitas
pack stiker, dll), lalu jalankan:

```bash
node app.js
```

---

## Autentikasi

### Interaktif (terminal)

Jalankan `node app.js` lalu pilih metodenya:

1. **QR Code** — QR tampil dengan banner custom; scan dari
   WhatsApp → Perangkat tertaut. QR juga bisa disimpan sebagai PNG.
2. **Pairing Code** — masukkan nomor tujuan; bot menampilkan code 8 karakter
   (custom dari config). Di HP: *Perangkat tertaut → Tautkan perangkat →
   Tautkan dengan nomor telepon* → masukkan code. Jalur ini tetap sah walau
   push notif tidak muncul.

Catatan operasional:

- Pairing code punya masa berlaku singkat; base ini meminta code **setelah**
  socket aktif agar selalu valid.
- Jangan meminta code berulang-ulang dalam waktu singkat — WhatsApp punya
  anti-abuse yang menekan pengiriman notif bila endpoint di-hammer.

### Non-interaktif (PM2 / server)

Set di `config.js` supaya bot tidak perlu ditanya saat start:

```js
auth: {
  method: 'pairing',
  pairingNumber: '628xxxxxxxxxx',
}
```

---

## Deploy dengan PM2

```bash
npm install -g pm2
pm2 start app.js --name zapo
pm2 logs zapo            # pairing code & log live
pm2 save && pm2 startup  # hidup otomatis saat server boot
```

Perintah harian: `pm2 status`, `pm2 restart zapo`, `pm2 stop zapo`.
Setelah sekali pairing sukses, restart berikutnya langsung melanjutkan sesi —
tanpa pairing ulang.

---

## Menambah fitur

File `.js` di dalam `feat/` (subfolder mana pun) dimuat otomatis saat start.
Format minimal:

```js
export default {
  name: 'halo',
  aliases: ['hi'],
  tags: 'general',
  description: 'Contoh fitur',
  async run(ctx) {
    await ctx.reply('Halo!')
  }
}
```

Objek `ctx` memberi akses rapi ke konteks pesan: `chat`, `sender`,
`senderNumber`, `isGroup`, `isOwner`, `isAdmin`, `mentioned`, `reply()`,
`react()`, `replyButtons()`, `replyList()`, dan lainnya — lihat
`core/context.js` sebagai sumber kebenarannya.

---

## Status pengembangan

Daftar fitur sengaja tidak dipublikasikan: base ini masih berkembang aktif
dan sebagian fitur sudah berjalan di produksi. Dokumentasi ini berfokus pada
arsitektur, penyesuaian, dan cara operasional — hal-hal yang stabil dan
benar-benar berguna untuk pembaca.

## Kredit

- [zapo-js](https://github.com/vinikjkkj/zapo) — implementasi protokol WhatsApp Web
- [sharp](https://sharp.pixelplumbing.com) — pemrosesan gambar
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — database SQLite
- [pino](https://getpino.io) — logging
- [qrcode](https://github.com/soldair/node-qrcode) — render QR

## Lisensi

MIT — © 2026 by JamvanHax0r - All Rights Reserved.
