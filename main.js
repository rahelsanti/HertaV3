// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

import "./settings.js";

// DYNAMIC IMPORT UNTUK SEMUA VERSI BAILEYS
import chalk from "chalk";
import { Boom } from "@hapi/boom";

let makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion, DisconnectReason, Browsers, proto;

try {
    const baileysModule = await import('@whiskeysockets/baileys');
    
    makeWASocket = baileysModule.default || baileysModule.makeWASocket;
    useMultiFileAuthState = baileysModule.useMultiFileAuthState;
    makeCacheableSignalKeyStore = baileysModule.makeCacheableSignalKeyStore;
    fetchLatestBaileysVersion = baileysModule.fetchLatestBaileysVersion;
    DisconnectReason = baileysModule.DisconnectReason;
    Browsers = baileysModule.Browsers;
    proto = baileysModule.proto;
    
    console.log('Baileys module loaded');
} catch (error) {
    console.error('Failed to load Baileys:', error.message);
    process.exit(1);
}

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

const msgRetryCounterCache = new NodeCache();

CFonts.say("fearless", {
  font: "chrome",
  align: "left",
  gradient: ["red", "magenta"],
});

// SIMPLE STORE IMPLEMENTATION
const makeSimpleInMemoryStore = () => {
  return {
    messages: {},
    chats: {},
    contacts: {},
    groupMetadata: {},
    presences: {},
    bind: function(ev) {
      // Store bind
    },
    loadMessage: async function(remoteJid, id) {
      return this.messages[remoteJid]?.[id] || null;
    },
    saveMessage: function(remoteJid, message) {
      if (!this.messages[remoteJid]) {
        this.messages[remoteJid] = {};
      }
      this.messages[remoteJid][message.key.id] = message;
    },
  };
};

// CONNECT TO WHATSAPP FUNCTION
const connectToWhatsApp = async () => {
  try {
    // Import database
    try {
      await (await import("./message/database.js")).default();
    } catch (error) {
      console.log('Database module not found, continuing...');
    }

    // Setup session
    const sessionFolder = './session';
    
    if (!fs.existsSync(sessionFolder)) {
      fs.mkdirSync(sessionFolder, { recursive: true });
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

    const store = makeSimpleInMemoryStore();

    // Get WhatsApp version
    let version = [2, 2413, 1];
    try {
      if (fetchLatestBaileysVersion) {
        const versionInfo = await fetchLatestBaileysVersion();
        version = versionInfo.version;
        console.log(`Using WhatsApp version: ${version.join('.')}`);
      }
    } catch (error) {
      console.log(`Using default WhatsApp version: ${version.join('.')}`);
    }

    // Function to get message
    const getMessage = async (key) => {
      if (store && store.loadMessage) {
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
      keys: makeCacheableSignalKeyStore ? 
        makeCacheableSignalKeyStore(
          state.keys,
          logg().child({ level: "fatal", stream: "store" })
        ) : state.keys
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

    // PAIRING CODE SUPPORT
    const printQR = !global.pairingCode;

    // Connection options
    const connectionOptions = {
      version,
      printQRInTerminal: printQR,
      patchMessageBeforeSending,
      logger: logg({ level: "fatal" }),
      auth,
      browser: Browsers ? Browsers.ubuntu("Chrome") : ["Ubuntu", "Chrome", ""],
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

    // Create socket
    global.conn = makeWASocket(connectionOptions);

    // PAIRING CODE - SIMPLE VERSION
    if (global.pairingCode && !conn.authState?.creds?.registered && global.nomerBot) {
        setTimeout(async () => {
            try {
                const phoneNumber = global.nomerBot.replace(/\D/g, '');
                const code = await conn.requestPairingCode(phoneNumber);
                const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
                
                console.log('Number:', global.nomerBot);
                console.log('Pairing Code:', formattedCode);
                
            } catch (error) {
                console.log('Error getting pairing code:', error.message);
            }
        }, 3000);
    }

    // Handle connection updates
    conn.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr && !global.pairingCode) {
        console.log('QR Code generated, please scan!');
      }
      
      if (connection === 'close') {
        let shouldReconnect = true;
        
        if (lastDisconnect?.error && DisconnectReason) {
          const statusCode = (new Boom(lastDisconnect.error)).output?.statusCode;
          shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        }
        
        console.log(`Connection closed. Reconnecting: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          setTimeout(connectToWhatsApp, 5000);
        }
      } else if (connection === 'open') {
        console.log('WhatsApp connected successfully!');
        console.log('User:', conn.user?.name || conn.user?.id);
        
        // Update presence
        try {
          await conn.sendPresenceUpdate('available');
        } catch (error) {
          // Ignore
        }
      }
    });

    // Handle credentials update
    if (saveCreds) {
      conn.ev.on('creds.update', saveCreds);
    }

    // Handle messages
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
          console.log('Handler error:', err.message);
        }
        
      } catch (err) {
        console.log('Error processing message:', err.message);
        if (global.ownerBot) {
          try {
            await conn.sendMessage(global.ownerBot, { text: `Error: ${err.message}` });
          } catch (sendError) {
            // Ignore
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
        console.log('Error handling call:', error.message);
      }
    });

    // Handle group participants update
    conn.ev.on('group-participants.update', async (anu) => {
      try {
        if (typeof memberUpdate === 'function') {
          await memberUpdate(conn, anu);
        }
      } catch (error) {
        console.log('Error handling group update:', error.message);
      }
    });

    console.log('WhatsApp Bot is ready!');
    console.log(`Mode: ${global.pairingCode ? 'Pairing Code' : 'QR Code'}`);
    
    return conn;

  } catch (error) {
    console.log('Error connecting to WhatsApp:', error.message);
    console.log('Reconnecting in 5 seconds...');
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
    "Cannot find package",
    "makeInMemoryStore"
  ];
  
  if (ignorableErrors.some(error => e.includes(error))) return;
  
  console.log('Uncaught Exception:', err.message);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log('Unhandled Rejection:', reason);
});
