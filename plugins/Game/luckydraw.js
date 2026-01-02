// luckydraw.js
export const handler = async (m, { text, conn }) => {
    const user = global.db.data.users[m.sender];
    const [betAmountStr, ticketNumberStr] = text.split(' ');
    const betAmount = parseInt(betAmountStr);
    const ticketNumber = parseInt(ticketNumberStr);

    // Initialize the game session if it doesn't exist for the current group
    conn.luckydraw = conn.luckydraw || {};
    if (!conn.luckydraw[m.chat]) {
        conn.luckydraw[m.chat] = { tickets: new Set(), inProgress: false };
    }

    // Check if this is a new session or if the game is in progress
    if (conn.luckydraw[m.chat].inProgress) {
        return m.reply("🎲 Lucky Draw sedang berlangsung! Tiket-tiket sedang dikumpulkan untuk undian.");
    }

    // Show usage instructions if arguments are missing
    if (!betAmountStr || !ticketNumberStr) {
        return m.reply(
            "🎲 Cara menggunakan Lucky Draw:\n" +
            "Ketik: *.luckydraw <jumlah_taruhan> <nomor_tiket>*\n" +
            "Contoh: *.luckydraw 1000 50*\n\n" +
            "💡 Pilih nomor tiket antara 1 hingga 100. Tunggu hingga terkumpul 5 peserta untuk undian."
        );
    }

    if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
        return m.reply("💸 Masukkan jumlah taruhan yang valid.");
    }

    if (user.money < betAmount) {
        return m.reply("❌ Saldo Anda tidak cukup untuk taruhan ini.");
    }

    if (isNaN(ticketNumber) || ticketNumber < 1 || ticketNumber > 100) {
        return m.reply("🎫 Nomor tiket harus antara 1 dan 100.");
    }

    // Deduct user's money based on the bet amount
    user.money -= betAmount;

    // Store user's ticket in the current session
    conn.luckydraw[m.chat].tickets.add({ user: m.sender, ticket: ticketNumber, bet: betAmount });

    // Notify user of their ticket purchase
    m.reply(`✅ Anda telah membeli tiket nomor ${ticketNumber}. Tunggu hingga 5 tiket terkumpul untuk undian!`);

    // Check if enough tickets have been purchased for the draw
    if (conn.luckydraw[m.chat].tickets.size >= 5) {
        conn.luckydraw[m.chat].inProgress = true; // Set session as in-progress
        const winningNumber = Math.floor(Math.random() * 100) + 1;
        let winners = [];
        let message = `🎉 Lucky Draw 🎉\n\n🏆 Angka pemenang: ${winningNumber}\n\n🎟 List Ticket:\n`;

        // Prepare mentions for each user in the ticket list
        let mentions = [];

        // List all participants and check for winners
        conn.luckydraw[m.chat].tickets.forEach(entry => {
            const shortId = (conn.decodeJid ? conn.decodeJid(entry.user) : entry.user || '').split('@')[0];
            message += `- @${shortId}\n   Nomor Tiket: ${entry.ticket}\n   Taruhan: Rp.${entry.bet}\n`;
            mentions.push(entry.user);

            if (entry.ticket === winningNumber) {
                const prize = entry.bet * 10;
                // ensure user object exists
                global.db.data.users[entry.user] = global.db.data.users[entry.user] || { money: 0 };
                global.db.data.users[entry.user].money += prize;
                winners.push({ user: entry.user, prize });
            }
        });

        // Reset tickets after the draw
        conn.luckydraw[m.chat].tickets.clear();
        conn.luckydraw[m.chat].inProgress = false; // End the session

        // Compose the result message
        if (winners.length === 0) {
            message += "\n😢 Sayangnya, tidak ada pemenang kali ini. Coba lagi!";
            await conn.sendMessage(m.chat, { text: message, mentions });
        } else {
            // Add winner announcement to the message
            message += "\n🎉 Pemenang:\n";
            winners.forEach(winner => {
                const winnerShort = (conn.decodeJid ? conn.decodeJid(winner.user) : winner.user || '').split('@')[0];
                message += `- Selamat! @${winnerShort} memenangkan Rp.${winner.prize}!\n`;
                mentions.push(winner.user);
            });

            // Send image and message with mentions
            const winningImageUrl = 'https://pomf2.lain.la/f/y88myjq.jpg'; // Replace with a valid image URL
            await conn.sendMessage(m.chat, { image: { url: winningImageUrl }, caption: message, mentions });
        }
    }
};

handler.help = ['luckydraw <taruhan> <nomor_tiket>'];
handler.tags = ['game'];
handler.command = /^luckydraw$/;

export default handler;
