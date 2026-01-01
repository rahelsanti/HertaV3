let handler = async (m, { conn, command, args }) => {
  let user = global.db.data.users[m.sender];
  let totalEksplorasi = user.sand || 0;
  let ekplorasiFormatted = totalEksplorasi.toLocaleString('en-US');
  const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = await import("baileys");
  
  let mentionedJid = [m.sender];
  
  const destinations = [
    'Desa Elf', 'Desa Goblin', 'Lost Temple', 'Labirin Dark', 'Kastil Naga',
    'Gua Troll', 'Hutan Terlarang', 'Pantai Berhantu', 'Gunung Berapi',
    'Lembah Raksasa', 'Pulau Harta', 'Kuil Kuno', 'Reruntuhan Ajaib',
    'Hutan Mistis', 'Kota Hilang', 'Danau Beku', 'Dataran Guntur',
    'Gurun Pasir', 'Benteng Batu', 'Lembah Magis'
  ];
  
  let title = '';
  if (totalEksplorasi >= 1000) {
    title = 'Sang Legenda';
  } else if (totalEksplorasi >= 100) {
    title = 'Pecinta Alam';
  } else if (totalEksplorasi >= 25) {
    title = 'Penyelamat Alam';
  } else {
    title = 'Pemula';
  }
  
  // Function to randomly select three destinations
  function getRandomDestinations() {
    const shuffled = destinations.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  try {
    if (command === 'explore') {
      // Setup cooldown (10 minutes)
      let timing = (new Date - (user.lastbunga * 1)) * 1;
      if (timing < 3600000) return conn.reply(m.chat, `Kamu sudah lelah, istirahat dulu ya! Tunggu selama ${clockString(3600000 - timing)}`, floc);
      
      setTimeout(() => {
        if (user.tempDestinations) {
          delete user.tempDestinations;
          conn.reply(m.chat, `waktu untuk memilih destinasi explore telah habis. Silakan coba lagi.`, floc);
        }
      }, 60000); // Timeout 1 minute for destination selection
      
      const randomDestinations = getRandomDestinations();
      user.tempDestinations = randomDestinations;

      let msgs = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
          message: {
            "messageContextInfo": {
              "deviceListMetadata": {},
              "deviceListMetadataVersion": 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              contextInfo: {
                mentionedJid: [m.sender],
                isForwarded: true,       
              },



              body: proto.Message.InteractiveMessage.Body.create({
                text: `◤───「 *STATISTIK* 」──✦\n│🧑🏻‍💻 [ *Player :*  @${m.sender.replace(/@.+/g, '')}\n│🌟 [ *Total Explore :* ${ekplorasiFormatted} kali\n│🏆 [ *Title Saat ini :* ${title}\n◣──────────❈\n\n✦▣──┄╌╼〘 *EXPLORER* 〙╾╌┄──▣\n\n◤───「 *DESTINASI* 」──✦\n├⎆ 1. ${randomDestinations[0]}\n├⎆ 2. ${randomDestinations[1]}\n├⎆ 3. ${randomDestinations[2]}\n◣─────────────✦`
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: botName,
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                  { "name": "quick_reply", "buttonParamsJson": "{\"display_text\":\"Lokasi 1\",\"id\":\"!pilih 1\"}" },
                  { "name": "quick_reply", "buttonParamsJson": "{\"display_text\":\"Lokasi 2\",\"id\":\"!pilih 2\"}" },
                  { "name": "quick_reply", "buttonParamsJson": "{\"display_text\":\"Lokasi 3\",\"id\":\"!pilih 3\"}" },
                ]
              })
            })
          }
        }
      }, {quoted: m, userJid: m});

      return await conn.relayMessage(m.chat, msgs.message, { messageId: msgs.key.id });
    
    } else if (command === 'pilih') {
      // Check if tempDestinations exists
      if (!user.tempDestinations) {
        return conn.reply(m.chat, `silakan ketik .explore terlebih dahulu untuk mendapatkan pilihan destinasi.`, floc);
      }

      if (args.length === 0) {
        return conn.reply(m.chat, `@${m.sender.replace(/@.+/g, '')}, silakan pilih destinasi dengan mengetik .pilih <nomor>`, floc);
      }

      const pilihanIndex = parseInt(args[0]) - 1;
      const randomDestinations = user.tempDestinations;

      if (pilihanIndex < 0 || pilihanIndex >= randomDestinations.length) {
        return conn.reply(m.chat, `@${m.sender.replace(/@.+/g, '')}, pilihan tidak valid. Silakan ketik .pilih 1, .pilih 2, atau .pilih 3 untuk memilih destinasi yang diberikan`, floc);
      }

      const pilihan = randomDestinations[pilihanIndex];
        let hasil;

        switch (pilihan.toLowerCase()) {
            case 'desa elf':
                hasil = await exploreDesaElf(user);
                break;       
        case 'desa goblin':
          hasil = await exploreDesaGoblin(user);
          break;
        case 'lost temple':
          hasil = await exploreLostTemple(user);
          break;
        case 'labirin dark':
          hasil = await exploreLabirinDark(user);
          break;
        case 'kastil naga':
          hasil = await exploreKastilNaga(user);
          break;
        case 'gua troll':
          hasil = await exploreGuaTroll(user);
          break;
        case 'hutan terlarang':
          hasil = await exploreHutanTerlarang(user);
          break;
        case 'pantai berhantu':
          hasil = await explorePantaiBerhantu(user);
          break;
        case 'gunung berapi':
          hasil = await exploreGunungBerapi(user);
          break;
        case 'lembah raksasa':
          hasil = await exploreLembahRaksasa(user);
          break;
        case 'pulau harta':
          hasil = await explorePulauHarta(user);
          break;
        case 'kuil kuno':
          hasil = await exploreKuilKuno(user);
          break;
        case 'reruntuhan ajaib':
          hasil = await exploreReruntuhanAjaib(user);
          break;
        case 'hutan mistis':
          hasil = await exploreHutanMistis(user);
          break;
        case 'kota hilang':
          hasil = await exploreKotaHilang(user);
          break;
        case 'danau beku':
          hasil = await exploreDanauBeku(user);
          break;
        case 'dataran guntur':
          hasil = await exploreDataranGuntur(user);
          break;
        case 'gurun pasir':
          hasil = await exploreGurunPasir(user);
          break;
        case 'benteng batu':
          hasil = await exploreBentengBatu(user);
          break;
        case 'lembah magis':
          hasil = await exploreLembahMagis(user);
          break;
        // Add cases for other destinations...
        default:
          return conn.reply(m.chat, `@${m.sender.replace(/@.+/g, '')}, pilihan tidak valid. Silakan ketik .pilih 1, .pilih 2, atau .pilih 3 untuk memilih destinasi yang diberikan`, floc);
      }

      if (hasil) {
        setTimeout(() => {
          conn.reply(m.chat, `ayo explore kembali untuk menjelajahi dunia!`, m);
        }, 3600000); // Cooldown 10 minutes
      }

      // Clear temp destinations
      delete user.tempDestinations;
      // Update last explore time
      user.lastExploreTime = new Date();

      let msgs = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
          message: {
            "messageContextInfo": {
              "deviceListMetadata": {},
              "deviceListMetadataVersion": 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({

              contextInfo: {
                mentionedJid: [m.sender],
                isForwarded: true,       
              },
              
              body: proto.Message.InteractiveMessage.Body.create({
                text: `◤───「 *STATISTIK* 」──✦\n│🧑🏻‍💻 [ *Player :*  @${m.sender.replace(/@.+/g, '')}\n│🌟 [ *Total Explore :* ${ekplorasiFormatted} kali\n│🏆 [ *Title Saat ini :* ${title}\n◣──────────❈\n\n✦▣──┄╌╼〘 *EXPLORER* 〙╾╌┄──▣\n\n◤───「 *🗺️ HASIL EXPLORER* 」──✦\n├⎆ 🌍 *Destinasi:* ${pilihan}\n${hasil}\n◣─────────────✦`
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "© Herta-V2",
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                  { "name": "quick_reply", "buttonParamsJson": "{\"display_text\":\"Akun Explore\",\"id\":\"!inventory\"}" }
                ]
              })
            })
          }
        }
      }, {quoted: m, userJid: m});

      return await conn.relayMessage(m.chat, msgs.message, { messageId: msgs.key.id });
    }
  } catch (err) {
    m.reply("📢: " + err);
  }
};

// Example exploration functions
function exploreDesaElf(user) {
  const randomMoney = Math.floor(Math.random() * (500000 - 100 + 1)) + 100;
  const randomExp = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
  const randomDiamond = Math.floor(Math.random() * (3 - 2 + 1)) + 5;
  const randomUncommon = Math.floor(Math.random() * (3 - 2 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Selamat! Anda berhasil mendapatkan\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreDesaGoblin(user) {
  const randomMoney = Math.floor(Math.random() * (300000 - 50 + 1)) + 50;
  const randomExp = Math.floor(Math.random() * (150 - 30 + 1)) + 30;
  const randomDiamond = Math.floor(Math.random() * (5 - 3 + 4)) + 5;
  const randomUncommon = Math.floor(Math.random() * (10 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menemukan harta karun!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreLostTemple(user) {
  const randomMoney = Math.floor(Math.random() * (700000 - 150 + 1)) + 150;
  const randomExp = Math.floor(Math.random() * (300 - 70 + 1)) + 70;
  const randomDiamond = Math.floor(Math.random() * (3 - 2 + 1)) + 5;
  const randomUncommon = Math.floor(Math.random() * (5 - 3 + 4)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menjelajahi Lost Temple!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreLabirinDark(user) {
  const randomMoney = Math.floor(Math.random() * (3600000 - 120 + 1)) + 120;
  const randomExp = Math.floor(Math.random() * (250 - 60 + 1)) + 60;
  const randomDiamond = Math.floor(Math.random() * (3 - 2 + 1)) + 5;
  const randomUncommon = Math.floor(Math.random() * (10 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda berhasil keluar dari Labirin Dark!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreKastilNaga(user) {
  const randomMoney = Math.floor(Math.random() * (800000 - 200 + 1)) + 200;
  const randomExp = Math.floor(Math.random() * (400 - 100 + 1)) + 100;
  const randomDiamond = Math.floor(Math.random() * (3 - 2 + 1)) + 5;
  const randomUncommon = Math.floor(Math.random() * (5 - 3 + 4)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menaklukkan Kastil Naga!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreGuaTroll(user) {
  const randomMoney = Math.floor(Math.random() * (400000 - 80 + 1)) + 80;
  const randomExp = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
  const randomDiamond = Math.floor(Math.random() * (5 - 3 + 4)) + 5;
  const randomUncommon = Math.floor(Math.random() * (10 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda mengeksplorasi Gua Troll!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreHutanTerlarang(user) {
  const randomMoney = Math.floor(Math.random() * (500000 - 100 + 1)) + 100;
  const randomExp = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
  const randomDiamond = Math.floor(Math.random() * (3 - 2 + 1)) + 5;
  const randomUncommon = Math.floor(Math.random() * (5 - 3 + 4)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menjelajahi Hutan Terlarang!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function explorePantaiBerhantu(user) {
  const randomMoney = Math.floor(Math.random() * (450000 - 90 + 1)) + 90;
  const randomExp = Math.floor(Math.random() * (180 - 45 + 1)) + 45;
  const randomDiamond = Math.floor(Math.random() * (5 - 3 + 4)) + 5;
  const randomUncommon = Math.floor(Math.random() * (10 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda berani menjelajahi Pantai Berhantu!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreGunungBerapi(user) {
  const randomMoney = Math.floor(Math.random() * (700000 - 150 + 1)) + 150;
  const randomExp = Math.floor(Math.random() * (300 - 70 + 1)) + 70;
  const randomDiamond = Math.floor(Math.random() * (15 - 1 + 1)) + 5;
  const randomUncommon = Math.floor(Math.random() * (15 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda selamat dari Gunung Berapi!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreLembahRaksasa(user) {
  const randomMoney = Math.floor(Math.random() * (500000 - 100 + 1)) + 100;
  const randomExp = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
  const randomDiamond = Math.floor(Math.random() * (15 - 1 + 1)) + 5;
  const randomUncommon = Math.floor(Math.random() * (15 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menjelajahi Lembah Raksasa!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function explorePulauHarta(user) {
  const randomMoney = Math.floor(Math.random() * (800000 - 200 + 1)) + 200;
  const randomExp = Math.floor(Math.random() * (400 - 100 + 1)) + 100;
  const randomDiamond = Math.floor(Math.random() * (15 - 1 + 1)) + 5;
  const randomUncommon = Math.floor(Math.random() * (15 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menemukan harta karun di Pulau Harta!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreKuilKuno(user) {
  const randomMoney = Math.floor(Math.random() * (600000 - 120 + 1)) + 120;
  const randomExp = Math.floor(Math.random() * (250 - 60 + 1)) + 60;
  const randomDiamond = Math.floor(Math.random() * (3 - 1 + 2)) + 5;
  const randomUncommon = Math.floor(Math.random() * (15 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menjelajahi Kuil Kuno!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreReruntuhanAjaib(user) {
  const randomMoney = Math.floor(Math.random() * (700000 - 150 + 1)) + 150;
  const randomExp = Math.floor(Math.random() * (300 - 70 + 1)) + 70;
  const randomDiamond = Math.floor(Math.random() * (3 - 2 + 1)) + 5;
  const randomUncommon = Math.floor(Math.random() * (10 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menemukan misteri di Reruntuhan Ajaib!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreHutanMistis(user) {
  const randomMoney = Math.floor(Math.random() * (450000 - 90 + 1)) + 90;
  const randomExp = Math.floor(Math.random() * (180 - 45 + 1)) + 45;
  const randomDiamond = Math.floor(Math.random() * (5 - 3 + 4)) + 5;
  const randomUncommon = Math.floor(Math.random() * (10 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menjelajahi Hutan Mistis!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreKotaHilang(user) {
  const randomMoney = Math.floor(Math.random() * (600000 - 120 + 1)) + 120;
  const randomExp = Math.floor(Math.random() * (250 - 60 + 1)) + 60;
  const randomDiamond = Math.floor(Math.random() * (3 - 2 + 1)) + 5;
  const randomUncommon = Math.floor(Math.random() * (10 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menemukan Kota Hilang!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreDanauBeku(user) {
  const randomMoney = Math.floor(Math.random() * (500000 - 100 + 1)) + 100;
  const randomExp = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
  const randomDiamond = Math.floor(Math.random() * (5 - 3 + 4)) + 5;
  const randomUncommon = Math.floor(Math.random() * (10 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menjelajahi Danau Beku!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreDataranGuntur(user) {
  const randomMoney = Math.floor(Math.random() * (650000 - 130 + 1)) + 130;
  const randomExp = Math.floor(Math.random() * (270 - 60 + 1)) + 60;
  const randomDiamond = Math.floor(Math.random() * (3 - 2 + 1)) + 5;
  const randomUncommon = Math.floor(Math.random() * (10 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menjelajahi Dataran Guntur!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreGurunPasir(user) {
  const randomMoney = Math.floor(Math.random() * (600000 - 120 + 1)) + 120;
  const randomExp = Math.floor(Math.random() * (250 - 60 + 1)) + 60;
  const randomDiamond = Math.floor(Math.random() * (5 - 3 + 4)) + 5;
  const randomUncommon = Math.floor(Math.random() * (10 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menjelajahi Gurun Pasir!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreBentengBatu(user) {
  const randomMoney = Math.floor(Math.random() * (700000 - 150 + 1)) + 150;
  const randomExp = Math.floor(Math.random() * (300 - 70 + 1)) + 70;
  const randomDiamond = Math.floor(Math.random() * (3 - 2 + 1)) + 5;
  const randomUncommon = Math.floor(Math.random() * (10 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menaklukkan Benteng Batu!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

function exploreLembahMagis(user) {
  const randomMoney = Math.floor(Math.random() * (800000 - 200 + 1)) + 200;
  const randomExp = Math.floor(Math.random() * (400 - 100 + 1)) + 100;
  const randomDiamond = Math.floor(Math.random() * (3 - 2 + 1)) + 5;
  const randomUncommon = Math.floor(Math.random() * (10 - 1 + 1)) + 5;
  user.money += randomMoney;
  user.exp += randomExp;
  user.diamond += randomDiamond;
  user.uncommon += randomUncommon;
  user.sand += 1;
  user.lastbunga = new Date * 1
  return `├⎆ 🎉 Anda menjelajahi Lembah Magis!\n├⎆ 💰 *Money:* +${randomMoney}\n├⎆ ⭐ *EXP:* +${randomExp}\n├⎆ 💎 *Diamond:* +${randomDiamond}\n├⎆ 📦 *Uncommon:* +${randomUncommon}`;
}

// Define help, tags, command, and register for the RPG command handler
handler.help = ['explore'];
handler.tags = ['rpg'];
handler.command = /^(explore|pilih)$/i;
handler.register = true;
handler.group = true;
handler.rpg = true;

// Export the RPG command handler
export default handler;

function clockString(ms) {
    let d = Math.floor(ms / 86400000)
    let h = Math.floor(ms / 3600000) % 24
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return ['\n' + d, ' *Hari* ', h, ' *Jam* ', m, ' *Menit* ', s, ' *Detik* '].map(v => v.toString().padStart(2, 0)).join('')
}
