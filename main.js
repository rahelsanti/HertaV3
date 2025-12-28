//process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

import "./settings.js";

// FIX 1: IMPORT BAILEYS VERSI TERBARU (7.x) YANG BENAR
import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
  getAggregateVotesInPollMessage
} from '@whiskeysockets/baileys';

import fs, { readdirSync, existsSync, readFileSync, watch, statSync } from "fs";
import logg from "pino";
import { smsg, protoType, store} from "./lib/simple.js"; // use persistent store from lib/simple.js
import CFonts from "cfonts";
import path, { join, dirname, basename } from "path";
import { memberUpdate, groupsUpdate } from "./message/group.js";
import { antiCall } from "./message/anticall.js";
import { connectionUpdate } from "./message/connection.js";
import { Function } from "./message/function.js";
import NodeCache from "node-cache";
import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";
import { platform } from "process";
import syntaxerror from "syntax-error";
import { format } from "util";
import chokidar from "chokidar";
import chalk from "chalk";
import util from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));

global.__filename = function filename(
  pathURL = import.meta.url,
  rmPrefix = platform !== "win32"
) {
  return rmPrefix
    ? /file:\/\/\//.test(pathURL)
      ? fileURLToPath(pathURL)
      : pathURL
    : pathToFileURL(pathURL).toString();
};

global.__require = function require(dir = import.meta.url) {
  return createRequire(dir);
};

protoType();

let phoneNumber = "916909137213";

const requireC = createRequire(import.meta.url);
const readline = requireC("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const pairingCode = false;
const useMobile = process.argv.includes("--mobile");
const msgRetryCounterCache = new NodeCache();

// FIX 2: BUAT MESSAGERETRYMAP MANUAL UNTUK VERSI 7.x
const msgRetryCounterMap = {
  get: (key) => {
    const counter = msgRetryCounterCache.get(key) || 0;
    return counter;
  },
  set: (key, value) => {
    msgRetryCounterCache.set(key, value);
  }
};

CFonts.say("fearless", {
  font: "chrome",
  align: "left",
  gradient: ["red", "magenta"],
});

// Fungsi untuk mendapatkan nama pengirim
const getSenderName = (store, jid, participant = null) => {
  try {
    let name = "Anonymous";
    const targetJid = participant || jid;
    
    if (store && store.contacts) {
      const contact = store.contacts[targetJid];
      if (contact) {
        name = contact.name || contact.notify || targetJid.split('@')[0];
      }
    }
    
    if (name === "Anonymous") {
      name = targetJid.split('@')[0];
    }
    
    return name;
  } catch {
    return "Anonymous";
  }
};

// Fungsi untuk ekstrak teks pesan
const extractMessageText = (msg) => {
  if (msg.message?.conversation) return msg.message.conversation;
  if (msg.message?.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
  if (msg.message?.imageMessage?.caption) return msg.message.imageMessage.caption;
  if (msg.message?.videoMessage?.caption) return msg.message.videoMessage.caption;
  if (msg.message?.documentMessage?.caption) return msg.message.documentMessage.caption;
  
  if (msg.message?.imageMessage) return "[Image]";
  if (msg.message?.videoMessage) return "[Video]";
  if (msg.message?.audioMessage) return "[Audio]";
  if (msg.message?.documentMessage) return "[Document]";
  if (msg.message?.stickerMessage) return "[Sticker]";
  if (msg.message?.contactMessage) return "[Contact]";
  if (msg.message?.locationMessage) return "[Location]";
  
  return "[Message]";
};

//Connect to WhatsApp
const connectToWhatsApp = async () => {
  await (await import("./message/database.js")).default();

  // FIX 3: PASTIKAN SESSION PATH BENAR
  const sessionPath = global.session || './session';
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  // use persistent store exported from ./lib/simple.js
  // store already created in lib/simple.js and implements loadMessage & bind

  const { version, isLatest } = await fetchLatestBaileysVersion();

  // Function agar pesan bot tidak pending
  const getMessage = async (key) => {
    if (store) {
      const msg = await store.loadMessage(key.remoteJid, key.id, undefined);
      return msg?.message || undefined;
    }
    return {};
  };

  // Untuk menyimpan session
  const auth = {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(
      state.keys,
      logg().child({ level: "fatal", stream: "store" })
    ),
  };

  // Function agar bisa pake button di bailey terbaru
  const patchMessageBeforeSending = (message) => {
    const requiresPatch = !!(
      message.buttonsMessage ||
      message.listMessage ||
      message.templateMessage
    );
    if (requiresPatch) {
      message = {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadataVersion: 2,
              deviceListMetadata: {},
            },
            ...message,
          },
        },
      };
    }
    return message;
  };

  // FIX 4: GANTI Socket MENJADI makeWASocket DENGAN CONFIG YANG BENAR
  const connectionOptions = {
    version,
    printQRInTerminal: !global.pairingCode,
    patchMessageBeforeSending,
    logger: logg({ level: "fatal" }),
    auth,
    browser: Browsers.ubuntu('Chrome'),
    getMessage,
    msgRetryCounterMap, // PAKAI YANG BARU
    keepAliveIntervalMs: 20000,
    defaultQueryTimeoutMs: undefined,
    connectTimeoutMs: 30000,
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    msgRetryCounterCache,
  };

  // FIX 5: GANTI Socket() MENJADI makeWASocket()
  global.conn = makeWASocket(connectionOptions);

  store.bind(conn.ev);

  // FIX 6: PAIRING CODE YANG BENAR (CLEAN LOGGING)
  if (global.pairingCode && !conn.authState.creds.registered) {
    setTimeout(async () => {
      try {
        let code = await conn.requestPairingCode(global.nomerBot);
        // Format: XXXX-XXXX untuk 8 digit
        const formattedCode = code.length === 8 ? 
          `${code.substring(0, 4)}-${code.substring(4)}` : code;
        
        console.log(chalk.magenta(`ðŸ“± Pairing Code:`));
        console.log(chalk.magenta(`For: ${global.nomerBot}`));
        console.log(chalk.magenta(`Code: ${formattedCode}`));
        console.log(chalk.magenta(`â³ Masukkan di WhatsApp > Linked Devices`));
      } catch (err) {
        console.log(chalk.red(`Error: ${err.message}`));
        console.log(chalk.red(`Pastikan nomor ${global.nomerBot} benar (tanpa +)`));
      }
    }, 3000);
  }

  // FIX 7: EVENT HANDLING YANG BENAR UNTUK VERSI 7.x
  conn.ev.on('connection.update', async (update) => {
    if (global.db && global.db.data == null) {
      const loadDatabase = (await import("./message/database.js")).default;
      await loadDatabase();
    }
    await connectionUpdate(connectToWhatsApp, conn, update);
  });

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      if (!messages) return;
      
      let m = messages[0];
      if (!m) return;
      if (m.key.fromMe) return;
      
      if (m.message?.viewOnceMessageV2) m.message = m.message.viewOnceMessageV2.message;
      if (m.message?.documentWithCaptionMessage) m.message = m.message.documentWithCaptionMessage.message;
      if (m.message?.viewOnceMessageV2Extension) m.message = m.message.viewOnceMessageV2Extension.message;
      
      if (m.key && m.key.remoteJid === 'status@broadcast') return;
      if (!m.message) return;
      if (m.key.id && (m.key.id.length === 22 || m.key.id.startsWith('3EB0') && m.key.id.length === 12)) return;
      
      // CLEAN CHAT LOGGING
      if (m.message) {
        const senderJid = m.key.remoteJid;
        const participant = m.key.participant;
        const isGroup = senderJid.endsWith('@g.us');
        
        const displayName = getSenderName(
          store,
          isGroup && participant ? participant : senderJid
        );
        
        const messageText = extractMessageText(m);
        
        // CLEAN LOG: Nama: Pesan (violet:putih)
        console.log(
          chalk.magenta(`${displayName}: `) + 
          chalk.white(messageText.substring(0, 200))
        );
      }
      
      const { register } = await import(`./message/register.js?v=${Date.now()}`).catch((err) => console.log(chalk.red(`Register: ${err.message}`)));
      m = await smsg(conn, m);
      const { handler } = await import(`./handler.js?v=${Date.now()}`).catch(
        (err) => console.log(chalk.red(`Handler: ${err.message}`))
      );
      
      if (m.messageStubParameters && m.messageStubParameters[0] === "Message absent from node") {
        try {
          const { BufferJSON } = await import('@whiskeysockets/baileys');
          conn.sendMessageAck(JSON.parse(m.messageStubParameters[1], BufferJSON.reviver));
        } catch (e) {}
      }
      
      await register(m);
      if (global.db && global.db.data) await global.db.write();
      if (handler) await handler(conn, m, { messages, type }, store);
    } catch(err) {
      console.log(chalk.red(`Error: ${err.message}`));
      let e = util.format(err);
      if (global.ownerBot) {
        conn.sendMessage(global.ownerBot, {text: e});
      }
    }
  });

  conn.ev.on('call', async (calls) => {
    if (calls && calls.length > 0) {
      const node = calls[0];
      antiCall(global.db, node, conn);
    }
  });

  conn.ev.on('group-participants.update', async (event) => {
    if (global.db && global.db.data == null) {
      const loadDatabase = (await import("./message/database.js")).default;
      await loadDatabase();
    }
    memberUpdate(conn, event);
  });

  global.reloadHandler = async function (restatConn) {};

  const pluginFolder = path.join(__dirname, "./plugins");
  const pluginFilter = (filename) => /\.js$/.test(filename);
  global.plugins = {};

  async function filesInit(folderPath) {
    const files = readdirSync(folderPath);
    for (let file of files) {
      const filePath = join(folderPath, file);
      const fileStat = statSync(filePath);
      if (fileStat.isDirectory()) {
        await filesInit(filePath);
      } else if (pluginFilter(file)) {
        try {
          const module = await import("file://" + filePath);
          global.plugins[file] = module.default || module;
        } catch (e) {
          console.log(chalk.red(`Plugin error ${file}: ${e.message}`));
          delete global.plugins[file];
        }
      }
    }
  }

  filesInit(pluginFolder);

  global.reload = async (_ev, filename) => {
    if (pluginFilter(filename)) {
      let dir = global.__filename(join(filename), true);
      if (filename in global.plugins) {
        if (existsSync(dir))
          console.log(
            chalk.bgGreen(chalk.black("[ UPDATE ]")),
            chalk.white(`${filename}`)
          );
        else {
          console.log(chalk.yellow(`Deleted plugin '${filename}'`));
          return delete global.plugins[filename];
        }
      } else {
        console.log(
          chalk.bgGreen(chalk.black("[ UPDATE ]")),
          chalk.white(`${filename}`)
        );
      }
      
      let err = syntaxerror(readFileSync(dir), filename, {
        sourceType: "module",
        allowAwaitOutsideFunction: true,
      });
      
      if (err) {
        console.log(chalk.red(`Syntax error in '${filename}': ${format(err)}`));
      } else {
        try {
          const module = await import(
            `${global.__filename(dir)}?update=${Date.now()}`
          );
          global.plugins[filename] = module.default || module;
        } catch (e) {
          console.log(chalk.red(`Error loading plugin '${filename}': ${format(e)}`));
        } finally {
          global.plugins = Object.fromEntries(
            Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
          );
        }
      }
    }
  };

  const watcher = chokidar.watch(pluginFolder, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    depth: 99,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });

  watcher.on("all", (event, path) => {
    if (event === "change" && path.endsWith(".js")) {
      const filename = path.split("/").pop();
      global.reload(null, filename);
    }
  });

  Object.freeze(global.reload);
  watch(pluginFolder, global.reload);

  Function(conn);
  return conn;
};

connectToWhatsApp();

process.on("uncaughtException", function (err) {
  let e = String(err);
  if (e.includes("Socket connection timeout")) return;
  if (e.includes("rate-overlimit")) return;
  if (e.includes("Connection Closed")) return;
  if (e.includes("Timed Out")) return;
  if (e.includes("Value not found")) return;
  console.log(chalk.red("Caught exception: ", err.message));
});

process.on("warning", (warning) => {
  console.log(chalk.yellow(`Warning: ${warning.message}`));
});
