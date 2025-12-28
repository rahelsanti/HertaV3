import chalk from "chalk";
import axios from "axios";
import { fileURLToPath, URL } from "url";
import cluster from "cluster";
import { join, dirname } from "path";
import fs from 'fs-extra';
import Readline from "readline";
import { config } from 'dotenv';
import express from "express";

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const rl = Readline.createInterface(process.stdin, process.stdout);
const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

// Express server untuk health check
app.all('/', (req, res) => {
  let html = fs.readFileSync('./index.html', 'utf-8');
  res.end(html);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'WhatsApp Bot is running',
    version: '7.0.0'
  });
});

app.listen(PORT, HOST, () => {
  console.log(chalk.green('🌐') + chalk.white(` Port ${PORT} is open`));
  console.log(chalk.green('🌐') + chalk.white(' Keep Alive on'));
});

config();

let errorCount = 0;
let isRunning = false;

/**
 * Start a js file dengan cluster
 * @param {String} file `path/to/file`
 */
function start(file) {
  if (isRunning) return;
  isRunning = true;
  
  let args = [join(__dirname, file), ...process.argv.slice(2)];

  cluster.setupMaster({
    exec: join(__dirname, file),
    args: args.slice(1),
  });
  
  let p = cluster.fork();
  
  p.on("message", async (data) => {
    switch (data) {
      case "reset":
        console.log(chalk.yellow('🔄') + chalk.white(' Saatnya reset'));
        p.process.kill();
        isRunning = false;
        start.apply(this, arguments);
        break;
      case "null":
        p.process.kill();
        isRunning = false;
        start.apply(this, arguments);
        console.log(chalk.yellow('⚠️') + chalk.white(` System error total: ${errorCount}`));
        break;
      case "SIGKILL":
        p.process.kill();
        isRunning = false;
        start.apply(this, arguments);
        break;
      case "uptime":
        p.send(process.uptime());
        break;
    }
  });

  // Exit handler
  p.on("exit", async (_, code) => {
    console.log(chalk.red('🛑') + chalk.white(` Exited with code: ${code}`));
    console.log(chalk.red('❌') + chalk.white(' Script will restart...'));

    if (errorCount > 4) {
      console.log(chalk.yellow('⏰') + chalk.white(` Terjadi error lebih dari ${errorCount} kali, system dihentikan selama satu jam`));
      
      setTimeout(async () => {
        errorCount = 0;
        p.process.kill();
        isRunning = false;
        start.apply(this, arguments);
        console.log(chalk.green('✅') + chalk.white(` System error telah di reset, total system error ${errorCount}`));
      }, 60000 * 60);
      
    } else if (errorCount < 5) {
      
      // Reset error count setelah 5 menit
      setTimeout(() => {
        errorCount = 0;
        console.log(chalk.green('🔄') + chalk.white(' Error counter reset'));
      }, 60000 * 5);

      if (code == null || code === 0) {
        errorCount += 1;
        await sleep(3000);
        p.process.kill();
        isRunning = false;
        start.apply(this, arguments);
        console.log(chalk.yellow('⚠️') + chalk.white(` System error total: ${errorCount}`));
      } else if (code === "SIGKILL" || code === "SIGBUS" || code === "SIGABRT") {
        await sleep(3000);
        p.process.kill();
        isRunning = false;
        start.apply(this, arguments);
      }
    }

    isRunning = false;
  });

  // Unhandled rejection
  p.on("unhandledRejection", async (reason) => {
    console.log(chalk.red('❌') + chalk.white(' Unhandled promise rejection:'), reason);
    await sleep(3000);
    errorCount += 1;
    p.process.kill();
    isRunning = false;
    start.apply(this, arguments);
    console.log(chalk.yellow('⚠️') + chalk.white(` System error total: ${errorCount}`));
  });

  // Error handler
  p.on("error", async (err) => {
    console.error(chalk.red('❌') + chalk.white(` Error: ${err}`));
    await sleep(3000);
    errorCount += 1;
    p.process.kill();
    isRunning = false;
    start.apply(this, arguments);
    console.log(chalk.yellow('⚠️') + chalk.white(` System error total: ${errorCount}`));
  });
}

// Start the bot
start("main.js");

// KEEP ALIVE function
function keepAlive() {
  const url = `http://localhost:${PORT}`;
  
  setInterval(async () => {
    try {
      let response = await axios.get(url, { timeout: 10000 });
      if (errorCount < 5) {
        console.log(chalk.green('💚') + chalk.white(' Server wake-up! --'), response.status);
      }
    } catch (error) {
      if (errorCount < 5) {
        console.log(chalk.yellow('⚠️') + chalk.white(' Keep-alive ping failed:'), error.message);
      }
    }
  }, 1000 * 60);
}

// Start keep alive
keepAlive();
