/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * ping.js — Cek latensi bot dan resource dasar VPS
 */

import os from 'node:os'
import { readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function fmtUptime(seconds) {
  const s = Math.floor(Number(seconds) || 0)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60

  const parts = []

  if (d) parts.push(`${d} hari`)
  if (h) parts.push(`${h} jam`)
  if (m) parts.push(`${m} mnt`)

  parts.push(`${sec} dtk`)
  return parts.join(' ')
}

function fmtBytes(bytes) {
  const value = Number(bytes) || 0
  const units = ['B', 'KB', 'MB', 'GB', 'TB']

  let size = value
  let index = 0

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function fmtPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`
}

function usageIcon(percent) {
  const value = Number(percent) || 0

  if (value >= 90) return '🔴'
  if (value >= 75) return '🟠'
  if (value >= 50) return '🟡'
  return '🟢'
}

async function getCpuSnapshot() {
  const stat = await readFile('/proc/stat', 'utf8')
  const line = stat.split('\n').find((entry) => /^cpu\s/.test(entry))

  if (!line) throw new Error('CPU stats tidak tersedia')

  const values = line.trim().split(/\s+/).slice(1).map(Number)
  const idle = (values[3] || 0) + (values[4] || 0)
  const total = values.reduce((sum, value) => sum + value, 0)

  return { idle, total }
}

async function getCpuUsage() {
  try {
    const first = await getCpuSnapshot()
    await sleep(1000)
    const second = await getCpuSnapshot()

    const idleDiff = second.idle - first.idle
    const totalDiff = second.total - first.total

    if (totalDiff <= 0 || idleDiff < 0) return null

    const usage = ((totalDiff - idleDiff) / totalDiff) * 100
    return Math.min(100, Math.max(0, usage))
  } catch {
    return null
  }
}

async function getCpuModel() {
  try {
    const cpuInfo = await readFile('/proc/cpuinfo', 'utf8')
    const match = cpuInfo.match(/^(?:model name|Hardware)\s*:\s*(.+)$/mi)
    const model = match?.[1]?.trim()

    if (model && !/^\d+$/.test(model) && model.toLowerCase() !== 'unknown') {
      return model
    }
  } catch {}

  const model = os.cpus()[0]?.model?.trim()

  if (model && !/^\d+$/.test(model) && model.toLowerCase() !== 'unknown') {
    return model
  }

  return 'Model tidak tersedia'
}

async function getDiskUsage() {
  try {
    const { stdout } = await execFileAsync('df', ['-Pk', '/'], {
      timeout: 5000,
      maxBuffer: 1024 * 1024
    })

    const lines = stdout.trim().split('\n')
    const data = lines.at(-1)?.trim().split(/\s+/)

    if (!data || data.length < 5) return null

    const total = Number(data[1]) * 1024
    const used = Number(data[2]) * 1024
    const percent = Number.parseFloat(data[4].replace('%', ''))

    return { total, used, percent }
  } catch {
    return null
  }
}

async function getSwapUsage() {
  try {
    const memInfo = await readFile('/proc/meminfo', 'utf8')
    const totalMatch = memInfo.match(/^SwapTotal:\s+(\d+)\s+kB$/m)
    const freeMatch = memInfo.match(/^SwapFree:\s+(\d+)\s+kB$/m)

    const total = Number(totalMatch?.[1] || 0) * 1024
    const free = Number(freeMatch?.[1] || 0) * 1024
    const used = Math.max(0, total - free)
    const percent = total > 0 ? (used / total) * 100 : 0

    return { total, used, percent }
  } catch {
    return { total: 0, used: 0, percent: 0 }
  }
}

export default {
  name: 'ping',
  aliases: ['pong', 'p'],
  tags: 'general',
  description: 'Cek latensi, runtime, resource VPS, dan spek server',

  async run(ctx) {
    const latency = Date.now() - (ctx.receivedAt ?? Date.now())

    const [cpuUsage, disk, swap, cpuModel] = await Promise.all([
      getCpuUsage(),
      getDiskUsage(),
      getSwapUsage(),
      getCpuModel()
    ])

    const mem = process.memoryUsage()
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory
    const memoryPercent = totalMemory > 0
      ? (usedMemory / totalMemory) * 100
      : 0

    const load = os.loadavg()
    const cpuCount = os.cpus().length || 1
    const loadPerCore = load[0] / cpuCount

    const cpuText = cpuUsage === null
      ? '⚪ Tidak tersedia'
      : `${usageIcon(cpuUsage)} ${fmtPercent(cpuUsage)} • ${cpuCount} core`

    const diskText = disk
      ? `${usageIcon(disk.percent)} ${fmtBytes(disk.used)} / ${fmtBytes(disk.total)} (${fmtPercent(disk.percent)})`
      : '⚪ Tidak tersedia'

    const swapText = swap.total > 0
      ? `${usageIcon(swap.percent)} ${fmtBytes(swap.used)} / ${fmtBytes(swap.total)} (${fmtPercent(swap.percent)})`
      : '⚪ Tidak aktif'

    const warnings = []

    if (cpuUsage !== null && cpuUsage >= 85) warnings.push('CPU tinggi')
    if (memoryPercent >= 85) warnings.push('RAM tinggi')
    if (disk && disk.percent >= 85) warnings.push('Disk hampir penuh')
    if (loadPerCore >= 1) warnings.push('Load tinggi')

    const warningText = warnings.length
      ? `\n\n⚠️ *Warning:* ${warnings.join(', ')}`
      : ''

    await ctx.reply(
      `🏓 *PONG!*\n` +
        `├ ⚡ Latensi: ${latency} ms\n` +
        `├ ⏱️ Runtime bot: ${fmtUptime(process.uptime())}\n` +
        `├ 🖥️ Uptime VPS: ${fmtUptime(os.uptime())}\n` +
        `├ 🧠 Memori bot: ${fmtBytes(mem.rss)} RSS\n` +
        `├ 💻 RAM VPS: ${usageIcon(memoryPercent)} ${fmtBytes(usedMemory)} / ${fmtBytes(totalMemory)} (${fmtPercent(memoryPercent)})\n` +
        `├ 🧮 CPU VPS: ${cpuText}\n` +
        `├ 📈 Load average: ${load.map((value) => value.toFixed(2)).join(' / ')} • ${loadPerCore.toFixed(2)} per core\n` +
        `├ 💾 Disk: ${diskText}\n` +
        `├ 🔁 Swap: ${swapText}\n` +
        `├ 🧩 CPU: ${cpuModel}\n` +
        `└ 🟢 Node ${process.version} • ${os.platform()}/${os.arch()}` +
        warningText
    )
  }
}