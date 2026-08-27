import os from 'node:os'

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const parts = []
  if (d) parts.push(`${d} hari`)
  if (h) parts.push(`${h} jam`)
  parts.push(`${m} mnt ${s % 60} dtk`)
  return parts.join(' ')
}

function fmtBytes(b) {
  const mb = b / 1024 / 1024
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  return `${mb.toFixed(1)} MB`
}

export default {
  name: 'ping',
  aliases: ['pong', 'p'],
  tags: 'general',
  description: 'Cek latensi, runtime & spek server',
  async run(ctx) {
    const latency = Date.now() - (ctx.receivedAt ?? Date.now())
    const mem = process.memoryUsage()
    const cpuModel = os.cpus()[0]?.model?.trim().slice(0, 40) ?? '-'

    await ctx.reply(
      `🏓 *PONG!*\n` +
        `├ ⚡ Latensi: ${latency} ms\n` +
        `├ ⏱ Runtime: ${fmtUptime(process.uptime() * 1000)}\n` +
        `├ 🧠 Memori bot: ${fmtBytes(mem.rss)}\n` +
        `├ 💻 Sistem: ${fmtBytes(os.totalmem() - os.freemem())} / ${fmtBytes(os.totalmem())}\n` +
        `├ 🧮 CPU: ${os.cpus().length} core • ${cpuModel}\n` +
        `└ 🟢 Node ${process.version} • ${os.platform()}/${os.arch()}`
    )
  }
}
