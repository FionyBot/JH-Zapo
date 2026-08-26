import QRCode from 'qrcode'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import config from '../bot.config.js'
import { logger } from './logger.js'

// ANSI codes manual (sengaja gak nambah dependency chalk/kleur cuma buat warna)
const ansi = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
}

function drawBanner(lines) {
  const width = Math.max(...lines.map((l) => l.length)) + 2
  const top = `╭${'─'.repeat(width + 2)}╮`
  const bottom = `╰${'─'.repeat(width + 2)}╯`
  const body = lines.map((l) => `│ ${l.padEnd(width)} │`).join('\n')
  return `${top}\n${body}\n${bottom}`
}

/**
 * Render QR pairing dengan banner custom di terminal, plus (opsional) simpan
 * sebagai file PNG di `config.qr.imagePath` — berguna kalau lo mau scan dari
 * perangkat lain atau kirim ke tim tanpa akses langsung ke terminal server.
 */
export async function showQr(qr, ttlMs) {
  const seconds = Math.round((ttlMs ?? 60_000) / 1000)

  console.log()
  console.log(
    ansi.cyan +
      ansi.bold +
      drawBanner([
        `${config.botName} — pairing`,
        'WhatsApp → Perangkat tertaut → Tautkan perangkat',
        `Kedaluwarsa dalam ~${seconds} detik`
      ]) +
      ansi.reset
  )
  console.log()

  const terminalQr = await QRCode.toString(qr, {
    type: 'terminal',
    small: config.qr.small
  })
  console.log(terminalQr)

  if (config.qr.saveAsImage) {
    try {
      await mkdir(dirname(config.qr.imagePath), { recursive: true })
      await QRCode.toFile(config.qr.imagePath, qr, { width: 320, margin: 2 })
      console.log(ansi.dim + `📷 QR juga disimpan di: ${config.qr.imagePath}` + ansi.reset)
    } catch (err) {
      logger.warn({ err }, 'Gagal menyimpan QR sebagai gambar')
    }
  }
  console.log()
}
