/**
 * © JamvanHax0r — Fiony Bot
 * Hapus credit gak bikin u jago dumbass.
 * Hargai sebagaimana u mau dihargai.
 * carousel.js — Sample Carousel Logic on Zapo
 */

const IMAGE_URLS = {
  fiony: 'https://a.top4top.io/p_3911abna00.jpg',
  carmen: 'https://e.top4top.io/p_3911qtk020.jpg',
  nayeon: 'https://f.top4top.io/p_39119uot90.jpg'
}

function buildBusinessNodes(jid) {
  const isGroup = `${jid || ''}`.endsWith('@g.us')
  const bizNode = {
    tag: 'biz',
    attrs: {},
    content: [
      {
        tag: 'interactive',
        attrs: { type: 'native_flow', v: '1' },
        content: [
          { tag: 'native_flow', attrs: { v: '9', name: 'mixed' }, content: [] }
        ]
      }
    ]
  }
  if (isGroup) return [bizNode]
  return [bizNode, { tag: 'bot', attrs: { biz_bot: '1' }, content: [] }]
}

function buildButtons(buttons = []) {
  const out = []
  for (const btn of buttons) {
    if (btn.type === 'url') {
      out.push({
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: btn.displayText,
          url: btn.url,
          merchant_url: btn.url
        })
      })
    } else if (btn.type === 'reply') {
      out.push({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({ display_text: btn.displayText, id: btn.id })
      })
    }
  }
  return out
}

async function buildImageHeader(ctx, imageUrl) {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return null
    const rawBytes = Buffer.from(await res.arrayBuffer())

    const sharp = (await import('sharp')).default
    const jpegBytes = await sharp(rawBytes).jpeg({ quality: 90 }).toBuffer()
    const metadata = await sharp(jpegBytes).metadata()

    const jpegThumbnail = await sharp(jpegBytes)
      .resize(32)
      .jpeg({ quality: 50 })
      .toBuffer()

    const uploaded = await ctx.client.message.upload(jpegBytes, { type: 'image', mimetype: 'image/jpeg' })

    return {
      title: '',
      hasMediaAttachment: true,
      imageMessage: {
        ...uploaded,
        mimetype: 'image/jpeg',
        width: metadata.width,
        height: metadata.height,
        jpegThumbnail
      }
    }
  } catch (e) {
    return null
  }
}

export async function sendCarousel(ctx, { text, cards }) {
  if (!Array.isArray(cards) || cards.length < 2 || cards.length > 25) {
    throw new Error('Carousel butuh minimal 2 dan maksimal 25 card')
  }

  const interactiveCards = []
  for (const card of cards) {
    const header = await buildImageHeader(ctx, card.imageUrl)
    if (!header) continue

    interactiveCards.push({
      header,
      body: card.body ? { text: card.body } : undefined,
      footer: card.footer ? { text: card.footer } : undefined,
      nativeFlowMessage: {
        buttons: buildButtons(card.buttons),
        messageVersion: 1
      }
    })
  }

  if (interactiveCards.length < 2) {
    throw new Error('Terlalu banyak gambar dengan format HEIC/HEIF yang tidak didukung sistem.')
  }

  const content = {
    interactiveMessage: {
      body: { text: text || '' },
      carouselMessage: {
        cards: interactiveCards,
        messageVersion: 1,
        carouselCardType: 0
      }
    }
  }

  return await ctx.client.message.send(ctx.chat, content, {
    customNodes: buildBusinessNodes(ctx.chat)
  })
}

export { IMAGE_URLS }
export default sendCarousel
