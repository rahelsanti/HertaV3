import fs from 'fs'

const COOLDOWN = 60 * 60 * 1000
const MINE_TIME = 5 * 60 * 1000

const TOOL_BONUSES = {
  pickaxe: 0.00039581,
  drill: 0.00206932,
  robot: 0.00850492
}

const PRICES = {
  pickaxe: 1000000,
  drill: 5000000,
  robot: 10000000
}

const thumbnailUrl = 'https://pomf2.lain.la/f/kp2x0axf.jpg'

function fkontak(conn, m) {
  let sender = m.sender.split('@')[0]
  return {
    key: {
      participant: '0@s.whatsapp.net',
      remoteJid: 'status@broadcast',
      fromMe: false,
      id: 'HERTADROP'
    },
    message: {
      contactMessage: {
        displayName: 'Herta',
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Herta;;;\nFN:Herta\nORG:Herta Project;\nTITLE:Powered by Herta - V3\nTEL;waid=${sender}:${sender}\nEND:VCARD`
      }
    },
    participant: '0@s.whatsapp.net'
  }
}

const sendMessageWithSkyid = async (message, m, conn) => {
  const skyid = {
    text: message.trim(),
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: `ᴍɪɴɪɴɢ ʙɪᴛᴄᴏɪɴ [ʀᴘɢ]`,
        thumbnailUrl: thumbnailUrl,
        sourceUrl: `https://whatsapp.com/channel/0029VafEhDUIXnlyGgMSgH2u`,
        mediaType: 1,
        renderLargerThumbnail: true,
      },
    },
  }
  await conn.sendMessage(m.chat, skyid, { quoted: fkontak(conn, m) })
}

const calculateCooldown = (lastTime) => {
  const remainingTime = COOLDOWN - (Date.now() - lastTime)
  const minutes = Math.floor(remainingTime / 60000)
  const seconds = Math.floor((remainingTime % 60000) / 1000)
  return { minutes, seconds }
}

const calculateCoinEarned = (user) => {
  let coinEarned = 0
  coinEarned += user.pickaxemine * TOOL_BONUSES.pickaxe
  coinEarned += user.drillmine * TOOL_BONUSES.drill
  coinEarned += user.robotmine * TOOL_BONUSES.robot
  return coinEarned
}

const handler = async (m, { command, conn }) => {
  const user = global.db.data.users[m.sender]
  const currentTime = Date.now()

  try {
    if (command === 'minecoin') {
      const type = m.text.split(' ')[1]?.toLowerCase() || ''

      switch (type) {
        case '':
          await sendMessageWithSkyid(`
💎 *Selamat datang di MiningCoin!* 💎
⛏️ *!minecoin start* - Mulai mining, tunggu 5 menit untuk hasil.
📊 *!minecoin stats* - Melihat Progres mining.
🔍 *!minecoin check* - Cek alat & BTC yang didapat per mining.
🛒 *!minecoin shop* - Lihat alat untuk meningkatkan hasil mining.
🛠️ *!minecoin buy [item]* - Beli alat untuk mining. Pilihan: *pickaxe*, *drill*, *robot*.
          `, m, conn)
          break

        case 'start':
          if (!user.pickaxemine && !user.drillmine && !user.robotmine)
            return m.reply("❗ Kamu tidak memiliki alat. Silakan beli di *!minecoin shop*.")

          if (currentTime - user.lastmine < COOLDOWN) {
            const { minutes, seconds } = calculateCooldown(user.lastmine)
            return m.reply(`⛔ Tunggu ${minutes} menit ${seconds} detik sebelum mining lagi.`)
          }

          user.lastmine = currentTime

          await conn.sendMessage(m.chat, {
  video: fs.readFileSync('./media/mineprocces.mp4'),
  caption: `🔋 *ENERGY CORE STABILIZED*

@${m.sender.split('@')[0]} menjalankan robot tambang dengan kekuatan penuh!

📡 Komponen Aktif:
${user.pickaxemine ? `⛏️ Pickaxe Lv.${user.pickaxemine}` : ''}
${user.drillmine ? `🛠️ Drill Lv.${user.drillmine}` : ''}
${user.robotmine ? `🤖 Robot Lv.${user.robotmine}` : ''}

⛓️ Status Operasi:
[■■□□□□□□□□□□□□] 20% 🔄
⌛ Waktu tersisa: *5 menit*

🪙 Proses ekstraksi *Bitcoin* telah dimulai... silakan duduk manis!`,
  gifPlayback: true,
  mentions: [m.sender]
}, { quoted: fkontak(conn, m) })

          const coinEarned = calculateCoinEarned(user)

          setTimeout(async () => {
            user.btc += coinEarned

            if (user.pickaxemines > 0) {
              user.pickaxemines -= 1
              if (user.pickaxemines === 0) user.pickaxemine = 0
            }

            if (user.drillmines > 0) {
              user.drillmines -= 1
              if (user.drillmines === 0) user.drillmine = 0
            }

            if (user.robotmines > 0) {
              user.robotmines -= 1
              if (user.robotmines === 0) user.robotmine = 0
            }

            global.db.data.users[m.sender] = user

            await conn.sendMessage(m.chat, {
              text: `*🚀 Mining selesai!*\n@${m.sender.split('@')[0]} mendapatkan *${coinEarned.toFixed(8)} BTC*.\nTotal BTC: *${user.btc.toFixed(8)} 🪙*`,
              mentions: [m.sender]
            }, { quoted: fkontak(conn, m) })

          }, MINE_TIME)
          break

        case 'stats':
          if (currentTime - user.lastmine > MINE_TIME) return m.reply('⛔ Tidak ada proses mining aktif saat ini.')

          const elapsed = currentTime - user.lastmine
          const remaining = MINE_TIME - elapsed
          const totalBars = 20
          const percentage = Math.min((elapsed / MINE_TIME) * 100, 100)
          const barsFilled = Math.floor((percentage / 100) * totalBars)
          const bar = `[${'■'.repeat(barsFilled)}${'□'.repeat(totalBars - barsFilled)}]`

          const minutes = Math.floor(remaining / 60000)
          const seconds = Math.floor((remaining % 60000) / 1000)

          return m.reply(`⛏️ *Mining sedang berlangsung...*\nProgres: ${bar} ${percentage.toFixed(0)}%\nWaktu tersisa: ${minutes} menit ${seconds} detik.`)

        case 'check':
          const toolsList = []

          if (user.pickaxemine > 0) {
            const bonus = TOOL_BONUSES.pickaxe * user.pickaxemine
            toolsList.push(`⛏️ Pickaxe *${user.pickaxemine === 10 ? 'MAX' : user.pickaxemine}* (${user.pickaxemines} uses)\n + ${bonus.toFixed(7)} 🪙 / Mining`)
          }

          if (user.drillmine > 0) {
            const bonus = TOOL_BONUSES.drill * user.drillmine
            toolsList.push(`🛠️ Drill *${user.drillmine === 10 ? 'MAX' : user.drillmine}* (${user.drillmines} uses)\n + ${bonus.toFixed(7)} 🪙 / Mining`)
          }

          if (user.robotmine > 0) {
            const bonus = TOOL_BONUSES.robot * user.robotmine
            toolsList.push(`🤖 Robot *${user.robotmine === 10 ? 'MAX' : user.robotmine}* (${user.robotmines} uses)\n + ${bonus.toFixed(7)} 🪙 / Mining`)
          }

          const toolsText = toolsList.length ? toolsList.join('\n\n') : 'Tidak ada alat'
          const coinPerMine = calculateCoinEarned(user).toFixed(8)

          await sendMessageWithSkyid(`
🔧 *Alat yang kamu miliki:*
${toolsText}

*Total BTC Per Mining:* ${coinPerMine} 🪙
*🪙 BTC: ${user.btc.toFixed(8)}*
          `, m, conn)
          break

        case 'shop':
          await sendMessageWithSkyid(`
🛒 *Shop Tools*
- *pickaxe* - ${PRICES.pickaxe.toLocaleString()} money (+${TOOL_BONUSES.pickaxe} 🪙/Mining)
- *drill* - ${PRICES.drill.toLocaleString()} money (+${TOOL_BONUSES.drill} 🪙/Mining)
- *robot* - ${PRICES.robot.toLocaleString()} money (+${TOOL_BONUSES.robot} 🪙/Mining)

Gunakan *!minecoin buy [item] [quantity]*. Contoh: *!minecoin buy pickaxe 5*
          `, m, conn)
          break

        case 'buy':
          const item = m.text.split(' ')[2]?.toLowerCase()
          const quantity = parseInt(m.text.split(' ')[3]) || 1

          if (!PRICES[item]) return m.reply("❌ Pilih item dari: pickaxe, drill, robot.")
          if (quantity < 1 || quantity > 10) return m.reply("❌ Maksimal beli 10 alat.")
          if (user[item + 'mine'] + quantity > 10) return m.reply(`❌ Maksimal memiliki 10 ${item}.`)

          const totalPrice = PRICES[item] * quantity
          if (user.money < totalPrice) return m.reply(`❌ Uangmu tidak cukup. Butuh ${totalPrice} money.`)

          user.money -= totalPrice
          user[item + 'mine'] += quantity
          user[item + 'mines'] = 3

          global.db.data.users[m.sender] = user
          await m.reply(`🎉 Kamu berhasil membeli *${quantity} ${item}!*`)
          break
      }
    }
  } catch (error) {
    console.error(error)
  }
}

handler.help = ['minecoin start', 'minecoin stats', 'minecoin check', 'minecoin shop', 'minecoin buy [item]']
handler.tags = ['game']
handler.command = /^minecoin$/i
handler.rpg = true
handler.group = true
handler.register = true

export default handler