import { readFileSync } from 'fs'

function fkontak(conn, m) {
  let sender = m.sender
  let nomor = sender.split('@')[0]
  let name = m.pushName || nomor
  return {
    key: {
      participant: '0@s.whatsapp.net',
      remoteJid: 'status@broadcast'
    },
    message: {
      contactMessage: {
        displayName: name,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;${name};;;\nFN:${name}\nitem1.TEL;waid=${nomor}:${nomor}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    }
  }
}

const handler = async (m, { conn, args }) => {
  const id = m.chat
  conn.horseBet = conn.horseBet || {}
  const horseBet = conn.horseBet
  const subcmd = args[0]?.toLowerCase()
  horseBet[id] = horseBet[id] || {}

  const SYSTEM_TAX_PERCENT = 10

  switch (subcmd) {
    case 'create': {
      if (horseBet[id].active) return m.reply('⚠️ Sesi sudah ada!')
      horseBet[id] = {
        active: true,
        started: false,
        starter: m.sender,
        trackLength: 20,
        participants: []
      }
      return conn.sendMessage(id, {
        text: `🎮 Sesi Taruhan Kuda Dibuat!\n👥 Jumlah pemain: bebas\n🎯 Format: .horsebet bet <kuda>|<jumlah>\n\nContoh: .horsebet bet 2|100000\n🛑 Hanya pembuat sesi yang bisa .horsebet start`
      }, { quoted: fkontak(conn, m) })
    }

    case 'delete': {
      if (!horseBet[id].active) return m.reply('Tidak ada sesi.')
      delete horseBet[id]
      return conn.sendMessage(id, { text: '🗑️ Sesi dihapus.' }, { quoted: fkontak(conn, m) })
    }

    case 'bet': {
      if (!horseBet[id].active || horseBet[id].started)
        return m.reply('Taruhan tidak tersedia.')
      if (!args[1] || !args[1].includes('|'))
        return m.reply('Format salah! Contoh: .horsebet bet 2|100000')

      let [horseStr, amountStr] = args[1].split('|').map(v => v.trim())
      let horse = parseInt(horseStr)
      let amount = parseInt(amountStr)
      if (![1, 2, 3, 4].includes(horse) || isNaN(amount) || amount < 10000)
        return m.reply('Nomor kuda 1-4 & minimum 10000')

      let user = global.db.data.users[m.sender]
      if (user.money < amount) return m.reply('Uang kamu tidak cukup!')

      if (horseBet[id].participants.find(p => p.sender === m.sender))
        return m.reply('Kamu sudah bertaruh.')

      horseBet[id].participants.push({ sender: m.sender, horse, amount })

      // Hitung odds langsung setelah bet
      const participants = horseBet[id].participants
      let totalPool = participants.reduce((sum, p) => sum + p.amount, 0)
      let betPerHorse = { 1: 0, 2: 0, 3: 0, 4: 0 }
      participants.forEach(p => betPerHorse[p.horse] += p.amount)

      let oddsText = '\n\n📊 *ODDS SAAT INI*\n'
      for (let i = 1; i <= 4; i++) {
        let amount = betPerHorse[i]
        if (amount === 0) {
          oddsText += `${i}️⃣ Kuda ${i} — Belum ada taruhan\n`
        } else {
          let odds = (totalPool / amount).toFixed(2)
          oddsText += `${i}️⃣ Kuda ${i} — Taruhan: ${amount} — 💸 Odds: ${odds}x\n`
        }
      }

      return conn.sendMessage(id, {
        text: `✅ @${m.sender.split('@')[0]} memilih Kuda ${horse} | Taruhan: ${amount}${oddsText}`,
        mentions: [m.sender]
      }, { quoted: fkontak(conn, m) })
    }

    case 'start': {
      if (!horseBet[id].active || horseBet[id].started)
        return m.reply('Tidak bisa memulai.')
      if (horseBet[id].starter !== m.sender)
        return m.reply('Hanya pembuat sesi yang bisa mulai.')
      if (horseBet[id].participants.length === 0)
        return m.reply('Tidak ada peserta.')

      horseBet[id].started = true
      const participants = horseBet[id].participants
      const trackLength = horseBet[id].trackLength
      const winningHorse = Math.floor(Math.random() * 4) + 1

      let startVisual = Array(4).fill().map((_, i) => {
        return `${i + 1}️⃣ | ${'━'.repeat(trackLength)}🐎`
      }).join('\n')

      await conn.sendMessage(id, {
        text: `🏁 Balapan dimulai dalam 3 detik...\n\n${startVisual}`
      }, { quoted: fkontak(conn, m) })

      await new Promise(r => setTimeout(r, 3000))

      let track = Array(4).fill().map((_, i) => {
        let line = Array(trackLength).fill('━')
        if (i + 1 === winningHorse) line[0] = '🐎'
        else line[Math.floor(Math.random() * (trackLength - 2)) + 1] = '🐎'
        return `${i + 1}️⃣ | ${line.join('')}`
      }).join('\n')

      let totalPot = participants.reduce((sum, p) => sum + p.amount, 0)
      let tax = Math.floor(totalPot * SYSTEM_TAX_PERCENT / 100)
      let pool = totalPot - tax

      const winners = participants.filter(p => p.horse === winningHorse)
      const losers = participants.filter(p => p.horse !== winningHorse)

      let result = `🏇 *Arena Balap Kuda*\n\n${track}\n\n🏁 *Garis Finish*\n🎉 *Kuda Pemenang:* Kuda ${winningHorse}`

      result += `\n\n👥 Total Pemain: ${participants.length}`
      result += `\n💰 Total Taruhan: ${totalPot}`
      result += `\n📉 Potongan Sistem: ${SYSTEM_TAX_PERCENT}% (${tax})`
      result += `\n💸 Pool Dibagikan: ${pool}`

      if (winners.length === 0) {
        result += '\n\n😢 Tidak ada yang memilih kuda pemenang. Semua taruhan hangus.'
        for (let p of participants) {
          global.db.data.users[p.sender].money -= p.amount
        }
        let lines = participants.map(p =>
          `@${p.sender.split('@')[0]} ❌ -${p.amount}`
        )
        result += '\n\n' + lines.join('\n')
      } else {
        let totalWinBet = winners.reduce((sum, p) => sum + p.amount, 0)
        let lines = []
        for (let p of participants) {
          const tag = `@${p.sender.split('@')[0]}`
          if (p.horse === winningHorse) {
            let prop = p.amount / totalWinBet
            let reward = Math.floor(pool * prop)
            global.db.data.users[p.sender].money += reward
            lines.push(`${tag} ✅ +${reward}`)
          } else {
            global.db.data.users[p.sender].money -= p.amount
            lines.push(`${tag} ❌ -${p.amount}`)
          }
        }
        result += '\n\n' + lines.join('\n')
      }

      await conn.sendMessage(id, {
        text: result,
        mentions: participants.map(p => p.sender)
      }, { quoted: fkontak(conn, m) })

      delete horseBet[id]
      break
    }

    default: {
      return conn.sendMessage(id, {
        text: `🐎 *HORSE BETTING MENU*\n\n🟢 .horsebet create\n🎲 .horsebet bet <kuda>|<jumlah>\n🏁 .horsebet start\n🗑️ .horsebet delete\n\nContoh: .horsebet bet 2|100000\nMin bet: 10000`
      }, { quoted: fkontak(conn, m) })
    }
  }
}

handler.help = ['horsebet']
handler.tags = ['rpg']
handler.command = /^horsebet$/i
handler.group = true
handler.rpg = true

export default handler