# JH-Base WhatsApp Bot with Zapo-JS
Developed by JamvanHax0r
Thanks to BCCTeam - FLMGroup - Fiony Bot - And You Guys
Base bot WhatsApp custom di atas [Zapo-JS](https://zapo.to) (`zapo-js`) — plain JavaScript (ESM, tanpa TypeScript), feature-based, dengan dukungan **richMessage** (bentuk tombol & list terbaru WhatsApp).

## Kenapa ini bukan "base bot Zapo-JS" pada umumnya

- **QR custom**: bukan cuma print QR polos di terminal — ada banner custom + opsi auto-simpan QR jadi file PNG (`.session/qr.png`), berguna kalau server gak punya terminal yang enak buat scan langsung.
- **richMessage, bukan button/list versi lama**: `buttonsMessage` dan `listMessage` klasik makin dibatasi WhatsApp (banyak yang cuma jalan penuh di akun Business API). Base ini pakai `interactiveMessage` + `nativeFlowMessage` (`quick_reply` & `single_select`) — bentuk modern yang dipakai WA Web/mobile sekarang.
- **Feature system sendiri**: folder `features/`, format `{ name, run(ctx) }`, bukan `plugins/` gaya lama.
- **Reload tanpa restart**: command `!reload` (owner-only) re-import semua feature pakai cache-busting dynamic import — gak perlu matiin proses.

## Setup

```bash
npm install
node app.js
```

Scan QR yang muncul di terminal (atau buka `.session/qr.png` kalau lebih gampang scan dari device lain), lewat **WhatsApp → Perangkat tertaut → Tautkan perangkat**.

Semua konfigurasi (prefix, nomor owner, dll) ada di **`bot.config.js`** — tinggal edit langsung, gak pakai `.env`.

## Struktur folder

```
app.js                    # entrypoint: auth, reconnection, wiring event
bot.config.js             # config: prefix, owner, session id, opsi QR
core/
  logger.js                # instance pino logger
  session.js                # setup store SQLite + WaClient
  qr.js                     # custom QR renderer (banner + export PNG)
  richMessage.js             # builder untuk nativeFlow buttons & list ("richMessage")
  context.js                 # bikin objek `ctx` per pesan masuk (reply, replyButtons, replyList)
  router.js                  # routing: command teks + balasan richMessage
  features.js                # loader/registry feature, dengan reload
features/
  general/
    ping.js
    menu.js
  interactive/
    button-demo.js           # contoh richMessage quick_reply
    list-demo.js              # contoh richMessage single_select
  owner/
    reload.js                # !reload — muat ulang semua feature
```

## Nambah feature baru

Bikin file baru di `features/<kategori>/nama.js`:

```js
export default {
  name: 'halo',
  aliases: ['hi'],
  tags: 'general',
  description: 'Nyapa balik',
  owner: false, // true kalau mau khusus owner
  async run(ctx) {
    await ctx.reply(`Halo juga, ${ctx.args.join(' ') || 'kawan'}!`)
  }
}
```

Otomatis kebaca di `!menu` (baca dari registry) dan bisa langsung dites tanpa daftar manual di tempat lain — cukup jalanin `!reload` kalau bot udah nyala.

### Objek `ctx` yang tersedia di tiap feature

| Field / method       | Keterangan                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `ctx.chat`            | JID chat asal pesan                                                |
| `ctx.sender`          | JID pengirim                                                       |
| `ctx.isGroup`         | `true` kalau pesan dari grup                                       |
| `ctx.isOwner`         | `true` kalau pengirim ada di `bot.config.js → owners`              |
| `ctx.body`            | teks lengkap pesan                                                 |
| `ctx.command`         | nama command yang dipanggil (tanpa prefix)                        |
| `ctx.args` / `ctx.text` | argumen setelah command, array & string                          |
| `ctx.reply(text)`     | balas teks biasa                                                   |
| `ctx.react(emoji)`    | react ke pesan yang memicu command                                 |
| `ctx.replyButtons()`  | kirim richMessage tombol quick-reply                                |
| `ctx.replyList()`     | kirim richMessage list/menu single-select                          |

## richMessage — tombol & list versi baru

Dua contoh siap pakai: `!button` dan `!list`. Balasannya (klik tombol / pilih item list) ditangani lewat `onRichReply(id, handler)` di `core/router.js` — lihat `features/interactive/button-demo.js` dan `list-demo.js` buat pola lengkapnya.

```js
// Kirim tombol
await ctx.replyButtons({
  text: 'Pilih salah satu:',
  buttons: [{ id: 'rich:hai', text: '👋 Sapa aku' }]
})

// Tangani baliknya
onRichReply('rich:hai', async (ctx) => {
  await ctx.reply('Haii!')
})
```

> Rendering richMessage bisa sedikit beda antara WhatsApp Web dan mobile — selalu tes di device asli sebelum dipakai serius. WhatsApp juga bisa mengubah dukungan native-flow ini sewaktu-waktu di sisi server mereka.

## Yang WAJIB dicek sebelum push ke GitHub

- Folder `.session/` (kredensial WA + database SQLite) **sudah** masuk `.gitignore` — jangan pernah di-commit.
- Ganti nomor di `bot.config.js → owners` sebelum deploy.
- File `.session/qr.png` juga otomatis ke-ignore karena ada di dalam `.session/`.

## Referensi

- [Dokumentasi Zapo-JS](https://zapo.to/en/introduction)
- [Raw proto sends](https://zapo.to/en/guides/raw-sends)
- [Reconnection](https://zapo.to/en/guides/reconnection)

## Enjoy code, enjoy JH's code!
## © 2026 by JamvanHax0r — All Rights Reserved
