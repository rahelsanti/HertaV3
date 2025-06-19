import fs from 'fs'

let handler = async (m, { conn, args, command }) => {
  conn.airdrop = conn.airdrop || {}
  conn.airdropQueue = conn.airdropQueue || []

  let chats = global.db.data.chats
  let users = global.db.data.users

  const validItems = ['chip', 'exp', 'limit', 'tbox', 'common', 'uncommon', 'mythic', 'money']

  const fkontak = {
    key: {
      fromMe: false,
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast"
    },
    message: {
      contactMessage: {
        displayName: "Herta",
        vcard: "BEGIN:VCARD\nVERSION:3.0\nN:Herta;;;\nFN:Herta\nORG:Herta Project;\nTITLE:Powered by Herta - V3\nTEL;type=CELL;type=VOICE;waid=0:+0\nEND:VCARD"
      }
    }
  }

  if (command === 'callairdrop') {
    let [item, jumlahStr, limitStr] = args
    let jumlah = parseInt(jumlahStr)
    let limit = parseInt(limitStr)

    if (!item || isNaN(jumlah) || isNaN(limit))
      return m.reply(`❌ Format salah!\nGunakan: *.callairdrop <item> <jumlah> <maks_klaim>*\n\n🧾 Contoh: *.callairdrop chip 10 5*\n\n📦 Item yang tersedia:\n${validItems.map(i => '• ' + i).join('\n')}`)

    if (!validItems.includes(item))
      return m.reply(`❌ Item *${item}* tidak tersedia.\n\n✅ Item yang tersedia:\n${validItems.map(i => '• ' + i).join('\n')}`)

    let grupRpg = Object.entries(chats).filter(([_, data]) => data.rpg)
    if (!grupRpg.length) return m.reply("❌ Tidak ada grup RPG yang aktif.")

    m.reply(`🚀 Mengirim AirDrop *${jumlah} ${item.toUpperCase()}* ke ${grupRpg.length} grup (maks. ${limit} klaim)...`)

    let allDrop = []

    for (let [jid] of grupRpg) {
      if (conn.airdrop[jid]) continue

      let teks = `🎁 *AIRDROP ${item.toUpperCase()}!*\n\n📦 *${jumlah} ${item.toUpperCase()}* tersedia untuk diklaim!\n✋ Klaim dengan *balas pesan ini dan ketik claimairdrop*\n\n⏳ Waktu: 5 Menit\n👥 Maksimal: ${limit} orang`

      let msg = await conn.sendMessage(jid, {
        video: fs.readFileSync('./media/airdrop.mp4'),
        mimetype: 'video/mp4',
        gifPlayback: true,
        caption: teks,
        fileName: `🎁 AIRDROP ${item.toUpperCase()} 🎁`,
      }, { quoted: fkontak })

      conn.airdrop[jid] = {
        msg,
        users: [],
        item,
        amount: jumlah,
        limit,
        from: m.sender
      }

      // simpan data ini untuk penarikan hasil akhir
      allDrop.push(jid)

      await delay(2000)
    }

    // waktu habis semua sekaligus
    setTimeout(async () => {
      let hasil = []
      let semuaUser = []

      for (let jid of allDrop) {
        let drop = conn.airdrop[jid]
        if (!drop) continue

        // hapus pesan di grup
        await conn.sendMessage(jid, {
          delete: {
            remoteJid: jid,
            fromMe: true,
            id: drop.msg.key.id,
            participant: drop.msg.key.participant || undefined
          }
        }).catch(() => { })

        // data pengguna
        if (drop.users.length) {
          hasil.push(...drop.users)
        }

        delete conn.airdrop[jid]
      }

      let uniqueUsers = [...new Set(hasil)]
      let teks

      if (uniqueUsers.length) {
        teks = `📦 AirDrop *${item.toUpperCase()}* telah expired!\n\n📋 *Daftar Pengklaim:*\n${uniqueUsers.map(u => `- @${u.split('@')[0]}`).join('\n')}`
      } else {
        teks = `📦 AirDrop *${item.toUpperCase()}* telah expired!\n\n📋 *Daftar Pengklaim:*\nTidak ada yang klaim.`
      }

      await conn.sendMessage(m.sender, {
        text: teks,
        mentions: uniqueUsers,
        quoted: fkontak
      })

    }, 5 * 60 * 1000)
  }
}

handler.command = /^callairdrop$/i
handler.owner = true
export default handler

function delay(ms) {
  return new Promise(res => setTimeout(res, ms))
}

handler.before = async (m, { conn }) => {
  conn.airdrop = conn.airdrop || {}
  let users = global.db.data.users
  if (!m.text || m.text.toLowerCase() !== 'claimairdrop') return
  if (!m.quoted) return

  let drop = conn.airdrop[m.chat]
  if (!drop || !drop.msg || m.quoted.id !== drop.msg.key.id) return

  for (let chatId in conn.airdrop) {
    let d = conn.airdrop[chatId]
    if (d.users.includes(m.sender)) {
      return m.reply('❌ Kamu sudah klaim AirDrop ini di grup lain. Hanya bisa klaim sekali.')
    }
  }

  if (drop.users.includes(m.sender)) return m.reply('❌ Kamu sudah klaim AirDrop ini.')
  if (drop.users.length >= drop.limit) return m.reply('❌ Batas klaim sudah penuh.')

  drop.users.push(m.sender)
  let user = users[m.sender]
  user[drop.item] = (user[drop.item] || 0) + drop.amount

  m.reply(`🎉 Kamu berhasil klaim *${drop.amount} ${drop.item.toUpperCase()}*!`)
}