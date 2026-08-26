const prefix = ['.', '!', '/', '#']

export default {
  prefix,
  mainPrefix: prefix[0],

  sessionId: 'default',
  owners: ['62895405449333', '6289698133663', '13126001646'],

  logLevel: 'info',
  libraryLogLevel: 'warn',

  botName: 'Fiony Bot',

  // ===== PHASE 2 =====
  // Jeda per-command dalam ms (0 = mati). Bisa di-override per feature lewat `cooldown`
  cooldown: 3000,

  // Auto-read pesan masuk (centang biru)
  autoRead: true,

  // Nampilin indikator "sedang mengetik..." saat bot proses command
  typingPresence: true,

  // Anti-spam: maksimal `max` command dalam `windowMs`. Kalau lewat, dibisukan `muteMs`
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
