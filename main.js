// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

import "./settings.js";

// ✅ IMPOR YANG BENAR SESUAI DOKUMENTASI RESMI
import makeWASocket, {
    useMultiFileAuthState,
    makeInMemoryStore,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    DisconnectReason,
    Browsers,
    proto,
    getAggregateVotesInPollMessage,
    areJidsSameUser,
    generateWAMessageFromContent
} from '@whiskeysockets/baileys';

import fs, { readdirSync, existsSync, readFileSync, watch, statSync } from "fs";
import logg from "pino";
import { smsg, protoType } from "./lib/simple.js";
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
import { Boom } from "@hapi/boom";

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
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const pairingCode = false;
const useMobile = process.argv.includes("--mobile");

const msgRetryCounterCache = new NodeCache();

CFonts.say("fearless", {
  font: "chrome",
  align: "left",
  gradient: ["red", "magenta"],
});

// ✅ CONNECT TO WHATSAPP SESUAI CONTOH RESMI
const connectToWhatsApp = async () => {
  try {
    // Import database (jika ada)
    try {
      await (await import("./message/database.js")).default();
    } catch (error) {
      console.log("⚠️ Database module not found or error, continuing...");
    }

    // ✅ SESUAI CONTOH RESMI: useMultiFileAuthState
    const sessionFolder = './session';
    
    // Buat folder session jika belum ada
    if (!fs.existsSync(sessionFolder)) {
      fs.mkdirSync(sessionFolder, { recursive: true });
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

    // ✅ SESUAI CONTOH RESMI: makeInMemoryStore
    const store = makeInMemoryStore({
      logger: logg().child({ level: "fatal", stream: "store" }),
    });

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📱 Using WhatsApp version: ${version.join('.')}, isLatest: ${isLatest}`);

    // Function to get message (untuk store)
    const getMessage = async (key) => {
      if (store) {
        try {
          const msg = await store.loadMessage(key.remoteJid, key.id);
          return msg?.message || undefined;
        } catch (error) {
          return undefined;
        }
      }
      return undefined;
    };

    // Auth configuration
    const auth = {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        logg().child({ level: "fatal", stream: "store" })
      ),
    };

    // Patch message for buttons
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

    // ✅ CONNECTION OPTIONS SESUAI DOKUMENTASI
    const connectionOptions = {
      version,
      printQRInTerminal: !global.pairingCode,
      patchMessageBeforeSending,
      logger: logg({ level: "fatal" }),
      auth,
      browser: Browsers.ubuntu("Chrome"),
      getMessage,
      msgRetryCounterCache,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 30000,
      emitOwnEvents: true,
      fireInitQueries: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: true,
    };

    // ✅ MEMBUAT SOCKET DENGAN BENAR
    global.conn = makeWASocket(connectionOptions);

    // Bind store ke events
    if (!global.pairingCode) {
      store.bind(conn.ev);
    }

    // Handle pairing code jika diperlukan
    if (global.pairingCode && !conn.authState?.creds?.registered) {
      setTimeout(async () => {
        try {
          let code = await conn.requestPairingCode(global.nomerBot || phoneNumber);
          code = code?.match(/.{1,4}/g)?.join("-") || code;
          console.log(
            chalk.black(chalk.bgGreen(`Your Phone Number : `)),
            chalk.black(chalk.white(global.nomerBot || phoneNumber)),
            chalk.black(chalk.bgGreen(`\nYour Pairing Code : `)),
            chalk.black(chalk.white(code))
          );
        } catch (error) {
          console.log("⚠️ Error getting pairing code:", error.message);
        }
      }, 3000);
    }

    // ✅ HANDLE CONNECTION UPDATE SESUAI CONTOH RESMI
    conn.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('📱 QR Code generated, please scan!');
      }
      
      if (connection === 'close') {
        let shouldReconnect = true;
        
        if (lastDisconnect?.error) {
          const statusCode = (new Boom(lastDisconnect.error)).output?.statusCode;
          shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        }
        
        console.log(`❌ Connection closed. Reconnecting: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          setTimeout(connectToWhatsApp, 5000);
        }
      } else if (connection === 'open') {
        console.log('✅ WhatsApp connected successfully!');
        console.log('👤 User ID:', conn.user?.id);
        
        // Update presence
        try {
          await conn.sendPresenceUpdate('available');
        } catch (error) {
          // Ignore presence update errors
        }
      }
    });

    // Handle credentials update
    conn.ev.on('creds.update', saveCreds);

    // ✅ HANDLE MESSAGES SESUAI CONTOH RESMI
    conn.ev.on('messages.upsert', async ({ messages, type }) => {
      try {
        if (type !== 'notify') return;
        if (!messages || messages.length === 0) return;
        
        let m = messages[0];
        if (!m) return;
        if (m.key?.fromMe) return;
        
        // Handle special message types
        if (m.message?.viewOnceMessageV2) m.message = m.message.viewOnceMessageV2.message;
        if (m.message?.documentWithCaptionMessage) m.message = m.message.documentWithCaptionMessage.message;
        if (m.message?.viewOnceMessageV2Extension) m.message = m.message.viewOnceMessageV2Extension.message;
        
        // Skip status broadcasts
        if (m.key && m.key.remoteJid === 'status@broadcast') return;
        if (!m.message) return;
        
        // Filter out certain message IDs
        if (m.key.id && (m.key.id.length === 22 || (m.key.id.startsWith('3EB0') && m.key.id.length === 12))) return;
        
        // Convert to message object
        if (typeof smsg === 'function') {
          m = await smsg(conn, m);
        }
        
        // Handle registration jika ada
        try {
          const { register } = await import(`./message/register.js?v=${Date.now()}`);
          await register(m);
        } catch (err) {
          // Skip if register module doesn't exist
        }
        
        // Handle message dengan handler
        try {
          const { handler } = await import(`./handler.js?v=${Date.now()}`);
          await handler(conn, m, { messages, type }, store);
        } catch (err) {
          console.log('⚠️ Handler error:', err.message);
        }
        
      } catch (err) {
        console.log('⚠️ Error processing message:', err.message);
        if (global.ownerBot) {
          try {
            await conn.sendMessage(global.ownerBot, { text: `Error: ${err.message}` });
          } catch (sendError) {
            // Ignore send errors
          }
        }
      }
    });

    // Handle calls
    conn.ev.on('call', async (node) => {
      try {
        if (typeof antiCall === 'function') {
          await antiCall({}, node, conn);
        }
      } catch (error) {
        console.log('⚠️ Error handling call:', error.message);
      }
    });

    // Handle group participants update
    conn.ev.on('group-participants.update', async (anu) => {
      try {
        if (typeof memberUpdate === 'function') {
          await memberUpdate(conn, anu);
        }
      } catch (error) {
        console.log('⚠️ Error handling group update:', error.message);
      }
    });

    console.log("🚀 WhatsApp Bot is ready and waiting for QR scan!");
    return conn;

  } catch (error) {
    console.log("❌ Error connecting to WhatsApp:", error.message);
    console.log("Stack trace:", error.stack);
    console.log("🔄 Reconnecting in 5 seconds...");
    setTimeout(connectToWhatsApp, 5000);
  }
};

// Start the bot
connectToWhatsApp();

// Error handling
process.on("uncaughtException", function (err) {
  let e = String(err);
  const ignorableErrors = [
    "Socket connection timeout",
    "rate-overlimit",
    "Connection Closed",
    "Timed Out",
    "Value not found",
    "ERR_MODULE_NOT_FOUND",
    "Cannot find package"
  ];
  
  if (ignorableErrors.some(error => e.includes(error))) return;
  
  console.log("⚠️ Uncaught Exception:", err.message);
  console.log("Stack:", err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("⚠️ Unhandled Rejection:", reason);
});
