let handler = async (m, { text, command, usedPrefix, conn }) => {
    const userId = m.sender;
    const username = await conn.getName(userId);
    let user = global.db.data.users[userId];

    if (!user) {
        user = global.db.data.users[userId] = {
            money: 0,
            lastinvestasi: 0,
            prosesinvestasi: null,
            investmentLevel: 1,
            totalProfit: 0
        };
    }

    // Cek apakah user sedang investasi
    if (user.prosesinvestasi) {
        const investData = user.prosesinvestasi;
        const elapsed = Date.now() - investData.startTime;
        const duration = investData.duration;
        const progress = Math.min(Math.floor((elapsed / duration) * 100), 100);
        const remainingTime = Math.max(0, Math.ceil((duration - elapsed) / 60000));

        const barLength = 15;
        const filledBars = Math.floor((progress / 100) * barLength);
        const emptyBars = barLength - filledBars;
        const progressBar = '▰'.repeat(filledBars) + '▱'.repeat(emptyBars);

        const progressMessage = `📊 Investment Progress\n` +
                              `${progressBar} ${progress}%\n` +
                              `⏱️ ${remainingTime} menit tersisa\n` +
                              `💼 Portfolio: ${investData.portfolio}\n` +
                              `💰 Amount: ${investData.amount.toLocaleString()}`;
        return m.reply(progressMessage);
    }

    // Cek cooldown 5 menit
    if (user.lastinvestasi && Date.now() - user.lastinvestasi < 5 * 60 * 1000) {
        const sisa = Math.ceil((5 * 60 * 1000 - (Date.now() - user.lastinvestasi)) / 60000);
        return m.reply(`⏳ ${username}, tunggu ${sisa} menit sebelum berinvestasi lagi.`);
    }

    // Validasi input
    if (!text || (isNaN(text) && text.toLowerCase() !== 'all')) {
        const portfolios = ['Tech Stocks', 'Crypto', 'Gold', 'Real Estate', 'Bonds'];
        const randomPortfolio = portfolios[Math.floor(Math.random() * portfolios.length)];

        return m.reply(`💼 Investment Options\n` +
                      `Format: ${usedPrefix}${command} <amount>\n` +
                      `Example: ${usedPrefix}${command} 1000\n` +
                      `🎯 Suggested: ${randomPortfolio} portfolio`);
    }

    // Tentukan nominal
    let nominal = text.toLowerCase() === 'all' ? user.money : parseInt(text);
    if (nominal <= 0) return m.reply(`⚠️ Nominal harus lebih dari 0`);
    const minInvestment = user.investmentLevel * 100;
    if (nominal < minInvestment) {
        return m.reply(`📈 Minimum investment untuk level ${user.investmentLevel}: ${minInvestment.toLocaleString()}`);
    }
    if (nominal > user.money) {
        return m.reply(`💸 Uang kamu tidak cukup\nBalance: ${user.money.toLocaleString()}\nRequired: ${nominal.toLocaleString()}`);
    }

    // Portfolio
    const portfolios = [
        { name: 'Conservative Bonds', risk: 'Low', duration: 5, minReturn: 3, maxReturn: 8, lossChance: 0.15 },
        { name: 'Blue Chip Stocks', risk: 'Medium', duration: 5, minReturn: 5, maxReturn: 18, lossChance: 0.25 },
        { name: 'Growth Stocks', risk: 'High', duration: 5, minReturn: 8, maxReturn: 35, lossChance: 0.40 },
        { name: 'Crypto Assets', risk: 'Very High', duration: 5, minReturn: 15, maxReturn: 80, lossChance: 0.55 }
    ];

    let selectedPortfolio;
    if (nominal < 1000) selectedPortfolio = portfolios[0];
    else if (nominal < 5000) selectedPortfolio = portfolios[1];
    else if (nominal < 15000) selectedPortfolio = portfolios[2];
    else selectedPortfolio = portfolios[3];

    // Mulai investasi
    user.money -= nominal;
    user.prosesinvestasi = {
        amount: nominal,
        portfolio: selectedPortfolio.name,
        startTime: Date.now(),
        duration: selectedPortfolio.duration * 60 * 1000,
        risk: selectedPortfolio.risk,
        minReturn: selectedPortfolio.minReturn,
        maxReturn: selectedPortfolio.maxReturn,
        lossChance: selectedPortfolio.lossChance
    };
    await global.db.write();

    m.reply(`🚀 Investment Started\n` +
            `💰 Amount: ${nominal.toLocaleString()}\n` +
            `📊 Portfolio: ${selectedPortfolio.name}\n` +
            `⚡ Risk: ${selectedPortfolio.risk}\n` +
            `⏱️ Duration: 5 minutes`);

    setTimeout(async () => {
        const investData = user.prosesinvestasi;
        if (!investData) return;

        let result, changePercent;
        if (Math.random() < investData.lossChance) {
            result = 'loss';
            changePercent = Math.floor(Math.random() * 80 + 20);
        } else {
            result = 'profit';
            changePercent = Math.floor(Math.random() * (investData.maxReturn - investData.minReturn + 1) + investData.minReturn);
        }

        const nominal = investData.amount;
        let resultMessage;

        if (result === 'profit') {
            const profit = Math.floor(nominal * changePercent / 100);
            const totalReturn = nominal + profit;
            user.money += totalReturn;
            user.totalProfit += profit;

            if (user.totalProfit >= user.investmentLevel * 10000) {
                user.investmentLevel += 1;
                resultMessage = `📈 Investment Complete\n` +
                                `💰 Return: ${totalReturn.toLocaleString()}\n` +
                                `✨ Profit: +${profit.toLocaleString()} (+${changePercent}%)\n` +
                                `🎉 Level Up! Investment Level: ${user.investmentLevel}`;
            } else {
                resultMessage = `📈 Investment Complete\n` +
                                `💰 Return: ${totalReturn.toLocaleString()}\n` +
                                `✨ Profit: +${profit.toLocaleString()} (+${changePercent}%)`;
            }
        } else {
            const loss = Math.floor(nominal * changePercent / 100);
            const remaining = nominal - loss;
            user.money += remaining;
            resultMessage = `📉 Investment Complete\n` +
                            `💰 Return: ${remaining.toLocaleString()}\n` +
                            `💸 Loss: -${loss.toLocaleString()} (-${changePercent}%)`;
        }

        m.reply(resultMessage);
        user.lastinvestasi = Date.now();
        user.prosesinvestasi = null;
        await global.db.write();

    }, user.prosesinvestasi.duration);
};

handler.help = ['investasi <nominal>'];
handler.tags = ['rpg'];
handler.command = /^investasi$/i;
handler.rpg = true;
handler.group = true;
handler.register = true;

export default handler;