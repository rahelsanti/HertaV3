let handler  = async (m, { conn, isOwner}) => {
 const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = await import("baileys")
let msgs = generateWAMessageFromContent(m.chat, {
  viewOnceMessage: {
    message: {
        "messageContextInfo": {
          "deviceListMetadata": {},
          "deviceListMetadataVersion": 2
        },
        interactiveMessage: proto.Message.InteractiveMessage.create({
          body: proto.Message.InteractiveMessage.Body.create({
            text: `\`P A Y M E N T\`

 *E-Wallet* 

ᴅᴀɴᴀ: 081401689098
ɢᴏᴘᴀʏ: [ Tidak Tersedia ]
ᴏᴠᴏ: [ Tidak Tersedia ]
ᴘᴜʟsᴀ: 081401689098`,
          }),
          footer: proto.Message.InteractiveMessage.Footer.create({
            text: "© Herta-V7 || PT.dana_indonesia",
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: [
{                "name": "quick_reply",
                "buttonParamsJson": "{\"display_text\":\"🎉 ᴘʀᴇᴍɪᴜᴍ\",\"id\":\"!sewa\"}"
},
{                "name": "quick_reply",
                "buttonParamsJson": "{\"display_text\":\"💳 ǫʀɪs\",\"id\":\"!qris\"}"
},
           ],
          })
        })
    }
  }
}, {})

return await conn.relayMessage(m.key.remoteJid, msgs.message, {
  messageId: m.key.id
})
}

handler.command = /^(payment|pay)$/i;
handler.tags = ["info"];
handler.help = ['payment']

export default handler
