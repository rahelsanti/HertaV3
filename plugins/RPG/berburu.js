let handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender]
  const cooldown = 500000
  const now = new Date()
  const elapsed = now - user.lastberburu
  const remaining = cooldown - elapsed

  if (user.pistol < 1) return m.reply('Kamu harus memiliki *Pistol* 🔫 untuk berburu!')
  if (user.peluru < 50) return m.reply('Kamu harus memiliki *50 Peluru* 🔋 untuk berburu!')

  if (elapsed < cooldown)
    return conn.reply(m.chat, `⏳ Tunggu *${clockString(remaining)}* untuk berburu lagi.`, m, { quoted: fkontak })

  // Random hasil
  const hasil = {
    banteng: rand(0, 14),
    harimau: rand(0, 14),
    gajah: rand(0, 14),
    kambing: rand(0, 14),
    panda: rand(0, 14),
    buaya: rand(0, 14),
    kerbau: rand(0, 14),
    sapi: rand(0, 14),
    monyet: rand(0, 14),
    babihutan: rand(0, 14),
    babi: rand(0, 14),
    ayam: rand(0, 14),
    damage: rand(0, 258),
    peluru: rand(1, 10),
  }

  // Update ke database
  for (let key in hasil) {
    if (key === 'damage') user.damage += hasil[key]
    else if (key === 'peluru') user.peluru -= hasil[key]
    else user[key] += hasil[key]
  }
  user.lastberburu = now * 1

  // Hasil akhir
  let caption = `
*🎯 Hasil Berburu ${conn.getName(m.sender)}*

🐂 Banteng : ${hasil.banteng}
🐅 Harimau : ${hasil.harimau}
🐘 Gajah   : ${hasil.gajah}
🐐 Kambing : ${hasil.kambing}
🐼 Panda   : ${hasil.panda}
🐊 Buaya   : ${hasil.buaya}
🐃 Kerbau  : ${hasil.kerbau}
🐮 Sapi    : ${hasil.sapi}
🐒 Monyet  : ${hasil.monyet}
🐗 Babi Hutan : ${hasil.babihutan}
🐖 Babi    : ${hasil.babi}
🐓 Ayam    : ${hasil.ayam}

ketik *.kandang* untuk melihat hasil
🔋 Peluru digunakan: ${hasil.peluru}
💥 Damage diterima: ${hasil.damage}
`.trim()

  conn.sendMessage(m.chat, {
    text: caption,
    mentions: [m.sender],
    contextInfo: { mentionedJid: [m.sender] }
  }, { quoted: fkontak })
}

handler.help = ['berburu']
handler.tags = ['rpg']
handler.command = /^(berburu)$/i
handler.group = true
handler.rpg = true
handler.register = true
export default handler

// Utils
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function clockString(ms) {
  let d = Math.floor(ms / 86400000)
  let h = Math.floor(ms / 3600000) % 24
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return `${d} Hari ${h} Jam ${m} Menit ${s} Detik`
}