import "./settings.js"

import makeWASocket, {
  useMultiFileAuthState,
  makeInMemoryStore,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'

import fs, { readdirSync, existsSync, readFileSync, watch, statSync } from "fs"
import pino from "pino"
import { smsg } from "./lib/simple.js"
import path, { join, dirname } from "path"
import { memberUpdate } from "./message/group.js"
import { antiCall } from "./message/anticall.js"
import { connectionUpdate } from "./message/connection.js"
import { Function } from "./message/function.js"
import NodeCache from "node-cache"
import { createRequire } from "module"
import { fileURLToPath, pathToFileURL } from "url"
import { platform } from "process"
import chalk from "chalk"
import util from "util"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Global helpers
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== "win32") {
  return rmPrefix ? (/file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL) : pathToFileURL(pathURL).toString()
}

global.__require = function require(dir = import.meta.url) {
  return createRequire(dir)
}

const msgRetryCounterCache = new NodeCache()

// Fungsi untuk mendapatkan nama pengirim (CLEAN VERSION)
const getSenderName = async (sock, jid, participant = null) => {
  try {
    let name = "Anonymous"
    const targetJid = participant || jid
    
    // Coba dari kontak
    if (sock.contacts && sock.contacts[targetJid]) {
      name = sock.contacts[targetJid].name || sock.contacts[targetJid].notify || targetJid.split('@')[0]
    }
    
    // Jika masih anonymous, coba dari store jika ada
    if (name === "Anonymous" && sock.ev && sock.ev.store) {
      const storeContact = sock.ev.store.contacts?.[targetJid]
      if (storeContact?.name) {
        name = storeContact.name
      }
    }
    
    return name
  } catch {
    return "Anonymous"
  }
}

// Fungsi ekstrak teks pesan
const extractMessageText = (m) => {
  if (m.message?.conversation) return m.message.conversation
  if (m.message?.extendedTextMessage?.text) return m.message.extendedTextMessage.text
  if (m.message?.imageMessage?.caption) return m.message.imageMessage.caption
  if (m.message?.videoMessage?.caption) return m.message.videoMessage.caption
  
  if (m.message?.imageMessage) return "[Image]"
  if (m.message?.videoMessage) return "[Video]"
  if (m.message?.audioMessage) return "[Audio]"
  if (m.message?.documentMessage) return "[Document]"
  if (m.message?.stickerMessage) return "[Sticker]"
  
  return "[Message]"
}

// Connect to WhatsApp (CLEAN VERSION)
const connectToWhatsApp = async () => {
  try {
    console.log(chalk.magenta("Starting WhatsApp connection..."))
    
    // Load database
    if (global.db && typeof global.db.read === 'function') {
      await global.db.read()
    }
    
    // Auth state
    const sessionFolder = './session'
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder)
    
    // Store
    const store = makeInMemoryStore({ logger: pino({ level: 'silent' }) })
    
    // Version
    const { version } = await fetchLatestBaileysVersion()
    
    // Socket config SESUAI DOCS
    const sockConfig = {
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
      },
      printQRInTerminal: !global.pairingCode,
      browser: Browsers.ubuntu('WhatsApp Bot'),
      logger: pino({ level: 'silent' }),
      markOnlineOnConnect: true,
      syncFullHistory: false,
      generateHighQualityLinkPreview: true
    }
    
    // Buat socket
    global.conn = makeWASocket(sockConfig)
    
    // Bind store
    store.bind(global.conn.ev)
    
    // Pairing Code handler SESUAI DOCS
    if (global.pairingCode && !global.conn.authState.creds.registered) {
      setTimeout(async () => {
        try {
          const code = await global.conn.requestPairingCode(global.nomerBot)
          const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code
          
          console.log(chalk.magenta(`📱 Pairing Code:`))
          console.log(chalk.magenta(`For: ${global.nomerBot}`))
          console.log(chalk.magenta(`Code: ${formattedCode}`))
        } catch (err) {
          console.log(chalk.red(`Error getting pairing code: ${err.message}`))
        }
      }, 3000)
    }
    
    // Event handling SESUAI DOCS
    global.conn.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
          ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
          : true
        
        if (shouldReconnect) {
          console.log(chalk.magenta("Reconnecting..."))
          setTimeout(connectToWhatsApp, 5000)
        }
      } else if (connection === 'open') {
        console.log(chalk.magenta("✓ Connected to WhatsApp"))
      }
      
      if (typeof connectionUpdate === 'function') {
        await connectionUpdate(connectToWhatsApp, global.conn, update)
      }
    })
    
    // Creds update
    global.conn.ev.on('creds.update', saveCreds)
    
    // Messages handler - CLEAN LOGGING
    global.conn.ev.on('messages.upsert', async ({ messages }) => {
      try {
        if (!messages || messages.length === 0) return
        
        const m = messages[0]
        if (!m.message || m.key.fromMe) return
        
        // Skip system messages
        if (m.key.remoteJid === 'status@broadcast') return
        if (m.key.id?.startsWith('3EB0')) return
        
        // Get sender info
        const senderJid = m.key.remoteJid
        const participant = m.key.participant
        const isGroup = senderJid.endsWith('@g.us')
        
        // Get display name
        let displayName = await getSenderName(
          global.conn, 
          isGroup && participant ? participant : senderJid
        )
        
        // Extract message text
        const messageText = extractMessageText(m)
        
        // CLEAN LOG OUTPUT - NO BORDER, NO EXTRA INFO
        console.log(
          chalk.magenta(`${displayName}: `) + 
          chalk.white(messageText)
        )
        
        // Process message
        const processedMsg = await smsg(global.conn, m)
        
        // Load handler jika ada
        try {
          const { handler } = await import(`./handler.js?v=${Date.now()}`)
          if (handler && typeof handler === 'function') {
            await handler(global.conn, processedMsg, { messages }, store)
          }
        } catch (e) {
          // Handler tidak ditemukan, lanjutkan saja
        }
        
      } catch (err) {
        console.log(chalk.red(`Message error: ${err.message}`))
      }
    })
    
    // Anti call
    global.conn.ev.on('call', async (node) => {
      if (typeof antiCall === 'function') {
        antiCall(global.db, node, global.conn)
      }
    })
    
    // Group participants update
    global.conn.ev.on('group-participants.update', async (event) => {
      if (typeof memberUpdate === 'function') {
        memberUpdate(global.conn, event)
      }
    })
    
    // Load plugins
    const pluginFolder = path.join(__dirname, "./plugins")
    global.plugins = {}
    
    if (existsSync(pluginFolder)) {
      async function loadPlugins(folder) {
        const files = readdirSync(folder)
        for (const file of files) {
          const filePath = join(folder, file)
          const stat = statSync(filePath)
          
          if (stat.isDirectory()) {
            await loadPlugins(filePath)
          } else if (file.endsWith('.js')) {
            try {
              const module = await import(`file://${filePath}`)
              global.plugins[file] = module.default || module
            } catch (e) {
              // Skip error
            }
          }
        }
      }
      
      await loadPlugins(pluginFolder)
    }
    
    // Initialize function
    if (typeof Function === 'function') {
      Function(global.conn)
    }
    
    return global.conn
    
  } catch (err) {
    console.log(chalk.red(`Connection failed: ${err.message}`))
    // Restart setelah 10 detik
    setTimeout(connectToWhatsApp, 10000)
  }
}

// Start connection
connectToWhatsApp()

// Error handling
process.on('uncaughtException', (err) => {
  const msg = err.message
  if (msg.includes('Socket') || msg.includes('Connection') || msg.includes('Timed Out')) return
  console.log(chalk.red(`Error: ${msg}`))
})
