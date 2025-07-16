import moment from "moment-timezone";
import chalk from "chalk";
import fs from 'fs-extra'
import util from "util";
import canvafy from "canvafy";
import {
getBuffer,
getGroupAdmins,
} from "../lib/myfunc.js";

//Function update member dengan welcome/leave
export const memberUpdate = async (conn, anu) => {
await sleep(3000)
var jeda = false;
if (jeda) return console.log("spam welcome aktif");
jeda = true;
try {
const { id, participants, action } = anu;
log(anu)

var dataChat = conn.chats[id]

if(action === "demote" && dataChat){
let members = conn.chats[id].metadata.participants //|| (await conn.groupMetadata(id)).participants
await members.forEach(participant => {
if (participant.id === participants[0]) {
participant.admin = null;
}
});
} else if(action === "promote" && dataChat) {
let members = conn.chats[id].metadata.participants
await members.forEach(participant => {
if (participant.id === participants[0]) {
participant.admin = 'admin'
}
});
} else if(action === "add" && dataChat  ) {
let obj = {
id: participants[0],
admin: null
}

let members = conn.chats[id].metadata.participants
members.push(obj)
let bot = members.find(u => conn.decodeJid(u.id) == conn.user.jid)
let isBotAdmin = bot && bot.admin == 'admin' || false
let sender = conn.decodeJid(anu.participants[0])

if(isBotAdmin && participants[0].split('@')[0] === global.nomerOwner){
await conn.groupParticipantsUpdate(id, [sender], "promote")
}
} else if(action === "remove" && dataChat ) {
let members = conn.chats[id].metadata.participants
let idToRemove = participants[0]
members.filter(item => item.id !== idToRemove);
}

// Handle Welcome/Leave Messages dengan Canvafy
if (action === "add" || action === "remove") {
await handleWelcomeLeave(conn, anu);
}

if(anu.participants[0].includes('@lid')) return log('log 1')
if ((action == "remove" || action == "promote" || action == "demote") &&
anu.participants[0].split("@")[0].includes(conn.user.id.split(":")[0])
)
return log('log 2')
const myGroup = Object.keys(db.data.chats);
const from = anu.id
const botNumber = conn.user.jid;
const groupMetadata = ((conn.chats[from] || {}).metadata || await conn.groupMetadata(from).catch(_ => null))  || {}
const groupName = groupMetadata.subject || [];
const sender = conn.decodeJid(anu.participants[0])
if(sender.includes('_')) return log('log 3')
const senderNumber = sender.split("@")[0];
const groupMembers = groupMetadata.participants || [];
const groupAdmins = getGroupAdmins(groupMembers) || [];
const groupDesc = groupMetadata.desc || [];
const groupOwner = groupMetadata.owner || [];
const user = groupMembers.find((u) => conn.decodeJid(u.id) === sender) || {};
const bot = groupMembers.find((u) => conn.decodeJid(u.id) == conn.user.jid) || {};

const isOwner = sender.split('@')[0] === nomerOwner
const isRAdmin = (user && user.admin == "superadmin") || false;
const isAdmin = isRAdmin || (user && user.admin == "admin") || false;
const isBotAdmin = (bot && bot.admin == "admin") || false;
const pushname = await conn.getName(sender);
const oneMem = anu.participants.length === 1;
const itsMe = sender === botNumber;
const timeWib = moment.tz("Asia/Jakarta").format("HH:mm");
const chat = global.db.data.chats[id];
const add = action == "add";
const remove = action == "remove";
const isBanchat = myGroup.includes(from) ? db.data.chats[from].banchat : false;

if (isBanchat) {
return log('log 4')
}

let m = {
chat: from,
pushname: pushname,
sender: sender,
};

if (!chat) return log('log 5')

//Group Update Console.log
if (add && oneMem)
console.log(
chalk.magenta("[GRUP UPDATE]"),
chalk.green(`${pushname} telah bergabung dari gc`),
chalk.magenta(`${groupName}`)
);
if (remove && oneMem)
console.log(
chalk.magenta("[GRUP UPDATE]"),
chalk.green(`${pushname} telah keluar di gc`),
chalk.magenta(`${groupName}`)
);

//Auto kick jika itu user yang sudah di tandai
let kickon = db.data.kickon[from];
if (add && kickon && kickon.includes(senderNumber)) {
let teks = `@${senderNumber} tidak di izinkan masuk karena dia telah keluar dari group ini sebelumnya, dan juga sudah di tandai sebagai user biadap`;

await conn.sendMessage(from, { 
text: teks,
mentions: [sender]
});

if (!isBotAdmin)
return conn.sendMessage(from, {
text: `Gagal mengeluarkan @${senderNumber} dari group karena bot bukan admin`,
mentions: [sender]
});
if (isBotAdmin)
return conn.groupParticipantsUpdate(from, [sender], "remove");
}

await sleep(5000);
jeda = false;
} catch (err) {
jeda = false;
console.log(err);
let e = String(err);
if (e.includes("this.isZero")) {
return;
}
if (e.includes("rate-overlimit")) {
return;
}
if (e.includes("Connection Closed")) {
return;
}
if (e.includes("Timed Out")) {
return;
}
console.log(chalk.white("GROUP :"), chalk.green(e));

let text =`${util.format(anu)}

${util.format(err)}`
conn.sendMessage(ownerBot,{text})
}
};

// Function untuk handle welcome dan leave dengan Canvafy
const handleWelcomeLeave = async (conn, anu) => {
console.log("handleWelcomeLeave called with action:", anu.action);
try {
const { id, participants, action } = anu;
console.log("Processing action:", action, "for participant:", participants[0]);

// Early returns untuk filtering
if(anu.participants[0].includes('@lid')) {
console.log('log 1 - lid detected');
return;
}

if ((action == "remove" || action == "promote" || action == "demote") &&
anu.participants[0].split("@")[0].includes(conn.user.id.split(":")[0])
) {
console.log('log 2 - bot action detected');
return;
}

const myGroup = Object.keys(db.data.chats);
const from = anu.id
const botNumber = conn.user.jid;
const groupMetadata = ((conn.chats[from] || {}).metadata || await conn.groupMetadata(from).catch(_ => null))  || {}
const groupName = groupMetadata.subject || "Unknown Group";
const sender = conn.decodeJid(anu.participants[0])

if(sender.includes('_')) {
console.log('log 3 - underscore detected');
return;
}

const senderNumber = sender.split("@")[0];
const groupMembers = groupMetadata.participants || [];
const groupDesc = groupMetadata.desc || "Tidak ada deskripsi";
const pushname = await conn.getName(sender);
const oneMem = anu.participants.length === 1;
const itsMe = sender === botNumber;
const timeWib = moment.tz("Asia/Jakarta").format("HH:mm");
const chat = global.db.data.chats[id];
const add = action == "add";
const remove = action == "remove";
const isBanchat = myGroup.includes(from) ? db.data.chats[from].banchat : false;

if (isBanchat) {
console.log('log 4 - banchat detected');
return;
}

if (!chat) {
console.log('log 5 - no chat data');
return;
}

if (!chat.welcome) {
console.log('log 6 - welcome disabled');
return;
}

console.log("Welcome is enabled, processing:", action);

// Get user profile picture
let pp;
try {
pp = await conn.profilePictureUrl(sender, "image");
} catch (err) {
pp = null; // Will use default avatar from local file
}

switch (action) {
case "add": {
if (!chat.welcome || itsMe || !oneMem) return;
console.log("Processing welcome for:", pushname);

// Default welcome message template
let welcomeText = chat.sWelcome || "Welcome @user";
welcomeText = welcomeText
.replace(/@user/g, `@${senderNumber}`)
.replace(/@subject/g, groupName)
.replace(/@desc/g, groupDesc);

// Generate welcome image with Canvafy
let welcomeImage;
try {
console.log("Creating welcome image with Canvafy...");
const backgroundPath = "./media/welcomeleave.jpg"; // Local file path
const avatarPath = "./media/user.jpg"; // Default avatar path

welcomeImage = await new canvafy.WelcomeLeave()
.setAvatar(pp || avatarPath) // Use profile picture or default
.setBackground("image", backgroundPath)
.setTitle("Welcome")
.setDescription(`Welcome to ${groupName}`)
.setBorder("#2a2e35")
.setAvatarBorder("#2a2e35")
.setOverlayOpacity(0.3)
.build();

console.log("Welcome image created successfully");
} catch (err) {
console.error("Error creating Canvafy welcome image:", err);
console.log("Sending fallback welcome text");

// Fallback to text message only
return conn.sendMessage(from, { 
text: welcomeText, 
mentions: [sender]
});
}

// Send welcome message with image and text
console.log("Sending welcome message with image");
await conn.sendMessage(from, {
image: welcomeImage,
caption: welcomeText,
mentions: [sender]
});
}
break;

case "remove": {
if (!chat.welcome || itsMe || !oneMem) return;
console.log("Processing leave for:", pushname);

// Default leave message template
let leaveText = chat.sBye || "Selamat tinggal @user";
leaveText = leaveText
.replace(/@user/g, `@${senderNumber}`)
.replace(/@subject/g, groupName)
.replace(/@desc/g, groupDesc);

// Generate leave image with Canvafy
let leaveImage;
try {
console.log("Creating leave image with Canvafy...");
const backgroundPath = "./media/background.jpg"; // Local file path
const avatarPath = "./media/levelup.jpg"; // Default avatar path

leaveImage = await new canvafy.WelcomeLeave()
.setAvatar(pp || avatarPath) // Use profile picture or default
.setBackground("image", backgroundPath)
.setTitle("Goodbye")
.setDescription(`Goodbye from ${groupName}`)
.setBorder("#ff4444")
.setAvatarBorder("#ff4444")
.setOverlayOpacity(0.3)
.build();

console.log("Leave image created successfully");
} catch (err) {
console.error("Error creating Canvafy leave image:", err);
console.log("Sending fallback leave text");
  
// Fallback to text message only
return conn.sendMessage(from, { 
text: leaveText, 
mentions: [sender]
});
}

// Send leave message with image and text
console.log("Sending leave message with image");
await conn.sendMessage(from, {
image: leaveImage,
caption: leaveText,
mentions: [sender]
});
}
break;

default:
console.log("Unknown action:", action);
break;
}

} catch (err) {
console.log("Error in handleWelcomeLeave:", err);
let e = String(err);
if (e.includes("this.isZero")) {
return;
}
if (e.includes("rate-overlimit")) {
return;
}
if (e.includes("Connection Closed")) {
return;
}
if (e.includes("Timed Out")) {
return;
}
console.log(chalk.white("GROUP :"), chalk.green(e));

// Fallback to text message on error
try {
const from = anu.id;
const sender = conn.decodeJid(anu.participants[0]);
const senderNumber = sender.split("@")[0];
const pushname = await conn.getName(sender);
const chat = global.db.data.chats[from];
const groupMetadata = ((conn.chats[from] || {}).metadata || await conn.groupMetadata(from).catch(_ => null))  || {}
const groupName = groupMetadata.subject || "Unknown Group";
const groupDesc = groupMetadata.desc || "Tidak ada deskripsi";

if (chat && chat.welcome) {
if (anu.action === "add") {
let welcomeText = chat.sWelcome || "Welcome @user";
welcomeText = welcomeText
.replace(/@user/g, `@${senderNumber}`)
.replace(/@subject/g, groupName)
.replace(/@desc/g, groupDesc);
conn.sendMessage(from, { text: welcomeText, mentions: [sender] });
} else if (anu.action === "remove") {
let leaveText = chat.sBye || "Selamat tinggal @user";
leaveText = leaveText
.replace(/@user/g, `@${senderNumber}`)
.replace(/@subject/g, groupName)
.replace(/@desc/g, groupDesc);
conn.sendMessage(from, { text: leaveText, mentions: [sender] });
}
}
} catch (fallbackErr) {
console.log("Fallback error:", fallbackErr);
}

let text =`${util.format(anu)}

${util.format(err)}`
conn.sendMessage(ownerBot,{text})
}
};

//Function Update group
export async function groupsUpdate(conn, anu) {
try {
console.log(anu);
} catch (err) {
console.log(err);
}
}