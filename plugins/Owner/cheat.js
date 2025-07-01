let handler = async (m, { conn, args, setReply }) => {
  if (!args[0]) {
    return setReply(`❗ Gunakan format: .fakedb <jumlah>\n\nContoh:\n• .fakedb 10000 - Tambah 10k user palsu\n• .fakedb clear - Hapus semua user palsu\n• .fakedb status - Lihat status database`);
  }

  const command = args[0].toLowerCase();

  if (command === 'status') {
    const totalUsers = Object.keys(global.db.data.users).length;
    const registeredUsers = Object.values(global.db.data.users).filter(user => user.registered === true).length;
    const fakeUsers = Object.values(global.db.data.users).filter(user => user.isFakeUser === true).length;
    
    return setReply(`📊 *DATABASE STATUS*\n\n` +
      `👥 Total Users: ${totalUsers.toLocaleString()}\n` +
      `✅ Registered: ${registeredUsers.toLocaleString()}\n` +
      `🤖 Fake Users: ${fakeUsers.toLocaleString()}\n` +
      `👤 Real Users: ${(totalUsers - fakeUsers).toLocaleString()}`);
  }

  if (command === 'clear') {
    // Hapus semua user palsu
    const beforeCount = Object.keys(global.db.data.users).length;
    
    for (let userId in global.db.data.users) {
      if (global.db.data.users[userId].isFakeUser === true) {
        delete global.db.data.users[userId];
      }
    }
    
    const afterCount = Object.keys(global.db.data.users).length;
    const deletedCount = beforeCount - afterCount;
    
    return setReply(`🗑️ *FAKE DATABASE CLEARED*\n\n` +
      `✅ Deleted ${deletedCount.toLocaleString()} fake users\n` +
      `📊 Remaining users: ${afterCount.toLocaleString()}`);
  }

  const jumlah = parseInt(command);
  if (isNaN(jumlah) || jumlah <= 0) {
    return setReply(`❌ Jumlah harus berupa angka positif!`);
  }

  if (jumlah > 50000) {
    return setReply(`⚠️ Maksimal 50,000 user untuk mencegah lag!`);
  }

  setReply(`🔄 Menambahkan ${jumlah.toLocaleString()} user palsu ke database...\nMohon tunggu...`);

  // Array nama depan dan belakang untuk generate nama random
  const namaDepan = [
    'Ahmad', 'Budi', 'Citra', 'Deni', 'Eka', 'Fira', 'Gilang', 'Hana', 'Indra', 'Joko',
    'Kiki', 'Lina', 'Maya', 'Nanda', 'Oka', 'Putra', 'Qori', 'Rina', 'Sari', 'Tono',
    'Udin', 'Vera', 'Wira', 'Xena', 'Yudi', 'Zara', 'Andi', 'Bella', 'Caca', 'Dika',
    'Ella', 'Fajar', 'Gina', 'Haris', 'Ika', 'Jeni', 'Kevin', 'Lisa', 'Miko', 'Nina'
  ];

  const namaBelakang = [
    'Pratama', 'Sari', 'Wijaya', 'Putri', 'Kusuma', 'Utami', 'Santoso', 'Dewi', 'Ramadhan', 'Lestari',
    'Saputra', 'Wati', 'Hidayat', 'Anggraeni', 'Permana', 'Maharani', 'Setiawan', 'Kartika', 'Gunawan', 'Safitri'
  ];

  let berhasil = 0;
  let gagal = 0;

  for (let i = 0; i < jumlah; i++) {
    try {
      // Generate random phone number (fake)
      const randomPhone = `62${Math.floor(Math.random() * 900000000) + 100000000}@s.whatsapp.net`;
      
      // Skip jika user sudah ada
      if (global.db.data.users[randomPhone]) {
        gagal++;
        continue;
      }

      // Generate random name
      const firstName = namaDepan[Math.floor(Math.random() * namaDepan.length)];
      const lastName = namaBelakang[Math.floor(Math.random() * namaBelakang.length)];
      const fullName = `${firstName} ${lastName}`;

      // Generate random stats
      const randomLevel = Math.floor(Math.random() * 50) + 1;
      const randomExp = Math.floor(Math.random() * 10000);
      const randomMoney = Math.floor(Math.random() * 1000000);
      const randomBank = Math.floor(Math.random() * 5000000);

      // Create fake user data
      global.db.data.users[randomPhone] = {
        // Identitas
        name: fullName,
        age: Math.floor(Math.random() * 40) + 18,
        regTime: Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000), // Random dalam 1 tahun
        registered: Math.random() > 0.2, // 80% kemungkinan registered
        
        // Marker sebagai fake user
        isFakeUser: true,
        
        // Stats
        exp: randomExp,
        level: randomLevel,
        limit: Math.floor(Math.random() * 100),
        money: randomMoney,
        bank: randomBank,
        
        // Activity
        lastclaim: 0,
        lastadventure: 0,
        lastfishing: 0,
        lastdungeon: 0,
        lastduel: 0,
        lastmining: 0,
        lastweekly: 0,
        lastmonthly: 0,
        
        // Premium
        premium: Math.random() > 0.95, // 5% premium
        premiumTime: Math.random() > 0.95 ? Date.now() + (30 * 24 * 60 * 60 * 1000) : 0,
        
        // Warnings
        warn: Math.floor(Math.random() * 3),
        
        // Afk
        afk: Math.random() > 0.9 ? Date.now() : -1,
        afkReason: Math.random() > 0.9 ? 'Sedang sibuk' : '',
        
        // Game stats (opsional)
        health: 100,
        stamina: 100,
        mana: 100,
        
        // Job
        job: Math.random() > 0.7 ? ['programmer', 'doctor', 'teacher', 'chef', 'artist'][Math.floor(Math.random() * 5)] : '',
        
        // Banned
        banned: false,
        BannedReason: '',
        
        // Autolevelup
        autolevelup: Math.random() > 0.5
      };

      berhasil++;
    } catch (error) {
      gagal++;
    }
  }

  const totalUsers = Object.keys(global.db.data.users).length;
  const registeredUsers = Object.values(global.db.data.users).filter(user => user.registered === true).length;

  setReply(`✅ *FAKE DATABASE GENERATED*\n\n` +
    `📊 Berhasil: ${berhasil.toLocaleString()} user\n` +
    `❌ Gagal: ${gagal.toLocaleString()} user\n\n` +
    `👥 Total Users: ${totalUsers.toLocaleString()}\n` +
    `✅ Registered: ${registeredUsers.toLocaleString()}\n` +
    `📱 Unregistered: ${(totalUsers - registeredUsers).toLocaleString()}\n\n` +
    `💡 Gunakan .fakedb clear untuk hapus semua fake user`);
};

handler.help = ['fakedb <jumlah/clear/status>'];
handler.tags = ['owner'];
handler.command = /^fakedb$/i;
handler.owner = true;

export default handler;