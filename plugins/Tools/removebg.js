import axios from 'axios'
import uploadImage from '../../lib/uploadImage.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''

  if (!mime) throw 'Kirim/Reply Gambar Dengan Caption .removebg'
  m.reply('Processing, please wait...')

  let media = await q.download()
  let url = await uploadImage(media)

  const payload = {
    "image_file_b64": "",
    "image_url": `${url}`,
    "size": "auto",
    "type": "auto",
    "type_level": "1",
    "format": "png",
    "roi": "0% 0% 100% 100%",
    "crop": false,
    "crop_margin": "0",
    "scale": "original",
    "position": "original",
    "channels": "rgba",
    "add_shadow": false,
    "semitransparency": true,
    "bg_color": null,
    "bg_image_url": ""
  }

  axios({
    method: "POST",
    url: "https://api.remove.bg/v1.0/removebg",
    data: payload,
    headers: {
      "accept": "application/json",
      "X-API-Key": "q5nmz8R3ghVy2AzJpcZBKLUs",
      "Content-Type": "application/json"
    }
  })
  .then((res) => {
    const buffer = Buffer.from(res.data.data.result_b64, "base64")
    let cap = `Sudah jadi kak >///<`
    conn.sendFile(m.chat, buffer, 'result.png', cap, m)
  })
  .catch((error) => {
    console.error(error)
    m.reply('Gagal memproses gambar. Pastikan API Key valid atau coba lagi nanti.')
  })
}

handler.help = ['removebg']
handler.tags = ['tools']
handler.command = /^removebg$/i
handler.limit = true

export default handler