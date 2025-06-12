const { generateWAMessageFromContent, prepareWAMessageMedia,  proto, generateWAMessageContent  } = require("baileys");
let handler = async (m, { conn }) => {

  // Define the carousel options
  const carouselItems = [
  {
    title: '*📕 PREMIUM ACCESS*',
    body: '7 Days : Rp5.000\n15 Days : Rp10.000,- (Bonus 3Days)\n30 Days : Rp15.000,- (Bonus 5Days)\nUnlimited Days : Rp50.000,-\n\n*❗Keuntungan :*\n• Unlimited Limit (Limit tak terbatas) 📍\n• Bonus EXP/Money 💰\n• Dapat Menggunakan Bot Secara Private 🔒\n• Dan masih banyak lagi 🔮',
    buttonText: 'Order Disini',
    imageUrl: 'https://files.catbox.moe/kdic8k.jpg',
    url: 'https://wa.me/6281401689098?text=Min+mau+sewa+Premium+Access'
  },
  {
    title: '*📒 GROUP ACCESS*',
    body: '30 Days : Rp25.000,- (Bonus 5Days)\n60 Days : Rp50.000,- (Bonus 10Days)\n365 Days : Rp250.000,- (Bonus 15Days)\n\n*❗Keuntungan :*\n• Bot Dapat digunakan seluruh member Group 👥\n• Member dapat menggunakan seluruh fitur yang hanya bisa di Group 🔐\n• Member dapat memainkan fitur Game & RPG 🎮\n',
    buttonText: 'Order Disini',
    imageUrl: 'https://files.catbox.moe/1t9wyt.jpg',
    url: 'https://wa.me/6281401689098?text=Min+mau+sewa+Group+Access'
  },
];

  // Function to create the image message
  async function createImage(url) {
    const { imageMessage } = await generateWAMessageContent({
      image: { url }
    }, {
      upload: conn.waUploadToServer
    });
    return imageMessage;
  }

  // Prepare the carousel
  let push = [];
  for (let item of carouselItems) {
    push.push({
      body: proto.Message.InteractiveMessage.Body.fromObject({
        text: item.body
      }),
      footer: proto.Message.InteractiveMessage.Footer.fromObject({
        text: 'Powered by Herta-V2'
      }),
      header: proto.Message.InteractiveMessage.Header.fromObject({
        title: item.title,
        hasMediaAttachment: true,
        imageMessage: await createImage(item.imageUrl)
      }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
  buttons: [
    {
      "name": "cta_url",
      "buttonParamsJson": `{"display_text":"${item.buttonText}","url":"${item.url}"}`
    }
  ]
})
    });
  }

  // Generate the carousel message
  const bot = generateWAMessageFromContent(m.chat, {
    viewOnceMessage: {
      message: {
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
          body: proto.Message.InteractiveMessage.Body.create({
            text: ""
          }),
          footer: proto.Message.InteractiveMessage.Footer.create({
            text: '❗Pilih layanan:'
          }),
          carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
            cards: [...push]
          })
        })
      }
    }
  }, { quoted: m });

  // Send the message
  await conn.relayMessage(m.chat, bot.message, {
    messageId: bot.key.id
  });
}

handler.help = ["sewa"];
handler.tags = ["services"];
handler.command = /^sewa|premium|sewabot|orderbot|buysewa|buypremium|buyprem$/i;

export default handler;
