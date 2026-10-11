/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * uno.js — Game UNO Multiplayer di grup. Engine ada di lib/UNOEngine.js.
 * Kode Lama — Rich HTML
 * https://paste.myconan.net/683291-f02af03a.txt
 *
 * Thanks to XN for helping this.
 */
import {
  MIN_PLAYERS, MAX_PLAYERS,
  getGame, createGame, joinGame, leaveGame, beginGame, stopGame, resendHand
} from '../../lib/UNOEngine.js';

const HELP =
  '🎮 ✦ ━━ *UNO MULTIPLAYER* ━━ ✦ 🎮\n\n' +
  '*.uno start* — buka room baru (kamu jadi host)\n' +
  '*.uno join* — gabung room\n' +
  '*.uno leave* — keluar room\n' +
  '*.uno players* — daftar pemain\n' +
  '*.uno begin* — (host) mulai game\n' +
  '*.uno stop* — (host) bubarin game\n' +
  '*.uno hand* — liat ulang kartu kamu lewat DM\n\n' +
  `Minimal ${MIN_PLAYERS} pemain, maksimal ${MAX_PLAYERS}.\n` +
  'Giliran main lewat *tombol di DM bot* — tinggal tap kartu yang mau dikeluarin, atau tap Draw.';

function playerName(ctx) {
  return ctx.pushName || ctx.senderNumber || String(ctx.sender).split('@')[0].split(':')[0];
}

function listPlayers(game) {
  return game.players.map((p, i) => `${i + 1}. ${game.names.get(p)}${p === game.hostJid ? ' 👑' : ''}`).join('\n');
}

export default {
  name: 'uno',
  aliases: ['unogame'],
  tags: 'game',
  description: 'Game UNO Multiplayer di grup',

  async run(ctx) {
    if (!ctx.chat?.endsWith('@g.us')) {
      return ctx.reply('🎮 UNO cuma bisa dimainin di *grup*.');
    }

    const [sub = 'help'] = (ctx.text || '').trim().toLowerCase().split(/\s+/);
    const game = getGame(ctx.chat);

    switch (sub) {
      case 'start': {
        if (game) return ctx.reply('Udah ada room/game UNO di grup ini. *.uno join* buat gabung atau *.uno stop* (host) buat bubarin.');
        const g = createGame(ctx.chat, ctx.sender, playerName(ctx), ctx.client);
        return ctx.reply(
          `🎮 *Room UNO dibuka!* Host: ${playerName(ctx)}\n\n` +
          `Ketik *.uno join* buat gabung (min ${MIN_PLAYERS} pemain).\n` +
          `Kalo udah cukup, host ketik *.uno begin*.\n\n` +
          `Pemain (${g.players.length}):\n${listPlayers(g)}`
        );
      }

      case 'join': {
        if (!game) return ctx.reply('Belum ada room. Ketik *.uno start* dulu.');
        const err = joinGame(game, ctx.sender, playerName(ctx));
        if (err) return ctx.reply(err);
        await ctx.react('✅');
        return ctx.reply(`✅ ${playerName(ctx)} gabung!\n\nPemain (${game.players.length}):\n${listPlayers(game)}`);
      }

      case 'leave': {
        if (!game) return ctx.reply('Belum ada room.');
        const err = leaveGame(game, ctx.sender);
        if (err) return ctx.reply(err);
        return ctx.reply(`👋 ${playerName(ctx)} keluar.\n\nPemain (${game.players.length}):\n${listPlayers(game)}`);
      }

      case 'players':
      case 'list': {
        if (!game) return ctx.reply('Belum ada game di grup ini.');
        const rows = game.players
          .map((p, i) => `${i + 1}. ${game.names.get(p)}${game.phase === 'running' ? ` (${game.hands.get(p)?.length ?? 0} kartu)` : ''}`)
          .join('\n');
        return ctx.reply(`🎮 *Pemain (${game.players.length})* — fase: ${game.phase}\n\n${rows}`);
      }

      case 'hand': {
        if (!game) return ctx.reply('Belum ada game di grup ini.');
        const err = await resendHand(game, ctx.sender);
        if (err) return ctx.reply(err);
        return ctx.react('📩');
      }

      case 'begin': {
        if (!game) return ctx.reply('Belum ada room. Ketik *.uno start* dulu.');
        if (ctx.sender !== game.hostJid) return ctx.reply('Cuma host yang bisa mulai game.');
        if (game.phase !== 'lobby') return ctx.reply('Game udah jalan.');
        if (game.players.length < MIN_PLAYERS) {
          return ctx.reply(`Pemain kurang. Butuh minimal ${MIN_PLAYERS}, sekarang baru ${game.players.length}.`);
        }
        await ctx.react('⏳');
        const err = await beginGame(game);
        if (err) {
          await ctx.react('❎');
          return ctx.reply(err);
        }
        return;
      }

      case 'stop': {
        if (!game) return ctx.reply('Gak ada game di grup ini.');
        if (ctx.sender !== game.hostJid) return ctx.reply('Cuma host yang bisa bubarin game.');
        stopGame(ctx.chat);
        return ctx.reply('🛑 Game UNO dibubarin.');
      }

      default:
        return ctx.reply(HELP);
    }
  }
};