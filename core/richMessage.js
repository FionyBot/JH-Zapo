/**
 * richMessage.js
 *
 * Builder + reader untuk interactiveMessage + nativeFlowMessage (richMessage),
 * pengganti modern buttonsMessage / listMessage yang dipensiunkan WhatsApp.
 *
 * Referensi bentuk field mengikuti raw Proto.IMessage yang di-decode zapo-js
 * (identik dengan protobuf resmi WhatsApp / konvensi Baileys).
 */

/**
 * Bikin richMessage berisi tombol quick-reply.
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
 * Bikin richMessage berisi list/menu single-select.
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
 * Baca balasan richMessage (tap tombol / pilih list) dari pesan masuk.
 * Menangani SEMUA jalur proto yang diketahui mengirim respons tap:
 *
 *  1. templateButtonReplyMessage  → tap quick_reply di mayoritas klien (Android)
 *  2. interactiveResponseMessage  → nativeFlow modern (single_select & sebagian quick_reply)
 *  3. buttonsResponseMessage      → buttons legacy
 *  4. listResponseMessage         → list legacy
 *  5. extendedTextMessage quoted  → fallback klien yang ngirim tap sebagai teks
 */
export function readRichReply(message) {
  if (!message) return undefined

  // 1) ✅ JALUR UTAMA TAP TOMBOL: field resmi proto WhatsApp.
  //    `id` yang lo set di buttonParamsJson balik lagi lewat `selectedId`.
  const tpl = message.templateButtonReplyMessage
  if (tpl?.selectedId) {
    return {
      name: 'template_button_reply',
      id: tpl.selectedId,
      raw: { selectedDisplayText: tpl.selectedDisplayText }
    }
  }

  // 2) nativeFlow modern (single_select list, quick_reply di sebagian klien)
  const flow = message.interactiveResponseMessage?.nativeFlowResponseMessage
  if (flow) {
    let params = {}
    try {
      params = flow.paramsJson ? JSON.parse(flow.paramsJson) : {}
    } catch {
      // paramsJson bukan JSON valid, biarkan kosong
    }
    const id = params.id ?? params.selected_row_id ?? params.row_id ?? ''
    if (id) return { name: flow.name ?? 'native_flow', id, raw: params }
  }

  // 3) buttons legacy
  const btn = message.buttonsResponseMessage
  if (btn?.selectedButtonId) {
    return { name: 'buttons_response', id: btn.selectedButtonId, raw: btn }
  }

  // 4) list legacy
  const rowId = message.listResponseMessage?.singleSelectReply?.selectedRowId
  if (rowId) {
    return { name: 'list_response', id: rowId, raw: message.listResponseMessage }
  }

  // 5) FALLBACK: klien ngirim tap sebagai TEKS biasa yang nge-quote pesan tombol
  const ext = message.extendedTextMessage
  const quoted = ext?.contextInfo?.quotedMessage
  const interactive =
    quoted?.interactiveMessage ??
    quoted?.viewOnceMessage?.message?.interactiveMessage
  const buttons = interactive?.nativeFlowMessage?.buttons

  if (ext?.text && Array.isArray(buttons)) {
    for (const b of buttons) {
      let params = {}
      try {
        params = JSON.parse(b.buttonParamsJson || '{}')
      } catch {
        continue
      }

      // quick_reply: { display_text, id }
      if (params.id && params.display_text === ext.text) {
        return { name: 'quoted_quick_reply', id: params.id, raw: params }
      }

      // single_select: sections[].rows[]
      for (const section of params.sections ?? []) {
        for (const row of section.rows ?? []) {
          if (
            row.id &&
            (row.title === ext.text || `${row.title}\n${row.description}` === ext.text)
          ) {
            return { name: 'quoted_single_select', id: row.id, raw: row }
          }
        }
      }
    }
  }

  return undefined
}
