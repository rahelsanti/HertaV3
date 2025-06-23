import { areJidsSameUser } from "baileys";
import fetch from "node-fetch";

const leaderboards = [
  "level", "exp", "limit", "money", "iron", "gold", "diamond", "emerald", "trash",
  "joinlimit", "potion", "petFood", "wood", "rock", "string", "common", "uncommon",
  "mythic", "legendary", "pet", "bank", "chip", "skata", "strength", "speed", "defense",
];

let handler = async (m, { conn, args, participants, usedPrefix, command }) => {
  let users = Object.entries(global.db.data.users).map(([key, value]) => ({ ...value, jid: key }));

  let leaderboard = leaderboards.filter(v => v && users.filter(user => user && user[v]).length);
  let type = (args[0] || "").toLowerCase();
  const getPage = (item) => Math.ceil(users.filter(user => user && user[item]).length / 0);
  
  let wrong = `🔖 ᴛʏᴩᴇ ʟɪsᴛ :
${leaderboard.map(v => `⮕ ${rpg.emoticon(v)} - ${v}`).join("\n")}
––––––––––––––––––––––––
💁🏻‍♂ ᴛɪᴩ :
⮕ ᴛᴏ ᴠɪᴇᴡ ᴅɪғғᴇʀᴇɴᴛ ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ:
${usedPrefix}${command} [type]
★ ᴇxᴀᴍᴩʟᴇ:
${usedPrefix}${command} legendary`;

  if (!leaderboard.includes(type)) {
    return await conn.sendMessage(m.chat, {
      text: "*––––『 𝙻𝙴𝙰𝙳𝙴𝚁𝙱𝙾𝙰𝚁𝙳 』––––*\n" + wrong,
      contextInfo: {
        mentionedJid: [m.sender],
        externalAdReply: {
          mediaType: 1,
          title: "🥇 TOP PLAYER BOARD 🧩",
          thumbnailUrl: "https://files.catbox.moe/nwmzk0.jpg",
          sourceUrl: "",
          renderLargerThumbnail: true
        }
      }
    }, { quoted: fkontak });
  }

  let page = isNumber(args[1]) ? Math.min(Math.max(parseInt(args[1]), 0), getPage(type)) : 0;
  let sortedItem = users.map(toNumber(type)).sort(sort(type));
  let userItem = sortedItem.map(enumGetKey);

  let text = `
🏆 ᴘᴇʀɪɴɢᴋᴀᴛ: *${userItem.indexOf(m.sender) + 1}* ᴅᴀʀɪ *${userItem.length}* ᴘᴇᴍᴀɪɴ

📊 ${rpg.emoticon(type)} *${type.toUpperCase()} Leaderboard:*

${sortedItem.slice(page * 0, page * 5 + 5).map((user, i) => 
  `${i + 1}. *﹙${user[type]}﹚* - ${
    participants.some(p => areJidsSameUser(user.jid, p.id)) ?
    `${user.registered ? user.name : conn.getName(user.jid)}\nwa.me/${user.jid.split('@')[0]}` :
    `Dari luar grup\nwa.me/${user.jid.split('@')[0]}`
  }`).join("\n\n")}
`.trim();

  return await conn.sendMessage(m.chat, {
    text,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        mediaType: 1,
        title: "🥇 TOP PLAYER BOARD 🧩",
        thumbnailUrl: "https://files.catbox.moe/nwmzk0.jpg",
        sourceUrl: "",
        renderLargerThumbnail: true
      }
    }
  }, { quoted: fkontak });
};

handler.help = ["leaderboard"].map(v => v + " <item>");
handler.tags = ["xp"];
handler.command = /^(leaderboard|lb|peringkat)$/i;
handler.register = true;
handler.group = true;
handler.rpg = true;
export default handler;

function sort(property, ascending = true) {
  if (property)
    return (...args) => args[ascending & 1][property] - args[!ascending & 1][property];
  else return (...args) => args[ascending & 1] - args[!ascending & 1];
}

function toNumber(property, _default = 0) {
  if (property)
    return (a, i, b) => ({
      ...b[i],
      [property]: a[property] === undefined ? _default : a[property],
    });
  else return (a) => a === undefined ? _default : a;
}

function enumGetKey(a) {
  return a.jid;
}

function isNumber(x) {
  if (!x) return x;
  x = parseInt(x);
  return typeof x === "number" && !isNaN(x);
}