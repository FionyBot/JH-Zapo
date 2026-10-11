/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * ww.js — Game Werewolf (WW) khusus grup. Engine ada di lib/werewolf.js.
 */

import {
  MIN_PLAYERS, MAX_PLAYERS, TEAM, ROLE_INFO,
  getGame, createGame, joinGame, leaveGame, startGame, stopGame, resendRole
} from '../../lib/werewolf.js';

const HELP =
  '🐺 ✦ ━━ *WEREWOLF* ━━ ✦ 🐺\n\n' +
  '*.ww start* — buka lobby baru (kamu jadi host)\n' +
  '*.ww join* — gabung lobby\n' +
  '*.ww leave* — keluar lobby\n' +
  '*.ww players* — daftar pemain\n' +
  '*.ww begin* — (host) mulai game\n' +
  '*.ww stop* — (host) bubarin game\n' +
  '*.ww roles* — penjelasan semua role & kubu\n' +
  '*.ww myrole* — kirim ulang role kamu lewat DM\n\n' +
  `Minimal ${MIN_PLAYERS} pemain, maksimal ${MAX_PLAYERS}.\n` +
  'Aksi malam lewat *tombol di DM bot*, sidang siang lewat *tombol di grup*.';

function rolesText() {
  const section = (team) =>
    Object.values(ROLE_INFO)
      .filter((r) => r.team === team)
      .map((r) => `${r.emoji} *${r.name}*\n${r.desc}`)
      .join('\n\n');

  return (
    '📖 ✦ ━━ *DAFTAR ROLE* ━━ ✦ 📖\n\n' +
    `${TEAM.warga.emoji} *${TEAM.warga.name}*\n_${TEAM.warga.goal}_\n\n${section('warga')}\n\n` +
    '━━━━━━━━━━━━━━━━━━\n\n' +
    `${TEAM.wolf.emoji} *${TEAM.wolf.name}*\n_${TEAM.wolf.goal}_\n\n${section('wolf')}\n\n` +
    '_Penyihir baru muncul mulai 6 pemain._\n' +
    '_Peramal cuma baca alignment (Werewolf & Penyihir sama-sama kebaca "jahat"). ' +
    'Penyihir bisa nyium Peramal secara spesifik, tapi role baik lainnya cuma kebaca "ada kekuatan khusus" doang._'
  );
}

function playerName(ctx) {
  return ctx.pushName || ctx.senderNumber || String(ctx.sender).split('@')[0].split(':')[0];
}

function listPlayers(game) {
  return [...game.players.values()].map((p, i) => `${i + 1}. ${p.name}${p.jid === game.hostJid ? ' 👑' : ''}`).join('\n');
}

export default {
  name: 'ww',
  aliases: ['werewolf'],
  tags: 'game',
  description: 'Game Werewolf (WW) di grup',

  async run(ctx) {
    if (!ctx.chat?.endsWith('@g.us')) {
      return ctx.reply('🐺 Werewolf cuma bisa dimainin di *grup*.');
    }

    const [sub = 'help'] = (ctx.text || '').trim().toLowerCase().split(/\s+/);
    const game = getGame(ctx.chat);

    switch (sub) {
      case 'start': {
        if (game) return ctx.reply('Udah ada game/lobby di grup ini. *.ww join* buat gabung atau *.ww stop* (host) buat bubarin.');
        const g = createGame(ctx.chat, ctx.sender, playerName(ctx), ctx.client);
        return ctx.reply(
          `🌑 ✦ ━━ *LOBBY DESA KELAM* ━━ ✦ 🌑\n\n` +
          `_Kabut mulai turun. Siapa yang berani memasuki desa itu?_\n\n` +
          `👑 Host: ${playerName(ctx)}\n` +
          `Ketik *.ww join* buat gabung (min ${MIN_PLAYERS} pemain).\n` +
          `Kalo udah cukup, host ketik *.ww begin*.\n\n` +
          `Pemain (${g.players.size}):\n${listPlayers(g)}`
        );
      }

      case 'join': {
        if (!game) return ctx.reply('Belum ada lobby. Ketik *.ww start* dulu.');
        const err = joinGame(game, ctx.sender, playerName(ctx));
        if (err) return ctx.reply(err);
        await ctx.react('✅');
        return ctx.reply(`🕯️ *${playerName(ctx)}* melangkah masuk ke desa...\n\nPemain (${game.players.size}):\n${listPlayers(game)}`);
      }

      case 'leave': {
        if (!game) return ctx.reply('Belum ada lobby.');
        const err = leaveGame(game, ctx.sender);
        if (err) return ctx.reply(err);
        return ctx.reply(`👣 *${playerName(ctx)}* kabur meninggalkan desa.\n\nPemain (${game.players.size}):\n${listPlayers(game)}`);
      }

      case 'players':
      case 'list': {
        if (!game) return ctx.reply('Belum ada game di grup ini.');
        const rows = [...game.players.values()]
          .map((p, i) => `${i + 1}. ${p.name}${game.phase === 'running' ? (p.alive ? ' 🟢' : ' 💀') : ''}`)
          .join('\n');
        return ctx.reply(`🐺 *Pemain (${game.players.size})* — fase: ${game.phase}\n\n${rows}`);
      }

      case 'roles':
      case 'role':
        return ctx.reply(rolesText());

      case 'myrole': {
        if (!game) return ctx.reply('Belum ada game di grup ini.');
        const err = await resendRole(game, ctx.sender);
        if (err) return ctx.reply(err);
        return ctx.react('📩');
      }

      case 'begin': {
        if (!game) return ctx.reply('Belum ada lobby. Ketik *.ww start* dulu.');
        if (ctx.sender !== game.hostJid) return ctx.reply('Cuma host yang bisa mulai game.');
        if (game.phase !== 'lobby') return ctx.reply('Game udah jalan.');
        if (game.players.size < MIN_PLAYERS) {
          return ctx.reply(`Pemain kurang. Butuh minimal ${MIN_PLAYERS}, sekarang baru ${game.players.size}.`);
        }
        await ctx.react('⏳');
        const err = await startGame(game);
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
        return ctx.reply('🛑 _Kabut menghilang. Desa itu kembali sunyi..._\nGame Werewolf dibubarin.');
      }

      default:
        return ctx.reply(HELP);
    }
  }
};