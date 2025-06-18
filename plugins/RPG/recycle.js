const hargaSampah = {
  botol: 300,
  kardus: 400,
  kaleng: 500,
  plastik: 200,
  trash: 20
}

const namaSampah = {
  botol: '🍾 Botol',
  kardus: '📦 Kardus',
  kaleng: '🥫 Kaleng',
  plastik: '📜 Plastik',
  trash: '🗑️ Trash'
}

const handler = async (m, { args, command, usedPrefix, conn }) => {
  const user = global.db.data.users[m.sender]
  if (!args[0]) {
    return m.reply(`🔁 *RECYCLING CENTER*\n\nKetik:\n• *${usedPrefix}${command} <item> <jumlah>*\n• *${usedPrefix}${command} all*\n\nContoh:\n${usedPrefix}${command} botol 100\n${usedPrefix}${command} all`)
  }

  let totalUang = 0
  let teksHasil = `♻️ *DAUR ULANG BERHASIL!*\n\n`

  if (args[0] === 'all') {
    let adaYangDidaur = false
    for (let item in hargaSampah) {
      let jumlah = user[item] || 0
      if (jumlah > 0) {
        const uang = jumlah * hargaSampah[item]
        totalUang += uang
        teksHasil += `${namaSampah[item]} x${jumlah} → Rp${uang.toLocaleString()}\n`
        user[item] -= jumlah
        adaYangDidaur = true
      }
    }

    if (!adaYangDidaur) return m.reply('❌ Kamu tidak memiliki item daur ulang apapun.')

    user.money += totalUang
    teksHasil += `\n💰 Total: *Rp${totalUang.toLocaleString()}*`
    return m.reply(teksHasil)
  }

  // Skema 1: recycle <item> <jumlah>
  const item = args[0].toLowerCase()
  const jumlah = parseInt(args[1])

  if (!(item in hargaSampah)) {
    return m.reply(`❌ Item "${item}" tidak bisa didaur ulang!\nItem yang tersedia:\n- ${Object.keys(hargaSampah).join('\n- ')}`)
  }

  if (isNaN(jumlah) || jumlah <= 0) {
    return m.reply(`❌ Masukkan jumlah yang valid!\nContoh: *${usedPrefix}${command} ${item} 100*`)
  }

  if ((user[item] || 0) < jumlah) {
    return m.reply(`❌ Kamu tidak punya cukup ${item}!\nJumlah yang kamu punya: ${user[item] || 0}`)
  }

  const uang = jumlah * hargaSampah[item]
  user[item] -= jumlah
  user.money += uang

  return m.reply(`♻️ Kamu mendaur ulang ${namaSampah[item]} x${jumlah}\n💰 Uang yang didapat: *Rp${uang.toLocaleString()}*`)
}

handler.command = /^recycle$/i
handler.help = ['recycle [item] [jumlah]', 'recycle all']
handler.tags = ['rpg']
handler.rpg = true
handler.register = true
handler.group = true

export default handler