/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * evalRunner.js — Eval JS owner
 */
import { createRequire } from 'node:module'
import { format } from 'node:util'

const require = createRequire(import.meta.url)
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

let syntaxerror = null
try {
  syntaxerror = (await import('syntax-error')).default
} catch { /* paket opsional */ }

class CustomArray extends Array {
  constructor(...args) {
    if (typeof args[0] == 'number') return super(Math.min(args[0], 10000))
    else return super(...args)
  }
}

/**
 * @param {string} code
 * @param {{ m: object, conn: object, args?: string[], groupMetadata?: any }} env
 * @param {boolean} asReturn
 */
export async function runEval(code, { m, conn, args = [], groupMetadata = null }, asReturn = false) {
  let _return
  let _syntax = ''
  const _text = (asReturn ? 'return ' : '') + code
  const handler = { name: 'eval' }

  try {
    let i = 15
    const f = { exports: {} }

    const exec = new AsyncFunction(
      'print', 'm', 'handler', 'conn', 'Array', 'process', 'args', 'groupMetadata',
      'require', 'module', 'exports', 'argument',
      _text
    )

    _return = await exec.call(
      conn,
      (...a) => {
        if (--i < 1) return
        console.log(...a)
        return m.reply(format(...a))
      },
      m,
      handler,
      conn,
      CustomArray,
      process,
      args,
      groupMetadata,
      require,
      f,
      f.exports,
      [conn, { m }]
    )
  } catch (e) {
    if (syntaxerror) {
      const err = syntaxerror(_text, 'Execution Function', {
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true,
        sourceType: 'module'
      })
      if (err) _syntax = '```' + err + '```\n\n'
    }
    _return = e
  } finally {
    try {
      await m.reply(_syntax + format(_return))
    } catch { /* abaikan */ }
  }
}
