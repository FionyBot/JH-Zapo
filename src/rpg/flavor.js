/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * flavor.js — Narasi bertema Nusantara Wilds (life-simulation tone).
 */

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function fmtSec(total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  if (m && s) return `${m}m ${s}s`
  if (m) return `${m}m`
  return `${s}s`
}

/** Narasi progress rest, sesuai tahap pemulihan - thanks to Nad buat saran ini. */
export function restStage(p) {
  if (p >= 0.75) return 'Aroma teh herbal dari tungku membangunkanmu perlahan. Tubuhmu hampir pulih sepenuhnya.'
  if (p >= 0.5) return 'Kamu tertidur pulas; dalam mimpi, samar terdengar gemericik sungai di lembah.'
  if (p >= 0.25) return 'Napasmu mulai teratur. Pegal di pundak berangsur mengendur.'
  return 'Kamu baru merebahkan diri; api unggun masih berkobar, suara jangkrik mengisi malam.'
}

export const FLAVOR = {
  welcome: [
    '🌱 Kamu terbangun di sebuah desa kecil di tepi rimba Nusantara. Udara pagi beraroma tanah basah, dan jalan setapak membentang ke segala arah. Petualanganmu dimulai.',
    '🌱 Perahu yang membawamu akhirnya bersandar di dermaga kayu. Desa ini kecil, tapi rimbanya luas tanpa ujung. Mulai hari ini, rimba adalah rumah barumu.',
  ],
  tired: [
    '😮‍ Napasmu berat, kakimu gemetar. Tubuhmu menolak diajak masuk ke rimba lagi hari ini.',
    '😮‍💨 Peluh kemarin bahkan belum kering. Kamu butuh istirahat sebelum kembali berpetualang.',
    '😮‍💨 Punggungmu pegal, satchel terasa makin berat. Memaksakan diri hanya akan mencelakakanmu.',
  ],
  startRest: [
    '🛖 Kamu menutup pintu pondok, menyalakan api unggun kecil, dan merebahkan diri di dipan kayu. Rimba bisa menunggu.',
    '🛖 Kamu menyeduh teh daun herbal, menggantung satchel di paku dinding, dan memejamkan mata. Waktu berjalan pelan di sini.',
  ],
  fresh: [
    '✨ Tubuhmu sudah segar bugar — rimba menunggumu, tak ada yang perlu dipulihkan.',
  ],
  hunting: {
    success: [
      'Kamu mengendap-endap di balik semak, menahan napas... akhirnya {item} jatuh juga ke tanganmu!',
      'Jejak di lumpur menuntunmu jauh ke jantung rimba. Setelah lama menunggu, {item} kini tersimpan rapi di satchel.',
      'Panahmu melesat cepat, tepat sasaran. {item} — hasil buruan yang layak dibanggakan di depan tetua desa.',
    ],
    miss: [
      'Kamu mengejar bayangan itu berjam-jam, tapi ia lenyap ditelan kabut. Tanganmu pulang kosong.',
      'Gerimis menghapus jejak buruan. Kamu hanya membawa pulang lumpur di sepatu.',
      'Buruanmu terlalu lincah hari ini. Napas habis, kantung kosong — rimba memang tak pernah berjanji.',
    ],
  },
  foraging: {
    success: [
      'Di antara akar-akar tua, matamu menangkap kilau yang kau cari: {item}.',
      'Kamu memanjat tebing berlumut dengan hati-hati... {item} akhirnya bisa kau petik juga.',
      'Aroma tanah habis hujan menuntunmu ke tempat tersembunyi. {item} masuk ke dalam keranjang.',
    ],
    miss: [
      'Kamu menyisir lembah hingga matahari condong, tapi tanaman yang kau cari tak kunjung ditemukan.',
      'Semak berduri menyambut tanganmu. Keranjangmu masih kosong sore ini.',
      'Kabut turun terlalu cepat, memaksamu pulang sebelum menemukan apa pun.',
    ],
  },
  fishing: {
    success: [
      'Kailmu bergetar hebat — setelah tarikan panjang, {item} mengelepar di permukaan!',
      'Kamu menunggu dengan sabar hingga senja, dan kesabaranmu dibayar: {item}.',
      'Air beriak pelan, lalu senarmu menegang. {item} berhasil kau daratkan ke tepi.',
    ],
    miss: [
      'Umpanmu hanya disentuh arus. Permukaan air tetap tenang hingga malam.',
      'Ikan-ikan seakan bersekongkol hari ini. Kailmu pulang tanpa hasil.',
      'Kamu menunggu berjam-jam, tapi yang kau dapat hanya gigitan kecil yang lepas di ujung senar.',
    ],
  },
}
