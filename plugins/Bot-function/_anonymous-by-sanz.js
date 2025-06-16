import fs from 'fs-extra'

let handler = (m) => m;
handler.before = async function (m, { conn, prefix }) {
    // Skip jika bukan private chat atau adalah command
    if (m.isGroup || m.body?.startsWith(prefix)) return;
    
    // Cek apakah user sedang dalam anonymous chat
    this.anonymous = this.anonymous || {}
    let currentRoom = Object.values(this.anonymous).find(room => 
        room.check && room.check(m.sender) && room.state === 'CHATTING'
    )
    
    // Jika tidak dalam room atau room tidak valid, skip
    if (!currentRoom || !currentRoom.other) return;
    
    let partner = currentRoom.other(m.sender);
    if (!partner) return;

    // Deteksi tipe media
    const isMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'contactMessage', 'viewOnceMessage', 'viewOnceMessageV2'].includes(m.type);
    const hasQuoted = m.quoted !== null;

    try {
        let contextInfo = {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '0@newsletter',
                newsletterName: 'Anonymous Chat',
                serverMessageId: 1
            }
        };

        let quotedMessage = null;
        
        // Handle quoted message jika ada
        if (hasQuoted && m.quoted.mtype) {
            let quotedContent = {};
            
            switch (m.quoted.mtype) {
                case 'imageMessage':
                    quotedContent = { imageMessage: m.quoted };
                    break;
                case 'videoMessage':
                    quotedContent = { videoMessage: m.quoted };
                    break;
                case 'audioMessage':
                    quotedContent = { audioMessage: m.quoted };
                    break;
                case 'stickerMessage':
                    quotedContent = { stickerMessage: m.quoted };
                    break;
                case 'contactMessage':
                    quotedContent = { contactMessage: m.quoted };
                    break;
                case 'viewOnceMessage':
                case 'viewOnceMessageV2':
                    quotedContent = { viewOnceMessage: m.quoted };
                    break;
                case 'extendedTextMessage':
                    quotedContent = {
                        extendedTextMessage: {
                            text: m.quoted.text || m.quoted.caption || '',
                            contextInfo: m.quoted.contextInfo || {}
                        }
                    };
                    break;
                default:
                    quotedContent = {
                        extendedTextMessage: {
                            text: m.quoted.text || m.quoted.caption || 'Pesan'
                        }
                    };
            }

            quotedMessage = {
                key: {
                    fromMe: false,
                    participant: conn.user.jid,
                    remoteJid: partner
                },
                message: quotedContent
            };
        }

        // Kirim pesan berdasarkan tipe
        if (!isMedia) {
            // Text message
            await conn.sendMessage(partner, {
                text: m.body || m.text || '',
                contextInfo
            }, quotedMessage ? { quoted: quotedMessage } : {});
            
        } else {
            // Media message
            let mediaBuffer;
            let tempFile;
            
            try {
                // Download media
                if (conn.downloadMed) {
                    tempFile = await conn.downloadMed(m.msg);
                    mediaBuffer = fs.readFileSync(tempFile);
                } else {
                    mediaBuffer = await conn.downloadMediaMessage(m);
                }

                let mediaOptions = { contextInfo };
                if (quotedMessage) mediaOptions.quoted = quotedMessage;

                // Kirim berdasarkan tipe media
                switch (m.type) {
                    case 'imageMessage':
                        await conn.sendMessage(partner, {
                            image: mediaBuffer,
                            caption: m.caption || '',
                            ...mediaOptions
                        });
                        break;
                        
                    case 'videoMessage':
                        await conn.sendMessage(partner, {
                            video: mediaBuffer,
                            caption: m.caption || '',
                            ...mediaOptions
                        });
                        break;
                        
                    case 'audioMessage':
                        await conn.sendMessage(partner, {
                            audio: mediaBuffer,
                            mimetype: m.mimetype || 'audio/mp4',
                            ...mediaOptions
                        });
                        break;
                        
                    case 'stickerMessage':
                        await conn.sendMessage(partner, {
                            sticker: mediaBuffer,
                            ...mediaOptions
                        });
                        break;
                        
                    case 'contactMessage':
                        await conn.sendMessage(partner, {
                            contact: {
                                displayName: m.contact?.displayName || 'Contact',
                                vcard: m.contact?.vcard || ''
                            },
                            ...mediaOptions
                        });
                        break;
                        
                    case 'viewOnceMessage':
                    case 'viewOnceMessageV2':
                        // Forward view once message
                        await conn.copyNForward(partner, m, true);
                        break;
                        
                    default:
                        await conn.sendMessage(partner, {
                            text: '❌ Media tidak didukung',
                            contextInfo
                        });
                }

                // Cleanup temp file
                if (tempFile && fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
                
            } catch (mediaError) {
                console.error('Media handling error:', mediaError);
                await conn.sendMessage(partner, {
                    text: '❌ Gagal mengirim media',
                    contextInfo
                });
                
                if (tempFile && fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            }
        }

        // React untuk konfirmasi (optional)
        // await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (error) {
        console.error('Anonymous chat error:', error);
        await conn.sendMessage(m.chat, {
            text: '❌ Gagal mengirim pesan ke partner'
        });
    }
};

export default handler;