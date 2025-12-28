//axios@0.20.0 "^0.27.2",
mengimpor kapur dari "kapur";
impor axios dari "axios";
impor { fileURLToPath, URL } dari "url";
impor klaster dari "klaster";
impor { gabung, nama direktori } dari "jalur";
impor fs dari 'fs-extra'
impor Readline dari "readline";
impor { konfigurasi } dari 'dotenv';
impor ekspres dari "ekspres";

const sleep = async (ms) => {
  kembalikan Promise baru ((resolve) => setTimeout(resolve, ms));
};


const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const rl = Readline.createInterface(process.stdin, process.stdout);
const PORT = parseInt(process.env.PORT) || 4000;
konstanta HOST = '0.0.0.0';

app.all('/', (req, res) => {
  let html = fs.readFileSync('./index.html', 'utf-8');
  res.end(html);
});

// Mulai server dengan fallback otomatis jika port sudah digunakan
const startServer = (port) => {
  const server = app.listen(port, HOST, () => {
    console.log(chalk.green(`ðŸŒ Port ${port} is open`));
    console.log(chalk.green(`ðŸŒ Keep Alive on`));
  });

  server.on('error', (err) => {
    jika (err && err.code === 'EADDRINUSE') {
      console.log(chalk.yellow(`Port ${port} sedang digunakan - mencoba ${port + 1}...`));
      setTimeout(() => startServer(port + 1), 1000);
    } kalau tidak {
      console.error(chalk.red(`Kesalahan server: ${err}`));
      proses.keluar(1);
    }
  });
};

startServer(PORT);

konfigurasi();



variabel error = 0

var isRunning = false;
/**
* Mulai file js
* @param {String} file `path/to/file`
*/
fungsi mulai(file) {
jika (sedang berjalan) kembali;
isRunning = true;
let args = [join(__dirname, file), ...process.argv.slice(2)];

cluster.setupMaster({
jalankan: gabungkan(__dirname, file),
argumen: args.slice(1),
});
misalkan p = cluster.fork();
p.on("pesan",async (data) => {
//console.log("[RECEIVED]", data);
beralih (data) {
kasus "reset":
console.log("saatnya direset");
p.process.kill();
isRunning = false;
mulai.terapkan(ini, argumen);
merusak;
kasus "null":
p.process.kill();
isRunning = false;
mulai.terapkan(ini, argumen);
    console.log(chalk.yellowBright.bold(`Total kesalahan sistem: ${error}`))
merusak;
kasus "SIGKILL":
p.process.kill();
isRunning = false;
mulai.terapkan(ini, argumen);
merusak;
kasus "uptime":
p.send(process.uptime());
merusak;
}
});

//KELUAR
p.on("exit", async (_, code) => {
console.error(chalk.red(`ðŸ›' Keluar dengan kode: ${code}`));
console.error(chalk.red(`â Œ Skrip akan dimulai ulang...`));

jika (kesalahan > 4) {
console.log(chalk.YellowBright.bold(`Terjadi error lebih dari ${error} kali, sistem dihentikan selama satu jam`))
  
setInterval(async () => {
kesalahan = 0
  p.process.kill();
  isRunning = false;
  mulai.terapkan(ini, argumen);
console.log(chalk.yellowBright.bold(`System error telah direset, total system error ${error}`))
}, 60000 * 60);

} else if(error < 5) {

  
setInterval(async () => {
kesalahan = 0
}, 60000 * 5);

  
  
jika (kode == null) {
//tunggu tidur (10000)
kesalahan += 1
p.process.kill();
isRunning = false;
mulai.terapkan(ini, argumen);
console.log(chalk.yellowBright.bold(`Total kesalahan sistem: ${error}`))
} else if (code == "SIGKILL") {
p.process.kill();
isRunning = false;
mulai.terapkan(ini, argumen);
} else if (code == "SIGBUS") {
p.process.kill();
isRunning = false;
mulai.terapkan(ini, argumen);
} else if (code == "SIGABRT") {
p.process.kill();
isRunning = false;
mulai.terapkan(ini, argumen);
} else if (code === 0) {
//tunggu tidur (10000)
kesalahan += 1
p.process.kill();
isRunning = false;
mulai.terapkan(ini, argumen);
console.log(chalk.yellowBright.bold(`Total kesalahan sistem: ${error}`))
}

}// akhir dari error < 5

  
isRunning = false;

/*
fs.watchFile(args[0], () => {
fs.unwatchFile(args[0]);
mulai(file);
});

jika (!rl.listenerCount())
rl.on("line", (line) => {
p.emit("pesan", line.trim());
});
  */
});

//unhandledRejection
p.on("unhandledRejection", async () => {
konsol.kesalahan(
chalk.red(`â Œ Penolakan janji yang tidak ditangani. Skrip akan dimulai ulang...`)
);
tunggu tidur(10000)
  kesalahan += 1
p.process.kill();
isRunning = false;
mulai.terapkan(ini, argumen);
  console.log(chalk.yellowBright.bold(`Total kesalahan sistem: ${error}`))
});

//kesalahan
p.on("error", async (err) => {
console.error(chalk.red(`â Œ Error: ${err}`));
tunggu tidur(10000)
  kesalahan += 1
p.process.kill();
isRunning = false;
mulai.terapkan(ini, argumen);
});

}

mulai("main.js");
//start("test.js");






//MEMPERTAHANKAN
fungsi keepAlive() {
const url = `https://a7189f57-1f15-4060-b97e-853222c15d2e-00-uy10zij1nl6y.teams.replit.dev`;
jika (/(\/\/|\.)undefined\./.test(url)) kembalikan;
setInterval(async () => {
//console.log('pinging...')
//fetch(url).catch(console.error);

 biarkan respons = tunggu axios(url)
if(error < 5) console.log(chalk.yellowBright.bold('Server wake-up! --', response.status))
  
}, 1000 * 60);
}
