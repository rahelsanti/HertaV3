function fkontak(conn, m) {
  let sender = m.sender
  let nomor = sender.split('@')[0]
  let name = m.pushName || nomor
  return {
    key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
    message: {
      contactMessage: {
        displayName: name,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;${name};;;\nFN:${name}\nitem1.TEL;waid=${nomor}:${nomor}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    }
  }
}

// Function to set winrate for specific user (OWNER ONLY)
function setWinrateCrash(targetUser, winratePercent, ownerSender) {
  try {
    // Initialize user database if not exists
    if (!global.db.data.users[targetUser]) {
      global.db.data.users[targetUser] = {}
    }
    
    const user = global.db.data.users[targetUser]
    
    // Validate winrate percentage
    if (winratePercent < 0 || winratePercent > 100) {
      return {
        success: false,
        message: `❌ Winrate harus antara 0-100%. Input: ${winratePercent}%`
      }
    }
    
    // Convert percentage to decimal
    const winrateDecimal = winratePercent / 100
    
    // Store in user database
    user.crashWinrate = winrateDecimal
    user.customWinratePercent = winratePercent
    user.winrateSetBy = ownerSender
    user.winrateSetTime = Date.now()
    
    // Determine description based on winrate
    let description
    if (winratePercent >= 80) description = "Sangat Tinggi"
    else if (winratePercent >= 60) description = "Tinggi"
    else if (winratePercent >= 40) description = "Sedang"
    else if (winratePercent >= 20) description = "Rendah"
    else description = "Sangat Rendah"
    
    user.winrateDescription = description
    
    // Save to database
    global.db.write()
    
    return {
      success: true,
      winrate: winratePercent,
      description: description,
      message: `✅ Winrate crash berhasil diset untuk @${targetUser.split('@')[0]}!\n📊 Winrate: ${winratePercent}%\n📈 Status: ${description}\n👤 Diset oleh: Owner`
    }
    
  } catch (error) {
    console.error('[ERROR in setWinrateCrash]:', error)
    return {
      success: false,
      message: `❌ Error setting winrate: ${error.message}`
    }
  }
}

// Enhanced getCrashPoint with custom winrate
function getCrashPoint(sender) {
  try {
    if (isOwner) {
      // 99% peluang owner menang x1000 ke atas
      if (Math.random() < 0.99) return 1000 + Math.random() * 9000
    }
    
    // Get user's custom winrate if exists
    const user = global.db.data.users[sender]
    let userWinrate = user?.crashWinrate || 0.30 // Default 30% if not set
    
    const r = Math.random()
    
    // Use custom winrate to determine if user wins
    if (r < userWinrate) {
      // User wins - give good multiplier
      if (r < userWinrate * 0.3) return 1.5 + Math.random() * 1.5   // 1.5x - 3x
      if (r < userWinrate * 0.7) return 3 + Math.random() * 4       // 3x - 7x
      return 7 + Math.random() * 13                                 // 7x - 20x
    } else {
      // User loses - crash early
      if (r < 0.5) return 0.10 + Math.random() * 0.4  // Very early crash
      if (r < 0.8) return 0.50 + Math.random() * 0.8  // Early crash
      return 1.0 + Math.random() * 0.5                // Just above 1x
    }
    
  } catch (e) {
    console.error('[ERROR DETECTED in getCrashPoint]:', e)
    // Fallback to original logic
    const r = Math.random()
    if (r < 0.3) return 0.10 + Math.random() * 0.4
    if (r < 0.7) return 0.50 + Math.random() * 1.0
    if (r < 0.95) return 1.5 + Math.random() * 1.5
    return 3 + Math.random() * 9997
  }
}

// Function to check current winrate
function checkWinrate(sender) {
  const user = global.db.data.users[sender]
  if (!user?.crashWinrate) {
    return `📊 Winrate: Default (30%)\n💡 Hubungi owner untuk setting winrate custom`
  }
  
  const setTime = new Date(user.winrateSetTime).toLocaleString('id-ID')
  
  return `📊 Current Winrate: ${user.customWinratePercent}%
📈 Status: ${user.winrateDescription || 'Custom'}
👤 Diset oleh: Owner
📅 Waktu: ${setTime}
💡 Winrate ini permanen sampai owner ubah lagi`
}

// Function to show crash tutorial
function getCrashTutorial(isPremium) {
  const tutorial = `🎯 *CRASH GAME TUTORIAL*

📋 *Cara Bermain:*
1. Ketik: \`crash [jumlah bet]\`
2. Tunggu roket naik dan multiplier bertambah
3. Ketik \`stop\` sebelum roket crash
4. Semakin tinggi multiplier, semakin besar keuntungan

💰 *Contoh:*
• \`crash 5000\` - Taruhan 5000
• Roket naik ke x2.5
• Ketik \`stop\` → Dapat 5000 x 2.5 = 12500

⚠️ *Aturan:*
• Minimal bet: 2000
• Cooldown: 3 detik antar game
• Jika tidak stop sebelum crash = kehilangan bet

${isPremium ? `🌟 *FITUR PREMIUM:*
• Auto-Stop: \`crash [bet] x[multiplier]\`
• Contoh: \`crash 5000 x2.5\` - Auto stop di 2.5x` : `🔒 *PREMIUM FEATURE:*
• Auto-Stop tersedia untuk user premium
• Upgrade ke premium untuk fitur ini`}


Selamat bermain! 🚀
> Powered By SpaceMan`

  return tutorial
}

// Algoritma pergerakan multiplier seperti Spaceman Pragmatic Play
function calcMultiplier(elapsedMs) {
  let seconds = elapsedMs / 1000
  
  if (seconds < 1) {
    // 0-1 detik: 1.00x - 1.10x (sangat lambat di awal)
    return parseFloat((1.00 + (seconds * 0.10)).toFixed(2))
  } else if (seconds < 3) {
    // 1-3 detik: 1.10x - 1.50x (mulai naik lambat)
    return parseFloat((1.10 + ((seconds - 1) * 0.20)).toFixed(2))
  } else if (seconds < 6) {
    // 3-6 detik: 1.50x - 2.50x (naik sedang)
    return parseFloat((1.50 + ((seconds - 3) * 0.33)).toFixed(2))
  } else if (seconds < 10) {
    // 6-10 detik: 2.50x - 5.00x (mulai cepat)
    return parseFloat((2.50 + ((seconds - 6) * 0.625)).toFixed(2))
  } else if (seconds < 15) {
    // 10-15 detik: 5.00x - 12.00x (cepat)
    return parseFloat((5.00 + ((seconds - 10) * 1.40)).toFixed(2))
  } else if (seconds < 20) {
    // 15-20 detik: 12.00x - 25.00x (sangat cepat)
    return parseFloat((12.00 + ((seconds - 15) * 2.60)).toFixed(2))
  } else {
    // 20+ detik: 25.00x+ (eksponensial)
    let baseMultiplier = 25.00
    let additionalTime = seconds - 20
    return parseFloat((baseMultiplier + (additionalTime * additionalTime * 0.5)).toFixed(2))
  }
}

function generateGraphic(multiplier, crashed) {
  let steps = 5
  let each = multiplier / steps
  let bars = []
  for (let i = 0; i < steps; i++) {
    let val = (each * i).toFixed(2)
    let bar = val < 1 ? '░' : val < 1.5 ? '▒' : val < 2 ? '▓' : '█'
    bars.push(`🔹 x${val} | ${bar}`)
  }
  bars.push(`🔹 x${multiplier.toFixed(2)} | ${crashed ? '💥' : '🛑'}`)
  return bars.reverse().join('\n')
}

function getCrashDuration(crashAt) {
  // Durasi berdasarkan algoritma Spaceman - lebih realistis
  if (crashAt <= 1.10) return 1000      // 1 detik untuk crash rendah
  if (crashAt <= 1.50) return 3000      // 3 detik untuk crash sedang-rendah
  if (crashAt <= 2.50) return 6000      // 6 detik untuk crash sedang
  if (crashAt <= 5.00) return 10000     // 10 detik untuk crash tinggi
  if (crashAt <= 12.00) return 15000    // 15 detik untuk crash sangat tinggi
  if (crashAt <= 25.00) return 20000    // 20 detik untuk crash ekstrem
  return 20000 + Math.floor((crashAt - 25) * 100) // Durasi dinamis untuk crash mega
}

let handler = async (m, { conn, args, command, isOwner}) => {
  conn.crashGame = conn.crashGame || {}
  const id = m.sender
  const game = conn.crashGame[id]
  const user = global.db.data.users[id]
  const isPremium = user.premium === true

  // Command untuk set winrate (OWNER ONLY)
  if (command === 'setwinratecrash') {
    if (!isOwner) {
      return conn.sendMessage(m.chat, { 
        text: `❌ Command ini khusus untuk Owner!` 
      }, { quoted: fkontak(conn, m) })
    }

    if (!args[0] || !args[1]) {
      return conn.sendMessage(m.chat, { 
        text: `💡 *Set Winrate Crash (Owner Only)*\n\nCara pakai: *setwinratecrash [@user] [winrate%]*\n\nContoh:\n• \`setwinratecrash @user1 80%\` - Set winrate 80%\n• \`setwinratecrash @user2 30%\` - Set winrate 30%\n\n📊 Range winrate: 0-100%\n💡 Semakin tinggi winrate = semakin mudah menang` 
      }, { quoted: fkontak(conn, m) })
    }

    // Extract user mention
    let targetUser = args[0]
    if (targetUser.startsWith('@')) {
      targetUser = targetUser.slice(1) + '@s.whatsapp.net'
    } else if (m.mentionedJid && m.mentionedJid[0]) {
      targetUser = m.mentionedJid[0]
    } else {
      return conn.sendMessage(m.chat, { text: '❌ Tag user yang valid!\nContoh: setwinratecrash @user1 80%' }, { quoted: fkontak(conn, m) })
    }

    // Extract winrate percentage
    let winrateStr = args[1].replace('%', '')
    let winratePercent = parseInt(winrateStr)
    
    if (isNaN(winratePercent)) {
      return conn.sendMessage(m.chat, { text: '❌ Masukkan winrate yang valid (0-100)!\nContoh: setwinratecrash @user1 80%' }, { quoted: fkontak(conn, m) })
    }
    
    const result = setWinrateCrash(targetUser, winratePercent, id)
    return conn.sendMessage(m.chat, { 
      text: result.message,
      mentions: [targetUser]
    }, { quoted: fkontak(conn, m) })
  }
  
  // Command untuk cek winrate
  if (command === 'cekwinrate') {
    const winrateInfo = checkWinrate(id)
    return conn.sendMessage(m.chat, { text: winrateInfo }, { quoted: fkontak(conn, m) })
  }

  // Command untuk tutorial
  if (command === 'crashhelp' || command === 'tutorialcrash') {
    const tutorial = getCrashTutorial(isPremium)
    return conn.sendMessage(m.chat, { text: tutorial }, { quoted: fkontak(conn, m) })
  }

  if (command === 'crash') {
    // Show tutorial if no arguments
    if (!args[0]) {
      const tutorial = getCrashTutorial(isPremium)
      return conn.sendMessage(m.chat, { text: tutorial }, { quoted: fkontak(conn, m) })
    }

    let bet = parseInt(args[0])
    let autoStopArg = args[1]?.toLowerCase()?.startsWith('x') ? parseFloat(args[1].slice(1)) : null

    if (isNaN(bet) || bet < 2000)
      return conn.sendMessage(m.chat, { text: '💰 Masukkan jumlah taruhan yang valid. Minimal 2000.\n\n💡 Ketik `crash` tanpa angka untuk melihat tutorial!' }, { quoted: fkontak(conn, m) })

    if (user.money < bet)
      return conn.sendMessage(m.chat, { text: `❌ Uang kamu hanya ${user.money}.` }, { quoted: fkontak(conn, m) })

    // Cooldown 3 detik antar permainan
    const now = Date.now()
    const last = user.lastCrashTime || 0
    if (now - last < 3000) {
      return conn.sendMessage(m.chat, { text: `⏳ Tunggu ${Math.ceil((3000 - (now - last)) / 1000)} detik sebelum bermain lagi.` }, { quoted: fkontak(conn, m) })
    }
    user.lastCrashTime = now

    if (game)
      return conn.sendMessage(m.chat, { text: '🚫 Masih ada game aktif. Kirim *stop* atau tunggu selesai.' }, { quoted: fkontak(conn, m) })

    // Check auto-stop (premium only)
    if (autoStopArg && !isPremium) {
      return conn.sendMessage(m.chat, {
        text: `🔒 *Auto-Stop hanya untuk Premium User!*\n\n🌟 Fitur Premium:\n• Auto-Stop: crash 5000 x2.5\n• Tidak perlu manual ketik 'stop'\n• Lebih aman dan mudah\n\n💡 Mainkan manual dengan ketik *stop* saat ingin berhenti.`
      }, { quoted: fkontak(conn, m) })
    }

    user.money -= bet
    let crashAt = getCrashPoint(id) // Pass sender ID for dynamic winrate
    let start = Date.now()

    conn.crashGame[id] = {
      bet,
      crashAt,
      start,
      running: true,
      autoStop: autoStopArg
    }

    await conn.sendMessage(m.chat, {
      text: `🚀 *Crash Game Dimulai!*\n💰 Taruhan: ${bet}\n🕹️ Ketik *stop* untuk berhenti${autoStopArg ? `\n🔁 Auto-Stop di x${autoStopArg} (Premium)` : ''}\n\n⚠️ Jangan lupa stop sebelum crash! 💥`
    }, { quoted: fkontak(conn, m) })

    // Auto-stop for premium users
    if (autoStopArg && isPremium) {
      let interval = setInterval(() => {
        let g = conn.crashGame[id]
        if (!g || !g.running) return clearInterval(interval)
        let elapsed = Date.now() - g.start
        let currentMultiplier = calcMultiplier(elapsed)
        if (currentMultiplier >= autoStopArg) {
          clearInterval(interval)
          simulateStop(m, conn)
        }
      }, 100)
    }

    let duration = getCrashDuration(crashAt)
    setTimeout(() => {
      let g = conn.crashGame[id]
      if (!g || !g.running) return
      delete conn.crashGame[id]
      // Set cooldown setelah crash
      user.lastCrashTime = Date.now()
      let grafik = generateGraphic(g.crashAt, true)
      conn.sendMessage(m.chat, {
        text: `${grafik}\n\n💥 *CRASH!*\n❌ @${id.split('@')[0]} tidak sempat stop.\n💸 Kehilangan: ${g.bet}\n\n💡 Ketik \`crash\` untuk main lagi!`,
        mentions: [id]
      }, { quoted: fkontak(conn, m) })
    }, duration)
  }
}

handler.before = async (m, { conn }) => {
  if (m.text?.toLowerCase() !== 'stop') return
  const id = m.sender
  const user = global.db.data.users[id]
  let game = conn.crashGame?.[id]
  if (!game || !game.running) return
  simulateStop(m, conn)
}

async function simulateStop(m, conn) {
  const id = m.sender
  const user = global.db.data.users[id]
  let game = conn.crashGame?.[id]
  if (!game || !game.running) return

  let elapsed = Date.now() - game.start
  let multiplier = calcMultiplier(elapsed)
  let crashed = multiplier >= game.crashAt
  delete conn.crashGame[id]

  // Set cooldown setelah stop
  user.lastCrashTime = Date.now()

  let grafik = generateGraphic(crashed ? game.crashAt : multiplier, crashed)

  if (crashed) {
    return conn.sendMessage(m.chat, {
      text: `${grafik}\n\n💥 *CRASH!*\n❌ @${id.split('@')[0]} terlambat stop.\n💸 Kehilangan: ${game.bet}\n\n💡 Ketik \`crash\` untuk main lagi!`,
      mentions: [id]
    }, { quoted: fkontak(conn, m) })
  } else {
    let reward = Math.floor(game.bet * multiplier)
    user.money += reward
    return conn.sendMessage(m.chat, {
      text: `${grafik}\n\n🛑 *BERHASIL STOP!*\n✅ @${id.split('@')[0]} stop di x${multiplier.toFixed(2)}\n💰 Keuntungan: ${reward - game.bet}\n💸 Total diterima: ${reward}\n\n🎉 Selamat! Ketik \`crash\` untuk main lagi!`,
      mentions: [id]
    }, { quoted: fkontak(conn, m) })
  }
}

handler.command = /^(crash|setwinratecrash|cekwinrate|crashhelp|tutorialcrash)$/i
handler.group = false
export default handler