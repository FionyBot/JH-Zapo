const prefix = ['.', '!', '/', '#']

export default {
  prefix,
  mainPrefix: prefix[0],

  sessionId: 'default',

  // ===== STAFF BOT =====
  // role: 'owner' = akses penuh | 'admin' = ngurus bot (ban/unban, dll)
  // Format nomor: angka internasional tanpa "+".
  // Tips: salin angka yang muncul di log bot (💬 Nama +angka) biar pasti sama.
  staff: [
    { number: '62895405449333', role: 'owner', label: 'JamvanHax0r • Developer' },
    { number: '13126001646', role: 'owner', label: 'JHPremix • Developer' },
    // { number: '6289698133663', role: 'admin', label: 'XN • Admin' },
  ],

  logLevel: 'info',
  libraryLogLevel: 'warn',

  botName: 'Fiony Bot',

  cooldown: 3000,
  autoRead: true,        // centang biru otomatis (method resmi: sendReceipt)
  typingPresence: true,  // indikator mengetik (method resmi: sendChatstate)

  antiSpam: {
    enabled: true,
    max: 5,
    windowMs: 10_000,
    muteMs: 30_000
  },

  qr: {
    small: true,
    saveAsImage: true,
    imagePath: '.session/qr.png'
  }
}
