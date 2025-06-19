import fs from 'fs'

let handler = async (m, { conn, args, command }) => {
  conn.airdrop = conn.airdrop || {}

  let chats = global.db.data.chats
  let users = global.db.data.users

  const validItems = ['chip', 'money', 'limit']

  // 💠 fkontak untuk efek centang biru
  const fkontak = {
    key: {
      fromMe: false,
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast"
    },
    message: {
      contactMessage: {
        displayName: "Herta",
        vcard: `BEGIN:VCARD
VERSION:3.0
N:Herta;;;
FN:Herta
ORG:Herta Project;
TITLE:Powered by Herta - V3
TEL;type=CELL;type=VOICE;waid=0:+0
END:VCARD`
      }
    }
  }

  if (command === 'callairdrop') {
    let [item, jumlahStr, limitStr] = args
    let jumlah = parseInt(jumlahStr)
    let limit = parseInt(limitStr)

    if (!item || isNaN(jumlah) || isNaN(limit)) {
      return m.reply(`❌ Format salah!\n\n*Contoh:* *.callairdrop chip 10 5*\n📦 *Item Tersedia:* ${validItems.join(', ')}`)
    }

    if (!validItems.includes(item)) {
      return m.reply(`❌ Item *${item}* tidak tersedia.\n📦 Item tersedia: ${validItems.join(', ')}`)
    }

    let grupRpg = Object.entries(chats).filter(([_, data]) => data.rpg)
    if (!grupRpg.length) return m.reply("❌ Tidak ada grup RPG yang aktif.")

    m.reply(`🚀 Mengirim AirDrop *${jumlah} ${item.toUpperCase()}* ke ${grupRpg.length} grup (maks. ${limit} klaim)...`)

    for (let [jid, data] of grupRpg) {
      if (conn.airdrop[jid]) continue

      let id = Math.floor(Math.random() * 90000000000)
      let teks = `🎁 *AIRDROP ${item.toUpperCase()}!*\n\n📦 *${jumlah} ${item.toUpperCase()}* tersedia untuk diklaim!\n✋ Klaim dengan *balas pesan ini dan ketik claimairdrop*\n\n⏳ Waktu: 5 Menit\n👥 Maksimal: ${limit} orang\n🆔 ID: ${id}`

      let msg = await conn.sendMessage(jid, {
        video: fs.readFileSync('./media/airdrop.mp4'),
        mimetype: 'video/mp4',
        gifPlayback: true,
        caption: teks,
        fileName: `🎁 AIRDROP ${item.toUpperCase()} 🎁`
      }, { quoted: fkontak }) // ⬅️ fkontak dipakai di sini

      conn.airdrop[jid] = {
        id,
        msg,
        users: [],
        item,
        amount: jumlah,
        limit,
        from: m.sender
      }

      setTimeout(() => {
        conn.sendMessage(jid, {
          delete: {
            remoteJid: jid,
            fromMe: true,
            id: msg.key.id,
            participant: msg.key.participant || undefined
          }
        }).catch(() => { })

        delete conn.airdrop[jid]
      }, 5 * 60 * 1000)

      await delay(3000)
    }
  }
}

handler.command = /^callairdrop$/i
handler.owner = true
export default handler

// 💬 Handler .claimairdrop
handler.before = async (m, { conn }) => {
  conn.airdrop = conn.airdrop || {}
  let users = global.db.data.users

  if (!m.text || m.text.toLowerCase() !== 'claimairdrop') return
  if (!m.quoted) return

  let drop = conn.airdrop[m.chat]
  if (!drop) return
  if (!drop.msg || m.quoted.id !== drop.msg.key.id) return

  for (let chatId in conn.airdrop) {
    let d = conn.airdrop[chatId]
    if (d.users.includes(m.sender)) {
      return m.reply('❌ Kamu sudah klaim AirDrop ini di grup lain. Hanya bisa klaim sekali.')
    }
  }

  if (drop.users.includes(m.sender)) {
    return m.reply('❌ Kamu sudah klaim AirDrop ini.')
  }

  if (drop.users.length >= drop.limit) {
    return m.reply('❌ Batas klaim sudah penuh.')
  }

  drop.users.push(m.sender)
  let user = users[m.sender]
  user[drop.item] = (user[drop.item] || 0) + drop.amount

  m.reply(`🎉 Kamu telah berhasil klaim *${drop.amount} ${drop.item.toUpperCase()}*!`)

  if (drop.users.length >= drop.limit) {
    let list = drop.users.map(u => '@' + u.split('@')[0]).join('\n')
    conn.sendMessage(drop.from, {
      text: `📦 AirDrop *${drop.item.toUpperCase()}* telah diklaim penuh!\n\n📋 *Daftar Pengklaim:*\n${list}`,
      mentions: drop.users
    }, { quoted: drop.msg })

    delete conn.airdrop[m.chat]
  }
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms))
}