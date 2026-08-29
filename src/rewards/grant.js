/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * grant.js — Stub function buat grant reward.
 * Sekarang cuma LOG, belum aktif — siap dipanggil pas RPG ada (soon).
 */
import { logger } from '../../core/logger.js'
import { REWARD_PRESETS } from './schema.js'

/**
 * Grant reward ke user. Sekarang masih STUB (log doang) ya bray.
 * Pas RPG ada, uncomment addReward() dan beautify response-nya.
 *
 * @param {object} client
 * @param {string} chat
 * @param {string} userJid
 * @param {string} gameType
 */
export async function grantReward(client, chat, userJid, gameType) {
  const reward = REWARD_PRESETS[gameType]
  if (!reward) return

  logger.info(
    `💰 [STUB] Grant reward ${gameType} ke ${userJid}: ` +
    `+${reward.gold}G, +${reward.xp}XP, +${reward.gems}💎`
  )

  // Uncomment pas RPG ready:
  // const bal = addReward(userJid, reward)
  // await client.message.send(chat,
  //   `🎁 @${userJid.split('@')[0]} dapat hadiah:\n` +
  //   `💰 +${reward.gold} Gold\n⭐ +${reward.xp} XP\n💎 +${reward.gems} Gems\n\n` +
  //   `Total: ${bal.gold}G / ${bal.xp}XP / ${bal.gems}💎`
  // )
}
