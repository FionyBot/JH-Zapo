/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * errorHandler.js — Centralized error handling + recovery.
 * Catch unhandled errors, prevent crash, dan log buat debugging.
 */
import { logger } from '../core/logger.js'

export function setupErrorHandler() {
  // Uncaught exception (buat sync code error)
  process.on('uncaughtException', (err) => {
    logger.error({ err, stack: err.stack }, '❌ Uncaught Exception')
    // Jangan u exit — biarin bot tetep jalan, error udah ke-log bray. 
  })

  // Unhandled promise rejection (buat async code error)
  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, '❌ Unhandled Promise Rejection')
    // Jangan u exit — biarin bot tetep jalan, error udah ke-log bray. 
  })

  // Warning (non-fatal issues)
  process.on('warning', (warning) => {
    logger.warn({ warning }, '⚠️ Node Warning')
  })

  logger.info('🛡️ Error handler siap — bot gak akan crash karena error')
}
