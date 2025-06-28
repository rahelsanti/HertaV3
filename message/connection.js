"use strict";
const {
  default: makeWASocket,
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = (await import("baileys")).default;
import chalk from "chalk";
import { Boom } from "@hapi/boom";
import spin from "spinnies";
import { spawn } from "child_process";
import { sleep } from "../lib/myfunc.js";
import fs from "fs-extra";
import { Octokit } from '@octokit/rest';
import { Buffer } from 'buffer';

const spinner = {
  interval: 120,
  frames: [
    "✖ [░░░░░░░░░░░░░░░]",
    "✖ [■░░░░░░░░░░░░░░]",
    "✖ [■■░░░░░░░░░░░░░]",
    "✖ [■■■░░░░░░░░░░░░]",
    "✖ [■■■■░░░░░░░░░░░]",
    "✖ [■■■■■░░░░░░░░░░]",
    "✖ [■■■■■■░░░░░░░░░]",
    "✖ [■■■■■■■░░░░░░░░]",
    "✖ [■■■■■■■■░░░░░░░]",
    "✖ [■■■■■■■■■░░░░░░]",
    "✖ [■■■■■■■■■■░░░░░]",
    "✖ [■■■■■■■■■■■░░░░]",
    "✖ [■■■■■■■■■■■■░░░]",
    "✖ [■■■■■■■■■■■■■░░]",
    "✖ [■■■■■■■■■■■■■■░]",
    "✖ [■■■■■■■■■■■■■■■]",
  ],
};
let globalSpinner;
const getGlobalSpinner = (disableSpins = false) => {
  if (!globalSpinner)
    globalSpinner = new spin({
      color: "blue",
      succeedColor: "green",
      spinner,
      disableSpins,
    });
  return globalSpinner;
};
let spins = getGlobalSpinner(false);

const start = (id, text) => {
  spins.add(id, { text: text });
};
const success = (id, text) => {
  spins.succeed(id, { text: text });
};

// Flag untuk mencegah save berulang saat reconnect
let hasInitialConnection = false;

// Function untuk save session ke GitHub
async function saveSessionToGitHub() {
  if (!global.heroku) {
    console.log(chalk.yellow("GitHub save disabled (global.heroku = false)"));
    return;
  }

  if (!global.token || !global.username || !global.repo) {
    console.log(chalk.red("GitHub credentials not configured"));
    return;
  }

  try {
    const sessionFilePath = './session/creds.json';
    if (!fs.existsSync(sessionFilePath)) {
      console.log(chalk.red("Session file not found for GitHub upload"));
      return;
    }

    console.log(chalk.blue("Saving session to GitHub..."));
    
    const contentBuffer = fs.readFileSync(sessionFilePath);
    const octokit = new Octokit({ auth: global.token });
    const filePath = 'session/creds.json';

    // Cek apakah file sudah ada di GitHub
    let sha = null;
    try {
      const { data } = await octokit.repos.getContent({
        owner: global.username,
        repo: global.repo,
        path: filePath,
      });
      sha = data?.sha || null;
    } catch (err) {
      // File belum ada, biarkan sha null
      if (err.status !== 404) {
        console.error(chalk.red("Error checking existing file:"), err.message);
        return;
      }
    }

    // Upload/update file ke GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: global.username,
      repo: global.repo,
      path: filePath,
      message: `Update session/creds.json via bot`,
      content: contentBuffer.toString('base64'),
      sha: sha || undefined,
      committer: {
        name: 'WhatsApp Bot',
        email: 'bot@whatsapp.dev'
      },
      author: {
        name: 'WhatsApp Bot',
        email: 'bot@whatsapp.dev'
      }
    });

    console.log(chalk.green("✅ Session successfully saved to GitHub!"));
    
  } catch (error) {
    console.error(chalk.red("❌ Failed to save session to GitHub:"), error.message);
  }
}

async function clearSession() {
  try {
    const files = await fs.readdir(`./${global.session}`);
    const filteredArray = files.filter(
      (item) =>
        item.startsWith("pre-key") ||
        item.startsWith("sender-key") ||
        item.startsWith("session-")
    );

    console.log(`Terdeteksi ${filteredArray.length} file sampah`);
    if (filteredArray.length === 0) {
      console.log("Tidak ada file sampah untuk dihapus.");
      return;
    }

    console.log("Menghapus file sampah session...");
    for (const file of filteredArray) {
      await fs.unlink(`./${global.session}/${file}`);
    }

    console.log("Berhasil menghapus semua sampah di folder session.");
  } catch (err) {
    console.error("Gagal membersihkan folder session:", err);
  }
}

export const connectionUpdate = async (connectToWhatsApp, conn, update) => {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  const {
    connection,
    lastDisconnect,
    receivedPendingNotifications,
    isNewLogin,
    qr,
  } = update;

  const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
  if (connection === "close") {
    console.log(chalk.red(lastDisconnect.error));

    if (lastDisconnect.error == "Error: Stream Errored (unknown)") {
      process.send("reset");
    } else if (reason === DisconnectReason.badSession) {
      console.log(`Bad Session File, Please Delete Session and Scan Again`);
      process.send("reset");
    } else if (reason === DisconnectReason.connectionClosed) {
      console.log("[SYSTEM]", chalk.red("Connection closed, reconnecting..."));
      process.send("reset");
    } else if (reason === DisconnectReason.connectionLost) {
      console.log(
        chalk.red("[SYSTEM]", "white"),
        chalk.green("Connection lost, trying to reconnect")
      );
      process.send("reset");
    } else if (reason === DisconnectReason.connectionReplaced) {
      console.log(
        chalk.red(
          "Connection Replaced, Another New Session Opened, Please Close Current Session First"
        )
      );
      conn.logout();
    } else if (reason === DisconnectReason.loggedOut) {
      console.log(chalk.red(`Device Logged Out, Please Scan Again And Run.`));
      conn.logout();
      // Reset flag ketika logout
      hasInitialConnection = false;
    } else if (reason === DisconnectReason.restartRequired) {
      console.log("Restart Required, Restarting...");
      connectToWhatsApp();
      process.send("reset");
    } else if (reason === DisconnectReason.timedOut) {
      console.log(chalk.red("Connection TimedOut, Reconnecting..."));
      connectToWhatsApp();
    }
  } else if (connection === "connecting") {
    console.log(
      chalk.magenta(`]─`),
      `「`,
      chalk.red(`FEARLESS`),
      `」`,
      chalk.magenta(`─[`)
    );

    if (!global.pairingCode) start(`1`, `Connecting...`);
  } else if (connection === "open") {
    if (!global.pairingCode) success(`1`, `[■■■■■■■■■■■■■■■] Connected`);
    if (global.pairingCode)
      console.log(chalk.green(`[■■■■■■■■■■■■■■■] Connected`));

    // Clear session saat koneksi terbuka
    await clearSession();

    // Cek apakah ini koneksi pertama atau setelah pairing/scan barcode
    const shouldSaveToGitHub = !hasInitialConnection || isNewLogin;
    
    if (shouldSaveToGitHub) {
      console.log(chalk.blue("Initial connection or new login detected"));
      hasInitialConnection = true;
      
      // Save ke GitHub setelah delay 5 detik
      setTimeout(async () => {
        await saveSessionToGitHub();
      }, 5000);
    } else {
      console.log(chalk.yellow("Reconnection detected, skipping GitHub save"));
    }

    // Kirim pesan Bot Connected ke owner setelah delay 10 detik
    setTimeout(async () => {
      try {
        if (global.nomerOwner) {
          const ownerJid = `${global.nomerOwner}@s.whatsapp.net`;
          await conn.sendMessage(ownerJid, { text: "*Bot Connected*" });
          console.log(chalk.green("Bot connected message sent to owner."));
        }
      } catch (err) {
        console.error("Failed to send bot connected message:", err);
      }
    }, 10000);

    const bot = db.data.others["restart"];
    if (bot) {
      const m = bot.m;
      const from = bot.from;
      let text = "Bot is connected";
      await conn.sendMessage(from, { text }, { quoted: m });
      delete db.data.others["restart"];
    }

    // Quick Test
    async function _quickTest() {
      let test = await Promise.all(
        [
          spawn("ffmpeg"),
          spawn("ffprobe"),
          spawn("ffmpeg", [
            "-hide_banner",
            "-loglevel",
            "error",
            "-filter_complex",
            "color",
            "-frames:v",
            "1",
            "-f",
            "webp",
            "-",
          ]),
          spawn("convert"),
          spawn("magick"),
          spawn("gm"),
          spawn("find", ["--version"]),
        ].map((p) => {
          return Promise.race([
            new Promise((resolve) => {
              p.on("close", (code) => {
                resolve(code !== 127);
              });
            }),
            new Promise((resolve) => {
              p.on("error", (_) => resolve(false));
            }),
          ]);
        })
      );
      let [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
      let s = (global.support = {
        ffmpeg,
        ffprobe,
        ffmpegWebp,
        convert,
        magick,
        gm,
        find,
      });
      Object.freeze(global.support);

      if (!s.ffmpeg)
        conn.logger.warn(
          "Please install ffmpeg for sending videos (pkg install ffmpeg)"
        );
      if (s.ffmpeg && !s.ffmpegWebp)
        conn.logger.warn(
          "Stickers may not animated without libwebp on ffmpeg (--enable-libwebp while compiling ffmpeg)"
        );
      if (!s.convert && !s.magick && !s.gm)
        conn.logger.warn(
          "Stickers may not work without imagemagick if libwebp on ffmpeg isntalled (pkg install imagemagick)"
        );
    }

    _quickTest()
      .then(() => conn.logger.info("☑️ Quick Test Done"))
      .catch(console.error);
  }
}; // akhir connection