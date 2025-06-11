import got from 'got'
import cheerio from 'cheerio'
import axios from 'axios'

let handler = async (m, { conn, text, args, command, usedPrefix }) => {
    let input = `[!] *wrong input*
    
    Contoh: ${usedPrefix + command} https://vt.tiktok.com/ZSYgBPSLD/`

    if (!text) return m.reply(input)
    if (!(text.includes('http://') || text.includes('https://'))) return m.reply(`URL invalid, please input a valid URL. Try with http:// or https://`)
    if (!text.includes('tiktok.com')) return m.reply(`Invalid TikTok URL.`)

    const user = global.db.data.users[m.sender]
    const isPremium = user?.premium

    if (!conn.ttQueue) conn.ttQueue = []
    if (!conn.ttProcessing) conn.ttProcessing = false

    // === PREMIUM USER ===
    if (isPremium) {
        try {
            await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

            await processTikTok(m, conn, text)

            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        } catch (e) {
            console.error(e)
            await m.reply('Terjadi kesalahan saat memproses video TikTok kamu >_<')
        }
        return
    }

    // === NON-PREMIUM ===
    const alreadyInQueue = conn.ttQueue.find(entry => entry.sender === m.sender)
    if (alreadyInQueue) {
        const position = conn.ttQueue.findIndex(entry => entry.sender === m.sender) + 1
        return m.reply(`(>///<) Kamu sudah ada di antrian ke *${position}*, Senpai~\nTunggu sampai giliranmu diproses ya~`)
    }

    if (conn.ttQueue.length >= 10) {
        return m.reply(`(╥﹏╥) Antrian penuh, Senpai~\nMaksimal hanya *10 pengguna* dalam antrian.\nSilakan coba lagi nanti!`)
    }

    conn.ttQueue.push({ m, text, sender: m.sender })
    const position = conn.ttQueue.length
    await m.reply(`(>///<) Kamu masuk antrian ke *${position}*, Senpai~\nUpgrade ke *Premium* biar langsung diproses tanpa antri~ ketik *.buypremium* 💎`)

    if (!conn.ttProcessing) {
        conn.ttProcessing = true
        await processQueue(conn)
    }
}

// === PROSES ANTRIAN UNTUK NON-PREMIUM ===
async function processQueue(conn) {
    while (conn.ttQueue.length > 0) {
        const { m, text, sender } = conn.ttQueue[0]
        try {
            await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
            await new Promise(resolve => setTimeout(resolve, 3000))

            await processTikTok(m, conn, text)

            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        } catch (e) {
            console.error(`Error proses TikTok untuk ${sender}`, e)
            await m.reply('Terjadi kesalahan saat memproses video TikTok kamu >_<')
        }

        conn.ttQueue.shift()
    }

    conn.ttProcessing = false
}

// === PROSES UTAMA TIKTOK ===
async function processTikTok(m, conn, text) {
    const { isSlide, result, title, author, audio } = await tiktok(text)

    if (isSlide) {
        await m.reply('Detected TikTok slide URL 📋\nPhotos and audio sent to private chat')

        for (let img of result) {
            const response = await got(img, { responseType: 'buffer' })
            await conn.sendMessage(m.sender, { image: response.body })
            await sleep(1000)
        }

        if (audio) {
            const audioResponse = await got(audio, { responseType: 'buffer' })
            await conn.sendMessage(m.sender, {
                audio: audioResponse.body,
                mimetype: 'audio/mpeg',
                title: title,
                fileName: `${title}.mp3`
            })
        }
    } else {
        await m.reply('Detected TikTok video URL 📹')
        const videoResponse = await got(result, { responseType: 'buffer' })
        const audioResponse = audio ? await got(audio, { responseType: 'buffer' }) : null

        await conn.sendMessage(m.chat, {
            video: videoResponse.body,
            caption: title
        }, { quoted: m })

        if (audioResponse) {
            await conn.sendMessage(m.chat, {
                audio: audioResponse.body,
                mimetype: 'audio/mpeg',
                title: title,
                fileName: `${title}.mp3`
            }, { quoted: m })
        }
    }
}

handler.help = ['tiktok <url>']
handler.tags = ['downloader']
handler.command = /^(t(ik)?t(ok)?|t(ik)?t(ok)?dl)$/i
handler.limit = true

export default handler

// === FUNGSI TIKTOK ===
async function tiktok(url) {
    try {
        const data = new URLSearchParams({ 'id': url, 'locale': 'id', 'tt': 'RFBiZ3Bi' })
        const headers = {
            'HX-Request': true,
            'HX-Trigger': '_gcaptcha_pt',
            'HX-Target': 'target',
            'HX-Current-URL': 'https://ssstik.io/id',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
            'Referer': 'https://ssstik.io/id'
        }

        const response = await axios.post('https://ssstik.io/abc?url=dl', data, { headers })
        const html = response.data

        const $ = cheerio.load(html)
        const author = $('#avatarAndTextUsual h2').text().trim()
        const title = $('#avatarAndTextUsual p').text().trim()
        const video = $('.result_overlay_buttons a.download_link').attr('href')
        const audio = $('.result_overlay_buttons a.download_link.music').attr('href')
        const imgLinks = []

        $('img[data-splide-lazy]').each((i, el) => {
            imgLinks.push($(el).attr('data-splide-lazy'))
        })

        return {
            isSlide: !video,
            author,
            title,
            result: video || imgLinks,
            audio
        }
    } catch (error) {
        console.error('Error:', error)
        throw 'Gagal mengambil data TikTok.'
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
