const prefix = ['.', '!', '/', '#']

export default {
  prefix,
  mainPrefix: prefix[0],

  sessionId: 'default',

  staff: [
    { number: '62895405449333', role: 'owner', label: 'JamvanHax0r • Developer' },
    { number: '13126001646', role: 'owner', label: 'JHPremix Store • Developer' },
    { number: '6289698133663', role: 'admin', label: 'XN • Staff Admin' },
  ],

  logLevel: 'info',
  libraryLogLevel: 'warn',

  botName: 'Fiony Bot',

  cooldown: 3000,
  autoRead: true,
  typingPresence: true,

  antiSpam: { enabled: true, max: 5, windowMs: 10_000, muteMs: 30_000 },

  sticker: {
    packName: 'Made with',
    author: 'Fiony Bot♡',
    withExif: true,
    maxVideoSeconds: 10
  },

  qr: { small: true, saveAsImage: true, imagePath: '.session/qr.png' }
}
