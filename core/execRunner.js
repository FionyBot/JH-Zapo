/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * execRunner.js — Logic exec shell command untuk owner (trigger: `$ command`).
 * Sengaja dipisah dari handler biar bisa di-test & dipakai ulang.
 */
import { exec as _exec } from 'node:child_process'
import { promisify, stripVTControlCharacters } from 'node:util'

const exec = promisify(_exec)

/**
 * Run shell command, return { stdout, stderr, error }.
 * @param {string} command - Shell command to run
 */
export async function runExec(command) {
  try {
    const { stdout, stderr } = await exec(command, { maxBuffer: 1024 * 1024 * 10 })
    return {
      stdout: stripVTControlCharacters(stdout).trim(),
      stderr: stripVTControlCharacters(stderr).trim(),
      error: null
    }
  } catch (err) {
    return {
      stdout: err.stdout ? stripVTControlCharacters(err.stdout).trim() : '',
      stderr: err.stderr ? stripVTControlCharacters(err.stderr).trim() : '',
      error: err
    }
  }
}
