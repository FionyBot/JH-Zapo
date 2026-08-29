/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * flavor.js — Narasi bertema Nusantara Wilds (life-simulation tone).
 * Semua respon game ambil dari sini biar gak klise & gak kosongan.
 * Bebas kau kreasikan lagi bray
 */

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
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
  rest: [
    '🛖 Kamu menyalakan api unggun kecil, merebus teh daun herbal, dan memejamkan mata. Hangat menjalar ke seluruh tubuh.',
    '🛖 Kamu merebahkan diri di pondok kayu, mendengarkan suara jangkrik dan hujan di atap rumbia. Perlahan, tenagamu kembali.',
    '🛖 Kamu duduk di beranda, memandang kabut turun dari punggung gunung. Pikiranmu tenang, tubuhmu pulih.',
  ],
}
