import fs from 'fs-extra'
import toMs from "ms";
import moment from "moment-timezone"

let handler = async (m, { conn, q, args, setReply, usedPrefix, command }) => {
  let timeWib = moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm');

  if (!m.isGroup) {
    const rex1 = /chat.whatsapp.com\/([\w\d]*)/g;
    let LinkGc = q.includes("|") ? q.split("|")[0] : q.split(" ")[0]
    let Second = q.includes("|") ? q.split("|")[1] : q.split(" ")[1]
    let code = LinkGc.match(rex1);
    if (code == null) return setReply("❌ Tidak ada link undangan terdeteksi!");
    let kode = code[0].replace("chat.whatsapp.com/", "");

    var { id, subject, creation, participants, owner, subjectOwner } = await conn.groupGetInviteInfo(kode).catch(() => m.reply("❌ Link undangan tidak valid."));
    let tagnya = owner ?? subjectOwner ?? ""
    let creator = owner ?? subjectOwner ?? "Tidak ada"
    if (creator !== "Tidak ada") creator = "@" + creator.split("@")[0]

    let chat = global.db.data.chats[id];

    // Gabung ke grup jika bisa
    try {
      var nana = await conn.groupAcceptInvite(kode)
    } catch {
      var nana = undefined
    }

    await addVip(id, subject, LinkGc, Second, creator)

    let groupMetadata = nana == undefined ? {} : await conn.groupMetadata(id)
    let data = nana == undefined ? participants : groupMetadata.participants
    let member = data.filter(u => u.admin !== 'admin' && u.admin !== 'superadmin')
    let admin = data.filter(u => u.admin === 'admin' || u.admin === 'superadmin')

    let teks = `
––––––『 *ORDER GROUP VVIP SUCCESS* 』––––––

🌟 *Group VVIP*
• Name: ${subject}
• Created at: ${new Date(creation * 1000).toLocaleString()}
• Creator: ${creator}
• Group Id: ${id}
• Admins: ${admin.length} (semua admin mendapatkan akses premium)
• Members: ${member.length}
• Durasi: ${conn.msToDate(toMs(Second))}
• Waktu Order: ${timeWib}
• Berakhir: ${formatEnd(Date.now() + toMs(Second))}

📌 *Note:*
• Admin dapat akses fitur premium selama durasi aktif
• Ketik .menu untuk memulai
• Gunakan .cekorder untuk cek masa aktif
• Tidak bisa refund
• Owner: wa.me/${nomerOwner}

${copyright} - ${calender}`

    await conn.sendMessage(m.chat, { text: teks, mentions: [tagnya] }, { quoted: m })
    if (nana == undefined) return m.reply('🕒 Menunggu persetujuan grup untuk bergabung.')

    await sleep(2000)
    await conn.sendMessage(id, { text: teks })

  } else if (m.isGroup) {
    if (!q) return setReply("⏱ Masukkan durasi, contoh: 3d")
    let linkgc = m.isBotAdmin ? await conn.groupInviteCode(m.chat) : null
    let link = linkgc ? `https://chat.whatsapp.com/${linkgc}` : "Link tidak tersedia"
    let creator = m.chat.split('@')[0]
    await addVip(m.chat, m.groupName, link, q, creator)
    m.reply("✅ Grup ini telah diubah menjadi *VVIP*, semua admin dapat akses fitur premium.")
  }

  // Fungsi waktu selesai
  function formatEnd(ms) {
    return moment(ms).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm')
  }

  // Fungsi simpan ke database chat
  function addVip(gid, subject, link, expired, creator) {
    let timeWib = moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm')
    let obj = global.db.data.chats[gid] || {}
    obj.id = gid
    obj.name = subject
    obj.linkgc = link
    obj.expired = Date.now() + toMs(expired)
    obj.vipExpired = Date.now() + toMs(expired)
    obj.isVip = true
    obj.adminVipAccess = true
    obj.timeOrder = timeWib
    obj.timeEnd = formatEnd(Date.now() + toMs(expired))
    obj.creator = creator == 'Tidak ada' ? 'Tidak ada' : 'wa.me/' + creator.split('@')[1]
    global.db.data.chats[gid] = obj
  }
}

handler.help = ['addgroupvvip <link|durasi>', 'addgroupvvip <durasi>']
handler.tags = ['owner']
handler.command = /^(addgroupvip|addgroupvvip|setgroupvip)$/i
handler.owner = true
handler.group = false

export default handler