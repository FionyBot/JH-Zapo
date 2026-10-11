/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * werewolf.js — Engine game Werewolf (WW) buat grup WA.
 */

import { onRichReply } from '../handlers/messageHandler.js';

const GAMES = (globalThis.JH_WW_GAMES ??= new Map());

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 20;

const NIGHT_MS = 120_000;
const MIN_NIGHT_MS = 30_000;
const VOTE_MS = 90_000;
const HUNTER_MS = 60_000;
const REMINDER_BEFORE_MS = 30_000;

export const TEAM = {
  warga: { emoji: '🟢', name: 'KUBU WARGA', goal: 'Temukan & habisi SEMUA Werewolf sebelum desa binasa.' },
  wolf: { emoji: '🔴', name: 'KUBU WEREWOLF', goal: 'Habisi warga satu per satu sampai jumlah kubu Werewolf LEBIH BANYAK dari warga yang hidup.' }
};

export const ROLE_INFO = {
  werewolf: {
    team: 'wolf', emoji: '🐺', name: 'Werewolf',
    desc: 'Di siang hari kau wajah ramah di antara warga. Di malam hari... kau lapar.\n\n' +
      '🌙 *Aksi malam:* pilih 1 korban untuk diterkam bersama kawanan.\n' +
      '🎯 *Menang:* jumlah kubu Werewolf LEBIH BANYAK dari warga hidup.'
  },
  sorcerer: {
    team: 'wolf', emoji: '🧙', name: 'Penyihir (Sorcerer)',
    desc: 'Manusia biasa yang menjual jiwanya pada kegelapan. Kau setia pada kawanan, meski taring tak pernah tumbuh di mulutmu.\n\n' +
      '🌙 *Aksi malam:* menerawang 1 orang. Kalau dia Peramal, kau akan tahu PERSIS. Kalau dia role spesial baik lain, kau cuma tahu "ada kekuatan khusus" tanpa tahu persis apa. Kau TIDAK ikut memangsa.\n' +
      '🎯 *Menang:* bersama kubu Werewolf.'
  },
  seer: {
    team: 'warga', emoji: '🔮', name: 'Peramal (Seer)',
    desc: 'Bola kristalmu menembus topeng manusia — kau bisa merasakan niat busuk, walau tak selalu tahu wujud aslinya.\n\n' +
      '🌙 *Aksi malam:* intip 1 orang — hasilnya cuma *pihak BAIK* atau *pihak JAHAT* (Werewolf maupun Penyihir sama-sama kebaca sebagai jahat).\n' +
      '🎯 *Menang:* bersama kubu Warga.'
  },
  doctor: {
    team: 'warga', emoji: '💉', name: 'Dokter (Tabib)',
    desc: 'Ramuan dan tanganmu adalah satu-satunya penghalang antara warga dan maut.\n\n' +
      '🌙 *Aksi malam:* lindungi 1 orang (boleh dirimu sendiri) dari terkaman Werewolf.\n' +
      '🎯 *Menang:* bersama kubu Warga.'
  },
  hunter: {
    team: 'warga', emoji: '🏹', name: 'Pemburu (Hunter)',
    desc: 'Busurmu tak pernah lepas dari punggung. Bahkan di detik terakhir, kau tak akan mati sendirian.\n\n' +
      '💀 *Saat kau tewas* (diterkam / digantung): kau bisa menembak 1 orang untuk dibawa mati bersamamu.\n' +
      '🎯 *Menang:* bersama kubu Warga.'
  },
  villager: {
    team: 'warga', emoji: '👤', name: 'Warga (Villager)',
    desc: 'Tak ada kekuatan, tak ada rahasia — hanya nalar, firasat, dan keberanian menunjuk si pembohong.\n\n' +
      '🗳️ *Senjatamu:* diskusi & voting di siang hari.\n' +
      '🎯 *Menang:* bersama kubu Warga.'
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cut = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fmtSec = (ms) => `${Math.round(ms / 1000)} detik`;
const LINE = '━━━━━━━━━━━━━━━━━━';

const NIGHT_INTRO = [
  (n) => `🌙 ✦ ━━ *MALAM ${n}* ━━ ✦ 🌙\n\n_Lonceng gereja berdentang dua belas kali. Satu per satu lampu padam, pintu dikunci rapat dari dalam..._\n_Namun kunci tak pernah cukup menahan sesuatu yang lahir dari kegelapan._`,
  (n) => `🌑 ✦ ━━ *MALAM ${n}* ━━ ✦ 🌑\n\n_Bulan tertutup awan pekat. Anjing-anjing berhenti menggonggong — seakan mereka tahu, ada yang lebih buas berkeliaran di luar sana._`,
  (n) => `🌒 ✦ ━━ *MALAM ${n}* ━━ ✦ 🌒\n\n_Kabut turun menyapu jalan desa. Di kejauhan, sebuah lolongan panjang menyayat malam... lalu senyap._`,
  (n) => `🕯️ ✦ ━━ *MALAM ${n}* ━━ ✦ 🕯️\n\n_Lilin terakhir mati ditiup angin. Di balik gorden, ada mata yang mengintai. Di balik pintu, ada napas yang tertahan._`
];

const DAWN_INTRO = [
  (n) => `🌅 ✦ ━━ *FAJAR HARI ${n}* ━━ ✦ 🌅\n\n_Cahaya pucat merayap lewat celah jendela. Warga keluar satu per satu, saling menghitung kepala dengan mata was-was..._`,
  (n) => `🌄 ✦ ━━ *FAJAR HARI ${n}* ━━ ✦ 🌄\n\n_Ayam berkokok — tapi tak ada satu pun yang berani bersorak menyambut pagi._`,
  (n) => `🌫️ ✦ ━━ *FAJAR HARI ${n}* ━━ ✦ 🌫️\n\n_Kabut belum pergi. Di alun-alun, warga berkumpul dengan wajah pucat. Semua tahu: malam tadi ada yang tak selamat... atau justru sebaliknya._`
];

const WOLF_KILL = [
  (n) => `💀 *${n}* ditemukan tak bernyawa di depan pintunya — tubuhnya tercabik cakar, jejak lumpur berbentuk telapak buas mengarah ke hutan.`,
  (n) => `💀 Jeritan itu datang dari rumah *${n}*. Saat warga mendobrak masuk, hanya dinding berlumur merah yang menyambut mereka.`,
  (n) => `💀 Pintu rumah *${n}* terbuka lebar diterpa angin. Di dalam... sunyi yang terlalu rapi, dan darah yang belum kering.`,
  (n) => `💀 *${n}* ditemukan di tepi hutan, mata terbelalak menatap langit — seolah melihat sesuatu yang tak seharusnya dilihat manusia.`
];

const QUIET_NIGHT = [
  '_Malam ini terlalu sunyi. Tak ada jeritan, tak ada darah._\n_Justru itu yang paling menakutkan... apa yang sedang mereka rencanakan?_ 🕊️',
  '_Semua bangun dengan selamat. Tapi tak ada yang tersenyum — mereka tahu, kegelapan hanya sedang menahan napas._ 🕊️'
];

const DOCTOR_SAVE = [
  '_Cakar menggores pintu seseorang tengah malam — namun ramuan sang Tabib menahan maut di ambang pintu._\n💉 *Seseorang diserang, tapi selamat!* Tak ada korban malam ini.',
  '_Sesuatu mengendus di depan sebuah rumah, siap menerkam... lalu mundur. Ada tangan penyembuh yang berjaga semalaman._\n💉 *Serangan digagalkan!* Tak ada korban malam ini.'
];

const EXECUTION = [
  (n) => `⚖️ Tali gantungan mengencang. *${n}* menjerit membela diri hingga napas terakhir — lalu diam selamanya.`,
  (n) => `🔥 Obor dilempar ke tumpukan kayu. *${n}* terikat di tiang, bersumpah tak bersalah sementara api melahap segalanya.`,
  (n) => `⚖️ Massa yang murka menyeret *${n}* ke alun-alun. Tak ada ampun, tak ada pembelaan... hanya keheningan setelahnya.`
];

const TIE_TEXT = [
  '_Suara terpecah. Warga saling berteriak, saling tuding — tak ada yang berani menarik tali._\n⚖️ *Tak ada eksekusi hari ini.* Di antara kerumunan, sebuah bayangan tersenyum tipis.',
  '_Alun-alun riuh oleh tuduhan yang saling bertabrakan. Tak ada mayoritas, tak ada keputusan._\n⚖️ *Tak ada yang digantung hari ini.* Matahari mulai turun... dan malam menanti.'
];

const NO_VOTE_TEXT = [
  '_Warga hanya saling menatap dalam bisu — terlalu takut menunjuk, terlalu takut salah._\n⚖️ *Tak ada yang dieksekusi.* Ketakutan itu sendiri sudah menjadi kemenangan bagi kegelapan.'
];

const TENSION_EVEN = [
  '⚠️ _Jumlah kedua kubu kini SEIMBANG. Satu kesalahan vote lagi, dan segalanya bisa berbalik..._',
];
const TENSION_CLOSE = [
  '😰 _Kegelapan semakin dekat menyusul jumlah warga. Waktu tak banyak lagi..._',
];

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

const quickReply = (label, id) => ({
  name: 'quick_reply',
  buttonParamsJson: JSON.stringify({ display_text: cut(label, 20), id })
});

async function dm(client, jid, text) {
  for (let i = 0; i < 2; i++) {
    try {
      await client.message.send(jid, String(text));
      return true;
    } catch {
      await sleep(1500);
    }
  }
  return false;
}

export const getGame = (groupJid) => GAMES.get(groupJid);

export function createGame(groupJid, hostJid, hostName, client) {
  const game = {
    groupJid, hostJid, client,
    phase: 'lobby',
    players: new Map(),
    dayNumber: 0,
    stopped: false
  };
  game.players.set(hostJid, { jid: hostJid, name: hostName, role: null, alive: true });
  GAMES.set(groupJid, game);
  return game;
}

export function joinGame(game, jid, name) {
  if (game.phase !== 'lobby') return 'Game udah jalan, gak bisa join.';
  if (game.players.has(jid)) return 'Kamu udah join.';
  if (game.players.size >= MAX_PLAYERS) return `Lobby penuh (maks ${MAX_PLAYERS} pemain).`;
  game.players.set(jid, { jid, name, role: null, alive: true });
  return null;
}

export function leaveGame(game, jid) {
  if (game.phase !== 'lobby') return 'Game udah jalan, gak bisa keluar.';
  if (!game.players.has(jid)) return 'Kamu belum join.';
  if (jid === game.hostJid) return 'Host gak bisa keluar, pake .ww stop kalo mau bubarin.';
  game.players.delete(jid);
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

const alivePlayers = (game) => [...game.players.values()].filter((p) => p.alive);
const isWolfTeam = (p) => ROLE_INFO[p.role].team === 'wolf';

export function computeRoleList(n) {
  const wolves = Math.max(1, Math.floor(n / 4));
  let remaining = n - wolves;
  const specials = [];
  if (remaining >= 1) specials.push('seer');
  if (remaining >= 2) specials.push('doctor');
  if (remaining >= 3) specials.push('hunter');
  if (n >= 6 && remaining - specials.length >= 1) specials.push('sorcerer');
  remaining -= specials.length;
  return [
    ...Array(wolves).fill('werewolf'),
    ...specials,
    ...Array(Math.max(0, remaining)).fill('villager')
  ];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRoleCard(game, p) {
  const info = ROLE_INFO[p.role];
  const team = TEAM[info.team];
  let text =
    `${LINE}\n${info.emoji} *KAMU ADALAH: ${info.name.toUpperCase()}*\n${LINE}\n\n` +
    `${team.emoji} *${team.name}*\n_${team.goal}_\n\n${info.desc}`;

  if (info.team === 'wolf') {
    const mates = [...game.players.values()]
      .filter((x) => x.jid !== p.jid && isWolfTeam(x))
      .map((x) => `• ${x.name} — ${ROLE_INFO[x.role].emoji} ${ROLE_INFO[x.role].name}`);
    text += `\n\n🩸 *Kawananmu:*\n${mates.length ? mates.join('\n') : '(kau bergerak sendirian)'}`;
  } else {
    text += `\n\n_Kau tak tahu siapa yang bisa dipercaya. Curigai semua orang._`;
  }
  return text;
}

export async function resendRole(game, jid) {
  const p = game.players.get(jid);
  if (!p) return 'Kamu bukan peserta game ini.';
  if (game.phase !== 'running' || !p.role) return 'Game belum dimulai.';
  const ok = await dm(game.client, jid, buildRoleCard(game, p));
  return ok ? null : 'Gagal kirim DM ke kamu.';
}

function askChoice(game, playerJid, targets, promptText, timeoutMs) {
  return new Promise((resolve) => {
    if (!targets.length) return resolve(null);

    const token = `ww:choice:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`;
    const pname = game.players.get(playerJid)?.name || 'pemain';
    let state = 'open';
    let reminder = null;

    const timer = setTimeout(() => {
      if (state !== 'open') return;
      state = 'expired';
      clearTimeout(reminder);
      sendText(game.client, playerJid, '⌛ _Waktumu habis. Kesempatan itu lenyap ditelan gelap..._');
      resolve(null);
    }, timeoutMs);

    if (timeoutMs > REMINDER_BEFORE_MS + 15_000) {
      reminder = setTimeout(() => {
        if (state === 'open') sendText(game.client, playerJid, `⏳ *${fmtSec(REMINDER_BEFORE_MS)} lagi!* Segera tentukan pilihanmu.`);
      }, timeoutMs - REMINDER_BEFORE_MS);
    }

    for (const t of targets) {
      onRichReply(`${token}:${t.jid}`, async (c2) => {
        if (state === 'chosen') return c2.reply('🔒 Pilihanmu sudah final, gak bisa diganti.').catch(() => {});
        if (state === 'expired') return c2.reply('⌛ Waktu aksi sudah habis.').catch(() => {});
        state = 'chosen';
        clearTimeout(timer);
        clearTimeout(reminder);
        resolve(t.jid);
        await c2.reply(`✅ Pilihanmu terkunci: *${t.name}*\n_Tunggu fajar tiba..._`).catch(() => {});
      });
    }

    const buttons = targets.map((t) => quickReply(t.name, `${token}:${t.jid}`));
    const footer = `🐺 Werewolf • ${fmtSec(timeoutMs)}`;

    (async () => {
      for (let i = 0; i < 2; i++) {
        try {
          await sendButtons(game.client, playerJid, promptText, footer, buttons);
          return;
        } catch {
          await sleep(1500);
        }
      }
      if (state !== 'open') return;
      state = 'expired';
      clearTimeout(timer);
      clearTimeout(reminder);
      sendText(game.client, game.groupJid, `⚠️ Bot gagal mengirim DM aksi ke *${pname}*. Aksinya dilewati.`);
      resolve(null);
    })();
  });
}

export async function startGame(game) {
  const players = [...game.players.values()];
  if (players.length < MIN_PLAYERS) return `Minimal ${MIN_PLAYERS} pemain buat mulai.`;

  const roles = shuffle(computeRoleList(players.length));
  shuffle(players).forEach((p, i) => { p.role = roles[i]; p.alive = true; });

  const failed = [];
  await Promise.all(players.map(async (p) => {
    const ok = await dm(game.client, p.jid, buildRoleCard(game, p));
    if (!ok) failed.push(p.name);
  }));

  if (failed.length) {
    players.forEach((p) => { p.role = null; });
    return `Bot gagal ngirim DM role ke: *${failed.join(', ')}*.\nPastikan nomornya valid & gak ngeblok bot, lalu coba *.ww begin* lagi.`;
  }

  game.phase = 'running';
  runGameLoop(game).catch(async (err) => {
    await sendText(game.client, game.groupJid, `⚠️ Game berhenti karena error: ${err.message || err}`);
    stopGame(game.groupJid);
  });
  return null;
}

async function runGameLoop(game) {
  const { client, groupJid } = game;

  const count = {};
  for (const p of game.players.values()) count[p.role] = (count[p.role] || 0) + 1;
  const line = (r) => (count[r] ? `${ROLE_INFO[r].emoji} ${ROLE_INFO[r].name}: ${count[r]}\n` : '');

  await sendText(client, groupJid,
    `🩸 ✦ ━━ *DESA KELAM* ━━ ✦ 🩸\n\n` +
    `_Kabut pekat menelan sebuah desa terpencil. Tiga malam terakhir, lolongan terdengar dari hutan. Pagi ini, warga menemukan jejak cakar di depan pintu — dan bau darah yang belum kering._\n\n` +
    `*Salah satu dari kalian... bukan manusia.*\n\n${LINE}\n` +
    `🟢 *KUBU WARGA* — ${TEAM.warga.goal}\n` +
    line('villager') + line('seer') + line('doctor') + line('hunter') +
    `\n🔴 *KUBU WEREWOLF* — ${TEAM.wolf.goal}\n` +
    line('werewolf') + line('sorcerer') +
    `${LINE}\n\n` +
    `📩 Kartu peran sudah dikirim lewat DM. Lupa role? Ketik *.ww myrole*.\n` +
    `_Malam pertama sebentar lagi tiba..._`
  );
  await sleep(8000);

  while (!game.stopped) {
    game.dayNumber++;

    await sendText(client, groupJid,
      `${pick(NIGHT_INTRO)(game.dayNumber)}\n\n🕯️ Yang punya aksi malam ini, cek DM bot. _(maks ${fmtSec(NIGHT_MS)})_`
    );
    const actions = await collectNightActions(game);
    if (game.stopped) return;
    await resolveNight(game, actions);
    if (game.stopped) return;
    if (await checkEnd(game)) return;
    await announceTension(game);

    await runDay(game);
    if (game.stopped) return;
    if (await checkEnd(game)) return;
    await announceTension(game);
  }
}

async function announceTension(game) {
  const alive = alivePlayers(game);
  const wolfTeam = alive.filter(isWolfTeam).length;
  const wargaTeam = alive.length - wolfTeam;

  await sendText(game.client, game.groupJid,
    `📊 _Sisa yang bertahan: *${wargaTeam} warga* vs *${wolfTeam} kegelapan*._`
  );

  if (wolfTeam === wargaTeam) await sendText(game.client, game.groupJid, pick(TENSION_EVEN));
  else if (wolfTeam === wargaTeam - 1) await sendText(game.client, game.groupJid, pick(TENSION_CLOSE));
}

async function collectNightActions(game) {
  const alive = alivePlayers(game);
  const wolves = alive.filter((p) => p.role === 'werewolf');
  const seer = alive.find((p) => p.role === 'seer');
  const doctor = alive.find((p) => p.role === 'doctor');
  const sorcerer = alive.find((p) => p.role === 'sorcerer');

  const wolfTargets = alive.filter((p) => !isWolfTeam(p));

  const work = Promise.all([
    Promise.all(wolves.map((w) => askChoice(game, w.jid, wolfTargets,
      '🐺 *Malam ini kawananmu lapar.*\nPilih korban yang akan diterkam:', NIGHT_MS))),
    seer
      ? askChoice(game, seer.jid, alive.filter((p) => p.jid !== seer.jid),
        '🔮 *Bola kristalmu berpendar.*\nSiapa yang ingin kau intip alignment-nya (baik/jahat)?', NIGHT_MS)
      : Promise.resolve(null),
    doctor
      ? askChoice(game, doctor.jid, alive,
        '💉 *Tas obatmu sudah siap.*\nSiapa yang akan kau lindungi malam ini?', NIGHT_MS)
      : Promise.resolve(null),
    sorcerer
      ? askChoice(game, sorcerer.jid, alive.filter((p) => p.jid !== sorcerer.jid),
        '🧙 *Mantra terlarang berbisik di telingamu.*\nSiapa yang ingin kau terawang kekuatannya?', NIGHT_MS)
      : Promise.resolve(null)
  ]);

  const [[wolfChoices, seerTarget, doctorTarget, sorcererTarget]] = await Promise.all([work, sleep(MIN_NIGHT_MS)]);

  const tally = new Map();
  for (const t of wolfChoices) if (t) tally.set(t, (tally.get(t) || 0) + 1);
  let killTarget = null;
  if (tally.size) {
    const max = Math.max(...tally.values());
    const top = [...tally.entries()].filter(([, c]) => c === max).map(([j]) => j);
    killTarget = pick(top);
  }

  return { killTarget, seerTarget, doctorTarget, sorcererTarget, seer, sorcerer };
}

async function resolveNight(game, { killTarget, seerTarget, doctorTarget, sorcererTarget, seer, sorcerer }) {
  const { client, groupJid } = game;

  if (seer && seerTarget) {
    const t = game.players.get(seerTarget);
    if (t) {
      const isEvil = isWolfTeam(t);
      await sendText(client, seer.jid,
        isEvil
          ? `🔮 _Kabut di bola kristalmu memerah pekat..._\n*${t.name}* memancarkan aura 🔴 *PIHAK JAHAT!*\n_Kau tak tahu persis wujud aslinya — Werewolf atau sesuatu yang lebih licik — tapi niatnya jelas busuk._`
          : `🔮 _Bola kristalmu berpendar tenang._\n*${t.name}* memancarkan aura 🟢 *PIHAK BAIK.*`
      );
    }
  }

  if (sorcerer && sorcererTarget) {
    const t = game.players.get(sorcererTarget);
    if (t) {
      let text;
      if (t.role === 'seer') {
        text = `🧙 _Mantramu bergema keras — target ini istimewa!_\n*${t.name}* adalah 🔮 *SANG PERAMAL!*\n_Bunuh dia lebih dulu, atau kebenaran akan terbongkar._`;
      } else if (t.role === 'doctor' || t.role === 'hunter') {
        text = `🧙 _Ada kekuatan tersembunyi yang terasa dari tubuhnya..._\n*${t.name}* punya *kekuatan khusus pihak baik* — tapi bukan Peramal.`;
      } else if (isWolfTeam(t)) {
        text = `🧙 _Kau merasakan kehangatan yang sama seperti dirimu..._\n*${t.name}* ternyata bagian dari *kegelapan*, sama sepertimu.`;
      } else {
        text = `🧙 _Mantramu menyentuh kehampaan._\n*${t.name}* hanyalah warga biasa — tak ada apa-apa di baliknya.`;
      }
      await sendText(client, sorcerer.jid, text);
    }
  }

  await sendText(client, groupJid, pick(DAWN_INTRO)(game.dayNumber));
  await sleep(2500);

  if (!killTarget) {
    await sendText(client, groupJid, pick(QUIET_NIGHT));
    return;
  }
  if (killTarget === doctorTarget) {
    await sendText(client, groupJid, pick(DOCTOR_SAVE));
    return;
  }
  const victim = game.players.get(killTarget);
  await applyDeath(game, killTarget, pick(WOLF_KILL)(victim.name));
}

async function applyDeath(game, jid, narration, { byVote = false } = {}) {
  const p = game.players.get(jid);
  if (!p || !p.alive) return;
  p.alive = false;

  const info = ROLE_INFO[p.role];
  const team = TEAM[info.team];

  let reveal = `🪦 _Jasad diperiksa... identitas sejatinya terungkap:_\n${info.emoji} *${info.name}* — ${team.emoji} ${team.name}`;
  if (byVote) {
    reveal += info.team === 'wolf'
      ? `\n\n🐺 _Lolongan terakhir menggema — warga tidak salah menuduh!_`
      : `\n\n🩸 _Darah tak berdosa tertumpah. Tangan kalian kini ternoda... dan si pemangsa masih berkeliaran._`;
  }
  await sendText(game.client, game.groupJid, `${narration}\n\n${reveal}`);

  sendText(game.client, p.jid,
    `💀 *KAMU TELAH TEWAS.*\n_Rohmu melayang di atas desa, menyaksikan segalanya dalam sunyi._\n\n` +
    `🚫 Sebagai arwah, kamu *tidak bisa* voting, memilih aksi, atau membocorkan info apa pun ke pemain yang masih hidup — jangan bahas game di grup ya.\n` +
    `👁️ Kamu tetap boleh menonton sampai akhir.`
  );

  if (p.role === 'hunter') {
    const targets = alivePlayers(game);
    if (!targets.length) return;
    await sleep(1500);
    await sendText(game.client, game.groupJid,
      `🏹 _Dengan napas terakhir, *${p.name}* meraih busurnya. Sang Pemburu tak akan pergi sendirian..._`
    );
    const target = await askChoice(
      game, p.jid, targets,
      '🏹 *Napas terakhirmu.*\nBidik 1 orang untuk dibawa mati bersamamu:',
      HUNTER_MS
    );
    if (target) {
      const t = game.players.get(target);
      await applyDeath(game, target, `🏹 _Anak panah melesat membelah kabut!_ *${t.name}* tumbang, tertembus panah terakhir Sang Pemburu.`);
    } else {
      await sendText(game.client, game.groupJid, `🏹 _Tangan yang gemetar itu tak sempat melepas anak panah. Busur jatuh ke tanah, sunyi._`);
    }
  }
}

async function runDay(game) {
  const { client, groupJid } = game;
  const alive = alivePlayers(game);

  const votes = new Map();
  let closed = false;
  const token = `ww:vote:${groupJid}:${game.dayNumber}`;

  for (const t of alive) {
    onRichReply(`${token}:${t.jid}`, async (c2) => {
      const voter = game.players.get(c2.sender);
      if (!voter) return c2.reply('🚫 Kamu bukan peserta game ini, cukup menonton ya.').catch(() => {});
      if (!voter.alive) return c2.reply('💀 *Arwah tak bisa memilih.*\n_Kamu sudah tewas — cukup saksikan dari alam sana._').catch(() => {});
      if (closed) return c2.reply('⌛ Sidang sudah ditutup.').catch(() => {});
      votes.set(c2.sender, t.jid);
      await c2.react('🗳️').catch(() => {});
    });
  }

  await sendButtons(
    client, groupJid,
    `⚖️ ✦ ━━ *SIDANG WARGA — HARI ${game.dayNumber}* ━━ ✦ ⚖️\n\n` +
    `_Lonceng balai desa berdentang. Warga berkumpul di alun-alun, saling menatap curiga. Seseorang di antara kalian menyembunyikan taring di balik senyum. Tali gantungan sudah disiapkan..._\n\n` +
    `${LINE}\n🕯️ *Masih bernapas (${alive.length}):*\n${alive.map((p) => `• ${p.name}`).join('\n')}\n${LINE}\n\n` +
    `Diskusi, tuduh, bela diri — lalu *tap nama yang kalian curigai*.\n` +
    `Boleh ganti pilihan selama waktu belum habis. Yang sudah tewas tak berhak memilih.\n` +
    `⏳ _${fmtSec(VOTE_MS)}_`,
    '🐺 Werewolf • Sidang Warga',
    alive.map((t) => quickReply(t.name, `${token}:${t.jid}`))
  ).catch(() => {});

  await sleep(VOTE_MS - 20_000);
  if (game.stopped) return;
  await sendText(client, groupJid, '⏳ _Bayangan memanjang di alun-alun..._ *20 detik lagi* sebelum palu diketuk!');
  await sleep(20_000);
  closed = true;
  if (game.stopped) return;

  const tally = new Map();
  for (const target of votes.values()) tally.set(target, (tally.get(target) || 0) + 1);

  if (!tally.size) {
    await sendText(client, groupJid, pick(NO_VOTE_TEXT));
    return;
  }

  const summary = [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([j, c]) => `• ${game.players.get(j).name}: ${c} suara`)
    .join('\n');

  const max = Math.max(...tally.values());
  const top = [...tally.entries()].filter(([, c]) => c === max).map(([j]) => j);

  await sendText(client, groupJid, `📜 *Suara warga:*\n${summary}`);
  await sleep(2000);

  if (top.length > 1) {
    await sendText(client, groupJid, pick(TIE_TEXT));
    return;
  }

  const victim = game.players.get(top[0]);
  await applyDeath(game, top[0], pick(EXECUTION)(victim.name), { byVote: true });
}

async function checkEnd(game) {
  const alive = alivePlayers(game);
  const wolves = alive.filter((p) => p.role === 'werewolf').length;
  const wolfTeam = alive.filter(isWolfTeam).length;
  const wargaTeam = alive.length - wolfTeam;

  let winner = null;
  if (wolves === 0) winner = 'warga';
  else if (wolfTeam > wargaTeam) winner = 'wolf';
  if (!winner) return false;

  const fmt = (team) => [...game.players.values()]
    .filter((p) => ROLE_INFO[p.role].team === team)
    .map((p) => `${p.alive ? '🟢' : '💀'} ${p.name} — ${ROLE_INFO[p.role].emoji} ${ROLE_INFO[p.role].name}`)
    .join('\n');

  const ending = winner === 'warga'
    ? `🌅 ✦ ━━ *FAJAR TERAKHIR* ━━ ✦ 🌅\n\n_Matahari terbit tanpa lolongan. Kabut perlahan sirna, menyingkap desa yang porak-poranda namun bebas dari kutukan._\n\n🟢 *KUBU WARGA MENANG!* Semua Werewolf telah ditumpas.`
    : `🌑 ✦ ━━ *KEGELAPAN MENANG* ━━ ✦ 🌑\n\n_Lolongan bersahutan tanpa perlawanan. Lampu terakhir di desa itu padam, dan tak ada yang tersisa untuk melawan._\n\n🔴 *KUBU WEREWOLF MENANG!* Desa kini milik mereka.\n\n_(Hari ke-${game.dayNumber} — kegelapan akhirnya unggul jumlah)_`;

  await sendText(game.client, game.groupJid,
    `${ending}\n\n${LINE}\n*Identitas sejati:*\n\n🟢 *Kubu Warga*\n${fmt('warga')}\n\n🔴 *Kubu Werewolf*\n${fmt('wolf')}\n${LINE}\n\nGG semua! Main lagi? Ketik *.ww start*`
  );

  stopGame(game.groupJid);
  return true;
}
