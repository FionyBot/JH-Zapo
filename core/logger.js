/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * logger.js — Logger estetik ala-ala wkk
 */
import { createPinoLogger } from 'zapo-js'
import config from '../config.js'

export const logger = await createPinoLogger({
  level: config.logLevel,
  pretty: true,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() })
  },
  timestamp: () => `,"time":"${new Date().toLocaleTimeString('id-ID')}"`
})

logger.success = (msg, ...args) => logger.info({ ...args }, msg)

export const clientLogger = await createPinoLogger({
  level: config.libraryLogLevel ?? 'warn',
  pretty: true
})
