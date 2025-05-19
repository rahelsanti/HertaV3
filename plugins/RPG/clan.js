import crypto from 'crypto';

export function generateClanId() {
    return crypto.randomBytes(3).toString('hex').slice(0, 6).toUpperCase();
}

export function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateHpBar(hp, maxHp = 100) {
    const totalBars = 10;
    const filledBars = Math.round((hp / maxHp) * totalBars);
    const emptyBars = totalBars - filledBars;
    return '▬'.repeat(filledBars) + '▭'.repeat(emptyBars) + `\n➥${hp}/${maxHp} `;
}

const defaultClanThumbnail = 'https://files.catbox.moe/qfizya.jpg';

export function getClanThumbnail() {
    return 'https://files.catbox.moe/qfizya.jpg';
}

export async function handler(m, { conn, text, usedPrefix, command, args }) {
    if (!global.db.data.clans) global.db.data.clans = {};
    if (!global.db.data.clanRequests) global.db.data.clanRequests = {};
    if (!global.db.data.clanWar) global.db.data.clanWar = {};
    const sender = m.sender;

    const [subCommand, ...params] = args;
    switch(subCommand) {
        case 'create':
            if (!params[0]) {
                return conn.reply(m.chat, `❗ Gunakan: ${usedPrefix}clan create <nama clan>`, m);
            }
            const clanName = params[0];
            if (global.db.data.users[sender].level < 100) {
                return conn.reply(m.chat, '⚠️ Anda harus mencapai level 100 untuk membuat clan.', m);
            }
            if (global.db.data.users[sender].money < 1000000) {
                return conn.reply(m.chat, '⚠️ Anda membutuhkan 1.000.000 money untuk membuat clan.', m);
            }
            if (global.db.data.users[sender].cname) {
                return conn.reply(m.chat, '⚠️ Anda sudah memiliki clan. Silakan keluar dari clan saat ini terlebih dahulu.', m);
            }
            const clanExists = Object.values(global.db.data.clans).some(clan => clan.name.toLowerCase() === clanName.toLowerCase());
            if (clanExists) {
                return conn.reply(m.chat, '❌ Nama clan sudah digunakan. Pilih nama lain.', m);
            }
            global.db.data.users[sender].money -= 1000000;
            const clanId = generateClanId();
            global.db.data.clans[clanId] = {
                name: clanName,
                leader: sender,
                members: [sender],
                profile: getClanThumbnail(sender),
                catm: 10000,
                created: new Date().toISOString(),
                hp: 100
            };
            global.db.data.users[sender].cname = clanName;
            global.db.data.users[sender].cleader = true;
            global.db.data.users[sender].cid = clanId;
            global.db.data.users[sender].cprofile = getClanThumbnail(sender);
            global.db.data.users[sender].catm = 10000;

            const thumbnail = getClanThumbnail(sender);
            const creationMessage = {
                image: { url: thumbnail },
                caption: `🎉 Clan *${clanName}* berhasil dibuat! 🎉\n\n🆔 *Clan ID:* ${clanId}\n👑 *Leader:* @${sender.split('@')[0]}\n💰 *ATM:* 10000\n❤️ *HP:* ${generateHpBar(100)}\n\n✨ Selamat bergabung di dunia clan!`,
                mentions: [sender]
            };
            conn.sendMessage(m.chat, creationMessage);
            break;
            
        case 'withdraw':
            if (!global.db.data.users[sender].cname) {
                return conn.reply(m.chat, 'Anda belum memiliki clan.', m);
            }
            const withdrawClanId = global.db.data.users[sender].cid;
            const withdrawClan = global.db.data.clans[withdrawClanId];
            const withdrawAmount = parseFloat(params[0]);
            if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
                return conn.reply(m.chat, 'Masukkan jumlah penarikan yang valid.', m);
            }
            if (withdrawClan.catm < withdrawAmount) {
                return conn.reply(m.chat, 'Saldo clan tidak mencukupi.', m);
            }
            withdrawClan.catm -= withdrawAmount;
            global.db.data.users[sender].money += withdrawAmount;
            const leaderNotification = `Peringatan: @${sender.split('@')[0]} telah menarik ${withdrawAmount} dari dana clan.`;
            conn.reply(m.chat, leaderNotification, null, {
                contextInfo: {
                    mentionedJid: conn.parseMention(leaderNotification)
                }
            });
            break;
            
        case 'transfer':
            if (!global.db.data.users[sender].cleader) {
                return conn.reply(m.chat, 'Hanya leader clan yang dapat mentransfer kepemimpinan.', m);
            }
            const mentionedUsers = conn.parseMention(text);
            if (mentionedUsers.length === 0) {
                return conn.reply(m.chat, `Gunakan: ${usedPrefix}clan transfer @user`, m);
            }
            const newLeader = mentionedUsers[0];
            const transferClanId = global.db.data.users[sender].cid;
            if (newLeader === sender) {
                return conn.reply(m.chat, 'Anda tidak dapat mentransfer kepemimpinan kepada diri sendiri.', m);
            }
            const transferClan = global.db.data.clans[transferClanId];
            if (!transferClan.members.includes(newLeader)) {
                return conn.reply(m.chat, 'Pengguna yang dituju harus menjadi anggota clan.', m);
            }
            transferClan.leader = newLeader;
            global.db.data.users[sender].cleader = false;
            global.db.data.users[newLeader].cleader = true;
            const transferNotification = `Kepemimpinan clan telah dipindahkan kepada @${newLeader.split('@')[0]}`;
            conn.reply(m.chat, transferNotification, null, {
                contextInfo: {
                    mentionedJid: conn.parseMention(transferNotification)
                }
            });
            break;
            
        case 'join':
            if (!params[0]) {
                return conn.reply(m.chat, `Gunakan: ${usedPrefix}clan join <id clan>`, m);
            }
            const joinClanId = params[0].toUpperCase();
            if (!global.db.data.clans[joinClanId]) {
                return conn.reply(m.chat, 'Clan ID tidak ditemukan.', m);
            }
            if (global.db.data.users[sender].cname) {
                return conn.reply(m.chat, 'Anda sudah memiliki clan. Silakan keluar dari clan saat ini terlebih dahulu.', m);
            }
            const clan = global.db.data.clans[joinClanId];
            const clanLeader = clan.leader;
            global.db.data.clanRequests[joinClanId] = global.db.data.clanRequests[joinClanId] || {};
            global.db.data.clanRequests[joinClanId][sender] = {
                requester: sender,
                timestamp: Date.now()
            };
            conn.reply(m.chat, `Permintaan bergabung clan terkirim. Menunggu persetujuan leader clan.`, m);
            
            const leaderMessage = `Ada yang ingin bergabung ke clan Anda!\n\nGunakan:\n${usedPrefix}clan accept @${sender.split('@')[0]} untuk menerima\n${usedPrefix}clan decline @${sender.split('@')[0]} untuk menolak`;
            conn.reply(m.chat, leaderMessage, null, {
                contextInfo: {
                    mentionedJid: conn.parseMention(leaderMessage)
                }
            });
            break;
            
        case 'accept':
            if (!global.db.data.users[sender].cleader) {
                return conn.reply(m.chat, 'Hanya leader clan yang dapat menerima permintaan.', m);
            }
            const acceptMentionedUsers = conn.parseMention(text);
            if (acceptMentionedUsers.length === 0) {
                return conn.reply(m.chat, `Gunakan: ${usedPrefix}clan accept @user`, m);
            }
            const userToAccept = acceptMentionedUsers[0];
            const senderClanId = global.db.data.users[sender].cid;
            if (!global.db.data.clanRequests[senderClanId] || !global.db.data.clanRequests[senderClanId][userToAccept]) {
                return conn.reply(m.chat, 'Tidak ada permintaan bergabung dari pengguna ini.', m);
            }
            const acceptedClan = global.db.data.clans[senderClanId];
            acceptedClan.members.push(userToAccept);
            global.db.data.users[userToAccept].cname = acceptedClan.name;
            global.db.data.users[userToAccept].cid = senderClanId;
            global.db.data.users[userToAccept].cprofile = acceptedClan.profile;
            global.db.data.users[userToAccept].catm = 0;
            global.db.data.users[userToAccept].cleader = false;
            delete global.db.data.clanRequests[senderClanId][userToAccept];
            const acceptMessage = `@${userToAccept.split('@')[0]} telah diterima bergabung ke clan.`;
            conn.reply(m.chat, acceptMessage, null, {
                contextInfo: {
                    mentionedJid: conn.parseMention(acceptMessage)
                }
            });
            break;
            
        case 'decline':
            if (!global.db.data.users[sender].cleader) {
                return conn.reply(m.chat, 'Hanya leader clan yang dapat menolak permintaan.', m);
            }
            const declineMentionedUsers = conn.parseMention(text);
            if (declineMentionedUsers.length === 0) {
                return conn.reply(m.chat, `Gunakan: ${usedPrefix}clan decline @user`, m);
            }
            const userToDecline = declineMentionedUsers[0];
            const declineSenderClanId = global.db.data.users[sender].cid;
            if (!global.db.data.clanRequests[declineSenderClanId] || !global.db.data.clanRequests[declineSenderClanId][userToDecline]) {
                return conn.reply(m.chat, 'Tidak ada permintaan bergabung dari pengguna ini.', m);
            }
            delete global.db.data.clanRequests[declineSenderClanId][userToDecline];
            const declineMessage = `Maaf, permintaan bergabung clan Anda ditolak oleh leader.`;
            conn.reply(m.chat, declineMessage, null, {
                contextInfo: {
                    mentionedJid: conn.parseMention(declineMessage)
                }
            });
            break;
            
        case 'info':
            if (!global.db.data.users[sender].cname) {
                return conn.reply(m.chat, '⚠️ Anda belum bergabung dengan clan manapun.', m);
            }
            const userClanId = global.db.data.users[sender].cid;
            const clanInfo = global.db.data.clans[userClanId];
            const membersInfo = clanInfo.members.map((member, index) => `${index + 1}. @${member.split('@')[0]}`).join('\n');
            const infoThumbnail = clanInfo.profile || defaultClanThumbnail;
            const infoMessage = {
                image: { url: infoThumbnail },
                caption: `🏰 *Clan Info* 🏰\n\n✨ *Clan Name:* ${clanInfo.name}\n📅 *Created:* ${new Date(clanInfo.created).toLocaleDateString()}\n👑 *Leader:* @${clanInfo.leader.split('@')[0]}\n👥 *Members:* ${clanInfo.members.length}\n🆔 *Clan ID:* ${userClanId}\n💰 *ATM:* ${clanInfo.catm}\n❤️ *HP:* ${generateHpBar(clanInfo.hp || 100)}\n\n📜 *Daftar Anggota:*\n${membersInfo}`,
                mentions: clanInfo.members
            };
            conn.sendMessage(m.chat, infoMessage);
            break;
            
        case 'deposit':
            if (!global.db.data.users[sender].cname) {
                return conn.reply(m.chat, 'Anda belum memiliki clan.', m);
            }
            const depositAmount = parseFloat(params[0]);
            if (!depositAmount || isNaN(depositAmount) || depositAmount <= 0) {
                return conn.reply(m.chat, 'Masukkan jumlah deposit yang valid.', m);
            }
            const userMoney = global.db.data.users[sender].money || 0;
            if (userMoney < depositAmount) {
                return conn.reply(m.chat, 'Saldo Anda tidak mencukupi untuk melakukan deposit.', m);
            }
            const depositClanId = global.db.data.users[sender].cid;
            const depositClan = global.db.data.clans[depositClanId];
            global.db.data.users[sender].money -= depositAmount;
            depositClan.catm += depositAmount;
            const depositNotification = `@${sender.split('@')[0]} telah mendepositkan ${depositAmount} ke dana clan.`;
            conn.reply(m.chat, depositNotification, null, {
                contextInfo: {
                    mentionedJid: conn.parseMention(depositNotification)
                }
            });
            break;
            
        case 'war': 
            if (!params[0]) return conn.reply(m.chat, `Gunakan: ${usedPrefix}clan war <Clan ID>`, m);
            if (params[0] === 'accept' || params[0] === 'decline') {
                if (!global.db.data.users[sender].cleader) return conn.reply(m.chat, 'Hanya leader yang bisa melakukan ini.', m);
                const warClanId = global.db.data.users[sender].cid;
                if (!global.db.data.clanWar[warClanId]) return conn.reply(m.chat, 'Tidak ada permintaan war.', m);
                const opponentId = global.db.data.clanWar[warClanId].opponent;
                
                if (params[0] === 'accept') {
                    global.db.data.clanWar[warClanId].status = 'ongoing';
                    global.db.data.clanWar[opponentId].status = 'ongoing';
                    
                    conn.reply(m.chat, '⚔️ Clan war dimulai! Tunggu 5 menit untuk hasil perang.', m);
                    setTimeout(() => startWarWithDelay(warClanId, opponentId, conn, m.chat), 300000); // 5 minutes delay
                } else {
                    delete global.db.data.clanWar[warClanId];
                    delete global.db.data.clanWar[opponentId];
                    conn.reply(m.chat, '❌ Clan war ditolak.', m);
                }
                return;
            }
            
            const targetClanId = params[0].toUpperCase();
            if (!global.db.data.users[sender].cname) return conn.reply(m.chat, 'Anda tidak memiliki clan.', m);
            if (!global.db.data.users[sender].cleader) return conn.reply(m.chat, 'Hanya leader clan yang dapat memulai war.', m);
            if (!global.db.data.clans[targetClanId]) return conn.reply(m.chat, 'Clan tidak ditemukan.', m);
            
            const warSenderClanId = global.db.data.users[sender].cid;
            
            if (targetClanId === warSenderClanId) return conn.reply(m.chat, 'Tidak bisa menyerang clan sendiri.', m);
            
            // Check if already in war
            if (global.db.data.clanWar[warSenderClanId]) return conn.reply(m.chat, 'Clan anda sedang dalam war atau memiliki permintaan war yang belum diselesaikan.', m);
            if (global.db.data.clanWar[targetClanId]) return conn.reply(m.chat, 'Clan target sedang dalam war atau memiliki permintaan war yang belum diselesaikan.', m);
            
            // Reset clan HP for war
            global.db.data.clans[warSenderClanId].hp = 100;
            global.db.data.clans[targetClanId].hp = 100;
            
            const targetLeader = global.db.data.clans[targetClanId].leader;
            global.db.data.clanWar[warSenderClanId] = { 
                opponent: targetClanId, 
                status: 'pending',
                startTime: Date.now()
            };
            global.db.data.clanWar[targetClanId] = { 
                opponent: warSenderClanId, 
                status: 'pending',
                startTime: Date.now()
            };
            
            conn.reply(targetLeader, `⚔️ TANTANGAN WAR ⚔️\nClan ${global.db.data.clans[warSenderClanId].name} menantang clan anda untuk war!\n\nGunakan:\n${usedPrefix}clan war accept - untuk menerima\n${usedPrefix}clan war decline - untuk menolak`, null);
            conn.reply(m.chat, `Tantangan war telah dikirim ke leader clan ${global.db.data.clans[targetClanId].name}.`, m);
            break;
            
        case 'leave':
            if (!global.db.data.users[sender].cname) {
                return conn.reply(m.chat, 'Anda belum bergabung dengan clan manapun.', m);
            }
            const leaveClanId = global.db.data.users[sender].cid;
            const leaveClan = global.db.data.clans[leaveClanId];
            if (leaveClan.leader === sender) {
                return conn.reply(m.chat, 'Sebagai leader, Anda tidak dapat meninggalkan clan. Gunakan .clan remove untuk membubarkan clan.', m);
            }
            leaveClan.members = leaveClan.members.filter(member => member !== sender);
            delete global.db.data.users[sender].cname;
            delete global.db.data.users[sender].cid;
            delete global.db.data.users[sender].cprofile;
            delete global.db.data.users[sender].catm;
            conn.reply(m.chat, 'Anda telah keluar dari clan.', m);
            break;
            
        case 'remove':
            if (!global.db.data.users[sender].cleader) {    
                return conn.reply(m.chat, 'Hanya leader clan yang dapat membubarkan clan.', m);
            }
            const removeClanId = global.db.data.users[sender].cid;
            const removeClan = global.db.data.clans[removeClanId];
            const remainingMembers = removeClan.members.filter(member => member !== sender);
            const atmSplit = removeClan.catm / (remainingMembers.length || 1);
            remainingMembers.forEach(member => {
                if (global.db.data.users[member]) {
                    global.db.data.users[member].catm = (global.db.data.users[member].catm || 0) + atmSplit;
                }
            });
            remainingMembers.forEach(member => {
                delete global.db.data.users[member].cname;
                delete global.db.data.users[member].cid;
                delete global.db.data.users[member].cprofile;
            });
            delete global.db.data.clans[removeClanId];
            delete global.db.data.users[sender].cname;
            delete global.db.data.users[sender].cleader;
            delete global.db.data.users[sender].cid;
            delete global.db.data.users[sender].cprofile;
            conn.reply(m.chat, 'Clan telah dibubarkan. Sisa dana clan dibagi ke anggota yang tersisa.', m);
            break;
            
        case 'changename':
            if (!global.db.data.users[sender].cleader) {
                return conn.reply(m.chat, 'Hanya leader clan yang dapat mengganti nama clan.', m);
            }
            const newName = params.join(' ');
            if (!newName) {
                return conn.reply(m.chat, `Gunakan: ${usedPrefix}clan changename <nama baru>`, m);
            }
            if (global.db.data.users[sender].cnclan < 1) {
                return conn.reply(m.chat, 'Anda tidak memiliki item "cnclan" untuk mengganti nama clan.', m);
            }
            const currentClanId = global.db.data.users[sender].cid;
            global.db.data.clans[currentClanId].name = newName;
            global.db.data.users[sender].cnclan -= 1;
            conn.reply(m.chat, `Nama clan berhasil diubah menjadi *${newName}*`, m);
            break;
            
        default:
            const helpMessage = `
Perintah Clan:
• ${usedPrefix}clan create <nama clan> - Buat clan baru
• ${usedPrefix}clan join <id clan> - Minta bergabung clan
• ${usedPrefix}clan accept @user - Terima permintaan bergabung
• ${usedPrefix}clan decline @user - Tolak permintaan bergabung
• ${usedPrefix}clan withdraw <jumlah> - Tarik dana clan
• ${usedPrefix}clan deposit <jumlah> - Deposit dana ke clan
• ${usedPrefix}clan leave - keluar dari clan
• ${usedPrefix}clan remove - membubarkan clan
• ${usedPrefix}clan transfer @user - Transfer kepemimpinan
• ${usedPrefix}clan info - Lihat info clan
• ${usedPrefix}clan war <clanId> - untuk war antar clan
• ${usedPrefix}clan war accept - menyetujui war antar clan
• ${usedPrefix}clan war decline - menolak war dengan clan lain`;
            conn.reply(m.chat, helpMessage, m);
            break;
    }
};

handler.help = ['clan'];
handler.tags = ['rpg'];
handler.limit = true
handler.command = /^(clan)$/i;

export default handler;

async function startWarWithDelay(clan1Id, clan2Id, conn, chatId) {
    const clan1 = global.db.data.clans[clan1Id];
    const clan2 = global.db.data.clans[clan2Id];

    clan1.hp = 100;
    clan2.hp = 100;

    let battleLogs = `⚔️ *WAR DIMULAI* ⚔️\n\n🏰 *${clan1.name}* VS 🏰 *${clan2.name}*\n\n`;
    let attackingClanId = Math.random() < 0.5 ? clan1Id : clan2Id;

    for (let round = 1; clan1.hp > 0 && clan2.hp > 0; round++) {
        let damage = getRandom(5, 15);
        let defendingClanId = attackingClanId === clan1Id ? clan2Id : clan1Id;
        let attackingClan = global.db.data.clans[attackingClanId];
        let defendingClan = global.db.data.clans[defendingClanId];

        defendingClan.hp -= damage;
        if (defendingClan.hp < 0) defendingClan.hp = 0;

        battleLogs += `🌀 *Round ${round}*\n` +
            `⚔️ *${attackingClan.name}* menyerang *${defendingClan.name}* dengan damage *${damage}*.\n` +
            `❤️ *${attackingClan.name} HP:* ${attackingClan.hp}\n` +
            `❤️ *${defendingClan.name} HP:* ${defendingClan.hp}\n\n`;

        attackingClanId = defendingClanId;
        await sleep(3000); // Delay between rounds
    }

    let winnerClanId = clan1.hp > 0 ? clan1Id : clan2Id;
    let loserClanId = winnerClanId === clan1Id ? clan2Id : clan1Id;

    let stealAmount = Math.floor(global.db.data.clans[loserClanId].catm * 0.2);
    global.db.data.clans[loserClanId].catm -= stealAmount;
    global.db.data.clans[winnerClanId].catm += stealAmount;

    battleLogs += `🏆 *WAR SELESAI* 🏆\n\n` +
        `🎉 *Pemenang:* *${global.db.data.clans[winnerClanId].name}*\n` +
        `💰 *Hadiah:* ${stealAmount} ATM dirampas dari *${global.db.data.clans[loserClanId].name}*\n\n` +
        `❌ *Kalah:* *${global.db.data.clans[loserClanId].name}*\n`;

    global.db.data.clanWar[winnerClanId].status = 'completed';
    global.db.data.clanWar[loserClanId].status = 'completed';

    conn.reply(chatId, battleLogs);

    setTimeout(() => {
        delete global.db.data.clanWar[clan1Id];
        delete global.db.data.clanWar[clan2Id];
    }, 5000);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runWarLoop(clan1Id, clan2Id, attackingClanId, conn) {
    const clan1 = global.db.data.clans[clan1Id];
    const clan2 = global.db.data.clans[clan2Id];
    
    let clan1Leader = clan1.leader;
    let clan2Leader = clan2.leader;
    
    while (clan1.hp > 0 && clan2.hp > 0) {
        let damage = getRandom(5, 15);
        let defendingClanId = attackingClanId === clan1Id ? clan2Id : clan1Id;
        let attackingClan = global.db.data.clans[attackingClanId];
        let defendingClan = global.db.data.clans[defendingClanId];
        
        defendingClan.hp -= damage;
        if (defendingClan.hp < 0) defendingClan.hp = 0;
        
      await sleep(3000);
        
   const attackerMessage = `⚔️ SERANGAN WAR ⚔️\nClan ${attackingClan.name} menyerang Clan ${defendingClan.name}!\nDamage: ${damage}\n\nStatus HP:\nClan ${attackingClan.name}: ${attackingClan.hp}\nClan ${defendingClan.name}: ${defendingClan.hp}`;
        
        const defenderMessage = `⚡ CLAN DISERANG ⚡\nClan ${defendingClan.name} diserang oleh Clan ${attackingClan.name}!\nDarah clan kamu berkurang ${damage}!\n\nStatus HP:\nClan ${defendingClan.name}: ${defendingClan.hp}\nClan ${attackingClan.name}: ${attackingClan.hp}`;
        
        conn.reply(attackingClan.leader, attackerMessage, null);
        conn.reply(defendingClan.leader, defenderMessage, null);
        
      attackingClanId = defendingClanId;
        
       await sleep(3000);
    }
    
   let winnerClanId = clan1.hp > 0 ? clan1Id : clan2Id;
    let loserClanId = winnerClanId === clan1Id ? clan2Id : clan1Id;
    
  let stealAmount = Math.floor(global.db.data.clans[loserClanId].catm * 0.203);
    global.db.data.clans[loserClanId].catm -= stealAmount;
    global.db.data.clans[winnerClanId].catm += stealAmount;
    
   global.db.data.clanWar[winnerClanId].status = 'completed';
    global.db.data.clanWar[loserClanId].status = 'completed';
    
    const winnerMessage = `🏆 WAR SELESAI - KEMENANGAN! 🏆\nClan ${global.db.data.clans[winnerClanId].name} menang melawan Clan ${global.db.data.clans[loserClanId].name}!\n\nClan kamu berhasil mendapatkan uang sebesar ${stealAmount} yang ditambahkan ke ATM clan.`;
    
    const loserMessage = `❌ WAR SELESAI - KEKALAHAN! ❌\nClan ${global.db.data.clans[loserClanId].name} kalah melawan Clan ${global.db.data.clans[winnerClanId].name}.\n\nClan ${global.db.data.clans[winnerClanId].name} menang dan merampas uang ATM clan kamu sebesar ${stealAmount}.`;
    
    conn.reply(global.db.data.clans[winnerClanId].leader, winnerMessage, null);
    conn.reply(global.db.data.clans[loserClanId].leader, loserMessage, null);
    
   setTimeout(() => {
        delete global.db.data.clanWar[clan1Id];
        delete global.db.data.clanWar[clan2Id];
    }, 5000);
}

setInterval(() => {
    for (let clanId in global.db.data.clans) {
        if (!global.db.data.clans[clanId].hp) global.db.data.clans[clanId].hp = 100;
        if (global.db.data.clans[clanId].hp < 100) global.db.data.clans[clanId].hp += 20;
        if (global.db.data.clans[clanId].hp > 100) global.db.data.clans[clanId].hp = 100;
    }
}, 24 * 60 * 60 * 1000);
