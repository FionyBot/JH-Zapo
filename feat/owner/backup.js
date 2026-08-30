/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * backup.js — Owner-only: zip seluruh source project pake binary `zip`
 */
import { exec } from 'node:child_process'
import fs from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { logger } from '../../core/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..', '..')

const EXCLUDES = ['node_modules/*', '.git/*', 'logs/*', '*.log', 'session/state.sqlite*', '.env*']

function runShell(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr?.trim() || err.message))
      resolve(stdout)
    })
  })
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatTanggal(d = new Date()) {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  )
}

let isBackingUp = false

export default {
  name: 'backup',
  aliases: ['bak', 'backupbot'],
  tags: 'owner',
  owner: true,
  cooldown: 15_000,
  description: 'Backup seluruh source bot (.zip)',
  async run(ctx) {
    if (isBackingUp) {
      await ctx.reply('⏳ Masih ada proses backup lain yang jalan, tunggu itu kelar dulu ya.')
      return
    }
    isBackingUp = true

    const fileName = `FVerse-${formatTanggal()}.zip`
    const filePath = join(ROOT_DIR, fileName)

    await ctx.react('🗂️').catch(() => {})
    await ctx.reply('📦 Proses backup sedang berlangsung...')

    try {
      const excludeArgs = [...EXCLUDES, fileName].map((p) => `"${p}"`).join(' ')
      await runShell(`zip -r "${fileName}" . -x ${excludeArgs}`, ROOT_DIR)

      const stat = await fs.stat(filePath)
      const sizeMb = (stat.size / 1024 / 1024).toFixed(2)
      const buffer = await fs.readFile(filePath)

      const caption =
        `📦 *Backup — ${fileName}*\n` +
        `└ 💾 ${sizeMb} MB\n\n` +
        `⚠️ Isinya source code + database bot (tanpa node_modules & tanpa sesi login WA). ` +
        `Simpan baik2, jangan diteruskan sembarangan ya, Kak.`

      const target = ctx.sender

      const attempts = [
        { type: 'document', media: buffer, mimetype: 'application/zip', fileName, caption },
        { type: 'document', buffer, mimetype: 'application/zip', fileName, caption },
        { type: 'document', media: buffer, mimetype: 'application/zip', filename: fileName, caption }
      ]

      let sent = false
      let lastErr
      for (const [i, content] of attempts.entries()) {
        try {
          await ctx.client.message.send(target, content)
          logger.info(`📦 Backup terkirim ke ${target}`)
          sent = true
          break
        } catch (err) {
          lastErr = err
          logger.warn({ bentuk: i + 1, err: err.message }, 'Percobaan kirim backup gagal')
        }
      }
      if (!sent) throw lastErr ?? new Error('Gagal kirim file backup')

      await ctx.react('✅').catch(() => {})
      if (ctx.isGroup) {
        await ctx.reply('✅ Backup selesai, udah dikirim ke DM kamu ya (bukan ke grup ini).')
      }
    } catch (err) {
      const msg = String(err.message ?? err)
      logger.error({ err }, '❌ Gagal membuat/mengirim backup')
      await ctx.react('❌').catch(() => {})

      if (/command not found|not recognized|ENOENT/i.test(msg)) {
        await ctx.reply(
          '🗂️ Binary `zip` belum ke-install di server.\n' +
          'Debian/Ubuntu/VPS: `apt install -y zip`\n' +
          'Termux: `pkg install zip`'
        )
      } else {
        await ctx.reply(`😵 Backup gagal: ${msg.slice(0, 150)}`)
      }
    } finally {
      await fs.rm(filePath, { force: true }).catch(() => {})
      isBackingUp = false
    }
  }
}
