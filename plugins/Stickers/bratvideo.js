import axios from 'axios';

const handler = async (m, { conn, args, usedPrefix, command }) => {
    const q = m.quoted?.text || args.join(" ");
    if (!q) return m.reply(`Gunakan format: ${usedPrefix}${command} <teks>`);

    const user = global.db.data.users[m.sender];
    const isPremium = user?.premium;
    const mediaUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(q)}&isAnimated=true&delay=650`;

    if (!conn.bratVideoQueue) conn.bratVideoQueue = [];
    if (!conn.bratVideoProcessing) conn.bratVideoProcessing = false;

    const sendSticker = async (msg) => {
        try {
            await conn.toSticker(msg.chat, mediaUrl, msg); // proses jadi sticker
            await conn.sendMessage(msg.chat, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('[❌] Gagal mengonversi brat video:', err);
            await conn.sendMessage(msg.chat, { react: { text: '❌', key: msg.key } });
            await msg.reply('Gagal mengonversi brat video ke stiker, coba lagi nanti ya Senpai >_<');
        }
    };

    if (isPremium) {
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        return await sendSticker(m);
    }

    const alreadyInQueue = conn.bratVideoQueue.find(entry => entry.sender === m.sender);
    if (alreadyInQueue) {
        const pos = conn.bratVideoQueue.findIndex(entry => entry.sender === m.sender) + 1;
        return m.reply(`(>///<) Kamu sudah ada di antrian ke *${pos}*, Senpai~\nTunggu giliranmu ya~`);
    }

    if (conn.bratVideoQueue.length >= 10) {
        return m.reply(`(╥﹏╥) Antrian penuh, Senpai~\nMaksimal hanya *10 pengguna*. Coba lagi nanti.`);
    }

    conn.bratVideoQueue.push({ m, sender: m.sender });
    const pos = conn.bratVideoQueue.length;
    await m.reply(`(>///<) Kamu masuk antrian ke *${pos}*, Senpai~\nUpgrade ke *Premium* biar langsung diproses tanpa antri~ ketik *.buypremium* 💎`);

    if (!conn.bratVideoProcessing) {
        conn.bratVideoProcessing = true;
        await processBratVideoQueue(conn, sendSticker);
    }
};

async function processBratVideoQueue(conn, sendSticker) {
    while (conn.bratVideoQueue.length > 0) {
        const { m } = conn.bratVideoQueue[0];
        try {
            await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
            await new Promise(res => setTimeout(res, 3000)); // delay antar pengguna
            await sendSticker(m);
        } catch (e) {
            console.error('❌ Gagal proses antrian bratvideo:', e);
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await m.reply('Terjadi kesalahan saat memproses brat video kamu >_<');
        }

        conn.bratVideoQueue.shift();
    }

    conn.bratVideoProcessing = false;
}

handler.command = ['bratvideo'];
handler.help = ['bratvideo <teks>'];
handler.tags = ['sticker'];

export default handler;