import fs from "fs";

let handler = async (m, { conn }) => {
    let sender = m.sender;
    let who = m.mentionedJid && m.mentionedJid[0]
        ? m.mentionedJid[0]
        : m.fromMe
        ? conn.user.jid
        : sender;

    if (!(who in global.db.data.users)) {
        return m.reply(`User ${who} tidak ada dalam database`);
    }

    let user = global.db.data.users[who];
    let name = user?.name || await conn.getName(who);
    let nomor = who.split('@')[0];

    const caption = `
▧「 *BANK CEK* 」
│ 👤 Nama: ${user.registered ? user.name : name}
│ 💳 Atm: ${user.atm > 0 ? 'Level ' + user.atm : '❌'}
│ 🏦 Bank: ${user.bank.toLocaleString('id-ID')} / ${user.fullatm.toLocaleString('id-ID')}
│ 💰 Uang: ${user.money.toLocaleString('id-ID')}
│ ♋ Chip: ${user.chip.toLocaleString('id-ID')}
│ 🤖 Robo: ${user.robo > 9 ? 'MAX' : user.robo > 0 ? 'Level ' + user.robo : '❌'}
│ 🪙 BTC: ${user.btc.toFixed(8)}
│ 📑 Terdaftar: ${user.registered ? 'Yes ✅' : 'No ❌'}
└────···
`.trim();

    // Baca gambar lokal
    const thumbnail = fs.readFileSync('./media/bank.jpg');

    // Kirim pesan teks dengan thumbnail di contextInfo
    await conn.sendMessage(m.chat, {
        text: caption,
        contextInfo: {
            externalAdReply: {
                title: "BANK INFO 🏦",
                body: ``,
                thumbnail, // buffer gambar langsung
                sourceUrl: '',
                mediaType: 1,
                renderLargerThumbnail: true,
            }
        }
    }, {
        quoted: fkontak(name, nomor)
    });
};

handler.help = ['bank'];
handler.tags = ['rpg'];
handler.command = /^bank$/i;

handler.register = true;
handler.group = true;
handler.rpg = true;

export default handler;

// Fungsi quoted kontak
function fkontak(name, nomor) {
    const vcard = `
BEGIN:VCARD
VERSION:3.0
N:;${name};;;
FN:${name}
TEL;type=CELL;type=VOICE;waid=${nomor}:${nomor}
END:VCARD`.trim();

    return {
        key: {
            fromMe: false,
            participant: '0@s.whatsapp.net',
            remoteJid: 'status@broadcast'
        },
        message: {
            contactMessage: {
                displayName: name,
                vcard
            }
        }
    };
}