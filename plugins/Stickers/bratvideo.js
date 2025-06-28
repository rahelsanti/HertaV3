import axios from 'axios';

const handler = async (m, { conn, args, usedPrefix, command }) => {
    const q = m.quoted?.text || args.join(" ");
    if (!q) return m.reply(`[❗] ɢᴜɴᴀᴋᴀɴ ғᴏʀᴍᴀᴛ: ${usedPrefix}${command} <ᴛᴇᴋs>`);

    const user = global.db.data.users[m.sender];
    const isPremium = user?.premium;

    // Inisialisasi queue jika belum ada
    if (!conn.bratVideoQueue) conn.bratVideoQueue = [];
    if (!conn.bratVideoProcessing) conn.bratVideoProcessing = false;

    const sendSticker = async (messageObj, text) => {
        try {
            const mediaUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=true&delay=650`;
            await conn.toSticker(messageObj.chat, mediaUrl, messageObj);
            await conn.sendMessage(messageObj.chat, { react: { text: '✅', key: messageObj.key } });
        } catch (err) {
            console.error('[❌] Gagal mengonversi brat video:', err);
            await conn.sendMessage(messageObj.chat, { react: { text: '❌', key: messageObj.key } });
            await conn.sendMessage(messageObj.chat, { 
                text: '[❌] ɢᴀɢᴀʟ ᴍᴇɴɢᴏɴᴠᴇʀsɪ ʙʀᴀᴛ ᴠɪᴅᴇᴏ ᴋᴇ sᴛɪᴋᴇʀ, ᴄᴏʙᴀ ʟᴀɢɪ ɴᴀɴᴛɪ ʏᴀ sᴇɴᴘᴀɪ' 
            }, { quoted: messageObj });
        }
    };

    // Jika premium, langsung proses
    if (isPremium) {
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        return await sendSticker(m, q);
    }

    // Cek apakah user sudah ada di antrian
    const alreadyInQueue = conn.bratVideoQueue.find(entry => entry.sender === m.sender);
    if (alreadyInQueue) {
        const pos = conn.bratVideoQueue.findIndex(entry => entry.sender === m.sender) + 1;
        return m.reply(`[⏳] ᴋᴀᴍᴜ sᴜᴅᴀʜ ᴀᴅᴀ ᴅɪ ᴀɴᴛʀɪᴀɴ ᴋᴇ *${pos}*, sɪʟᴀʜᴋᴀɴ ᴛᴜɴɢɢᴜ ʜɪɴɢɢᴀ ᴘʀᴏsᴇs ᴋᴀᴍᴜ`);
    }

    // Cek batas maksimal antrian
    if (conn.bratVideoQueue.length >= 10) {
        return m.reply(`[❌] ᴀɴᴛʀɪᴀɴ ᴘᴇɴᴜʜ sᴇɴᴘᴀɪ, ᴍᴀᴋsɪᴍᴀʟ ʜᴀɴʏᴀ *10 ᴘᴇɴɢɢᴜɴᴀ*. ᴄᴏʙᴀ ʟᴀɢɪ ɴᴀɴᴛɪ`);
    }

    // Tambahkan ke antrian
    conn.bratVideoQueue.push({ 
        m: m, 
        sender: m.sender, 
        text: q,
        chat: m.chat,
        key: m.key
    });
    
    const pos = conn.bratVideoQueue.length;
    await m.reply(`[⏳] ᴋᴀᴍᴜ ʙᴇʀᴀᴅᴀ ᴅɪ ᴀɴᴛʀɪᴀɴ ᴋᴇ *#${pos}* sɪʟᴀʜᴋᴀɴ ᴛᴜɴɢɢᴜ ʜɪɴɢɢᴀ ᴘʀᴏsᴇs ᴋᴀᴍᴜ, ᴜᴘɢʀᴀᴅᴇ ᴋᴇ ᴘʀᴇᴍɪᴜᴍ ᴅᴇɴɢᴀɴ ᴄᴀʀᴀ ᴋᴇᴛɪᴋ .sᴇᴡᴀ sᴜᴘᴀʏᴀ ᴛɪᴅᴀᴋ ᴍᴇɴᴜɴɢɢᴜ ᴛᴇʀʟᴀʟᴜ ʟᴀᴍᴀ`);

    // Mulai proses antrian jika belum berjalan
    if (!conn.bratVideoProcessing) {
        conn.bratVideoProcessing = true;
        processBratVideoQueue(conn, sendSticker);
    }
};

async function processBratVideoQueue(conn, sendSticker) {
    while (conn.bratVideoQueue.length > 0) {
        const queueItem = conn.bratVideoQueue[0];
        const { m, text, chat, key, sender } = queueItem;
        
        try {
            await conn.sendMessage(chat, { react: { text: '⏳', key: key } });
            
            // Buat object message yang benar untuk proses
            const messageObj = {
                chat: chat,
                key: key,
                reply: async (text) => {
                    await conn.sendMessage(chat, { text }, { quoted: m });
                }
            };
            
            // Proses sticker dengan teks yang tepat
            await sendSticker(messageObj, text);
            
            // Delay sebelum proses berikutnya
            await new Promise(res => setTimeout(res, 3000));
            
        } catch (e) {
            console.error('❌ Gagal proses antrian bratvideo:', e);
            await conn.sendMessage(chat, { react: { text: '❌', key: key } });
            await conn.sendMessage(chat, { 
                text: '[❌] ᴛᴇʀᴊᴀᴅɪ ᴋᴇsᴀʟᴀʜᴀɴ sᴀᴀᴛ ᴍᴇᴍᴘʀᴏsᴇs ʙʀᴀᴛ ᴠɪᴅᴇᴏ ᴋᴀᴍᴜ' 
            }, { quoted: m });
        }

        // Hapus item pertama dari antrian
        conn.bratVideoQueue.shift();
    }

    // Set processing ke false setelah semua antrian selesai
    conn.bratVideoProcessing = false;
}

handler.command = ['bratvideo', 'bratvid'];
handler.help = ['bratvideo <teks>'];
handler.tags = ['sticker'];

export default handler;