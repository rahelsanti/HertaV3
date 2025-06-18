import { readFileSync } from 'fs';

// Function untuk membuat thumbnail
function thumbnail(url) {
    return url || 'https://files.catbox.moe/kiycz0.jpg';
}

// Function untuk membuat fake contact
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

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🚨 SISTEM PERINGATAN KERUGIAN & RESIKO SUSPEND SAHAM
 * ═══════════════════════════════════════════════════════════════════
 * 
 * FITUR UTAMA:
 * 1. Alert Kerugian Besar (>= -50%)
 * 2. Peringatan Resiko Suspend (>= -80%)
 * 3. Status Monitoring Real-time
 * 4. Rekomendasi Aksi untuk Investor
 * 
 * LEVEL PERINGATAN:
 * - 🟡 WASPADA: Kerugian -25% hingga -49%
 * - 🟠 BAHAYA: Kerugian -50% hingga -79%  
 * - 🔴 KRITIS: Kerugian -80% hingga -99%
 * - ⚫ SUSPEND: Kerugian >= -95% (Resiko Tinggi Suspend)
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

// Function untuk mengecek dan memberikan alert kerugian besar
function checkLossAlert(stockCode, stockName, investasi, investasiSekarang, currentPrice, avgPrice) {
    if (investasi <= 0) return { alert: '', riskLevel: 'AMAN', emoji: '🟢' };
    
    const lossPercent = ((investasiSekarang - investasi) / investasi) * 100;
    const lossAmount = investasi - investasiSekarang;
    
    let alert = '';
    let riskLevel = 'AMAN';
    let emoji = '🟢';
    let recommendation = '';
    
    // Tentukan level resiko berdasarkan persentase kerugian
    if (lossPercent <= -95) {
        riskLevel = 'SUSPEND';
        emoji = '⚫';
        alert = `⚫ *PERINGATAN SUSPEND RISK!* ⚫\n`;
        alert += `📊 Saham: ${stockCode} (${stockName})\n`;
        alert += `💸 Kerugian: ${lossAmount.toLocaleString()} (${lossPercent.toFixed(2)}%)\n`;
        alert += `🎯 Harga Rata-rata: ${avgPrice.toLocaleString()}\n`;
        alert += `💲 Harga Sekarang: ${currentPrice.toLocaleString()}\n`;
        alert += `⚠️ *RESIKO SUSPEND SANGAT TINGGI!*\n`;
        recommendation = `🔄 Pertimbangkan untuk cut loss segera\n💡 Saham berisiko suspend dari bursa\n`;
        
    } else if (lossPercent <= -80) {
        riskLevel = 'KRITIS';
        emoji = '🔴';
        alert = `🔴 *PERINGATAN KRITIS!* 🔴\n`;
        alert += `📊 Saham: ${stockCode} (${stockName})\n`;
        alert += `💸 Kerugian: ${lossAmount.toLocaleString()} (${lossPercent.toFixed(2)}%)\n`;
        alert += `🎯 Harga Rata-rata: ${avgPrice.toLocaleString()}\n`;
        alert += `💲 Harga Sekarang: ${currentPrice.toLocaleString()}\n`;
        recommendation = `⚠️ Pertimbangkan strategi cut loss\n📈 Monitor ketat pergerakan harga\n`;
        
    } else if (lossPercent <= -50) {
        riskLevel = 'BAHAYA';
        emoji = '🟠';
        alert = `🟠 *PERINGATAN KERUGIAN BESAR!* 🟠\n`;
        alert += `📊 Saham: ${stockCode} (${stockName})\n`;
        alert += `💸 Kerugian: ${lossAmount.toLocaleString()} (${lossPercent.toFixed(2)}%)\n`;
        alert += `🎯 Harga Rata-rata: ${avgPrice.toLocaleString()}\n`;
        alert += `💲 Harga Sekarang: ${currentPrice.toLocaleString()}\n`;
        recommendation = `📊 Evaluasi fundamental saham\n💰 Pertimbangkan averaging down\n`;
        
    } else if (lossPercent <= -25) {
        riskLevel = 'WASPADA';
        emoji = '🟡';
        alert = `🟡 *PERINGATAN WASPADA* 🟡\n`;
        alert += `📊 Saham: ${stockCode} (${stockName})\n`;
        alert += `💸 Kerugian: ${lossAmount.toLocaleString()} (${lossPercent.toFixed(2)}%)\n`;
        recommendation = `📈 Monitor pergerakan harga\n🔍 Analisa berita terkait emiten\n`;
    }
    
    if (alert) {
        alert += `\n💡 *REKOMENDASI:*\n${recommendation}\n`;
    }
    
    return { 
        alert, 
        riskLevel, 
        emoji, 
        lossPercent: lossPercent.toFixed(2),
        lossAmount 
    };
}

// Function untuk membuat ringkasan resiko portofolio
function getPortfolioRiskSummary(alerts) {
    const riskCounts = {
        'SUSPEND': 0,
        'KRITIS': 0, 
        'BAHAYA': 0,
        'WASPADA': 0,
        'AMAN': 0
    };
    
    alerts.forEach(alert => {
        riskCounts[alert.riskLevel]++;
    });
    
    let summary = `\n🛡️ *RINGKASAN RESIKO PORTOFOLIO:*\n`;
    
    if (riskCounts.SUSPEND > 0) {
        summary += `⚫ Suspend Risk: ${riskCounts.SUSPEND} saham\n`;
    }
    if (riskCounts.KRITIS > 0) {
        summary += `🔴 Kritis: ${riskCounts.KRITIS} saham\n`;
    }
    if (riskCounts.BAHAYA > 0) {
        summary += `🟠 Bahaya: ${riskCounts.BAHAYA} saham\n`;
    }
    if (riskCounts.WASPADA > 0) {
        summary += `🟡 Waspada: ${riskCounts.WASPADA} saham\n`;
    }
    if (riskCounts.AMAN > 0) {
        summary += `🟢 Aman: ${riskCounts.AMAN} saham\n`;
    }
    
    // Tambahkan rekomendasi umum portofolio
    const totalRiskyStocks = riskCounts.SUSPEND + riskCounts.KRITIS + riskCounts.BAHAYA;
    if (totalRiskyStocks > 0) {
        summary += `\n⚠️ *PERINGATAN PORTOFOLIO:*\n`;
        summary += `${totalRiskyStocks} saham dalam kondisi beresiko tinggi!\n`;
        summary += `💡 Pertimbangkan diversifikasi portofolio\n`;
    }
    
    return summary;
}

async function handler(m, { conn, usedPrefix }) {
    const user = global.db.data.users[m.sender];
    const settings = global.db.data.settings["settingbot"];

    // Inisialisasi harga saham jika belum ada
    if (!("bbcaNormalPrice" in settings)) settings.bbcaNormalPrice = 10150;
    if (!("bbriNormalPrice" in settings)) settings.bbriNormalPrice = 4750;
    if (!("bbniNormalPrice" in settings)) settings.bbniNormalPrice = 6075;
    if (!("brisNormalPrice" in settings)) settings.brisNormalPrice = 2894;

    // Set harga current jika belum ada
    if (!("bbcaPrice" in settings)) settings.bbcaPrice = settings.bbcaNormalPrice;
    if (!("bbriPrice" in settings)) settings.bbriPrice = settings.bbriNormalPrice;
    if (!("bbniPrice" in settings)) settings.bbniPrice = settings.bbniNormalPrice;
    if (!("brisPrice" in settings)) settings.brisPrice = settings.brisNormalPrice;

    // Inisialisasi data user
    if (!user.money) user.money = 0;
    if (!user.totalInvestasi) user.totalInvestasi = 0;
    if (!user.totalInvestasiSekarang) user.totalInvestasiSekarang = 0;

    // Fungsi untuk menghitung status naik/turun
    const calculateStatus = (price, normalPrice) => {
        const diffPercent = ((price - normalPrice) / normalPrice * 100).toFixed(2);
        const status = price > normalPrice ? `📈 Naik (+${diffPercent}%)` : `📉 Turun (${diffPercent}%)`;
        return { status, emoji: price > normalPrice ? "📈" : "📉", diffPercent: parseFloat(diffPercent) };
    };

    // Data saham yang tersedia
    const stocks = {
        bbca: { name: 'Bank Central Asia', code: 'BBCA', priceKey: 'bbcaPrice', normalKey: 'bbcaNormalPrice' },
        bbri: { name: 'Bank Rakyat Indonesia', code: 'BBRI', priceKey: 'bbriPrice', normalKey: 'bbriNormalPrice' },
        bbni: { name: 'Bank Negara Indonesia', code: 'BBNI', priceKey: 'bbniPrice', normalKey: 'bbniNormalPrice' },
        bris: { name: 'Bank Syariah Indonesia', code: 'BRIS', priceKey: 'brisPrice', normalKey: 'brisNormalPrice' }
    };

    // Data pengguna
    const investorName = m.pushName || 'Investor';
    const totalInvestasi = user.totalInvestasi || 0;
    let totalInvestasiSekarang = 0;
    let allAlerts = [];
    let riskAlerts = [];

    // Hitung ulang total investasi sekarang dan kumpulkan alerts
    for (const [key, stockData] of Object.entries(stocks)) {
        if (user[key] && user[`${key}LembarSaham`] > 0) {
            const currentPrice = settings[stockData.priceKey];
            const currentValue = currentPrice * user[`${key}LembarSaham`];
            user[`${key}InvestasiSekarang`] = currentValue;
            totalInvestasiSekarang += currentValue;

            // Cek alert kerugian
            const investasi = user[`${key}Investasi`] || 0;
            const lembarSaham = user[`${key}LembarSaham`] || 0;
            const avgPrice = lembarSaham > 0 ? Math.round(investasi / lembarSaham) : 0;
            
            const alertData = checkLossAlert(stockData.code, stockData.name, investasi, currentValue, currentPrice, avgPrice);
            
            if (alertData.alert) {
                allAlerts.push(alertData.alert);
            }
            
            riskAlerts.push(alertData);
        }
    }

    user.totalInvestasiSekarang = totalInvestasiSekarang;
    const totalProfit = totalInvestasiSekarang - totalInvestasi;
    const profitPercent = totalInvestasi > 0 ? ((totalProfit / totalInvestasi) * 100).toFixed(2) : '0.00';

    // Format output pesan dengan alerts
    let message = '';
    
    // Tampilkan alerts jika ada
    if (allAlerts.length > 0) {
        message += `🚨 *SISTEM PERINGATAN AKTIF* 🚨\n\n`;
        message += allAlerts.join('\n') + '\n';
        message += `═══════════════════════════════════\n\n`;
    }
    
    message += `🌐 *Market Bot Herta - V2* 🌐\n👤 *Investor:* ${investorName}\n\n💰 *Total Investasi:* ${totalInvestasi.toLocaleString()}\n💵 *Total Investasi Sekarang:* ${totalInvestasiSekarang.toLocaleString()}\n📈 *Total Profit:* ${totalProfit.toLocaleString()} (${profitPercent}%)\n`;

    // Tampilkan detail setiap saham yang dimiliki dengan status resiko
    for (const [key, stockData] of Object.entries(stocks)) {
        if (user[key] && user[`${key}LembarSaham`] > 0) {
            const currentPrice = settings[stockData.priceKey];
            const normalPrice = settings[stockData.normalKey];
            const { status, emoji } = calculateStatus(currentPrice, normalPrice);
            const lembarSaham = user[`${key}LembarSaham`] || 0;
            const lot = lembarSaham / 100;
            const investasi = user[`${key}Investasi`] || 0;
            const investasiSekarang = user[`${key}InvestasiSekarang`] || 0;
            const profit = investasiSekarang - investasi;
            const profitPercent = investasi > 0 ? ((profit / investasi) * 100).toFixed(2) : '0.00';
            const avgPrice = lembarSaham > 0 ? Math.round(investasi / lembarSaham) : 0;
            
            // Dapatkan status resiko untuk saham ini
            const riskData = riskAlerts.find(alert => 
                allAlerts.some(alertMsg => alertMsg.includes(stockData.code))
            );
            const riskEmoji = riskData ? riskData.emoji : '🟢';

            message += `\n🏷️ *Saham ${stockData.code}* (${stockData.name}) ${riskEmoji}\n`;
            message += `📊 *Average:* ${avgPrice.toLocaleString()}\n`;
            message += `💲 *Harga Per/Lembar:* ${currentPrice.toLocaleString()} ${emoji}\n`;
            message += `📦 *Harga Per/Lot:* ${(currentPrice * 100).toLocaleString()}\n`;
            message += `📈 *Lembar Saham:* ${lembarSaham.toLocaleString()}\n`;
            message += `📊 *Lot:* ${lot.toFixed(2)}\n`;
            message += `💸 *Investasi:* ${investasi.toLocaleString()}\n`;
            message += `💵 *Investasi Sekarang:* ${investasiSekarang.toLocaleString()}\n`;
            message += `💰 *Profit:* ${profit.toLocaleString()} (${profitPercent}%)\n`;
            message += `📊 *Status:* ${status}\n`;
        }
    }

    // Tambahkan ringkasan resiko portofolio
    if (riskAlerts.length > 0) {
        message += getPortfolioRiskSummary(riskAlerts);
    }

    if (totalInvestasi === 0) {
        message += '\n📭 *Anda belum memiliki saham apapun.*\n\nGunakan `.market beli [kode] [lot]` untuk mulai berinvestasi!';
    }

    // Kirim portofolio dengan format document seperti market.js
    return conn.sendMessage(m.chat, {
        document: readFileSync('./package.json'),
        mimetype: 'application/pdf',
        fileName: `Portofolio ${investorName}`,
        fileLength: "999999999999",
        caption: message,
        footer: `Portfolio Trading || Herta Bot`,
        buttons: [
            {
                buttonId: `!market`,
                buttonText: { displayText: '📊 Market Saham' },
                type: 1
            },
            {
                buttonId: `!portofolio`,
                buttonText: { displayText: '🔄 Refresh Portfolio' },
                type: 1
            },
        ],
        headerType: 1,
        viewOnce: true,
        contextInfo: {
            externalAdReply: {
                title: `📊 Portofolio ${investorName}`,
                body: `💰 Profit: ${totalProfit.toLocaleString()} (${profitPercent}%)`,
                thumbnailUrl: thumbnail('https://files.catbox.moe/kiycz0.jpg'),
                sourceUrl: 'https://whatsapp.com/channel/0029VafEhDUIXnlyGgMSgH2u',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: fkontak(conn, m) });
}

// Properti untuk membantu handler
handler.help = ['portofolio'];
handler.tags = ['finance'];
handler.command = /^portofolio$/i;

export default handler;