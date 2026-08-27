/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * config.js — Centralized configuration untuk FionyVerse
 */

export default {
  // ═══════════════════════════════════════
  // BOT IDENTITY
  // ═══════════════════════════════════════
  botName: 'FionyVerse',

  // ═══════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════
  auth: {
    method: 'auto', // 'qr' | 'pairing' | 'auto' (otomatis, ditanya saat run interaktif)
    customCode: 'JHXFNY48', // 8 karakter: 1-9 & A-Z tanpa I, O, U, 0 — INI ARAHAN DARI DOCS ZAPO BRAY
    useCustomCode: true,   
    // Buat mode non-interaktif (pm2). Isi nomornye di bawah biar gak ditanya saat run.
    // Biarkan '' alias kosongkan kalau mau run manual (node app.js) dan ditanya di terminal.
    pairingNumber: '',
  },

  // ═══════════════════════════════════════
  // COMMAND & PREFIX
  // ═══════════════════════════════════════
  prefixes: ['.', '!', '/', '#', ',', '🦅'],
  mainPrefix: '.',

  // ═══════════════════════════════════════
  // STAFF & ROLES
  // ═══════════════════════════════════════
  staff: [
    { number: '62895405449333', role: 'owner', label: 'JamvanHax0r • Developer' },
    { number: '13126001646', role: 'owner', label: 'JHPremix • Developer' },
    { number: '6289698133663', role: 'admin', label: 'XN • Staff Admin' },
  ],

  // ═══════════════════════════════════════
  // FEATURES
  // ═══════════════════════════════════════
  sticker: {
    packName: 'Made with',
    author: 'Fiony Bot♡',
    withExif: true,
    maxVideoSeconds: 10
  },

  // ═══════════════════════════════════════
  // ANTI-SPAM & COOLDOWN
  // ═══════════════════════════════════════
  antiSpam: {
    enabled: true,
    max: 5,
    windowMs: 10_000,
    muteMs: 30_000
  },
  cooldown: 3000,

  // ═══════════════════════════════════════
  // UX & BEHAVIOR
  // ═══════════════════════════════════════
  autoRead: true,
  typingPresence: true,

  // ═══════════════════════════════════════
  // MESSAGES (Template)
  // ═══════════════════════════════════════
  messages: {
    wait: '⏳ Tunggu sebentar ya, Kak...',
    error: '😵 Terjadi kesalahan, harap coba kembali nanti.',
    ownerOnly: '🚫 Fitur ini khusus OWNER!',
    adminOnly: '🚫 Fitur ini khusus ADMIN!',
    groupOnly: '🚫 Fitur ini khusus GRUP!',
  },

  // ═══════════════════════════════════════
  // LOGGING
  // ═══════════════════════════════════════
  logLevel: 'info',
  libraryLogLevel: 'error',
}
