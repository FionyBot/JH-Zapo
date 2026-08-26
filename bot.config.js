/**
 * bot.config.js
 * Konfigurasi utama bot. JANGAN commit file ini kalau lo isi nomor/data pribadi
 * yang sensitif — tapi karena isinya cuma prefix & nomor owner (bukan credential),
 * ini aman masuk git selama lo gak taruh secret di sini.
 *
 * Credential WhatsApp yang sebenarnya (session) disimpan terpisah di folder
 * `.session/` (lihat core/session.js) — folder itu yang WAJIB masuk .gitignore.
 */
export default {
  // Prefix command, contoh: "!ping", ".ping", "#ping"
  prefix: '!',

  // ID sesi WhatsApp (biarin "default" kalau cuma 1 akun)
  sessionId: 'default',

  // Nomor owner bot, format internasional tanpa "+". Bisa lebih dari satu.
  owners: ['62895405449333'],

  // Level log: fatal | error | warn | info | debug | trace
  logLevel: 'info',

  // Nama bot, dipakai di banner QR & pesan menu
  botName: 'Fiony Bot',

  qr: {
    // Tampilkan QR versi kecil (unicode half-block) di terminal
    small: true,
    // Simpan juga QR sebagai file PNG supaya bisa di-scan dari HP lain / di-share
    saveAsImage: true,
    imagePath: '.session/qr.png'
  }
}
