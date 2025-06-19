import { readFileSync } from 'fs';

// Function untuk membuat thumbnail
function thumbnail(url) {
    return url || 'https://files.catbox.moe/kiycz0.jpgg';
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

async function handler(m, { conn, usedPrefix }) {

    const tutorialText = `📚 *TUTORIAL TRADING SAHAM VIRTUAL* 📚

🔧 *CARA KERJA SISTEM:*

📊 *Sistem Harga Real-time:*
• Harga berubah otomatis setiap 15 menit
• Simulasi volatilitas pasar sesungguhnya
• Perhitungan profit/loss real-time
• Data disimpan permanen di database

⏰ *JAM OPERASIONAL MARKET:*
• 🟢 BUKA: Senin-Jumat 09:00-15:30 WIB
• 🔴 TUTUP: Sabtu-Minggu & Hari Libur
• ⚠️ Pre-market: 08:45-09:00 WIB
• 🔔 After-hours: 15:30-16:00 WIB

🏢 *SAHAM YANG TERSEDIA:*
• BBCA - Bank Central Asia
• BBRI - Bank Rakyat Indonesia  
• BBNI - Bank Negara Indonesia
• BRIS - Bank Syariah Indonesia

📋 *PERINTAH DASAR:*

1️⃣ *Melihat Harga Saham*
   ${usedPrefix}market
   > Menampilkan harga real-time semua saham

2️⃣ *Melihat Portofolio*  
   ${usedPrefix}portofolio
   > Menampilkan saham yang Anda miliki

3️⃣ *Membeli Saham*
   ${usedPrefix}market beli [kode] [lot]
   Contoh: ${usedPrefix}market beli bbca 5
   > Membeli 5 lot saham BBCA

4️⃣ *Menjual Saham*
   ${usedPrefix}market jual [kode] [lot] 
   Contoh: ${usedPrefix}market jual bbca 3
   > Menjual 3 lot saham BBCA

🚨 *SISTEM ALERT KERUGIAN:*

*PENGERTIAN ALERT:*
Alert adalah sistem peringatan otomatis yang akan memberitahu Anda ketika investasi saham mengalami kerugian yang signifikan. Sistem ini membantu investor mengambil keputusan cepat untuk meminimalkan kerugian lebih lanjut.

*FITUR UTAMA ALERT:*
• Alert Kerugian Besar (>= -50%)
• Peringatan Resiko Suspend (>= -80%)
• Status Monitoring Real-time
• Rekomendasi Aksi untuk Investor

*LEVEL PERINGATAN:*
• 🟡 WASPADA: Kerugian -25% hingga -49%
  ↳ Pantau ketat, siapkan strategi exit
• 🟠 BAHAYA: Kerugian -50% hingga -79%
  ↳ Pertimbangan jual untuk cut loss
• 🔴 KRITIS: Kerugian -80% hingga -99%
  ↳ Resiko suspend tinggi, segera ambil tindakan
• ⚫ SUSPEND: Kerugian >= -95%
  ↳ Resiko tinggi suspend trading

*CARA KERJA ALERT:*
1. Sistem otomatis memantau performa portfolio
2. Ketika kerugian mencapai threshold, alert dikirim
3. Notifikasi berisi level bahaya dan rekomendasi
4. Update status setiap perubahan harga signifikan

💰 *STRUKTUR BIAYA TRADING:*

📈 *BIAYA PEMBELIAN:*
• Broker Fee: 0.15% dari nilai transaksi
• Admin Fee: Rp 5.000 per transaksi
• Total biaya beli = (Harga × Lot × 100 × 0.0015) + 5.000

📉 *BIAYA PENJUALAN:*
• Broker Fee: 0.25% dari nilai transaksi  
• Pajak PPh: 0.1% dari nilai transaksi
• Admin Fee: Rp 5.000 per transaksi
• Total biaya jual = (Harga × Lot × 100 × 0.0035) + 5.000

💡 *CONTOH PERHITUNGAN BIAYA:*

*Beli BBCA 5 lot @ Rp 10.000:*
• Nilai transaksi: 5 × 100 × 10.000 = Rp 5.000.000
• Broker fee: 5.000.000 × 0.0015 = Rp 7.500
• Admin fee: Rp 5.000
• Total biaya: Rp 12.500
• Total yang dibayar: Rp 5.012.500

*Jual BBCA 5 lot @ Rp 11.000:*
• Nilai transaksi: 5 × 100 × 11.000 = Rp 5.500.000
• Broker fee: 5.500.000 × 0.0025 = Rp 13.750
• Pajak PPh: 5.500.000 × 0.001 = Rp 5.500
• Admin fee: Rp 5.000
• Total biaya: Rp 24.250
• Yang diterima: Rp 5.475.750

📊 *NET PROFIT CALCULATION:*
• Profit kotor: Rp 500.000
• Total biaya trading: Rp 36.750
• Net profit: Rp 463.250

💡 *TIPS TRADING:*

🎯 *Strategi Pemula:*
• Mulai dengan investasi kecil (1-2 lot)
• Diversifikasi portfolio ke beberapa saham
• Pantau pergerakan harga secara berkala
• Perhitungkan biaya trading dalam profit target

📈 *Membaca Grafik:*
• 📈 = Harga naik dari harga normal
• 📉 = Harga turun dari harga normal
• % menunjukkan persentase perubahan

💰 *Manajemen Risiko:*
• Set target profit minimal 5% untuk cover biaya
• Gunakan stop loss -20% untuk meminimalkan kerugian
• Perhatikan alert system untuk tindakan cepat
• Investasi jangka panjang lebih menguntungkan

⚠️ *PERINGATAN PENTING:*
• Market hanya buka jam bursa (09:00-15:30 WIB)
• Kerugian 100% akan reset saham otomatis
• Biaya trading akan mengurangi profit
• Alert kerugian membantu mengambil keputusan cepat
• 1 lot = 100 lembar saham

🏆 *FITUR LANJUTAN:*
• Average price tracking dengan biaya
• Real-time profit/loss calculator
• Alert system untuk risk management
• Portfolio performance metrics
• Trading cost calculator

📊 *CONTOH SKENARIO DENGAN ALERT:*

*Skenario 1 - Profit:*
Beli BBCA 2 lot @ 10.000 = 2.024.000 (termasuk biaya)
Harga naik ke 11.500 (+15%)
Jual 2 lot @ 11.500 = 2.275.250 (setelah biaya)
Net Profit = 251.250 (12.4%)

*Skenario 2 - Alert Kerugian:*
Beli BBRI 5 lot @ 5.000 = 2.512.500
Harga turun ke 3.500 (-30%)
🟡 ALERT WASPADA dikirim otomatis
Nilai sekarang = 1.750.000
Unrealized Loss = -762.500 (-30.4%)

🎓 *LEVEL TRADER:*
📊 Pemula: 0-5 transaksi, fokus belajar biaya
📈 Menengah: 6-20 transaksi, manfaatkan alert system
🏆 Ahli: 20+ transaksi, strategi advance

💎 *REKOMENDASI TRADING HOURS:*
• 09:30-10:30: Opening volatility tinggi
• 11:00-14:00: Stable trading period  
• 14:30-15:30: Closing rally/selloff

Selamat trading dan semoga profit! 💰`;

    conn.sendMessage(m.chat, {
        document: readFileSync('./package.json'),
        mimetype: 'application/pdf',
        fileName: `Tutorial Trading Saham`,
        fileLength: "999999999999",
        caption: tutorialText,
        footer: `Tutorial Trading || Herta Bot`,
        buttons: [
            {
                buttonId: `!market`,
                buttonText: { displayText: '📈 Lihat Market' },
                type: 1
            },
            {
                buttonId: `!portofolio`,
                buttonText: { displayText: '💼 Lihat Portofolio' },
                type: 1
            }
        ],
        headerType: 1,
        viewOnce: true,
        contextInfo: {
            externalAdReply: {
                title: 'Tutorial Trading Saham Virtual',
                body: 'Panduan Lengkap dengan Alert System',
                thumbnailUrl: thumbnail('https://files.catbox.moe/kiycz0.jpg'),
                sourceUrl: 'https://whatsapp.com/channel/0029VafEhDUIXnlyGgMSgH2u',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: fkontak(conn, m) });
}

// Properti untuk membantu handler
handler.help = ['saham'];
handler.tags = ['tutorial'];
handler.command = /^saham$/i;

export default handler;