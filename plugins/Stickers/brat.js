import fs from 'fs-extra';
import axios from 'axios';

const handler = async (m, { conn, args, usedPrefix, command }) => {
    const q = m.quoted?.text || args.join(" ");
    if (!q) return m.reply(`[❗] ɢᴜɴᴀᴋᴀɴ ғᴏʀᴍᴀᴛ: ${usedPrefix}${command} <ᴛᴇᴋs>`);

    const user = global.db.data.users[m.sender];
    const isPremium = user?.premium;
    const mediaUrl = `https://brat.caliphdev.com/api/brat?text=${encodeURIComponent(q)}`;
    const fallbackUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(q)}`;

    // Inisialisasi queue jika belum ada
    if (!conn.bratQueue) conn.bratQueue = [];
    if (!conn.bratProcessing) conn.bratProcessing = false;

    const sendStickerWithFallback = async (messageObj) => {
        try {
            await conn.toSticker(messageObj.chat, mediaUrl, messageObj);
            await conn.sendMessage(messageObj.chat, { react: { text: '✅', key: messageObj.key } });
        } catch (err) {
            console.log('[❌] Gagal API utama, mencoba fallback...');
            try {
                const { data } = await axios.get(fallbackUrl, { responseType: 'arraybuffer' });
                await conn.sendMessage(messageObj.chat, {
                    sticker: data
                }, { quoted: messageObj });
                await conn.sendMessage(messageObj.chat, { react: { text: '✅', key: messageObj.key } });
            } catch (e) {
                console.error('Fallback gagal:', e);
                await conn.sendMessage(messageObj.chat, { react: { text: '❌', key: messageObj.key } });
                await messageObj.reply('[❌] ɢᴀɢᴀʟ ᴍᴇᴍʙᴜᴀᴛ ʙʀᴀᴛ ᴅᴀʀɪ ᴋᴇᴅᴜᴀ sᴜᴍʙᴇʀ, ᴄᴏʙᴀ ʟᴀɢɪ ɴᴀɴᴛɪ ʏᴀ sᴇɴᴘᴀɪ');
            }
        }
    };

    // Jika premium, langsung proses
    if (isPremium) {
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        return await sendStickerWithFallback(m);
    }

    // Cek apakah user sudah ada di antrian
    const alreadyInQueue = conn.bratQueue.find(entry => entry.sender === m.sender);
    if (alreadyInQueue) {
        const pos = conn.bratQueue.findIndex(entry => entry.sender === m.sender) + 1;
        return m.reply(`[⏳] ᴋᴀᴍᴜ sᴜᴅᴀʜ ᴀᴅᴀ ᴅɪ ᴀɴᴛʀɪᴀɴ ᴋᴇ *${pos}*, sɪʟᴀʜᴋᴀɴ ᴛᴜɴɢɢᴜ ʜɪɴɢɢᴀ ᴘʀᴏsᴇs ᴋᴀᴍᴜ`);
    }

    // Cek batas maksimal antrian
    if (conn.bratQueue.length >= 10) {
        return m.reply(`[❌] ᴀɴᴛʀɪᴀɴ ᴘᴇɴᴜʜ sᴇɴᴘᴀɪ, ᴍᴀᴋsɪᴍᴀʟ ʜᴀɴʏᴀ *10 ᴘᴇɴɢɢᴜɴᴀ*. ᴄᴏʙᴀ ʟᴀɢɪ ɴᴀɴᴛɪ`);
    }

    // Tambahkan ke antrian
    conn.bratQueue.push({ 
        m: m, 
        sender: m.sender, 
        text: q,
        chat: m.chat,
        key: m.key
    });
    
    const pos = conn.bratQueue.length;
    await m.reply(`[⏳] ᴋᴀᴍᴜ ʙᴇʀᴀᴅᴀ ᴅɪ ᴀɴᴛʀɪᴀɴ ᴋᴇ *#${pos}* sɪʟᴀʜᴋᴀɴ ᴛᴜɴɢɢᴜ ʜɪɴɢɢᴀ ᴘʀᴏsᴇs ᴋᴀᴍᴜ, ᴜᴘɢʀᴀᴅᴇ ᴋᴇ ᴘʀᴇᴍɪᴜᴍ ᴅᴇɴɢᴀɴ ᴄᴀʀᴀ ᴋᴇᴛɪᴋ .sᴇᴡᴀ sᴜᴘᴀʏᴀ ᴛɪᴅᴀᴋ ᴍᴇɴᴜɴɢɢᴜ ᴛᴇʀʟᴀʟᴜ ʟᴀᴍᴀ`);

    // Mulai proses antrian jika belum berjalan
    if (!conn.bratProcessing) {
        conn.bratProcessing = true;
        processQueue(conn, sendStickerWithFallback);
    }
};

async function processQueue(conn, sendStickerWithFallback) {
    while (conn.bratQueue.length > 0) {
        const queueItem = conn.bratQueue[0];
        const { m, text, chat, key, sender } = queueItem;
        
        try {
            // Update URL dengan text yang benar dari antrian
            const mediaUrl = `https://brat.caliphdev.com/api/brat?text=${encodeURIComponent(text)}`;
            const fallbackUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}`;
            
            await conn.sendMessage(chat, { react: { text: '⏳', key: key } });
            
            // Buat object message yang benar untuk proses
            const messageObj = {
                chat: chat,
                key: key,
                reply: async (text) => {
                    await conn.sendMessage(chat, { text }, { quoted: m });
                }
            };
            
            // Proses sticker dengan URL yang tepat
            try {
                await conn.toSticker(chat, mediaUrl, m);
                await conn.sendMessage(chat, { react: { text: '✅', key: key } });
            } catch (err) {
                console.log('[❌] Gagal API utama, mencoba fallback...');
                try {
                    const { data } = await axios.get(fallbackUrl, { responseType: 'arraybuffer' });
                    await conn.sendMessage(chat, {
                        sticker: data
                    }, { quoted: m });
                    await conn.sendMessage(chat, { react: { text: '✅', key: key } });
                } catch (e) {
                    console.error('Fallback gagal:', e);
                    await conn.sendMessage(chat, { react: { text: '❌', key: key } });
                    await conn.sendMessage(chat, { 
                        text: '[❌] ɢᴀɢᴀʟ ᴍᴇᴍʙᴜᴀᴛ ʙʀᴀᴛ ᴅᴀʀɪ ᴋᴇᴅᴜᴀ sᴜᴍʙᴇʀ, ᴄᴏʙᴀ ʟᴀɢɪ ɴᴀɴᴛɪ ʏᴀ sᴇɴᴘᴀɪ' 
                    }, { quoted: m });
                }
            }
            
            // Delay sebelum proses berikutnya
            await new Promise(res => setTimeout(res, 2000));
            
        } catch (e) {
            console.error('❌ Gagal proses antrian:', e);
            await conn.sendMessage(chat, { react: { text: '❌', key: key } });
            await conn.sendMessage(chat, { 
                text: '[❌] ᴛᴇʀᴊᴀᴅɪ ᴋᴇsᴀʟᴀʜᴀɴ sᴀᴀᴛ ᴍᴇᴍᴘʀᴏsᴇs ʙʀᴀᴛ ᴋᴀᴍᴜ' 
            }, { quoted: m });
        }

        // Hapus item pertama dari antrian
        conn.bratQueue.shift();
    }

    // Set processing ke false setelah semua antrian selesai
    conn.bratProcessing = false;
}

handler.command = ['brat'];
handler.help = ['brat <teks>'];
handler.tags = ['sticker'];

export default handler;