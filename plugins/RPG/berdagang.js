let handler = async (m, { conn, text }) => {
  let who;
  if (m.isGroup) who = m.mentionedJid[0];
  else who = m.chat;

  if (!who) throw '⚠️ Tag seseorang yang ingin kamu ajak berdagang.';
  if (!global.db.data.users[who]) throw '❌ Target tidak ditemukan di database.';
  
  let user = global.db.data.users[m.sender];
  let partner = global.db.data.users[who];
  let __timers = new Date() - user.lastdagang;
  let _timers = 28800000 - __timers;
  let timers = clockString(_timers);

  if (__timers < 28800000) return conn.reply(m.chat, `⏳ Kamu sudah berdagang. Tunggu *${timers}* lagi!`, m, { mentions: [m.sender] });

  if (user.money < 5000) throw '💸 Uangmu kurang dari 5.000 untuk berdagang.';
  if (partner.money < 5000) throw '💸 Uang target tidak cukup untuk berdagang.';

  let hasilUang = Math.floor(Math.random() * (100000 - 75000) + 75000);

  let tradeItems = [
    { name: "🏺 Rare Artifacts", amount: rand(1, 5) },
    { name: "🧬 Enchanted Crystals", amount: rand(2, 7) },
    { name: "🐉 Dragon Scales", amount: rand(0, 2) },
    { name: "🪙 Ancient Coins", amount: rand(5, 15) },
    { name: "🌿 Mystic Herbs", amount: rand(3, 10) },
    { name: "🗡️ Elven Blades", amount: rand(1, 4) },
    { name: "📜 Forbidden Scrolls", amount: rand(1, 3) },
    { name: "🦴 Fossil Bones", amount: rand(2, 8) },
  ];

  user.money -= 5000;
  partner.money -= 5000;
  user.money += hasilUang;
  partner.money += hasilUang;
  user.lastdagang = new Date() * 1;

  let teksHasil = tradeItems.map(i => `• ${i.name}: +${i.amount}`).join('\n');

  let teks = `
🧝‍♂️✨ *Trade Report - Merchant's Guild Chronicle* ✨🧝‍♀️  
──────────────────────────────

🏷️ *Participants:*  
• @${m.sender.split`@`[0]}  
• @${who.split`@`[0]}  

💰 *Initial Investment:* 5,000 💵 each  
📦 *Trade Duration:* 8 cycles  
⚔️ *Route:* Misty Mountains → Shadowmarket

─────────────📊──────────────
📦 *Trade Results:*

${teksHasil}

💵 *Final Profit:*  
• @${m.sender.split`@`[0]} : +${toRupiah(hasilUang)} 💰  
• @${who.split`@`[0]} : +${toRupiah(hasilUang)} 💰

──────────────────────────────
📝 *Note:*  
Your caravan returned safely, and you’ve made quite the profit from this perilous journey. The Merchant’s Guild recognizes your trade prowess!
`.trim();

  const fkontak = {
    key: {
      participants: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "Halo",
    },
    message: {
      contactMessage: {
        displayName: `${conn.getName(m.sender)}`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${conn.getName(m.sender)};;;;\nFN:${conn.getName(m.sender)}\nitem1.TEL;waid=${m.sender.split`@`[0]}:${m.sender.split`@`[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
      },
    },
  };

  conn.sendMessage(m.chat, { text: teks, mentions: [m.sender, who] }, { quoted: fkontak });
};

handler.help = ['berdagang @tag'];
handler.tags = ['rpg'];
handler.command = /^berdagang$/i;
handler.register = true;
handler.group = true;
handler.rpg = true;

export default handler;

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function clockString(ms) {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return `${h}h ${m}m ${s}s`;
}
function toRupiah(n) {
  return n.toLocaleString('id-ID');
}