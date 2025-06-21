// file: plugins/request.js
import fs from 'fs'
import path from 'path'
import { createCanvas } from 'canvas'

const TMP_PATH = path.resolve('./tmp/request.png')
const toxicWords = ['babi', 'anjing', 'memek', 'kontol', 'tolol', 'ngentot', 'bangsat', 'pepek', 'jembut', 'pantek', 'sex', 'porn', 'bokep', 'jav', '18+', 'hentai', 'kocok']

function containsToxic(text) {
  const lower = text.toLowerCase()
  return toxicWords.some(word => lower.includes(word))
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' '
    const { width } = ctx.measureText(test)
    if (width > maxWidth && i > 0) {
      lines.push(line.trim())
      line = words[i] + ' '
    } else {
      line = test
    }
  }
  lines.push(line.trim())
  return lines
}

async function generateRequestImage(name, message) {
  const width = 800, height = 500
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#f4f4f4'
  ctx.fillRect(0, 0, width, height)

  const cardX = 80, cardY = 80, cardWidth = 640, cardHeight = 340, radius = 30
  ctx.beginPath()
  ctx.moveTo(cardX + radius, cardY)
  ctx.lineTo(cardX + cardWidth - radius, cardY)
  ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + radius)
  ctx.lineTo(cardX + cardWidth, cardY + cardHeight - radius)
  ctx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight, cardX + cardWidth - radius, cardY + cardHeight)
  ctx.lineTo(cardX + radius, cardY + cardHeight)
  ctx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - radius)
  ctx.lineTo(cardX, cardY + radius)
  ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY)
  grad.addColorStop(0, '#f50057')
  grad.addColorStop(1, '#ffa000')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(cardX + radius, cardY)
  ctx.lineTo(cardX + cardWidth - radius, cardY)
  ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + radius)
  ctx.lineTo(cardX + cardWidth, cardY + 90)
  ctx.lineTo(cardX, cardY + 90)
  ctx.lineTo(cardX, cardY + radius)
  ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 32px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`Dari ${name}`, cardX + cardWidth / 2, cardY + 55)

  ctx.fillStyle = '#000'
  ctx.font = 'bold 26px sans-serif'
  const wrapped = wrapText(ctx, message.replace(/[^\w\s.,!?]/g, ''), cardWidth - 60)
  wrapped.slice(0, 4).forEach((line, i) => {
    ctx.fillText(line, cardX + cardWidth / 2, cardY + 140 + i * 40)
  })

  fs.writeFileSync(TMP_PATH, canvas.toBuffer('image/png'))
  return TMP_PATH
}

let handler = async (m, { conn, args, text, command }) => {
  if (!text) return m.reply(`Contoh:\n.${command} Tambahkan fitur daily reward`)
  if (containsToxic(text)) return m.reply('🚫 Request mengandung kata tidak pantas!')
  
  const user = global.db.data.users[m.sender]
  const cooldown = 24 * 60 * 60 * 1000
  if (user.request && new Date - user.request < cooldown)
    return m.reply('⏳ Kamu hanya bisa kirim request setiap 24 jam.')

  const nama = m.pushName || 'User'
  const pengirim = `@${m.sender.split('@')[0]}`
  const image = await generateRequestImage(nama, text)

  const captionOwner = `🛠️ *Request Fitur Baru!*\n\n"${text}"\n\n📩 Dari: ${pengirim}`
  const captionChannel = `📨 *Ada Request Baru Masuk!*\n> Dari: ${nama}\nNomor: ${pengirim}\n\n*Request:* ${text}`

  try {
    await conn.sendMessage('6281401689098@s.whatsapp.net', {
      image: { url: image },
      caption: captionOwner,
      mentions: [m.sender],
      contextInfo: { externalAdReply: {
        title: nama,
        body: 'Request via Bot',
        mediaType: 1,
        thumbnailUrl: 'https://files.catbox.moe/ynxi7b.jpg',
        sourceUrl: 'https://whatsapp.com/channel/0029VafEhDUIXnlyGgMSgH2u'
      } }
    }, { quoted: fkontak(m.sender, conn) })

    await conn.sendMessage('120363416985431454@newsletter', {
      image: { url: image },
      caption: captionChannel,
      mentions: [m.sender],
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363416985431454@newsletter',
          newsletterName: 'Request & Saran'
        },
        externalAdReply: {
          title: 'Request Fitur Baru!',
          body: `Dari: ${nama}`,
          thumbnailUrl: 'https://files.catbox.moe/ynxi7b.jpg',
          mediaType: 1,
          showAdAttribution: true,
          sourceUrl: 'https://whatsapp.com/channel/0029VafEhDUIXnlyGgMSgH2u'
        }
      }
    })

    user.request = +new Date
    await conn.sendMessage(m.chat, {
      text: `✅ Request kamu sudah dikirim ke Owner dan Saluran!\n\n📮 Lihat di:\nhttps://whatsapp.com/channel/0029VbBWeDz4NVitr0jHtN2t`,
      mentions: [m.sender]
    }, { quoted: fkontak(m.sender, conn) })

  } catch (e) {
    console.error(e)
    m.reply('❌ Gagal mengirim request. Coba lagi nanti!')
  }
}

handler.help = ['request', 'req', 'saran']
handler.tags = ['tools']
handler.command = /^req(uest)?|saran$/i
export default handler

// Helper untuk centang biru
function fkontak(jid, conn) {
  const name = conn.getName(jid)
  return {
    key: {
      participants: '0@s.whatsapp.net',
      remoteJid: 'status@broadcast',
      fromMe: false
    },
    message: {
      contactMessage: {
        displayName: name,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;waid=${jid.split('@')[0]}:${jid.split('@')[0]}\nEND:VCARD`
      }
    },
    participant: '0@s.whatsapp.net'
  }
}