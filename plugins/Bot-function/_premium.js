let handler = m => m;

const { generateWAMessageFromContent, proto } = await import("baileys");

handler.before = async function () {
  try {
    const data = db.data.users;

    async function checkExpiration() {
      const currentTime = Date.now();
      for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
          const item = data[key];

          if (item.premiumNotified === undefined) item.premiumNotified = false;

          // Kirim pesan hanya jika premiumTime telah habis dan pesan belum dikirim
          if (item.premiumTime !== 0 && item.premiumTime < currentTime && !item.premiumNotified) {
            console.log(`Premium '${key}' telah berakhir!`);

            // Konten pesan interaktif
            let msg = generateWAMessageFromContent(key, {
              viewOnceMessage: {
                message: {
                  messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                  },
                  interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({
                      text: `⏰ *Premium Expired!*  
Akses kamu ke fitur premium telah berakhir.  
Hubungi Owner untuk memperpanjang sekarang!`,
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({
                      text: '© Herta-V2',
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                      buttons: [
                        {
                          name: 'cta_url',
                          buttonParamsJson: JSON.stringify({
                            display_text: 'Hubungi Owner',
                            url: 'https://wa.me/6281401689098',
                            merchant_url: 'https://wa.me/6281401689098'
                          })
                        },
                      ]
                    }),
                  }),
                }
              }
            }, { userJid: key });

            // Kirim pesan
            await conn.relayMessage(key, msg.message, { messageId: msg.key.id });

            // Tandai bahwa pesan telah dikirim
            item.premiumNotified = true;

            // Reset status premium
            item.premiumTime = 0;
            item.premium = false;
          }
        }
      }
    }

    // Jalankan interval dengan durasi lebih panjang untuk menghindari spam
    setInterval(checkExpiration, 60000); // Interval diperbesar menjadi 1 menit
  } catch (err) {
    console.log(err);
  }
};

export default handler;
