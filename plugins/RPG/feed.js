let handler = async (m, { conn, args, usedPrefix }) => {
let info = `
乂 List Pet:
🐈 • Cᴀᴛ (Common)
🐕 • Dᴏɢ (Common)
🐎 • Hᴏʀsᴇ (Common)
🦊 • Fᴏx (Common)
🤖 • Rᴏʙᴏ (Common)
🐉 • Dragon (Common)
🦄 • Uɴɪᴄᴏʀɴ (Rare)
🦖 • Dɪɴᴏ (Rare)
🦕 • Tᴀɴᴏ (Legendary)

➠ Example: ${usedPrefix}feed cat
`.trim();

let pesan = pickRandom([
"ɴʏᴜᴍᴍᴍ~",
"ᴛʜᴀɴᴋs",
"ᴛʜᴀɴᴋʏᴏᴜ ^-^",
"...",
"ᴛʜᴀɴᴋ ʏᴏᴜ~",
"ᴀʀɪɢᴀᴛᴏᴜ ^-^",
]);

let type = (args[0] || "").toLowerCase();
let emo = 
type == "fox" ? "🦊" : "" ||
type == "cat" ? "🐈" : "" ||
type == "dog" ? "🐕" : "" ||
type == "horse" ? "🐴" : "" ||
type == "robo" ? "🤖" : "" ||
type == "dragon" ? "🐲" : "" ||
type == "unicorn" ? "🦄" : "" ||
type == "dino" ? "🦖" : "" ||
type == "tano" ? "🦕" : "";

let user = global.db.data.users[m.sender];
let rubah = global.db.data.users[m.sender].fox;
let kuda = global.db.data.users[m.sender].horse;
let kucing = global.db.data.users[m.sender].cat;
let anjing = global.db.data.users[m.sender].dog;
let robot = global.db.data.users[m.sender].robo;
let naga = global.db.data.users[m.sender].dragon;
let unicorn = global.db.data.users[m.sender].unicorn;
let dino = global.db.data.users[m.sender].dino;
let tano = global.db.data.users[m.sender].tano;

// Function to create exp bar
function createExpBar(currentExp, requiredExp, length = 15) {
let percentage = Math.min(currentExp / requiredExp, 1);
let filledBars = Math.floor(percentage * length);
let emptyBars = length - filledBars;
return '▰'.repeat(filledBars) + '▱'.repeat(emptyBars);
}

// Function to get exp requirements based on pet rarity
function getExpRequirement(level, rarity) {
let baseExp = level * 100;
switch(rarity) {
case 'common': return baseExp; // 100, 200, 300, etc.
case 'rare': return baseExp * 2; // 200, 400, 600, etc.
case 'legendary': return baseExp * 4; // 400, 800, 1200, etc.
default: return baseExp;
}
}

// Function to get exp gain based on pet rarity
function getExpGain(rarity) {
switch(rarity) {
case 'common': return 20;
case 'rare': return 15; // Slower gain for rare pets
case 'legendary': return 10; // Slowest gain for legendary pets
default: return 20;
}
}

switch (type) {
case "fox":
if (rubah == 0) return m.reply("ʏᴏᴜ ᴅᴏɴ'ᴛ ʜᴀᴠᴇ ᴛʜɪs ᴘᴇᴛ ʏᴇᴛ!");
if (rubah == 10) return m.reply("ʏᴏᴜʀ ᴘᴇᴛ ɪs ᴍᴀx ʟᴇᴠᴇʟ !");
let __waktur = new Date() - user.foxlastfeed;
let _waktur = 600000 - __waktur;
let waktur = clockString(_waktur);
if (new Date() - user.foxlastfeed > 600000) {
if (user.petfood > 0) {
user.petfood -= 1;
let expGain = getExpGain('common');
user.foxexp += expGain;
user.foxlastfeed = new Date() * 1;

let requiredExp = getExpRequirement(rubah, 'common');
let expBar = createExpBar(user.foxexp, requiredExp);
let feedsNeeded = Math.ceil((requiredExp - user.foxexp) / expGain);
let percentage = Math.floor((user.foxexp/requiredExp)*100);

m.reply(
`🦊 Feeding fox...

🚀 LEVEL: ${rubah}
📊 EXP: [${expBar}] ${user.foxexp}/${requiredExp} ( ${percentage}% )
🧪 Feed ${feedsNeeded > 0 ? feedsNeeded : 0}x lagi untuk naik level.`
);

if (rubah > 0) {
let naiklvl = getExpRequirement(rubah, 'common') - 1;
if (user.foxexp > naiklvl) {
user.fox += 1;
user.foxexp = 0; // Reset exp after level up
m.reply(`*ᴄᴏɴɢʀᴀᴛs!* , ʏᴏᴜʀ ᴘᴇᴛ ʟᴇᴠᴇʟᴜᴘ to Level ${user.fox}!`);
}
}
} else m.reply("ʏᴏᴜʀ ᴘᴇᴛ ғᴏᴏᴅ ɴᴏᴛ ᴇɴᴏᴜɢʜ");
} else
m.reply(`ʏᴏᴜʀ ᴘᴇᴛ ɪs ғᴜʟʟ, ᴛʀʏ ғᴇᴇᴅɪɴɢ ɪᴛ ᴀɢᴀɪɴ ɪɴ
➞ ${waktur}`);
break;

case "cat":
if (kucing == 0) return m.reply("ʏᴏᴜ ᴅᴏɴ'ᴛ ʜᴀᴠᴇ ᴛʜɪs ᴘᴇᴛ ʏᴇᴛ!");
if (kucing == 10) return m.reply("ʏᴏᴜʀ ᴘᴇᴛ ɪs ᴍᴀx ʟᴇᴠᴇʟ !");
let __waktuc = new Date() - user.catlastfeed;
let _waktuc = 600000 - __waktuc;
let waktuc = clockString(_waktuc);
if (new Date() - user.catlastfeed > 600000) {
if (user.petfood > 0) {
user.petfood -= 1;
let expGain = getExpGain('common');
user.catexp += expGain;
user.catlastfeed = new Date() * 1;

let requiredExp = getExpRequirement(kucing, 'common');
let expBar = createExpBar(user.catexp, requiredExp);
let feedsNeeded = Math.ceil((requiredExp - user.catexp) / expGain);
let percentage = Math.floor((user.catexp/requiredExp)*100);

m.reply(
`🐈 Feeding cat...

🚀 LEVEL: ${kucing}
📊 EXP: [${expBar}] ${user.catexp}/${requiredExp} ( ${percentage}% )
🧪 Feed ${feedsNeeded > 0 ? feedsNeeded : 0}x lagi untuk naik level.`
);

if (kucing > 0) {
let naiklvl = getExpRequirement(kucing, 'common') - 1;
if (user.catexp > naiklvl) {
user.cat += 1;
user.catexp = 0;
m.reply(`*ᴄᴏɴɢʀᴀᴛs!* , ʏᴏᴜʀ ᴘᴇᴛ ʟᴇᴠᴇʟᴜᴘ to Level ${user.cat}!`);
}
}
} else m.reply("ʏᴏᴜʀ ᴘᴇᴛ ғᴏᴏᴅ ɴᴏᴛ ᴇɴᴏᴜɢʜ");
} else
m.reply(`ʏᴏᴜʀ ᴘᴇᴛ ɪs ғᴜʟʟ, ᴛʀʏ ғᴇᴇᴅɪɴɢ ɪᴛ ᴀɢᴀɪɴ ɪɴ
➞ *${waktuc}*`);
break;

case "dog":
if (anjing == 0) return m.reply("ʏᴏᴜ ᴅᴏɴ'ᴛ ʜᴀᴠᴇ ᴛʜɪs ᴘᴇᴛ ʏᴇᴛ!");
if (anjing == 10) return m.reply("ʏᴏᴜʀ ᴘᴇᴛ ɪs ᴍᴀx ʟᴇᴠᴇʟ !");
let __waktua = new Date() - user.doglastfeed;
let _waktua = 600000 - __waktua;
let waktua = clockString(_waktua);
if (new Date() - user.doglastfeed > 600000) {
if (user.petfood > 0) {
user.petfood -= 1;
let expGain = getExpGain('common');
user.dogexp += expGain;
user.doglastfeed = new Date() * 1;

let requiredExp = getExpRequirement(anjing, 'common');
let expBar = createExpBar(user.dogexp, requiredExp);
let feedsNeeded = Math.ceil((requiredExp - user.dogexp) / expGain);
let percentage = Math.floor((user.dogexp/requiredExp)*100);

m.reply(
`🐕 Feeding dog...

🚀 LEVEL: ${anjing}
📊 EXP: [${expBar}] ${user.dogexp}/${requiredExp} ( ${percentage}% )
🧪 Feed ${feedsNeeded > 0 ? feedsNeeded : 0}x lagi untuk naik level.`
);

if (anjing > 0) {
let naiklvl = getExpRequirement(anjing, 'common') - 1;
if (user.dogexp > naiklvl) {
user.dog += 1;
user.dogexp = 0;
m.reply(`*ᴄᴏɴɢʀᴀᴛs!* , ʏᴏᴜʀ ᴘᴇᴛ ʟᴇᴠᴇʟᴜᴘ to Level ${user.dog}!`);
}
}
} else m.reply("ʏᴏᴜʀ ᴘᴇᴛ ғᴏᴏᴅ ɴᴏᴛ ᴇɴᴏᴜɢʜ");
} else
m.reply(`ʏᴏᴜʀ ᴘᴇᴛ ɪs ғᴜʟʟ, ᴛʀʏ ғᴇᴇᴅɪɴɢ ɪᴛ ᴀɢᴀɪɴ ɪɴ
➞ *${waktua}*`);
break;

case "dragon":
if (naga == 0) return m.reply("ʏᴏᴜ ᴅᴏɴ'ᴛ ʜᴀᴠᴇ ᴛʜɪs ᴘᴇᴛ ʏᴇᴛ!");
if (naga == 10) return m.reply("ʏᴏᴜʀ ᴘᴇᴛ ɪs ᴍᴀx ʟᴇᴠᴇʟ !");
let __waktud = new Date() - user.dragonlastfeed;
let _waktud = 600000 - __waktud;
let waktud = clockString(_waktud);
if (new Date() - user.dragonlastfeed > 600000) {
if (user.petfood > 0) {
user.petfood -= 1;
let expGain = getExpGain('common');
user.dragonexp += expGain;
user.dragonlastfeed = new Date() * 1;

let requiredExp = getExpRequirement(naga, 'common');
let expBar = createExpBar(user.dragonexp, requiredExp);
let feedsNeeded = Math.ceil((requiredExp - user.dragonexp) / expGain);
let percentage = Math.floor((user.dragonexp/requiredExp)*100);

m.reply(
`🐲 Feeding dragon...

🚀 LEVEL: ${naga}
📊 EXP: [${expBar}] ${user.dragonexp}/${requiredExp} ( ${percentage}% )
🧪 Feed ${feedsNeeded > 0 ? feedsNeeded : 0}x lagi untuk naik level.`
);

if (naga > 0) {
let naiklvl = getExpRequirement(naga, 'common') - 1;
if (user.dragonexp > naiklvl) {
user.dragon += 1;
user.dragonexp = 0;
m.reply(`*ᴄᴏɴɢʀᴀᴛs!* , ʏᴏᴜʀ ᴘᴇᴛ ʟᴇᴠᴇʟᴜᴘ to Level ${user.dragon}!`);
}
}
} else m.reply("ʏᴏᴜʀ ᴘᴇᴛ ғᴏᴏᴅ ɴᴏᴛ ᴇɴᴏᴜɢʜ");
} else
m.reply(`ʏᴏᴜʀ ᴘᴇᴛ ɪs ғᴜʟʟ, ᴛʀʏ ғᴇᴇᴅɪɴɢ ɪᴛ ᴀɢᴀɪɴ ɪɴ
➞ *${waktud}*`);
break;

case "horse":
if (kuda == 0) return m.reply("ʏᴏᴜ ᴅᴏɴ'ᴛ ʜᴀᴠᴇ ᴛʜɪs ᴘᴇᴛ ʏᴇᴛ!");
if (kuda == 10) return m.reply("ʏᴏᴜʀ ᴘᴇᴛ ɪs ᴍᴀx ʟᴇᴠᴇʟ !");
let __waktuk = new Date() - user.horselastfeed;
let _waktuk = 600000 - __waktuk;
let waktuk = clockString(_waktuk);
if (new Date() - user.horselastfeed > 600000) {
if (user.petfood > 0) {
user.petfood -= 1;
let expGain = getExpGain('common');
user.horseexp += expGain;
user.horselastfeed = new Date() * 1;

let requiredExp = getExpRequirement(kuda, 'common');
let expBar = createExpBar(user.horseexp, requiredExp);
let feedsNeeded = Math.ceil((requiredExp - user.horseexp) / expGain);
let percentage = Math.floor((user.horseexp/requiredExp)*100);

m.reply(
`🐴 Feeding horse...

🚀 LEVEL: ${kuda}
📊 EXP: [${expBar}] ${user.horseexp}/${requiredExp} ( ${percentage}% )
🧪 Feed ${feedsNeeded > 0 ? feedsNeeded : 0}x lagi untuk naik level.`
);

if (kuda > 0) {
let naiklvl = getExpRequirement(kuda, 'common') - 1;
if (user.horseexp > naiklvl) {
user.horse += 1;
user.horseexp = 0;
m.reply(`*ᴄᴏɴɢʀᴀᴛs!* , ʏᴏᴜʀ ᴘᴇᴛ ʟᴇᴠᴇʟᴜᴘ to Level ${user.horse}!`);
}
}
} else m.reply("ʏᴏᴜʀ ᴘᴇᴛ ғᴏᴏᴅ ɴᴏᴛ ᴇɴᴏᴜɢʜ");
} else
m.reply(`ʏᴏᴜʀ ᴘᴇᴛ ɪs ғᴜʟʟ, ᴛʀʏ ғᴇᴇᴅɪɴɢ ɪᴛ ᴀɢᴀɪɴ ɪɴ
➞ *${waktuk}*`);
break;

case "robo":
if (robot == 0) return m.reply("ʏᴏᴜ ᴅᴏɴ'ᴛ ʜᴀᴠᴇ ᴛʜɪs ᴘᴇᴛ ʏᴇᴛ!");
if (robot == 10) return m.reply("ʏᴏᴜʀ ᴘᴇᴛ ɪs ᴍᴀx ʟᴇᴠᴇʟ !");
let __wakturb = new Date() - user.robolastfeed;
let _wakturb = 600000 - __wakturb;
let wakturb = clockString(_wakturb);
if (new Date() - user.robolastfeed > 600000) {
if (user.petfood > 0) {
user.petfood -= 1;
let expGain = getExpGain('common');
user.roboexp += expGain;
user.robolastfeed = new Date() * 1;

let requiredExp = getExpRequirement(robot, 'common');
let expBar = createExpBar(user.roboexp, requiredExp);
let feedsNeeded = Math.ceil((requiredExp - user.roboexp) / expGain);
let percentage = Math.floor((user.roboexp/requiredExp)*100);

m.reply(
`🤖 Feeding robo...

🚀 LEVEL: ${robot}
📊 EXP: [${expBar}] ${user.roboexp}/${requiredExp} ( ${percentage}% )
🧪 Feed ${feedsNeeded > 0 ? feedsNeeded : 0}x lagi untuk naik level.`
);

if (robot > 0) {
let naiklvl = getExpRequirement(robot, 'common') - 1;
if (user.roboexp > naiklvl) {
user.robo += 1;
user.roboexp = 0;
m.reply(`*ᴄᴏɴɢʀᴀᴛs!* , ʏᴏᴜʀ ᴘᴇᴛ ʟᴇᴠᴇʟᴜᴘ to Level ${user.robo}!`);
}
}
} else m.reply("ʏᴏᴜʀ ᴘᴇᴛ ғᴏᴏᴅ ɴᴏᴛ ᴇɴᴏᴜɢʜ");
} else
m.reply(`ʏᴏᴜʀ ᴘᴇᴛ ɪs ғᴜʟʟ, ᴛʀʏ ғᴇᴇᴅɪɴɢ ɪᴛ ᴀɢᴀɪɴ ɪɴ
➞ *${wakturb}*`);
break;

// NEW PETS START HERE
case "unicorn":
if (unicorn == 0) return m.reply("ʏᴏᴜ ᴅᴏɴ'ᴛ ʜᴀᴠᴇ ᴛʜɪs ᴘᴇᴛ ʏᴇᴛ!");
if (unicorn == 10) return m.reply("ʏᴏᴜʀ ᴘᴇᴛ ɪs ᴍᴀx ʟᴇᴠᴇʟ !");
let __wakturu = new Date() - user.unicornlastfeed;
let _wakturu = 600000 - __wakturu;
let wakturu = clockString(_wakturu);
if (new Date() - user.unicornlastfeed > 600000) {
if (user.petfood > 0) {
user.petfood -= 1;
let expGain = getExpGain('rare');
user.unicornexp += expGain;
user.unicornlastfeed = new Date() * 1;

let requiredExp = getExpRequirement(unicorn, 'rare');
let expBar = createExpBar(user.unicornexp, requiredExp);
let feedsNeeded = Math.ceil((requiredExp - user.unicornexp) / expGain);
let percentage = Math.floor((user.unicornexp/requiredExp)*100);

m.reply(
`🦄 Feeding unicorn...

🚀 LEVEL: ${unicorn}
📊 EXP: [${expBar}] ${user.unicornexp}/${requiredExp} ( ${percentage}% )
🧪 Feed ${feedsNeeded > 0 ? feedsNeeded : 0}x lagi untuk naik level.`
);

if (unicorn > 0) {
let naiklvl = getExpRequirement(unicorn, 'rare') - 1;
if (user.unicornexp > naiklvl) {
user.unicorn += 1;
user.unicornexp = 0;
m.reply(`✨ *ᴄᴏɴɢʀᴀᴛs!* ✨, ʏᴏᴜʀ RARE ᴘᴇᴛ ʟᴇᴠᴇʟᴜᴘ to Level ${user.unicorn}!`);
}
}
} else m.reply("ʏᴏᴜʀ ᴘᴇᴛ ғᴏᴏᴅ ɴᴏᴛ ᴇɴᴏᴜɢʜ");
} else
m.reply(`ʏᴏᴜʀ ᴘᴇᴛ ɪs ғᴜʟʟ, ᴛʀʏ ғᴇᴇᴅɪɴɢ ɪᴛ ᴀɢᴀɪɴ ɪɴ
➞ *${wakturu}*`);
break;

case "dino":
if (dino == 0) return m.reply("ʏᴏᴜ ᴅᴏɴ'ᴛ ʜᴀᴠᴇ ᴛʜɪs ᴘᴇᴛ ʏᴇᴛ!");
if (dino == 10) return m.reply("ʏᴏᴜʀ ᴘᴇᴛ ɪs ᴍᴀx ʟᴇᴠᴇʟ !");
let __wakturd = new Date() - user.dinolastfeed;
let _wakturd = 600000 - __wakturd;
let wakturd = clockString(_wakturd);
if (new Date() - user.dinolastfeed > 600000) {
if (user.petfood > 0) {
user.petfood -= 1;
let expGain = getExpGain('rare');
user.dinoexp += expGain;
user.dinolastfeed = new Date() * 1;

let requiredExp = getExpRequirement(dino, 'rare');
let expBar = createExpBar(user.dinoexp, requiredExp);
let feedsNeeded = Math.ceil((requiredExp - user.dinoexp) / expGain);
let percentage = Math.floor((user.dinoexp/requiredExp)*100);

m.reply(
`🦖 Feeding dino...

🚀 LEVEL: ${dino}
📊 EXP: [${expBar}] ${user.dinoexp}/${requiredExp} ( ${percentage}% )
🧪 Feed ${feedsNeeded > 0 ? feedsNeeded : 0}x lagi untuk naik level.`
);

if (dino > 0) {
let naiklvl = getExpRequirement(dino, 'rare') - 1;
if (user.dinoexp > naiklvl) {
user.dino += 1;
user.dinoexp = 0;
m.reply(`🦴 *ᴄᴏɴɢʀᴀᴛs!* 🦴, ʏᴏᴜʀ RARE ᴘᴇᴛ ʟᴇᴠᴇʟᴜᴘ to Level ${user.dino}!`);
}
}
} else m.reply("ʏᴏᴜʀ ᴘᴇᴛ ғᴏᴏᴅ ɴᴏᴛ ᴇɴᴏᴜɢʜ");
} else
m.reply(`ʏᴏᴜʀ ᴘᴇᴛ ɪs ғᴜʟʟ, ᴛʀʏ ғᴇᴇᴅɪɴɢ ɪᴛ ᴀɢᴀɪɴ ɪɴ
➞ *${wakturd}*`);
break;

case "tano":
if (tano == 0) return m.reply("ʏᴏᴜ ᴅᴏɴ'ᴛ ʜᴀᴠᴇ ᴛʜɪs ᴘᴇᴛ ʏᴇᴛ!");
if (tano == 10) return m.reply("ʏᴏᴜʀ ᴘᴇᴛ ɪs ᴍᴀx ʟᴇᴠᴇʟ !");
let __wakturt = new Date() - user.tanolastfeed;
let _wakturt = 600000 - __wakturt;
let wakturt = clockString(_wakturt);
if (new Date() - user.tanolastfeed > 600000) {
if (user.petfood > 0) {
user.petfood -= 1;
let expGain = getExpGain('legendary');
user.tanoexp += expGain;
user.tanolastfeed = new Date() * 1;

let requiredExp = getExpRequirement(tano, 'legendary');
let expBar = createExpBar(user.tanoexp, requiredExp);
let feedsNeeded = Math.ceil((requiredExp - user.tanoexp) / expGain);
let percentage = Math.floor((user.tanoexp/requiredExp)*100);

m.reply(
`🦕 Feeding tano...

🚀 LEVEL: ${tano}
📊 EXP: [${expBar}] ${user.tanoexp}/${requiredExp} ( ${percentage}% )
🧪 Feed ${feedsNeeded > 0 ? feedsNeeded : 0}x lagi untuk naik level.`
);

if (tano > 0) {
let naiklvl = getExpRequirement(tano, 'legendary') - 1;
if (user.tanoexp > naiklvl) {
user.tano += 1;
user.tanoexp = 0;
m.reply(`🦴 *ᴄᴏɴɢʀᴀᴛs* 🦴, ʏᴏᴜʀ RARE ᴘᴇᴛ ʟᴇᴠᴇʟᴜᴘ to Level ${user.tano}!`);
}
}
} else m.reply("ʏᴏᴜʀ ᴘᴇᴛ ғᴏᴏᴅ ɴᴏᴛ ᴇɴᴏᴜɢʜ");
} else
m.reply(`ʏᴏᴜʀ ᴘᴇᴛ ɪs ғᴜʟʟ, ᴛʀʏ ғᴇᴇᴅɪɴɢ ɪᴛ ᴀɢᴀɪɴ ɪɴ
➞ *${wakturt}*`);
break;

default:
return m.reply(info);
}
};

handler.help = ["feed [pet type]"];
handler.tags = ["rpg"];
handler.command = /^(feed(ing)?)$/i;

handler.register = true;
handler.group = true;
handler.rpg = true;
export default handler;

function clockString(ms) {
let h = isNaN(ms) ? "--" : Math.floor(ms / 3600000);
let m = isNaN(ms) ? "--" : Math.floor(ms / 60000) % 60;
let s = isNaN(ms) ? "--" : Math.floor(ms / 1000) % 60;
return [h, " H ", m, " M ", s, " S"]
.map((v) => v.toString().padStart(2, 0))
.join("");
}

function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)];
}
