/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * qrHandler.js — QR auth flow: banner custom + render terminal + simpan PNG.
 */
import qrcode from 'qrcode'
import fs from 'node:fs'
import config from '../config.js'
import { logger } from '../core/logger.js'

const QR = config.qr ?? { small: true, saveAsImage: true, imagePath: './session/qr.png' }

function banner() {
  const title = ` ${config.botName} — scan QR buat pairing `
  const line = '═'.repeat(title.length + 2)
  return `\n╔${line}╗\n║${title}║\n╚${line}╝\n`
}

export function setupQR(client) {
  client.on('auth_qr', async ({ qr, ttlMs }) => {
    console.log(banner())

    try {
      const term = await qrcode.toString(qr, { type: 'terminal', small: QR.small !== false })
      console.log(term)
    } catch (err) {
      logger.warn({ err: err.message }, 'Gagal render QR di terminal')
    }

    if (QR.saveAsImage !== false) {
      try {
        const path = QR.imagePath ?? './session/qr.png'
        const dir = path.slice(0, path.lastIndexOf('/') + 1)
        if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        await qrcode.toFile(path, qr, { width: 512 })
        logger.info(`🖼️  QR disimpan di ${path}`)
      } catch (err) {
        logger.warn({ err: err.message }, 'Gagal simpan QR PNG')
      }
    }

    logger.info(`⏳ QR berlaku ${Math.round(ttlMs / 1000)} detik — scan dari WhatsApp → Perangkat tertaut`)
  })

  client.on('auth_paired', ({ credentials }) => {
    logger.success(`✅ Pairing berhasil sebagai ${credentials.meJid}`)
    logger.success('✅ Bot berjalan. Ctrl+C buat berhenti.')
  })
}
