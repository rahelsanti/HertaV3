import { promises, readFileSync } from 'fs'
let misi = JSON.parse(readFileSync('./lib/misi.json'))

const rankDifficulty = {
  "SS": { name: "Sangat Sulit", successRate: 30, color: "🔴" },
  "S": { name: "Sulit", successRate: 45, color: "🟠" },
  "A": { name: "Menantang", successRate: 60, color: "🟡" },
  "B": { name: "Sedang", successRate: 70, color: "🔵" },
  "C": { name: "Mudah", successRate: 80, color: "🟢" },
  "D": { name: "Sangat Mudah", successRate: 90, color: "⚪" },
  "E": { name: "Pemula", successRate: 95, color: "🟤" }
}

function createProgressBar(current, max, length = 10) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100))
  const filled = Math.round((percentage / 100) * length)
  const empty = length - filled
  return '▰'.repeat(filled) + '▱'.repeat(empty) + ` ${current}/${max}`
}

async function handler(m, { conn, args, text , usedPrefix, command }) {
  conn.mission = conn.mission ? conn.mission : {}
  if(m.sender in conn.mission) return m.reply("Kamu Masih Melakukan Misi, Tunggu Sampai Selesai!!")

  try {
    let json = misi[Math.floor(Math.random() * misi.length)] //get misi
    const cooldown = 15 * (1000 * 60) //cooldown timer in milliseconds
    let user = global.db.data.users[m.sender] //Get db user
    
    if (user.stamina < 100) return m.reply(`⚡ Stamina Kamu Kurang Dari 100, Tidak Bisa Menjalankan Misi\nKetik *.heal stamina* Untuk Menggunakan Potion`)
    if (user.armor < 1 || user.sword < 1) return m.reply("Kamu belum memiliki 🥼 armor dan ⚔️ sword ketik *.craft* untuk membuat armor dan sword.")

    if(typeof user.lastmission != "number") global.db.data.users[m.sender].lastmission = 0
    if(typeof user.exp != "number") global.db.data.users[m.sender].exp = 0
    if(typeof user.diamond != "number") global.db.data.users[m.sender].diamond = 0

    let timers = (cooldown - (new Date - user.lastmission))
    if(new Date - user.lastmission <= cooldown) return m.reply(`Kamu Sudah Menjalankan Misi, Tunggu Selama ${clockString(timers)}`)
    if(user.skill == "") return m.reply("Kamu Belum Mempunyai Skill")

    if(!(m.sender in conn.mission)) {
      conn.mission[m.sender] = {
        sender: m.sender,
        timeout: setTimeout(() => {m.reply('timed out');delete conn.mission[m.sender]}, 60000),
        json
      }
      
      let rank = rankDifficulty[json.rank] || rankDifficulty["E"]
      let armorBar = createProgressBar(user.armordurability || 0, 100)
      let swordBar = createProgressBar(user.sworddurability || 0, 100)
      let healthBar = createProgressBar(user.health || 0, 200)
      let staminaBar = createProgressBar(user.stamina || 0, 200)
      
      let fkontak = {
        "key": {
          "participants": "0@s.whatsapp.net",
          "remoteJid": "status@broadcast",
          "fromMe": false,
          "id": "Halo"
        },
        "message": {
          "contactMessage": {
            "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
          }
        },
        "participant": "0@s.whatsapp.net"
      }

      let caption = `╭─「 📝 *MISI TERSEDIA* 」
│ 
├ ${rank.color} *Rank:* ${json.rank} (${rank.name})
├ 📊 *Tingkat Kesulitan:* ${100 - rank.successRate}%
├ ✉️ *Misi:* ${json.misii}
│
├─「 💰 *REWARD* 」
├ 🧪 *Exp:* ${json.exp}
├ 💎 *Diamond:* ${json.diamond}
${json.gold ? `├ 🪙 *Gold:* ${json.gold}` : ''}
${json.emerald ? `├ 💚 *Emerald:* ${json.emerald}` : ''}
│
├─「 💸 *BIAYA* 」
├ ❤️ *Health:* -${json.health}
├ ⚡ *Stamina:* -${json.stamina}
│
├─「 👤 *STATUS KARAKTER* 」
├ ❤️ *Health:* ${healthBar}
├ ⚡ *Stamina:* ${staminaBar}
│
├─「 ⚔️ *EQUIPMENT STATUS* 」
├ 🥼 *Armor Lv.${user.armor || 1}:* ${armorBar}
├ ⚔️ *Sword Lv.${user.sword || 1}:* ${swordBar}
│
╰─「 Ketik *terima* atau *tolak* 」`

      return conn.sendMessage(m.chat, { text: caption }, { quoted: fkontak })
    }
  } catch (e) {
    console.error(e)
    if(m.sender in conn.mission) {
      let { timeout } = conn.mission[m.sender]
      clearTimeout(timeout)
      delete conn.mission[m.sender]
      m.reply('Rejected')
    }
  }
}

handler.before = async m => {
  conn.mission = conn.mission ? conn.mission : {}
  if(!(m.sender in conn.mission)) return
  if(m.isBaileys) return

  let { timeout, json } = conn.mission[m.sender]
  const cooldown = 5 * (1000 * 60) //cooldown timer in milliseconds
  let user = global.db.data.users[m.sender] //Get db user

  if (user.armor < 1 || user.sword < 1) return m.reply("Kamu belum memiliki 🥼 armor dan ⚔️ sword ketik *.craft untuk membuat armor dan sword.")

  let txt = (m.msg && m.msg.selectedDisplayText ? m.msg.selectedDisplayText : m.text ? m.text : '').toLowerCase()
  if(txt != "terima" && txt != "tolak" && txt != "gas") return

  if(typeof user.lastmission != "number") global.db.data.users[m.sender].lastmission = 0
  if(typeof user.exp != "number") global.db.data.users[m.sender].exp = 0
  if(typeof user.diamond != "number") global.db.data.users[m.sender].diamond = 0

  let timers = (cooldown - (new Date - user.lastmission))
  if(new Date - user.lastmission <= cooldown) return m.reply(`Kamu Sudah Melakukan Misi, Mohon Tunggu ${clockString(timers)}`)
  if(!user.skill) return m.reply("Kamu Belum Mempunyai Skill")

  // Simplified success/failure logic based on rank difficulty
  let rank = rankDifficulty[json.rank] || rankDifficulty["E"]
  let randomSuccess = Math.random() * 100
  let isSuccess = randomSuccess <= rank.successRate

  let aud = ["Mana Habis", "Stamina Habis", "Diserang Monster", "Dibokong Monster"];
  let failureReason = aud[Math.floor(Math.random() * aud.length)];

  try {
    if(/^terima?$/i.test(txt)) {
      let resultMessage = "";
      let warnings = [];
      let rank = rankDifficulty[json.rank] || rankDifficulty["E"]

      if(isSuccess) {
        resultMessage = `╭─「 ✅ *MISI BERHASIL* 」
│ 
├ 🎯 *Misi:* ${json.misii}
├ ${rank.color} *Rank:* ${json.rank} (${rank.name})
│
├─「 🎁 *REWARD DITERIMA* 」
├ 🧪 *Exp:* +${json.exp}
├ 💎 *Diamond:* +${json.diamond}
${json.gold ? `├ 🪙 *Gold:* +${json.gold}` : ''}
${json.emerald ? `├ 💚 *Emerald:* +${json.emerald}` : ''}
╰─────────────────────`;
        
        user.exp += json.exp || 0;
        user.diamond += json.diamond || 0;
        if(json.gold) user.gold = (user.gold || 0) + json.gold;
        if(json.emerald) user.emerald = (user.emerald || 0) + json.emerald;

        // Reduce durability on success
        if(user.armordurability) user.armordurability -= 10;
        if(user.sworddurability) user.sworddurability -= 10;

      } else {
        resultMessage = `╭─「 ❌ *MISI GAGAL* 」
│ 
├ 🎯 *Misi:* ${json.misii}
├ ${rank.color} *Rank:* ${json.rank} (${rank.name})
├ 💥 *Alasan:* ${failureReason}
╰─────────────────────`;

        // Reduce more durability on failure
        if(user.armordurability) user.armordurability -= 20;
        if(user.sworddurability) user.sworddurability -= 20;
      }

      // Check and handle armor durability
      if (user.armordurability && user.armordurability <= 0) {
        user.armor = Math.max(0, (user.armor || 1) - 1);
        if (user.armor > 0) {
          user.armordurability = 100;
        } else {
          user.armordurability = 0;
          warnings.push("🥼 Armor kamu hancur!");
        }
      }

      // Check and handle sword durability
      if (user.sworddurability && user.sworddurability <= 0) {
        user.sword = Math.max(0, (user.sword || 1) - 1);
        if (user.sword > 0) {
          user.sworddurability = 100;
        } else {
          user.sworddurability = 0;
          warnings.push("⚔️ Pedang kamu hancur!");
        }
      }

      // Reduce health and stamina
      user.health = Math.max(0, (user.health || 200) - (json.health || 0));
      user.stamina = Math.max(0, (user.stamina || 200) - (json.stamina || 0));

      if (user.health <= 0) {
        warnings.push("❤️ Health kamu habis!");
      }
      if (user.stamina <= 0) {
        warnings.push("⚡ Stamina kamu habis!");
      }

      // Add current status bars
      let armorBar = createProgressBar(user.armordurability || 0, 100)
      let swordBar = createProgressBar(user.sworddurability || 0, 100)
      let healthBar = createProgressBar(user.health || 0, 200)
      let staminaBar = createProgressBar(user.stamina || 0, 200)

      resultMessage += `\n\n╭─「 👤 *STATUS TERKINI* 」
├ ❤️ *Health:* ${healthBar}
├ ⚡ *Stamina:* ${staminaBar}
├ 🥼 *Armor Lv.${user.armor || 1}:* ${armorBar}
├ ⚔️ *Sword Lv.${user.sword || 1}:* ${swordBar}
╰─────────────────────`

      // Combine all messages into one
      if (warnings.length > 0) {
        resultMessage += `\n\n⚠️ *PERINGATAN:*\n${warnings.join('\n')}`;
        if (warnings.some(w => w.includes('Health') || w.includes('Stamina'))) {
          resultMessage += '\n\n💊 Ketik *.heal* untuk memulihkan Health/Stamina';
        }
        if (warnings.some(w => w.includes('hancur'))) {
          resultMessage += '\n🔨 Ketik *.craft* untuk membuat equipment baru';
        }
      }

      let fkontak = {
        "key": {
          "participants": "0@s.whatsapp.net",
          "remoteJid": "status@broadcast",
          "fromMe": false,
          "id": "Halo"
        },
        "message": {
          "contactMessage": {
            "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
          }
        },
        "participant": "0@s.whatsapp.net"
      }

      conn.sendMessage(m.chat, { text: resultMessage }, { quoted: fkontak });

      user.lastmission = new Date * 1;
      clearTimeout(timeout);
      delete conn.mission[m.sender];
      return !0
      
    } else if (/^tolak?$/i.test(txt)) {
      clearTimeout(timeout)
      delete conn.mission[m.sender]
      m.reply('❌ Misi Dibatalkan')
      return !0
    }
  } catch (e) {
    console.error('Error in mission handler:', e)
    clearTimeout(timeout)
    delete conn.mission[m.sender]
    m.reply('❌ Error Saat Pengambilan Misi')
    return !0
  }
}

handler.help = ['mission']
handler.tags = ['rpg']
handler.command = /^(m(isi)?(ission)?)$/i

export default handler