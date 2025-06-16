import fs from 'fs';
import Jimp from 'jimp';
import { Chess } from 'chess.js';

const data = [{
    map: "https://chessboardimage.com/{fen}.png", 
    name: "Premium",
    stabil_x: 0,
    stabil_y: 0
}];

let handler = async (m, { conn, text, command }) => {
    conn.catur = conn.catur ? conn.catur : {};
    const ct = conn.catur;
    
    const catur_cmd = {
        create: () => {
            if(ct[m.chat]) return m.reply("⚠️ Masih ada permainan yang berlangsung!");
            ct[m.chat] = {
                chess: new Chess(),
                date: Date.now(),
                status: '⌛ MENUNGGU',
                host: m.sender,
                players: {},
                map: data[0].map,
                map_name: data[0].name,
                stabil_x: data[0].stabil_x, 
                stabil_y: data[0].stabil_y,
                msg: {},
                moves: [],
                captures: {white: [], black: []}
            };
            ct[m.chat].players[m.sender] = {color: 'white', captures: 0};
            return conn.sendMessage(m.chat, {
                text: `🎮 *Room Catur Dibuat!* 🎮\n\n🆔 *ID Game:* ${m.chat}\n👑 *Host:* @${m.sender.split('@')[0]}\n\n⚡ Ketik *.catur join* untuk bergabung\n📖 Ketik *.catur tutorial* untuk bantuan`,
                mentions: [m.sender]
            });
        },

        join: () => {
            if(!ct[m.chat]) return m.reply("❌ Tidak ada permainan berlangsung!");
            if(m.sender === ct[m.chat].host) return m.reply("⚠️ Host tidak bisa bergabung sebagai pemain!");
            if(Object.keys(ct[m.chat].players).length >= 2) return m.reply("⛔ Room sudah penuh!");
            
            ct[m.chat].players[m.sender] = {color: 'black', captures: 0};
            ct[m.chat].status = '🎯 BERMAIN';
            
            const players = Object.keys(ct[m.chat].players);
            if(players.length !== 2 || players[0] === players[1]) {
                delete ct[m.chat];
                return m.reply("⚠️ Gagal memulai permainan!");
            }

            conn.sendMessage(m.chat, {
                text: `🎮 *Permainan Dimulai!* 🎮\n\n⚪ Putih: @${ct[m.chat].host.split('@')[0]}\n⚫ Hitam: @${m.sender.split('@')[0]}\n\n📢 Giliran Pertama: Putih\n💡 Ketik *.catur tutorial* untuk panduan`,
                mentions: [ct[m.chat].host, m.sender]
            });
            return sendBoard(m, ct, conn);
        },

        tutorial: () => {
            const tutorialText = `📚 *Panduan Catur* 📚

🎯 *Cara Bergerak:*
Ketik *move [dari][ke]*
Contoh:
• *move e2 e4* (Pindah pion dari e2 ke e4)
• *move g1 f3* (Pindah kuda dari g1 ke f3)

⚔️ *Gerakan Khusus:*
• Rokade: *0-0* (Sisi Raja) atau *0-0-0* (Sisi Ratu)
• Promosi: *e7e8=Q* (Promosi menjadi Ratu)
• En Passant: *e5d6* (Tangkap pion musuh en passant)

♟️ *Simbol Bidak:*
• P = Pion   • R = Benteng
• N = Kuda   • B = Gajah
• Q = Ratu   • K = Raja

⚡ *Perintah:*
• *.catur info* - Lihat status permainan
• *.catur exit* - Keluar permainan
• *.catur delete* - Akhiri sesi

🎮 Selamat bermain!`;
            conn.sendMessage(m.chat, {text: tutorialText});
        },

        delete: () => {
            if(!ct[m.chat]) return m.reply("❌ Tidak ada sesi aktif!");
            delete ct[m.chat];
            return m.reply(`✅ Sesi dihapus (ID: ${m.chat})`);
        },

        info: () => {
            if(!ct[m.chat]) return m.reply("❌ Tidak ada sesi aktif!");
            const players = Object.keys(ct[m.chat].players);
            const game = ct[m.chat].chess;
            
            return conn.sendMessage(m.chat, {
                text: `📊 *Statistik Permainan* 📊

🎮 *Status:* ${ct[m.chat].status}
👑 *Host:* @${players[0].split('@')[0]}

⚪ *Putih:* @${players[0].split('@')[0]}
   Tangkapan: ${ct[m.chat].captures.white.length}
⚫ *Hitam:* @${players[1]?.split('@')[0] || 'Menunggu...'}
   Tangkapan: ${ct[m.chat].captures.black.length}

⏳ *Giliran:* ${game.turn() === 'w' ? 'Putih' : 'Hitam'}
📝 *Langkah:* ${Math.floor(game.moveNumber())}
${game.isCheck() ? '⚡ SKAK!' : ''}`,
                mentions: players
            });
        },

        exit: () => {
            if(!ct[m.chat]) return m.reply("❌ Tidak ada sesi aktif!");
            delete ct[m.chat].players[m.sender];
            m.reply("👋 Keluar dari permainan");
            if(!Object.keys(ct[m.chat].players).length) delete ct[m.chat];
        }
    };

    if(!text || !catur_cmd[text]) return conn.sendMessage(m.chat, {
        text: `♟️ *Perintah Catur* ♟️

Perintah tersedia:
${Object.keys(catur_cmd).map(v => `• *.catur ${v}*`).join('\n')}

Contoh:
• *.catur create*
• *.catur join*
• *.move e2 e4*

Ketik *.catur tutorial* untuk panduan lengkap`
    });

    await catur_cmd[text]();
}

handler.command = handler.help = ['catur'];
handler.tags = ['game'];
handler.register = true;

handler.before = async function (m, { conn }) {
    conn.catur = conn.catur ? conn.catur : {};
    const ct = conn.catur;
    
    const moveRegex = /^(?:move|m)[\s\/]*([a-h][1-8])[\s-]*([a-h][1-8]|[QRNB]|0-0-0|0-0)/i;
    if(!moveRegex.test(m.text) || !ct[m.chat]) return;
    
    const [, from, to] = m.text.match(moveRegex);
    const game = ct[m.chat].chess;
    const player = ct[m.chat].players[m.sender];
    
    try {
        if(!player || game.turn() !== player.color[0]) {
            return m.reply(`⏳ Bukan giliranmu! Sekarang: ${game.turn() === 'w' ? 'Putih' : 'Hitam'}`);
        }

        const move = game.move({from, to, promotion: 'q'});
        
        let moveText = `📢 *Langkah Dilakukan!*\n`;
        moveText += `${player.color === 'white' ? '⚪' : '⚫'} @${m.sender.split('@')[0]}: ${from} → ${to}\n`;
        
        if(move.captured) {
            moveText += `⚔️ Menangkap ${move.captured.toUpperCase()}!\n`;
            ct[m.chat].captures[player.color].push(move.captured);
        }
        if(move.flags.includes('k') || move.flags.includes('q')) moveText += `🏰 Rokade!\n`;
        if(move.flags.includes('e')) moveText += `✨ En Passant!\n`;
        if(move.promotion) moveText += `👑 Promosi menjadi ${move.promotion.toUpperCase()}!\n`;
        if(game.isCheck()) moveText += `⚡ SKAK!\n`;
        
        ct[m.chat].moves.push({
            piece: move.piece,
            from,
            to,
            player: m.sender,
            flags: move.flags
        });

        await sendBoard(m, ct, conn);
        conn.sendMessage(m.chat, {text: moveText, mentions: [m.sender]});

        if(game.isGameOver()) {
            let endText = `🎯 *Permainan Selesai!*\n\n`;
            if(game.isCheckmate()) {
                endText += `⭐ Skakmat! @${m.sender.split('@')[0]} Menang!\n`;
            } else if(game.isDraw()) {
                endText += `🤝 Seri! (${game.isDraw()})\n`;
            }
            endText += `\n📊 *Statistik Akhir:*\n`;
            endText += `⚪ Tangkapan Putih: ${ct[m.chat].captures.white.length}\n`;
            endText += `⚫ Tangkapan Hitam: ${ct[m.chat].captures.black.length}\n`;
            endText += `📝 Total Langkah: ${Math.floor(game.moveNumber())}\n`;
            
            delete ct[m.chat];
            return conn.sendMessage(m.chat, {text: endText, mentions: [m.sender]});
        }

        const nextPlayer = Object.keys(ct[m.chat].players).find(p => 
            ct[m.chat].players[p].color[0] === game.turn()
        );

        conn.sendMessage(m.chat, {
            text: `⏳ Giliran: @${nextPlayer.split('@')[0]} (${game.turn() === 'w' ? 'Putih' : 'Hitam'})`,
            mentions: [nextPlayer]
        });

    } catch (e) {
        const errors = {
            'Invalid move': '❌ Gerakan tidak valid!',
            'Not your turn': '⏳ Bukan giliranmu!',
            'No piece on square': '❓ Tidak ada bidak disitu!',
            'Illegal move': '⚠️ Gerakan tidak diperbolehkan!'
        };
        m.reply(errors[e.message] || `❌ Error: ${e.message}`);
    }
}

async function sendBoard(m, ct, conn) {
    try {
        const fen = ct[m.chat].chess.fen();
        const boardUrl = data[0].map.replace('{fen}', fen.split(' ')[0]) + 
            `?size=600` +
            `&coordinates=true` +
            `&flip=${ct[m.chat].chess.turn() === 'b'}` +
            `&check=${ct[m.chat].chess.isCheck()}` +
            `&style=merida` +
            `&theme=blue`;

        const img = await Jimp.read(boardUrl);
        const buffer = await img.getBufferAsync(Jimp.MIME_PNG);
        
        const caption = `♟️ *Posisi Saat Ini* ♟️\n` +
            `Giliran: ${ct[m.chat].chess.turn() === 'w' ? '⚪ Putih' : '⚫ Hitam'}\n` +
            `Langkah: ${Math.floor(ct[m.chat].chess.moveNumber())}\n` +
            (ct[m.chat].chess.isCheck() ? '⚡ SKAK!' : '');

        await conn.sendMessage(m.chat, {
            image: buffer,
            caption: caption
        });
    } catch (e) {
        m.reply("❌ Gagal menampilkan papan!");
    }
}

export default handler;;