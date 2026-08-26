import { createPinoLogger } from 'zapo-js'
import config from '../bot.config.js'

// Logger aktivitas bot — yang tampil estetik di terminal
export const logger = await createPinoLogger({
  level: config.logLevel,
  pretty: true
})

// Logger internal zapo-js — senyap biar log protokol gak nge-spam.
// Ganti ke 'debug' kalau suatu saat butuh ngulik protokol dalam.
export const clientLogger = await createPinoLogger({
  level: config.libraryLogLevel ?? 'warn',
  pretty: true
})
