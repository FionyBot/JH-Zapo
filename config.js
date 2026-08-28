/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * config.js — Centralized configuration untuk FionyVerse
 */

export default {
  botName: 'FionyVerse',

  auth: {
    method: 'auto',
    customCode: 'JHXFNY48',
    useCustomCode: true,
    pairingNumber: '',
  },

  prefixes: ['.', '!', '/', '#', ',', '😁', '🦅'],
  mainPrefix: '.',

  staff: [
    { number: '62895405449333', role: 'owner', label: 'JamvanHax0r • Developer' },
    { number: '13126001646', role: 'owner', label: 'JHPremix • Developer' },
    { number: '6289698133663', role: 'admin', label: 'XN • Staff Admin' },
  ],

  // Fitur grup yang butuh on/off (permission admin/staff)
  toggleable: ['welcome', 'bye', 'antilink', 'game'],

  // BLACKLIST domain antilink (default; bisa di-override per grup).
  // Selain daftar ini = boleh. Yang di daftar = dihapus.
  antilink: {
    defaultBlacklist: 'wa.me,chat.whatsapp.com,t.me,telegram.me',
  },

  sticker: {
    packName: 'Made with',
    author: 'Fiony Bot♡',
    withExif: true,
    maxVideoSeconds: 10
  },

  antiSpam: {
    enabled: true,
    max: 5,
    windowMs: 10_000,
    muteMs: 30_000
  },
  cooldown: 3000,

  autoRead: true,
  typingPresence: true,

  messages: {
    wait: '⏳ Tunggu sebentar ya, Kak...',
    error: '😵 Terjadi kesalahan, harap coba kembali nanti',
    ownerOnly: '🚫 Fitur ini khusus OWNER!',
    adminOnly: '🚫 Fitur ini khusus ADMIN!',
    groupOnly: '🚫 Fitur ini khusus GRUP!',
  },

  logLevel: 'info',
  libraryLogLevel: 'error',
}
