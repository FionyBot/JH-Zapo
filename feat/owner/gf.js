/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * gf.js — GF (Get Feature): ambil isi file feature/code.
 *
 * [UPDATE BELOW]
 * Mode:
 *  .gf <path>           → kirim sebagai document .js, DITAMBAH tombol
 *                          "📋 Copy Code" (cta_copy) biar gak perlu download
 *                          cuma buat liat/copy isinya.
 *  .gf <path> --txt      → kirim isi file sebagai TEXT inline (chunk 50K char,
 *                          isi chunk murni tanpa prefix biar enak di-copy)
 *  .gf list              → daftar semua file feature di feat/
 *
 * Resolusi path:
 *  - Default root: feat/  →  .gf game/uno = feat/game/uno.js
 *  - Prefix lain di repo juga boleh: lib/, scraper/, core/, handlers/,
 *    src/, app.js, config.js  →  .gf lib/jhrich = lib/jhrich.js
 *  - Extension .js otomatis kalau gak ditulis
 *  - Fallback case-insensitive ( .gf scraper/ig-dl → scraper/IG-DL.js )
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..')

const ROOT_DIRS = ['feat/', 'lib/', 'scraper/', 'core/', 'handlers/', 'src/']
const ROOT_FILES = ['app.js', 'config.js']

const TXT_CHUNK = 50000
const COPY_CHUNK = 50000

function resolveTarget(input) {
  let p = String(input || '').trim().replace(/\\/g, '/').replace(/^\/+/, '')

  if (!p) return null

  if (!p.endsWith('.js')) p += '.js'

  const isRoot =
    ROOT_DIRS.some(dir => p.startsWith(dir)) ||
    ROOT_FILES.includes(p)

  const rel = isRoot ? p : 'feat/' + p

  if (rel.split('/').includes('..')) return null

  const resolved = path.resolve(REPO_ROOT, rel)

  if (!resolved.startsWith(REPO_ROOT + path.sep)) return null

  return {
    rel,
    resolved
  }
}

async function caseFallback(resolved) {
  try {
    const dir = path.dirname(resolved)
    const wanted = path.basename(resolved).toLowerCase()
    const entries = await fs.readdir(dir)
    const match = entries.find(entry => entry.toLowerCase() === wanted)

    return match ? path.join(dir, match) : null
  } catch {
    return null
  }
}

async function listFeatures() {
  const output = []

  async function walk(dir, prefix) {
    const entries = await fs.readdir(dir, {
      withFileTypes: true
    })

    entries.sort((a, b) => a.name.localeCompare(b.name))

    for (const entry of entries) {
      if (entry.isDirectory()) {
        await walk(
          path.join(dir, entry.name),
          prefix + entry.name + '/'
        )
      } else if (entry.name.endsWith('.js')) {
        output.push(
          prefix + entry.name.replace(/\.js$/, '')
        )
      }
    }
  }

  await walk(path.join(REPO_ROOT, 'feat'), '')

  return output
}

async function sendCopyButtons(ctx, text, rel) {
  if (!text) return

  const chunks = []

  for (let i = 0; i < text.length; i += COPY_CHUNK) {
    chunks.push(text.slice(i, i + COPY_CHUNK))
  }

  const buttons = chunks.map((chunk, index) => ({
    name: 'cta_copy',
    buttonParamsJson: JSON.stringify({
      display_text: chunks.length > 1
        ? `📋 Copy (${index + 1}/${chunks.length})`
        : '📋 Copy Code',
      id: `gf:copy:${Date.now()}:${index}`,
      copy_code: chunk
    })
  }))

  try {
    await ctx.client.message.send(ctx.chat, {
      interactiveMessage: {
        body: {
          text: `📋 Tap buat copy isi \`${rel}\` tanpa perlu download file-nya.`
        },
        footer: {
          text: 'GF • Copy Code'
        },
        nativeFlowMessage: {
          buttons,
          messageVersion: 1
        }
      }
    })
  } catch {
  }
}

const HELP =
  '📄 *GF — Get Feature*\n\n' +
  '`.gf <path>` → kirim sebagai document .js + tombol Copy Code\n' +
  '`.gf <path> --txt` → kirim sebagai text inline\n' +
  '`.gf list` → daftar semua feature\n\n' +
  'Contoh:\n' +
  '`.gf game/uno`\n' +
  '`.gf game/uno --txt`\n' +
  '`.gf lib/jhrich` → lib/jhrich.js\n' +
  '`.gf scraper/igdl` → case-insensitive\n\n' +
  'Extension `.js` otomatis kalau gak ditulis.'

export default {
  name: 'gf',
  aliases: ['getfeature', 'getfeat'],
  tags: 'owner',
  owner: true,
  description: 'Ambil isi file feature/code (.gf <path> [--txt] / .gf list)',

  async run(ctx) {
    const tokens = (ctx.text || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)

    const asText = tokens.some(token =>
      token === '--txt' || token === '--text'
    )

    const input = tokens
      .filter(token =>
        token !== '--txt' && token !== '--text'
      )
      .join(' ')

    if (!input) {
      return ctx.reply(HELP)
    }

    if (/^list$/i.test(input)) {
      try {
        const list = await listFeatures()
        const body = list
          .slice(0, 80)
          .map(feature => '• ' + feature)
          .join('\n')

        const more = list.length > 80
          ? `\n\n… +${list.length - 80} lainnya`
          : ''

        return ctx.reply(
          '📚 *FEATURE LIST* (' +
          list.length +
          ')\n\n' +
          body +
          more
        )
      } catch (error) {
        return ctx.reply(
          '❌ Gagal baca daftar feature: ' +
          String(error.message || error).slice(0, 150)
        )
      }
    }

    const target = resolveTarget(input)

    if (!target) {
      return ctx.reply(
        '⚠️ Path tidak valid. Contoh: `.gf game/uno`'
      )
    }

    let filePath = target.resolved
    let buffer = null

    try {
      buffer = await fs.readFile(filePath)
    } catch {
      const alternative = await caseFallback(filePath)

      if (alternative) {
        filePath = alternative

        try {
          buffer = await fs.readFile(filePath)
        } catch {
        }
      }
    }

    if (!buffer) {
      return ctx.reply(
        '⚠️ File tidak ditemukan: `' +
        target.rel +
        '`\nCoba `.gf list` buat liat path yang ada.'
      )
    }

    const relativePath = path
      .relative(REPO_ROOT, filePath)
      .split(path.sep)
      .join('/')

    const shortPath = relativePath
      .replace(/^feat\//, '')
      .replace(/\.js$/, '')

    const text = buffer.toString('utf8')
    const lines = text.split('\n').length

    const info =
      '📏 ' +
      (buffer.length / 1024).toFixed(1) +
      ' KB • ' +
      lines +
      ' baris'

    if (asText) {
      const parts = []

      for (let i = 0; i < text.length; i += TXT_CHUNK) {
        parts.push(text.slice(i, i + TXT_CHUNK))
      }

      try {
        await ctx.reply(
          '📄 `' +
          relativePath +
          '`\n' +
          info +
          ' • mode text' +
          (parts.length > 1
            ? ` (${parts.length} bagian)`
            : '')
        )

        for (const part of parts) {
          await ctx.client.message.send(ctx.chat, part)
        }

        await ctx.react('✅')
      } catch (error) {
        await ctx.react('❎')

        return ctx.reply(
          '❌ Gagal kirim text: ' +
          String(error.message || error).slice(0, 150)
        )
      }

      return
    }

    try {
      await ctx.client.message.send(ctx.chat, {
        type: 'document',
        media: buffer,
        mimetype: 'application/javascript',
        fileName: path.basename(filePath),
        caption:
          '📄 `' +
          relativePath +
          '`\n' +
          info
      })

      await sendCopyButtons(ctx, text, relativePath)
      await ctx.react('✅')
    } catch (error) {
      await ctx.react('❎')

      return ctx.reply(
        '❌ Gagal kirim file: ' +
        String(error.message || error).slice(0, 150)
      )
    }
  }
}