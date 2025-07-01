import { generateWAMessageFromContent } from 'baileys';

let handler = async (m, { conn }) => {
  let totalreg = Object.keys(global.db.data.users).length
  let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length
  let unregistered = totalreg - rtotalreg

  const poll = await generateWAMessageFromContent(m.chat, {
    pollResultSnapshotMessage: {
      pollVotes: [
        { optionName: 'Terdaftar 📥', optionVoteCount: rtotalreg.toString() },
        { optionName: 'Tidak Terdaftar 📤', optionVoteCount: unregistered.toString() }
      ],
      name: `Total User di Database 🗃️`,
    }
  }, { quoted: m, ...global.ephemeral });

  return conn.relayMessage(poll.key.remoteJid, poll.message, { messageId: poll.key.id });
}

handler.help = ['user']
handler.tags = ['main', 'info']
handler.command = /^(pengguna|(jumlah)?database|user)$/i

export default handler