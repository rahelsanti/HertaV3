import schedule from 'node-schedule'
import ms from 'parse-ms'
import toMs from 'ms'
import moment from 'moment-timezone'

const handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!m.isGroup) throw '❗ Perintah ini hanya untuk di dalam grup!';
  const target = m.mentionedJid?.[0] || args[0];
  const duration = args[1];

  if (!target || !duration) throw `📌 Contoh penggunaan:
${usedPrefix + command} @user 10m

🕒 Format waktu yang didukung:
• 1s = 1 detik
• 1m = 1 menit
• 1h = 1 jam
• 1d = 1 hari
`;

  // Konversi waktu ke milidetik
  let durationMs = toMs(duration);
  if (!durationMs) throw '⏰ Format durasi tidak valid! Contoh: 5m, 1h, 1d';

  let now = Date.now();
  let end = now + durationMs;
  let formattedEnd = moment(end).tz('Asia/Jakarta').format('LLLL');

  // Promote user
  await conn.groupParticipantsUpdate(m.chat, [target], 'promote');

  await conn.sendMessage(m.chat, {
    text: `✅ @${target.split('@')[0]} kini *admin sementara*.\n⏳ Akan dicabut otomatis pada:\n🗓️ *${formattedEnd}*`,
    mentions: [target]
  });

  // Jadwalkan demote
  schedule.scheduleJob(new Date(end), async () => {
    await conn.groupParticipantsUpdate(m.chat, [target], 'demote');
    conn.sendMessage(m.chat, {
      text: `⏱️ Waktu habis! @${target.split('@')[0]} telah di *demote* otomatis.`,
      mentions: [target]
    });
  });
};

handler.help = ['trialadmin @user <durasi>'];
handler.tags = ['group'];
handler.command = /^trialadmin$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;