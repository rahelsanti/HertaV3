import fetch from 'node-fetch'

let handler = m => m

handler.before = async function (m, { conn }) {
  // Hanya tanggapi jika di grup dan bot di-tag
  if (!m.isGroup || !m.mentionedJid?.includes(conn.user.jid)) return

  // Delay 3 detik agar tidak spam
  await new Promise(resolve => setTimeout(resolve, 1500))

  const stickerUrl = 'https://files.catbox.moe/ssmtr1.webp'

  // Ambil buffer dari URL stiker
  const res = await fetch(stickerUrl)
  if (!res.ok) throw 'Gagal mengambil stiker'
  const buffer = await res.buffer()

  // Kirim stiker sebagai balasan terhadap pesan tag
  await conn.sendMessage(m.chat, {
    sticker: buffer,
    quoted: m
  })
}

export default handler