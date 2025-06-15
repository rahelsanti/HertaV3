import fs from 'fs';
import path from 'path';

const redeemFile = path.join(process.cwd(), 'src', 'coderedeem.json');

const loadRedeemData = () => {
    try {
        if (!fs.existsSync(redeemFile)) {
            const dir = path.dirname(redeemFile);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(redeemFile, JSON.stringify({}, null, 2));
            return {};
        }
        const data = fs.readFileSync(redeemFile, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.error('❌ Gagal memuat data kode redeem:', e);
        return {};
    }
};

const saveRedeemData = (data) => {
    try {
        fs.writeFileSync(redeemFile, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('❌ Gagal menyimpan data kode redeem:', e);
    }
};

const isExpired = (expiresAt) => new Date(expiresAt) < new Date();

let handler = async (m, { conn, text, usedPrefix, command, isOwner }) => {
    let redeemCodes = loadRedeemData();
    let args = text.trim().split(' ');
    let subCommand = args[0]?.toLowerCase();
    const generateId = () => Math.random().toString(36).substring(2, 10).toUpperCase();

    if (!subCommand) {
        let menu = isOwner
            ? `📦 *Daftar Perintah Tersedia:*\n` +
              `- ${usedPrefix}${command} claim <kode>\n` +
              `- ${usedPrefix}${command} create <limit> <item> <jumlah>\n` +
              `- ${usedPrefix}${command} delete <kode>\n` +
              `- ${usedPrefix}${command} list`
            : `📦 *Perintah Tersedia:*\n- ${usedPrefix}${command} claim <kode>`;
        return m.reply(`${menu}\n\nGunakan dengan bijak ya! 🤖`);
    }

    if (!isOwner && subCommand !== 'claim') {
        return m.reply(`❌ Perintah ini hanya dapat digunakan oleh *Owner*. Silakan gunakan: ${usedPrefix}${command} claim <kode>`);
    }

    switch (subCommand) {
        case 'claim': {
            let codeId = args[1]?.toUpperCase();
            if (!codeId) return m.reply(`❗ Silakan masukkan kode redeem!\nContoh: *${usedPrefix}${command} claim ABC123*`);

            let codeData = redeemCodes[codeId];
            if (!codeData) return m.reply(`⚠️ Kode *${codeId}* tidak ditemukan.`);

            if (isExpired(codeData.expiresAt)) {
                delete redeemCodes[codeId];
                saveRedeemData(redeemCodes);
                return m.reply(`⏳ Kode *${codeId}* telah kedaluwarsa.`);
            }

            let user = db.data.users[m.sender];
            if (!user) db.data.users[m.sender] = { claimedCodes: [] };

            if (user.claimedCodes?.includes(codeId)) {
                return m.reply(`🛑 Anda sudah pernah mengklaim kode *${codeId}* sebelumnya.`);
            }

            if (codeData.limit <= 0) return m.reply(`⚠️ Kode *${codeId}* telah habis kuotanya.`);

            if (!user[codeData.item]) user[codeData.item] = 0;
            user[codeData.item] += codeData.jumlah;

            codeData.limit -= 1;
            if (!user.claimedCodes) user.claimedCodes = [];
            user.claimedCodes.push(codeId);

            if (codeData.limit === 0) delete redeemCodes[codeId];
            saveRedeemData(redeemCodes);

            return m.reply(`✅ Berhasil klaim kode *${codeId}*!\n🎁 Anda menerima: *${codeData.jumlah} ${codeData.item}*`);
        }

        case 'create': {
            let limit = parseInt(args[1]);
            let item = args[2];
            let jumlah = parseInt(args[3]);

            if (isNaN(limit) || !item || isNaN(jumlah)) {
                return m.reply(`❗ Format salah!\nContoh: *${usedPrefix}${command} create 5 exp 100*`);
            }

            if (limit <= 0 || jumlah <= 0) {
                return m.reply(`❌ Limit dan jumlah harus lebih dari 0.`);
            }

            let codeId = generateId();
            let createdAt = new Date();
            let expiresAt = new Date(createdAt);
            expiresAt.setDate(createdAt.getDate() + 30);

            redeemCodes[codeId] = {
                limit,
                item: item.toLowerCase(),
                jumlah,
                createdAt: createdAt.toLocaleString('id-ID'),
                expiresAt: expiresAt.toISOString()
            };

            saveRedeemData(redeemCodes);

            return m.reply(`🎉 Kode redeem berhasil dibuat!\n\n🆔 *Kode:* ${codeId}\n🔁 *Limit:* ${limit}\n🎁 *Reward:* ${jumlah} ${item}\n📅 *Kedaluwarsa:* ${expiresAt.toLocaleString('id-ID')}`);
        }

        case 'delete': {
            let codeId = args[1]?.toUpperCase();
            if (!codeId) return m.reply(`❗ Masukkan kode yang ingin dihapus.\nContoh: *${usedPrefix}${command} delete ABC123*`);

            if (!redeemCodes[codeId]) return m.reply(`⚠️ Kode *${codeId}* tidak ditemukan.`);

            delete redeemCodes[codeId];
            saveRedeemData(redeemCodes);

            return m.reply(`🗑️ Kode *${codeId}* berhasil dihapus.`);
        }

        case 'list': {
            let list = Object.entries(redeemCodes)
                .filter(([_, v]) => !isExpired(v.expiresAt))
                .map(([id, v]) => {
                    return `🆔 *${id}*\n🔁 Limit: ${v.limit}\n🎁 ${v.jumlah} ${v.item}\n📅 Dibuat: ${v.createdAt}\n⏳ Exp: ${new Date(v.expiresAt).toLocaleString('id-ID')}`;
                })
                .join(`\n\n`);

            if (!list) return m.reply(`📭 Tidak ada kode aktif saat ini.`);

            saveRedeemData(redeemCodes);
            return m.reply(`📦 *Daftar Kode Redeem Aktif:*\n\n${list}`);
        }

        default:
            return m.reply(`⚠️ Subcommand *${subCommand}* tidak dikenal. Gunakan *${usedPrefix}${command}* untuk melihat daftar perintah.`);
    }
};

handler.help = ['coderedeem'];
handler.tags = ['main'];
handler.command = /^(coderedeem|coderedem)$/i;
handler.register = true;

export default handler;