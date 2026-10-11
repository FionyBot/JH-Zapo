/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * UNOEngine.js — Engine game UNO Multiplayer buat grup WA.
 *
 * LOGIC BY JAMVANHAX0R ft. XN — BCCTEAM
 * JANGAN HAPUS CREDIT!
 */
import { onRichReply } from '../handlers/messageHandler.js';

const GAMES = (globalThis.JH_UNO_GAMES ??= new Map());
const IMAGE_CACHE = (globalThis.JH_UNO_IMG_CACHE ??= new Map());

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;

const TURN_MS = 60_000;
const COLOR_MS = 20_000;
const PER_PAGE = 6;

const COLORS = ['red', 'yellow', 'green', 'blue'];
const VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', '+2'];
const COLOR_EMOJI = { red: '🟥', yellow: '🟨', green: '🟩', blue: '🟦' };
const BASE_IMG_URL = 'https://raw.githubusercontent.com/JamvanHax0r/UNO-Cards/main/src/JH-Cards/';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const cut = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
const LINE = '━━━━━━━━━━━━━━━━━━';

function createDeck() {
  const deck = [];
  for (const color of COLORS) {
    deck.push({ color, value: '0' });
    for (const value of VALUES.slice(1)) {
      deck.push({ color, value });
      deck.push({ color, value });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ color: 'wild', value: 'wild' });
    deck.push({ color: 'wild', value: '+4' });
  }
  return deck.sort(() => Math.random() - 0.5);
}

function cardString(card) {
  if (card.color === 'wild') return `⬛ ${card.value.toUpperCase()}`;
  return `${COLOR_EMOJI[card.color]} ${card.value.toUpperCase()}`;
}

function cardImageUrl(card) {
  if (card.color === 'wild') {
    return card.value === '+4' ? `${BASE_IMG_URL}Wild_Draw.png` : `${BASE_IMG_URL}Wild.png`;
  }
  const cMap = { red: 'Red', yellow: 'Yellow', green: 'Green', blue: 'Blue' };
  let val = card.value;
  if (val === '+2') val = 'Draw';
  else if (val === 'reverse') val = 'Reverse';
  else if (val === 'skip') val = 'Skip';
  return `${BASE_IMG_URL}${cMap[card.color]}_${val}.png`;
}

async function loadCardImage(card) {
  const url = cardImageUrl(card);
  if (IMAGE_CACHE.has(url)) return IMAGE_CACHE.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal load gambar kartu: HTTP ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  IMAGE_CACHE.set(url, buf);
  return buf;
}

function isValid(card, discard, currentColor) {
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === discard.value) return true;
  return false;
}

function sendText(client, jid, text) {
  return client.message.send(jid, String(text)).catch(() => {});
}

function sendButtons(client, jid, text, footer, buttons) {
  return client.message.send(jid, {
    interactiveMessage: {
      body: { text },
      footer: { text: footer },
      nativeFlowMessage: { buttons, messageVersion: 1 }
    }
  });
}

async function sendBoardImage(client, jid, card, caption) {
  const buf = await loadCardImage(card);
  await client.message.send(jid, { type: 'image', media: buf, mimetype: 'image/png', caption });
}

const quickReply = (label, id) => ({
  name: 'quick_reply',
  buttonParamsJson: JSON.stringify({ display_text: cut(label, 20), id })
});

function handListText(hand, { excludeIndex } = {}) {
  return hand
    .map((c, i) => c)
    .filter((_, i) => i !== excludeIndex)
    .map((c) => `• ${cardString(c)}`)
    .join('\n') || '_(kosong)_';
}

export const getGame = (groupJid) => GAMES.get(groupJid);

export function createGame(groupJid, hostJid, hostName, client) {
  const game = {
    groupJid, hostJid, client,
    phase: 'lobby',
    players: [hostJid],
    names: new Map([[hostJid, hostName]]),
    hands: new Map(),
    deck: [], discard: null, currentColor: '',
    turn: 0, direction: 1, drawStack: 0,
    stopped: false
  };
  GAMES.set(groupJid, game);
  return game;
}

export function joinGame(game, jid, name) {
  if (game.phase !== 'lobby') return 'Game udah jalan, gak bisa join.';
  if (game.players.includes(jid)) return 'Kamu udah join.';
  if (game.players.length >= MAX_PLAYERS) return `Room penuh (maks ${MAX_PLAYERS} pemain).`;
  game.players.push(jid);
  game.names.set(jid, name);
  return null;
}

export function leaveGame(game, jid) {
  if (game.phase !== 'lobby') return 'Game udah jalan, gak bisa keluar.';
  if (!game.players.includes(jid)) return 'Kamu belum join.';
  if (jid === game.hostJid) return 'Host gak bisa keluar, pake .uno stop kalo mau bubarin.';
  game.players = game.players.filter((p) => p !== jid);
  return null;
}

export function stopGame(groupJid) {
  const game = GAMES.get(groupJid);
  if (game) {
    game.stopped = true;
    game.phase = 'ended';
    GAMES.delete(groupJid);
  }
}

function nextIndex(game, step = 1) {
  let n = (game.turn + step * game.direction) % game.players.length;
  if (n < 0) n += game.players.length;
  return n;
}
function advanceTurn(game, step = 1) {
  game.turn = nextIndex(game, step);
}

function drawCards(game, jid, count) {
  const hand = game.hands.get(jid);
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (game.deck.length < 5) game.deck.push(...createDeck());
    const c = game.deck.pop();
    hand.push(c);
    drawn.push(c);
  }
  return drawn;
}

async function notifyDraw(game, jid, drawn, reason) {
  const hand = game.hands.get(jid);
  const drawnStr = drawn.map((c) => cardString(c)).join(', ');
  const text =
    `🃏 ${reason}\nKartu yang kamu dapet: *${drawnStr}*\n\n` +
    `${LINE}\n*Kartu kamu sekarang (${hand.length}):*\n${handListText(hand)}`;
  await sendText(game.client, jid, text);
}

export async function resendHand(game, jid) {
  if (!game.players.includes(jid)) return 'Kamu bukan peserta game ini.';
  if (game.phase !== 'running') return 'Game belum dimulai.';
  const hand = game.hands.get(jid) || [];
  const text =
    `🃏 *Kartu kamu (${hand.length}):*\n${handListText(hand)}\n\n` +
    `${LINE}\nTumpukan: ${cardString(game.discard)}\nWarna: ${game.currentColor.toUpperCase()}`;
  const ok = await sendText(game.client, jid, text);
  return ok !== false ? null : 'Gagal kirim DM ke kamu.';
}

export async function beginGame(game) {
  if (game.players.length < MIN_PLAYERS) return `Minimal ${MIN_PLAYERS} pemain buat mulai.`;

  game.deck = createDeck();
  game.drawStack = 0;
  for (const p of game.players) {
    game.hands.set(p, []);
  }
  for (const p of game.players) {
    drawCards(game, p, 7);
  }

  let first;
  do {
    first = game.deck.pop();
    if (first.color === 'wild' || ['skip', 'reverse', '+2'].includes(first.value)) {
      game.deck.unshift(first);
    }
  } while (first.color === 'wild' || ['skip', 'reverse', '+2'].includes(first.value));
  game.discard = first;
  game.currentColor = first.color;
  game.turn = 0;

  await Promise.all(game.players.map((p) => resendHand(game, p)));

  game.phase = 'running';
  runGameLoop(game).catch(async (err) => {
    await sendText(game.client, game.groupJid, `⚠️ Game berhenti karena error: ${err.message || err}`);
    stopGame(game.groupJid);
  });
  return null;
}

async function runGameLoop(game) {
  const { client, groupJid } = game;
  const roster = game.players.map((p, i) => `${i + 1}. ${game.names.get(p)}`).join('\n');

  await sendText(client, groupJid,
    `🎮 ✦ ━━ *UNO MULTIPLAYER DIMULAI!* ━━ ✦ 🎮\n\n` +
    `Pemain (${game.players.length}):\n${roster}\n\n` +
    `📩 Kartu awal udah dikirim ke DM masing-masing.\n⏱️ ${TURN_MS / 1000} detik per giliran, kelamaan = auto-draw!`
  );
  await sleep(1500);

  while (!game.stopped) {
    const currentJid = game.players[game.turn];
    const announce = `Giliran *${game.names.get(currentJid)}* (${game.hands.get(currentJid).length} kartu)\nWarna: *${game.currentColor.toUpperCase()}*${game.drawStack > 0 ? `\n🔥 Stack aktif: +${game.drawStack}!` : ''}`;
    await sendBoardImage(client, groupJid, game.discard, announce).catch(() => sendText(client, groupJid, announce));

    const action = await promptTurn(game, currentJid);
    if (game.stopped) return;

    const resultMsg = await applyAction(game, currentJid, action);
    if (game.stopped) return;

    const hand = game.hands.get(currentJid);
    if (hand.length === 0) {
      await sendBoardImage(client, groupJid, game.discard,
        `${resultMsg}\n\n🎉 *UNO! ${game.names.get(currentJid)} MENANG!* 🎉\nGG semua, main lagi? *.uno start*`
      ).catch(() => {});
      stopGame(groupJid);
      return;
    }

    await sendText(client, groupJid, resultMsg);
    if (hand.length === 1) {
      await sendText(client, groupJid, `⚠️ *UNO!* ${game.names.get(currentJid)} sisa 1 kartu!`);
    }
  }
}

function promptTurn(game, playerJid) {
  return new Promise((resolve) => {
    const hand = game.hands.get(playerJid);
    const playable = hand
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => (game.drawStack > 0 ? c.value === game.discard.value : isValid(c, game.discard, game.currentColor)));

    const token = `uno:turn:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`;
    let state = 'open';
    let page = 0;
    const totalPages = Math.max(1, Math.ceil(playable.length / PER_PAGE));

    const timer = setTimeout(() => {
      if (state !== 'open') return;
      state = 'expired';
      resolve({ type: 'timeout' });
    }, TURN_MS);

    const finish = (action) => {
      if (state !== 'open') return false;
      state = 'done';
      clearTimeout(timer);
      resolve(action);
      return true;
    };

    async function sendPage(p) {
      page = p;
      const slice = playable.slice(p * PER_PAGE, p * PER_PAGE + PER_PAGE);

      const buttons = slice.map(({ c, i }) =>
        quickReply(cardString(c), `${token}:play:${i}`)
      );
      buttons.push(quickReply('🃏 Draw', `${token}:draw`));
      if (p > 0) buttons.push(quickReply('◀ Prev', `${token}:page:${p - 1}`));
      if (p < totalPages - 1) buttons.push(quickReply('Next ▶', `${token}:page:${p + 1}`));

      slice.forEach(({ c, i }) => {
        onRichReply(`${token}:play:${i}`, async (c2) => {
          if (state !== 'open') return c2.reply('⌛ Giliran ini udah lewat.').catch(() => {});
          if (c.color === 'wild') {
            const chosenColor = await askColor(game, playerJid, i);
            if (!finish({ type: 'play', cardIndex: i, chosenColor })) return;
            await c2.reply(`✅ Kamu keluarin *${cardString(c)}*, warna baru: ${COLOR_EMOJI[chosenColor]} ${chosenColor.toUpperCase()}`).catch(() => {});
          } else {
            if (!finish({ type: 'play', cardIndex: i })) return;
            await c2.reply(`✅ Kamu keluarin *${cardString(c)}*`).catch(() => {});
          }
        });
      });

      onRichReply(`${token}:draw`, async (c2) => {
        if (!finish({ type: 'draw' })) return c2.reply('⌛ Giliran ini udah lewat.').catch(() => {});
        await c2.reply('🃏 Kamu ambil kartu dari tumpukan.').catch(() => {});
      });

      if (p > 0) onRichReply(`${token}:page:${p - 1}`, async () => { if (state === 'open') await sendPage(p - 1); });
      if (p < totalPages - 1) onRichReply(`${token}:page:${p + 1}`, async () => { if (state === 'open') await sendPage(p + 1); });

      const header =
        `🎮 *GILIRAN KAMU!*\n\n` +
        `Tumpukan: ${cardString(game.discard)}\nWarna: *${game.currentColor.toUpperCase()}*` +
        (game.drawStack > 0 ? `\n🔥 Stack +${game.drawStack}! Cuma bisa numpuk kartu sejenis atau Draw.` : '') +
        `\n\n📄 Halaman ${p + 1}/${totalPages}` +
        (playable.length === 0 ? '\n\n_Gak ada kartu yang bisa dimainin, tap Draw._' : '');

      try {
        await sendButtons(game.client, playerJid, header, `UNO • ${TURN_MS / 1000} detik`, buttons);
      } catch {
        if (finish({ type: 'timeout' })) {
          await sendText(game.client, game.groupJid, `⚠️ Bot gagal DM giliran ke *${game.names.get(playerJid)}*. Gilirannya di-skip (auto-draw).`);
        }
      }
    }

    sendPage(0);
  });
}

function askColor(game, playerJid, excludeIndex) {
  return new Promise((resolve) => {
    const token = `uno:color:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`;
    let settled = false;
    const hand = game.hands.get(playerJid);

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(pick(COLORS));
    }, COLOR_MS);

    const buttons = COLORS.map((c) => quickReply(`${COLOR_EMOJI[c]} ${c}`, `${token}:${c}`));
    COLORS.forEach((c) => {
      onRichReply(`${token}:${c}`, async () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(c);
      });
    });

    const body =
      `*Sisa kartu kamu setelah ini (${hand.length - 1}):*\n${handListText(hand, { excludeIndex })}\n\n` +
      `${LINE}\n🌈 *Pilih warna baru buat kartu wild-mu:*`;

    sendButtons(game.client, playerJid, body, `UNO • ${COLOR_MS / 1000} detik`, buttons)
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(pick(COLORS));
      });
  });
}

async function applyAction(game, playerJid, action) {
  const name = game.names.get(playerJid);
  const hand = game.hands.get(playerJid);

  if (action.type === 'timeout') {
    if (game.drawStack > 0) {
      const total = game.drawStack;
      const drawn = drawCards(game, playerJid, total);
      game.drawStack = 0;
      advanceTurn(game, 1);
      await notifyDraw(game, playerJid, drawn, `Waktu habis pas kena stack — dihukum nyedot ${total} kartu!`);
      return `⏳ *WAKTU HABIS!* ${name} ketiduran pas kena stack — dihukum nyedot ${total} kartu & giliran di-skip! 🤣`;
    }
    const drawn = drawCards(game, playerJid, 1);
    advanceTurn(game, 1);
    await notifyDraw(game, playerJid, drawn, 'Waktu habis — dihukum nyedot 1 kartu!');
    return `⏳ *WAKTU HABIS!* ${name} kelamaan mikir — dihukum nyedot 1 kartu & giliran di-skip!`;
  }

  if (action.type === 'draw') {
    if (game.drawStack > 0) {
      const total = game.drawStack;
      const drawn = drawCards(game, playerJid, total);
      game.drawStack = 0;
      advanceTurn(game, 1);
      await notifyDraw(game, playerJid, drawn, `Kamu nyerah nahan stack, nyedot ${total} kartu sekaligus.`);
      return `🃏 ${name} nyerah nahan stack, nyedot ${total} kartu sekaligus & giliran di-skip!`;
    }
    const drawn = drawCards(game, playerJid, 1);
    advanceTurn(game, 1);
    await notifyDraw(game, playerJid, drawn, 'Kamu ambil kartu dari tumpukan.');
    return `🃏 ${name} ngambil kartu dari tumpukan & giliran di-skip!`;
  }

  const card = hand[action.cardIndex];
  hand.splice(action.cardIndex, 1);
  game.discard = card;
  game.currentColor = card.color === 'wild' ? action.chosenColor : card.color;

  let msg = `🎴 ${name} ngeluarin kartu *${cardString(card)}*`;
  const isWin = hand.length === 0;

  if (card.color === 'wild') {
    msg += ` → warna baru: ${COLOR_EMOJI[action.chosenColor]} ${action.chosenColor.toUpperCase()}`;
  }

  if (card.value === 'skip') {
    const skipped = game.players[nextIndex(game, 1)];
    msg += `\n⏭️ *${game.names.get(skipped)}* di-skip gilirannya!`;
    advanceTurn(game, 2);
  } else if (card.value === 'reverse') {
    game.direction *= -1;
    msg += `\n🔄 Arah permainan dibalik!`;
    advanceTurn(game, game.players.length === 2 ? 2 : 1);
  } else if (card.value === '+2' || card.value === '+4') {
    game.drawStack += card.value === '+4' ? 4 : 2;
    const nextJid = game.players[nextIndex(game, 1)];
    const nextHand = game.hands.get(nextJid);
    const canStack = !isWin && nextHand.some((c) => c.value === card.value);

    if (canStack) {
      msg += `\n\n🔥 *STACK!* ${game.names.get(nextJid)} kena ancaman +${game.drawStack}! Buruan tumpuk kartu sejenis atau Draw.`;
      advanceTurn(game, 1);
    } else {
      const total = game.drawStack;
      const drawn = drawCards(game, nextJid, total);
      msg += `\n\n💥 ${game.names.get(nextJid)} gak punya kartu sejenis, nyedot ${total} kartu & di-skip!`;
      game.drawStack = 0;
      advanceTurn(game, 2);
      await notifyDraw(game, nextJid, drawn, `Kena stack dari ${name}, kamu dipaksa nyedot ${total} kartu!`);
    }
  } else {
    advanceTurn(game, 1);
  }

  return msg;
}
