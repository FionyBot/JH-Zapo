/**
 * richMessage.js
 *
 * WhatsApp sudah pelan-pelan mempensiunkan `buttonsMessage` / `listMessage` versi lama
 * (yang sekarang cuma jalan penuh di akun WhatsApp Business API resmi). Pengganti
 * modern-nya adalah `interactiveMessage` + `nativeFlowMessage` — sering disebut
 * "richMessage" — yang dipakai WA Web/mobile terbaru untuk quick-reply button
 * maupun list/menu select. Zapo-JS belum punya typed builder untuk ini, jadi kita
 * susun sendiri sebagai raw Proto.IMessage lalu kirim lewat client.message.send().
 *
 * Referensi bentuk paramsJson diverifikasi dari beberapa implementasi komunitas
 * (native_flow: quick_reply & single_select) di ekosistem WhatsApp Web protocol.
 */

/**
 * Bikin richMessage berisi tombol quick-reply (pengganti buttonsMessage lama).
 *
 * @param {object} opts
 * @param {string} opts.text - isi body pesan
 * @param {string} [opts.footer] - teks footer kecil di bawah
 * @param {{ id: string, text: string }[]} opts.buttons - maks ±3 tombol disarankan
 * @returns {import('zapo-js').proto.IMessage}
 */
export function richButtons({ text, footer, buttons }) {
  return {
    interactiveMessage: {
      body: { text },
      footer: footer ? { text: footer } : undefined,
      nativeFlowMessage: {
        messageVersion: 1,
        buttons: buttons.map((btn) => ({
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.id })
        }))
      }
    }
  }
}

/**
 * Bikin richMessage berisi list/menu single-select (pengganti listMessage lama).
 *
 * @param {object} opts
 * @param {string} opts.text - isi body pesan
 * @param {string} [opts.footer] - teks footer kecil di bawah
 * @param {string} opts.title - judul list yang muncul saat dibuka
 * @param {string} opts.buttonText - teks tombol pembuka list, mis. "Lihat menu"
 * @param {{ title: string, rows: { id: string, title: string, description?: string }[] }[]} opts.sections
 * @returns {import('zapo-js').proto.IMessage}
 */
export function richList({ text, footer, title, buttonText, sections }) {
  return {
    interactiveMessage: {
      body: { text },
      footer: footer ? { text: footer } : undefined,
      nativeFlowMessage: {
        messageVersion: 1,
        buttons: [
          {
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title,
              button_text: buttonText,
              sections: sections.map((section) => ({
                title: section.title,
                rows: section.rows.map((row) => ({
                  title: row.title,
                  description: row.description ?? '',
                  id: row.id
                }))
              }))
            })
          }
        ]
      }
    }
  }
}

/**
 * Baca balasan dari richMessage (klik tombol quick_reply atau pilih item single_select).
 * Balasan keduanya masuk sebagai `interactiveResponseMessage.nativeFlowResponseMessage`,
 * dengan `paramsJson` berisi minimal `{ id: '<id yang lo set di atas>' }`.
 *
 * @param {import('zapo-js').proto.IMessage | null | undefined} message
 * @returns {{ name: string, id: string, raw: Record<string, unknown> } | undefined}
 */
export function readRichReply(message) {
  const flow = message?.interactiveResponseMessage?.nativeFlowResponseMessage
  if (!flow) return undefined

  let params = {}
  try {
    params = flow.paramsJson ? JSON.parse(flow.paramsJson) : {}
  } catch {
    // paramsJson tidak valid JSON, biarkan kosong
  }

  return { name: flow.name ?? '', id: params.id ?? '', raw: params }
}
