let handler = async function (m, { conn }) {
  if (!m.isGroup) return
  let chat = db.data.chats[m.chat] || {}
  if (!chat.blacklist) chat.blacklist = []

  let sender = m.sender.split('@')[0]

  const isOwner = [
    global.nomorOwner, // pastikan ini string tanpa + (contoh: '628xxxx')
    global.nomorOwner2,
    '6283897550140',
  ].includes(sender)

  if (chat.blacklist.includes(sender)) {
    if (isOwner) return // Jangan kick owner

    try {
      await sleep(1500)

      // Hapus pesan
      if (m.key && m.key.id) {
        await conn.sendMessage(m.chat, { delete: m.key })
      }

      // Kick user
      if (m.isBotAdmin) {
        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
        await conn.sendMessage(m.chat, {
          text: `🚫 Nomor @${sender} diblacklist dan telah dikeluarkan dari grup.`,
          mentions: [m.sender]
        })
      }
    } catch (e) {
      console.error('Gagal auto-kick blacklist:', e)
    }
  }
}

export const before = handler