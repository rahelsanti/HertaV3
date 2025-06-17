let handler = async (m, { conn, text, isAdmin }) => {
  if (!m.isGroup) throw 'Hanya bisa digunakan di grup!'
  if (!isAdmin) throw 'Fitur ini hanya untuk admin grup!'

  let number = text.replace(/[^0-9]/g, '').replace(/^0/, '62')
  if (!number || number.length < 8) throw 'Masukkan nomor yang valid.'

  let chat = db.data.chats[m.chat] || {}
  if (!chat.blacklist) chat.blacklist = []

  if (!chat.blacklist.includes(number)) throw 'Nomor tidak ada di daftar blacklist.'

  chat.blacklist = chat.blacklist.filter(n => n !== number)
  db.data.chats[m.chat] = chat

  m.reply(`✅ Nomor *${number}* telah dihapus dari blacklist.`)
}

handler.help = ['unblacklist @user|628xxxx']
handler.tags = ['admin']
handler.command = /^unblacklist$/i
handler.admin = true
handler.group = true

export default handler