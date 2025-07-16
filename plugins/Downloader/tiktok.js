import axios from 'axios'

let handler = async (m, { conn, args, text }) => {
  if (!text) throw 'Masukkan URL TikTok!\nContoh: .tiktok https://vt.tiktok.com/ZS...'

  const isGroup = m.chat.endsWith('@g.us')
  const user = m.sender
  const res = await downloadTikTok(text)

  let caption = `🎵 *TikTok Downloader*\n📌 *Judul:* ${res.title}`

  if (res.type === 'video') {
    if (isGroup) {
      await conn.sendMessage(user, {
        video: { url: res.mp4Links[0].href },
        caption,
        mimetype: 'video/mp4'
      }, { quoted: m })

      if (res.mp3Link) {
        await conn.sendMessage(user, {
          audio: { url: res.mp3Link.href },
          mimetype: 'audio/mp4',
          ptt: false
        }, { quoted: m })
      }

      await conn.reply(m.chat, '📤 *Video & Audio berhasil dikirim ke private chat Anda!*', m)

    } else {
      await conn.sendMessage(m.chat, {
        video: { url: res.mp4Links[0].href },
        caption,
        mimetype: 'video/mp4'
      }, { quoted: m })

      if (res.mp3Link) {
        await conn.sendMessage(m.chat, {
          audio: { url: res.mp3Link.href },
          mimetype: 'audio/mp4',
          ptt: false
        }, { quoted: m })
      }
    }

  } else if (res.type === 'image') {
    if (isGroup) {
      for (let i = 0; i < res.images.length; i++) {
        await conn.sendMessage(user, {
          image: { url: res.images[i] },
          caption: i === 0 ? caption : ''
        }, { quoted: m })
      }

      if (res.mp3Link) {
        await conn.sendMessage(user, {
          audio: { url: res.mp3Link.href },
          mimetype: 'audio/mp4',
          ptt: false
        }, { quoted: m })
      }

      await conn.reply(m.chat, '📤 *Foto & Audio berhasil dikirim ke private chat Anda!*', m)

    } else {
      for (let i = 0; i < res.images.length; i++) {
        await conn.sendMessage(m.chat, {
          image: { url: res.images[i] },
          caption: i === 0 ? caption : ''
        }, { quoted: m })
      }

      if (res.mp3Link) {
        await conn.sendMessage(m.chat, {
          audio: { url: res.mp3Link.href },
          mimetype: 'audio/mp4',
          ptt: false
        }, { quoted: m })
      }
    }

  } else {
    throw '❌ Gagal mendeteksi tipe konten TikTok.'
  }
}

handler.command = /^((tiktok|tt)(dl)?)$/i
handler.help = ['tiktok <url>']
handler.tags = ['downloader']
export default handler

// Scraper
async function getTokenAndCookie() {
  const res = await axios.get('https://tmate.cc/id', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })
  const cookie = res.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || ''
  const tokenMatch = res.data.match(/<input[^>]+name="token"[^>]+value="([^"]+)"/i)
  const token = tokenMatch?.[1]
  if (!token) throw new Error('token tidak ditemukan')
  return { token, cookie }
}

async function downloadTikTok(url) {
  const { token, cookie } = await getTokenAndCookie()
  const params = new URLSearchParams()
  params.append('url', url)
  params.append('token', token)

  const res = await axios.post('https://tmate.cc/action', params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://tmate.cc/id',
      'Origin': 'https://tmate.cc',
      'Cookie': cookie
    }
  })

  const html = res.data?.data
  if (!html) throw new Error('Tidak ada data, pastikan URL TikTok valid.')

  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
  const title = titleMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || 'Tanpa Judul'

  const matches = [...html.matchAll(/<a[^>]+href="(https:\/\/[^"]+)"[^>]*>\s*<span>\s*<span>([^<]*)<\/span><\/span><\/a>/gi)]
  const seen = new Set()
  const links = matches
    .map(([_, href, label]) => ({ href, label: label.trim() }))
    .filter(({ href }) => !href.includes('play.google.com') && !seen.has(href) && seen.add(href))

  const mp4Link = links.find(v => /download without watermark/i.test(v.label))
  const mp3Link = links.find(v => /download mp3 audio/i.test(v.label))

  const imageMatches = [...html.matchAll(/<img[^>]+src="(https:\/\/tikcdn\.app\/a\/images\/[^"]+)"/gi)]
  const imageLinks = [...new Set(imageMatches.map(m => m[1]))]

  if (mp4Link) {
    return {
      type: 'video',
      title,
      mp4Links: [mp4Link],
      mp3Link
    }
  }

  if (imageLinks.length > 0) {
    return {
      type: 'image',
      title,
      images: imageLinks,
      mp3Link
    }
  }

  throw new Error('Konten tidak dikenali.')
}