/* 
• Plugins Asci Art
• Info: Hanya tools asci saja, tapi semoga bermanfaat:v
• Source: https://whatsapp.com/channel/0029VakezCJDp2Q68C61RH2C
*/

import axios from 'axios'
import * as cheerio from 'cheerio'
import { writeFileSync } from 'fs'
import path from 'path'

let handler = async (m, { args, text, conn }) => {
  if (!text) return m.reply(`🚫 Masukkan kata kunci!\n\nContoh:\n.ascii naruto`)

  try {
    const res = await axios.get('https://emojicombos.com/anime-text-art', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    const $ = cheerio.load(res.data)
    const results = []

    $('.combo-ctn').each((_, el) => {
      const tags = $(el).find('.keywords a').map((i, tag) => $(tag).text().toLowerCase()).get()
      const match = tags.some(tag => tag.includes(text.toLowerCase()))
      if (match) {
        const art = $(el).find('.emojis').text().trim()
        if (art.length > 10) results.push(art)
      }
    })

    if (results.length === 0)
      return m.reply(`❌ Tidak ada ASCII art yang cocok untuk: *${text}*`)

    const limited = results.slice(0, 10)
    const content = `🎭 Hasil ASCII Art untuk: ${text}\n\n` +
      limited.join('\n\n' + '-'.repeat(40) + '\n\n')

    const filePath = path.resolve('./tmp', `ascii-${Date.now()}.txt`)
    writeFileSync(filePath, content)

    await conn.sendMessage(m.chat, {
      document: { url: filePath },
      fileName: `ascii-${text}.txt`,
      mimetype: 'text/plain',
      caption: `📂 Berhasil ditemukan *${limited.length}* ASCII Art untuk: *${text}*`
    }, { quoted: m })

  } catch (err) {
    console.error(err)
    m.reply('❌ Terjadi kesalahan saat mengambil data.')
  }
}

handler.help = ['ascii <nama>']
handler.tags = ['tools']
handler.command = /^ascii$/i

export default handler