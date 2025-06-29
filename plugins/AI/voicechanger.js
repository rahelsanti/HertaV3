import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

/**
 * ✨ Voice Changer Feature - HololiveID RVC Models
 * Base: https://kit-lemonfoot-vtuber-rvc-models.hf.space/
 * Usage: Reply audio with .voicechanger model transpose
 */

class VoiceChangerHoloID {
    constructor() {
        this.api_url = 'https://kit-lemonfoot-vtuber-rvc-models.hf.space';
        this.file_url = 'https://kit-lemonfoot-vtuber-rvc-models.hf.space/file=';
        this.models = {
            moona: {
                fn: 44,
                name: 'Moona Hoshinova',
                file: ['Moona Hoshinova', 'weights/hololive-id/Moona/Moona_Megaaziib.pth', 'weights/hololive-id/Moona/added_IVF1259_Flat_nprobe_1_v2_mbkm.index', '']
            },
            iofi: {
                fn: 45,
                name: 'Airani Iofifteen',
                file: ['Airani Iofifteen', 'weights/hololive-id/Iofi/Iofi_KitLemonfoot.pth', 'weights/hololive-id/Iofi/added_IVF256_Flat_nprobe_1_AiraniIofifteen_Speaking_V2_v2.index', '']
            },
            risu: {
                fn: 46,
                name: 'Ayunda Risu',
                file: ['Ayunda Risu', 'weights/hololive-id/Risu/Risu_Megaaziib.pth', 'weights/hololive-id/Risu/added_IVF2090_Flat_nprobe_1_v2_mbkm.index', '']
            },
            ollie: {
                fn: 47,
                name: 'Kureiji Ollie',
                file: ['Kureiji Ollie', 'weights/hololive-id/Ollie/Ollie_Dacoolkid.pth', 'weights/hololive-id/Ollie/added_IVF2227_Flat_nprobe_1_ollie_v2_mbkm.index', '']
            },
            anya: {
                fn: 48,
                name: 'Anya Melfissa',
                file: ['Anya Melfissa', 'weights/hololive-id/Anya/Anya_Megaaziib.pth', 'weights/hololive-id/Anya/added_IVF910_Flat_nprobe_1_anyav2_v2_mbkm.index', '']
            },
            reine: {
                fn: 49,
                name: 'Pavolia Reine',
                file: ['Pavolia Reine', 'weights/hololive-id/Reine/Reine_KitLemonfoot.pth', 'weights/hololive-id/Reine/added_IVF256_Flat_nprobe_1_PavoliaReine_Speaking_KitLemonfoot_v2.index', '']
            },
            zeta: {
                fn: 50,
                name: 'Vestia Zeta',
                file: ['Vestia Zeta', 'weights/hololive-id/Zeta/Zeta_Megaaziib.pth', 'weights/hololive-id/Zeta/added_IVF462_Flat_nprobe_1_zetav2_v2.index', '']
            },
            kaela: {
                fn: 51,
                name: 'Kaela Kovalskia',
                file: ['Kaela Kovalskia', 'weights/hololive-id/Kaela/Kaela_Megaaziib.pth', 'weights/hololive-id/Kaela/added_IVF265_Flat_nprobe_1_kaelaV2_v2.index', '']
            },
            kobo: {
                fn: 52,
                name: 'Kobo Kanaeru',
                file: ['Kobo Kanaeru', 'weights/hololive-id/Kobo/Kobo_Megaaziib.pth', 'weights/hololive-id/Kobo/added_IVF454_Flat_nprobe_1_kobov2_v2.index', '']
            }
        };
    }

    generateSession() {
        return Math.random().toString(36).substring(2);
    }

    async upload(buffer) {
        try {
            const upload_id = this.generateSession();
            const orig_name = `voice_${Date.now()}.mp3`;
            const form = new FormData();
            form.append('files', buffer, orig_name);
            
            const { data } = await axios.post(`${this.api_url}/upload?upload_id=${upload_id}`, form, {
                headers: {
                    ...form.getHeaders()
                }
            });

            return {
                orig_name,
                path: data[0],
                url: `${this.file_url}${data[0]}`
            };
        } catch (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }
    }

    async processVoiceChange(buffer, options = {}) {
        try {
            const {
                model = 'moona',
                transpose = 0,
                method = 'pm',
                ratio = 0.4,
                protection = 1,
                hop_length = 0,
                split_audio = 1,
                clean_strength = 0.23
            } = options;

            if (!Buffer.isBuffer(buffer)) {
                throw new Error('Audio buffer is required');
            }
            
            if (!Object.keys(this.models).includes(model)) {
                throw new Error(`Available models: ${Object.keys(this.models).join(', ')}`);
            }

            console.log(`🎵 Processing voice change with model: ${this.models[model].name}`);
            
            const audio_url = await this.upload(buffer);
            const session_hash = this.generateSession();
            
            const response = await axios.post(`${this.api_url}/queue/join?`, {
                data: [
                    ...this.models[model].file,
                    {
                        path: audio_url.path,
                        url: audio_url.url,
                        orig_name: audio_url.orig_name,
                        size: buffer.length,
                        mime_type: 'audio/mpeg',
                        meta: {
                            _type: 'gradio.FileData'
                        }
                    },
                    '',
                    'English-Ana (Female)',
                    transpose,
                    method,
                    ratio,
                    protection,
                    hop_length,
                    split_audio,
                    clean_strength
                ],
                event_data: null,
                fn_index: this.models[model].fn,
                trigger_id: 620,
                session_hash: session_hash
            });

            const { data } = await axios.get(`${this.api_url}/queue/data?session_hash=${session_hash}`);

            let result;
            const lines = data.split('\n\n');
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const d = JSON.parse(line.substring(6));
                    if (d.msg === 'process_completed') {
                        result = d.output.data[1].url;
                        break;
                    }
                }
            }

            if (!result) {
                throw new Error('Processing failed - no result URL received');
            }

            return result;
        } catch (error) {
            throw new Error(`Voice processing failed: ${error.message}`);
        }
    }

    async downloadAudio(url) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            return Buffer.from(response.data);
        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }
}

const voiceChanger = new VoiceChangerHoloID();

// Function fkontak
function fkontak(conn, m) {
    return {
        key: {
            participant: '0@s.whatsapp.net',
            remoteJid: 'status@broadcast',
            fromMe: false,
            id: 'Halo'
        },
        message: {
            contactMessage: {
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
            }
        },
        participant: '0@s.whatsapp.net'
    };
}

// Handler utama
const handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        const quoted = m.quoted;
        
        // Jika tidak ada text dan tidak ada audio yang di-reply, tampilkan help
        if (!text && (!quoted || !quoted.mimetype?.includes('audio'))) {
            const helpText = `🎵 *Voice Changer HololiveID*

*Format:*
Reply audio + ${usedPrefix}${command} [model] [transpose]

*Model yang tersedia:*
- moona - iofi - risu - ollie - anya
- reine - zeta - kaela - kobo

*Transpose:*
-12 = Cowok
12 = Cewek
0 = Normal

*Contoh:*
Reply audio + ${usedPrefix}${command} kobo 12`;
            
            return conn.sendMessage(m.chat, { text: helpText }, { quoted: fkontak(conn, m) });
        }
        
        // Jika ada text tapi tidak ada audio, minta reply audio
        if (text && (!quoted || !quoted.mimetype?.includes('audio'))) {
            const errorText = `❌ Reply audio terlebih dahulu!

*Format:*
Reply audio + ${usedPrefix}${command} [model] [transpose]

*Contoh:*
Reply audio + ${usedPrefix}${command} kobo 12`;
            
            return conn.sendMessage(m.chat, { text: errorText }, { quoted: fkontak(conn, m) });
        }
        
        // Parse arguments
        const args = text.trim().split(' ');
        const model = args[0]?.toLowerCase() || 'moona';
        const transpose = parseInt(args[1]) || 0;
        
        // Validasi model
        if (!Object.keys(voiceChanger.models).includes(model)) {
            const models = Object.keys(voiceChanger.models).join(', ');
            const errorText = `❌ Model tidak tersedia!

*Model yang tersedia:*
${models}

*Contoh:*
Reply audio + ${usedPrefix}${command} kobo 12`;
            
            return conn.sendMessage(m.chat, { text: errorText }, { quoted: fkontak(conn, m) });
        }
        
        // Validasi transpose
        if (transpose < -12 || transpose > 12) {
            const errorText = `❌ Transpose harus antara -12 sampai 12!

*Transpose:*
-12 = Cowok
12 = Cewek
0 = Normal

*Contoh:*
Reply audio + ${usedPrefix}${command} kobo 12`;
            
            return conn.sendMessage(m.chat, { text: errorText }, { quoted: fkontak(conn, m) });
        }
        
        // Proses voice change
        const processingText = `🎵 Memproses voice change...

🎭 Model: ${voiceChanger.models[model].name}
🎵 Transpose: ${transpose}

⏳ Mohon tunggu sebentar...`;
        
        await conn.sendMessage(m.chat, { text: processingText }, { quoted: fkontak(conn, m) });
        
        // Download audio
        const audioBuffer = await quoted.download();
        
        // Process voice change
        const resultUrl = await voiceChanger.processVoiceChange(audioBuffer, {
            model: model,
            transpose: transpose
        });
        
        // Download processed audio
        const processedAudio = await voiceChanger.downloadAudio(resultUrl);
        
        // Send processed audio dengan fkontak
        await conn.sendMessage(m.chat, {
            audio: processedAudio,
            mimetype: 'audio/mpeg',
            ptt: true
        }, { quoted: fkontak(conn, m) });
        
        // Success message
        const successText = `✅ Voice change berhasil!

🎭 Model: ${voiceChanger.models[model].name}
🎵 Transpose: ${transpose}
⏱️ Processed by Voice Changer HololiveID`;
        
        await conn.sendMessage(m.chat, { text: successText }, { quoted: fkontak(conn, m) });
        
    } catch (error) {
        console.error('Voice Changer Error:', error);
        
        const errorText = `❌ Gagal memproses audio!

*Error:* ${error.message}

*Coba lagi atau hubungi admin jika masalah berlanjut.*`;
        
        await conn.sendMessage(m.chat, { text: errorText }, { quoted: fkontak(conn, m) });
    }
};

// Handler properties
handler.command = ['voicechanger', 'vc'];
handler.help = ['voicechanger [model] [transpose]'];
handler.tags = ['audio'];

export default handler;