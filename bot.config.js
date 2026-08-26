/**
 * bot.config.js
 * Konfigurasi utama bot. Credential WhatsApp (session) disimpan terpisah di
 * folder `.session/` — folder itu yang WAJIB masuk .gitignore.
 */

const prefix = ['.', '!', '/', '#']

export default {
  prefix,
  mainPrefix: prefix[0], // prefix utama buat tampilan menu/contoh

  sessionId: 'default',

  owners: ['62895405449333'],

  logLevel: 'info',
  libraryLogLevel: 'warn', // log internal zapo-js (biar gak berisik)

  botName: 'Fiony Bot',

  cooldown: 3000,

  qr: {
    small: true,
    saveAsImage: true,
    imagePath: '.session/qr.png'
  }
}
