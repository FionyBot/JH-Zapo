/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass. 
 * Hargai sebagaimana u mau dihargai.
 * richMessage.js — Builder & reader untuk interactive messages
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

export function readRichReply(message) {
  if (!message) return undefined

  const tpl = message.templateButtonReplyMessage
  if (tpl?.selectedId) {
    return {
      name: 'template_button_reply',
      id: tpl.selectedId,
      raw: { selectedDisplayText: tpl.selectedDisplayText }
    }
  }

  const flow = message.interactiveResponseMessage?.nativeFlowResponseMessage
  if (flow) {
    let params = {}
    try {
      params = flow.paramsJson ? JSON.parse(flow.paramsJson) : {}
    } catch {}
    const id = params.id ?? params.selected_row_id ?? params.row_id ?? ''
    if (id) return { name: flow.name ?? 'native_flow', id, raw: params }
  }

  const btn = message.buttonsResponseMessage
  if (btn?.selectedButtonId) {
    return { name: 'buttons_response', id: btn.selectedButtonId, raw: btn }
  }

  const rowId = message.listResponseMessage?.singleSelectReply?.selectedRowId
  if (rowId) {
    return { name: 'list_response', id: rowId, raw: message.listResponseMessage }
  }

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

      if (params.id && params.display_text === ext.text) {
        return { name: 'quoted_quick_reply', id: params.id, raw: params }
      }

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
