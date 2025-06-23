import fs from 'fs';
import path from 'path';

const classes = [
    {
        name: "KECEPATAN",
        latihan: "kecepatan",
        biaya: 12500,
        durasi: 10,
        reward: { type: 'speed', value: 10 }
    },
    {
        name: "KETANGGUHAN",
        latihan: "ketangguhan",
        biaya: 7500,
        durasi: 15,
        reward: { type: 'defense', value: 15 }
    },
    {
        name: "KEKUATAN",
        latihan: "kekuatan",
        biaya: 10000,
        durasi: 20,
        reward: { type: 'strength', value: 20 }
    }
];

export async function handler(m, { conn, command, text, usedPrefix }) {
    const user = global.db.data.users[m.sender];

    if (command === 'academy') {
        let message = `*「 🏫 ACADEMY RPG 」*\n\n`;

        for (let cls of classes) {
            const rewardEmoji = cls.reward.type === 'speed' ? '⚡' :
                                cls.reward.type === 'defense' ? '🛡️' :
                                cls.reward.type === 'strength' ? '💪' : '';
            message += `📘 *${cls.name}*\n`;
            message += `🧪 Latihan: ${cls.latihan}\n`;
            message += `💰 Biaya: ${cls.biaya} 💵\n`;
            message += `⏱️ Durasi: ${cls.durasi} menit\n`;
            message += `🎖️ Hadiah: +${cls.reward.value} ${rewardEmoji} ${cls.name}\n\n`;
        }

        message += `📝 Ketik *${usedPrefix}joinclass <nama_kelas>* untuk mengikuti kelas.\n`;
        message += `Contoh: *${usedPrefix}joinclass kecepatan*`;

        // Ambil file package.json sebagai buffer
        const filePath = path.resolve('./package.json'); // pastikan path benar
        const buffer = fs.readFileSync(filePath); // baca file sebagai buffer

        await conn.sendMessage(m.chat, {
            document: buffer,
            fileName: `Powered By Sanz Verse`,
            mimetype: 'application/pdf',
            caption: message.trim(),
            contextInfo: {
                externalAdReply: {
                    title: `🏫 Academy RPG`,
                    thumbnailUrl: "https://pomf2.lain.la/f/ns0lcrwx.jpg",
                    mediaType: 1,
                    renderLargerThumbnail: true,
                }
            }
        }, { quoted: fkontak });
    }



    if (command === 'joinclass') {
        const className = text.trim().toLowerCase();
        const cls = classes.find(c => c.latihan === className);

        if (!cls) {
            return await m.reply(`Kelas tidak ditemukan. Silakan ketik *.academy* untuk melihat daftar kelas.`);
        }

        const now = Date.now();
        if (user.lastJoinedClass && (now - user.lastJoinedClass < user.classCooldown)) {
            const remainingTime = Math.ceil((user.classCooldown - (now - user.lastJoinedClass)) / 60000);
            return await m.reply(`⏳ Kamu masih dalam sesi latihan. Tunggu ${remainingTime} menit lagi untuk ikut kelas baru.`);
        }

        if (user.money < cls.biaya) {
            return await m.reply(`💸 Uangmu tidak cukup. Biaya kelas ini adalah ${cls.biaya} 💵.`);
        }

        user.money -= cls.biaya;
        user.lastJoinedClass = now;
        user.classCooldown = cls.durasi * 60000;

        await m.reply(`📚 Kamu telah bergabung di kelas *${cls.name}*. Latihan akan berlangsung selama ${cls.durasi} menit.`);

        setTimeout(async () => {
            if (cls.reward.type === 'speed') user.speed = (user.speed || 0) + cls.reward.value;
            if (cls.reward.type === 'defense') user.defense = (user.defense || 0) + cls.reward.value;
            if (cls.reward.type === 'strength') user.strength = (user.strength || 0) + cls.reward.value;

            await m.reply(`✅ Latihan *${cls.name}* selesai!\nKamu mendapat +${cls.reward.value} ${cls.reward.type === 'speed' ? '⚡ Kecepatan' : cls.reward.type === 'defense' ? '🛡️ Ketangguhan' : '💪 Kekuatan'}.`);
        }, cls.durasi * 60000);
    }
}

handler.help = ['academy', 'joinclass <nama_kelas>'];
handler.tags = ['rpg'];
handler.command = ['academy', 'joinclass'];
handler.rpg = true;
handler.group = true;
handler.register = true;

export default handler;