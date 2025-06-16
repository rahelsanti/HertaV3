async function handler(m, { command, conn, text }) {
    try {
        // fkontak dummy
        const fkontak = {
            key: {
                participants: '0@s.whatsapp.net',
                remoteJid: 'status@broadcast',
                fromMe: false,
                id: 'Halo'
            },
            message: {
                contactMessage: {
                    displayName: 'Anonymous Chat',
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;Anonymous;;;\nFN:Anonymous\nitem1.TEL;waid=0:0\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
                }
            },
            participant: '0@s.whatsapp.net'
        }

        this.anonymous = this.anonymous || {}
        let who = m.mentionedJid?.[0] || (m.fromMe ? conn.user.jid : m.sender)
        let room = Object.values(this.anonymous).find(room => room.check(who))
        if (!room)
            return conn.sendMessage(m.chat, { text: '❌ Kamu tidak berada di anonymous chat!\nGunakan *.start* untuk memulai anonymous chat.' }, { quoted: fkontak })

        let other = room.other(who)
        if (!other)
            return conn.sendMessage(m.chat, { text: '❌ Partner tidak ditemukan atau telah meninggalkan chat.' }, { quoted: fkontak })

        let name = text ? text.trim() : conn.getName(m.sender) || 'Anonymous User'
        let number = who.split('@')[0]

        let contactInfo = `┌─ 📞 *KONTAK PARTNER*
├ 📱 Nomor: ${number}
├ 👤 Nama: ${name}
└─ 💬 Dari: Anonymous Chat`

        // Notifikasi ke pengirim
        await conn.sendMessage(m.chat, { text: '📤 Mengirimkan kontak ke partner...' }, { quoted: fkontak })

        // Notifikasi ke partner
        await conn.sendMessage(other, { text: '📨 Partner mengirimkan kontak kepadamu!' }, { quoted: fkontak })

        try {
            let profilePicUrl = await conn.profilePictureUrl(m.sender, 'image').catch(_ => null)

            if (conn.sendHydrated) {
                await conn.sendHydrated(
                    other,
                    `🔗 *ANONYMOUS CHAT*`,
                    contactInfo,
                    profilePicUrl || './src/avatar_contact.png',
                    `https://wa.me/${number}`,
                    '💬 Chat Partner',
                    null,
                    null,
                    [
                        ['🚪 Leave Chat', '.leave'],
                        ['🔄 Next Partner', '.next'],
                        ['❓ Help', '.help anonymous']
                    ],
                    0,
                    { quoted: fkontak, mentionedJid: [m.sender] }
                )
            } else {
                await conn.sendMessage(other, {
                    text: contactInfo + `\n\n🔗 Link: https://wa.me/${number}`,
                    contextInfo: {
                        mentionedJid: [m.sender],
                        externalAdReply: {
                            title: '📞 Kontak Partner',
                            body: `Nama: ${name}`,
                            thumbnailUrl: profilePicUrl,
                            sourceUrl: `https://wa.me/${number}`,
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: fkontak })
            }

            await conn.sendMessage(m.chat, { text: '✅ Kontak berhasil dikirim ke partner!' }, { quoted: fkontak })

        } catch (sendError) {
            console.error('Error sending contact:', sendError)

            await conn.sendMessage(other, {
                text: contactInfo + `\n\n🔗 Link: https://wa.me/${number}`
            }, { quoted: fkontak })

            await conn.sendMessage(m.chat, { text: '✅ Kontak berhasil dikirim (mode sederhana)' }, { quoted: fkontak })
        }

    } catch (error) {
        console.error('Sendkontak error:', error)
        await conn.sendMessage(m.chat, { text: '❌ Terjadi kesalahan saat mengirim kontak. Silakan coba lagi.' }, { quoted: fkontak })
    }
}

handler.help = ['sendkontak [nama]']
handler.tags = ['anonymous']
handler.command = /^(sendkontak|send|kontak)$/i
handler.private = true

export default handler