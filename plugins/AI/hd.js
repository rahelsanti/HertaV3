import FormData from "form-data";
import * as jimp from 'jimp'

async function processing(urlPath, method) {
  return new Promise(async (resolve, reject) => {
    let Methods = ["enhance", "recolor", "dehaze"];
    Methods.includes(method) ? (method = method) : (method = Methods[0]);
    let buffer,
      Form = new FormData(),
      scheme = "https" + "://" + "inferenceengine" + ".vyro" + ".ai/" + method;
    Form.append("model_version", 1, {
      "Content-Transfer-Encoding": "binary",
      contentType: "multipart/form-data; charset=uttf-8",
    });
    Form.append("image", Buffer.from(urlPath), {
      filename: "enhance_image_body.jpg",
      contentType: "image/jpeg",
    });
    Form.submit(
      {
        url: scheme,
        host: "inferenceengine" + ".vyro" + ".ai",
        path: "/" + method,
        protocol: "https:",
        headers: {
          "User-Agent": "okhttp/4.9.3",
          Connection: "Keep-Alive",
          "Accept-Encoding": "gzip",
        },
      },
      function (err, res) {
        if (err) reject();
        let data = [];
        res
          .on("data", function (chunk, resp) {
            data.push(chunk);
          })
          .on("end", () => {
            resolve(Buffer.concat(data));
          });
        res.on("error", (e) => {
          reject();
        });
      }
    );
  });
}

let handler = async (m, { conn, usedPrefix, command }) => {
  switch (command) {
    case "hdr":
    case "hd":
      {
        const user = global.db.data.users[m.sender];
        const isPremium = user?.premium;

        // Inisialisasi queue jika belum ada
        if (!conn.hdrQueue) conn.hdrQueue = [];
        if (!conn.hdrProcessing) conn.hdrProcessing = false;

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || q.mediaType || "";
        if (!mime) return m.reply(`[❗] ғᴏᴛᴏɴʏᴀ ᴍᴀɴᴀ ᴋᴀᴋ?`);
        if (!/image\/(jpe?g|png)/.test(mime))
          return m.reply(`[❌] ᴍɪᴍᴇ ${mime} ᴛɪᴅᴀᴋ sᴜᴘᴘᴏʀᴛ`);

        const processHD = async (messageObj, imageBuffer) => {
          try {
            const result = await processing(imageBuffer, "enhance");
            await conn.sendFile(messageObj.chat, result, "", "[✅] sᴜᴅᴀʜ ᴊᴀᴅɪ ᴋᴀᴋ", messageObj);
            await conn.sendMessage(messageObj.chat, { react: { text: '✅', key: messageObj.key } });
          } catch (error) {
            console.error('[❌] Gagal proses HD:', error);
            await conn.sendMessage(messageObj.chat, { react: { text: '❌', key: messageObj.key } });
            await conn.sendMessage(messageObj.chat, { 
              text: '[❌] ᴘʀᴏsᴇs ɢᴀɢᴀʟ, ᴄᴏʙᴀ ʟᴀɢɪ ɴᴀɴᴛɪ ʏᴀ ᴋᴀᴋ' 
            }, { quoted: messageObj });
          }
        };

        // Jika premium, langsung proses
        if (isPremium) {
          await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
          await m.reply("[⏳] ᴘʀᴏsᴇs ᴋᴀᴋ...");
          let img = await q.download();
          return await processHD(m, img);
        }

        // Cek apakah user sudah ada di antrian
        const alreadyInQueue = conn.hdrQueue.find(entry => entry.sender === m.sender);
        if (alreadyInQueue) {
          const pos = conn.hdrQueue.findIndex(entry => entry.sender === m.sender) + 1;
          return m.reply(`[⏳] ᴋᴀᴍᴜ sᴜᴅᴀʜ ᴀᴅᴀ ᴅɪ ᴀɴᴛʀɪᴀɴ ᴋᴇ *${pos}*, sɪʟᴀʜᴋᴀɴ ᴛᴜɴɢɢᴜ ʜɪɴɢɢᴀ ᴘʀᴏsᴇs ᴋᴀᴍᴜ`);
        }

        // Cek batas maksimal antrian
        if (conn.hdrQueue.length >= 10) {
          return m.reply(`[❌] ᴀɴᴛʀɪᴀɴ ᴘᴇɴᴜʜ ᴋᴀᴋ, ᴍᴀᴋsɪᴍᴀʟ ʜᴀɴʏᴀ *10 ᴘᴇɴɢɢᴜɴᴀ*. ᴄᴏʙᴀ ʟᴀɢɪ ɴᴀɴᴛɪ`);
        }

        // Download gambar sebelum masuk antrian
        let img = await q.download();

        // Tambahkan ke antrian
        conn.hdrQueue.push({ 
          m: m, 
          sender: m.sender, 
          imageBuffer: img,
          chat: m.chat,
          key: m.key
        });
        
        const pos = conn.hdrQueue.length;
        await m.reply(`[⏳] ᴋᴀᴍᴜ ʙᴇʀᴀᴅᴀ ᴅɪ ᴀɴᴛʀɪᴀɴ ᴋᴇ *#${pos}* sɪʟᴀʜᴋᴀɴ ᴛᴜɴɢɢᴜ ʜɪɴɢɢᴀ ᴘʀᴏsᴇs ᴋᴀᴍᴜ, ᴜᴘɢʀᴀᴅᴇ ᴋᴇ ᴘʀᴇᴍɪᴜᴍ ᴅᴇɴɢᴀɴ ᴄᴀʀᴀ ᴋᴇᴛɪᴋ .sᴇᴡᴀ sᴜᴘᴀʏᴀ ᴛɪᴅᴀᴋ ᴍᴇɴᴜɴɢɢᴜ ᴛᴇʀʟᴀʟᴜ ʟᴀᴍᴀ`);

        // Mulai proses antrian jika belum berjalan
        if (!conn.hdrProcessing) {
          conn.hdrProcessing = true;
          processHDQueue(conn, processHD);
        }
      }
      break;
  }
};

async function processHDQueue(conn, processHD) {
  while (conn.hdrQueue.length > 0) {
    const queueItem = conn.hdrQueue[0];
    const { m, imageBuffer, chat, key, sender } = queueItem;
    
    try {
      await conn.sendMessage(chat, { react: { text: '⏳', key: key } });
      await conn.sendMessage(chat, { 
        text: '[⏳] ᴘʀᴏsᴇs ᴋᴀᴋ...' 
      }, { quoted: m });
      
      // Buat object message yang benar untuk proses
      const messageObj = {
        chat: chat,
        key: key,
        reply: async (text) => {
          await conn.sendMessage(chat, { text }, { quoted: m });
        }
      };
      
      // Proses gambar dengan buffer yang tepat
      await processHD(messageObj, imageBuffer);
      
      // Delay sebelum proses berikutnya
      await new Promise(res => setTimeout(res, 2000));
      
    } catch (e) {
      console.error('❌ Gagal proses antrian HD:', e);
      await conn.sendMessage(chat, { react: { text: '❌', key: key } });
      await conn.sendMessage(chat, { 
        text: '[❌] ᴛᴇʀᴊᴀᴅɪ ᴋᴇsᴀʟᴀʜᴀɴ sᴀᴀᴛ ᴍᴇᴍᴘʀᴏsᴇs ɢᴀᴍʙᴀʀ ᴋᴀᴍᴜ' 
      }, { quoted: m });
    }

    // Hapus item pertama dari antrian
    conn.hdrQueue.shift();
  }

  // Set processing ke false setelah semua antrian selesai
  conn.hdrProcessing = false;
}

handler.help = ["remini2", "color", "hdr"];
handler.tags = ["ai"];
handler.command = ["hd", "hdr"];
export default handler;