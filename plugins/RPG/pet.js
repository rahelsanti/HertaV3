let handler = async (m, { conn, args, usedPrefix }) => {
    let user = global.db.data.users[m.sender];
    
    // Function to create exp bar
    function createExpBar(currentExp, requiredExp, length = 15) {
        let percentage = Math.min(currentExp / requiredExp, 1);
        let filledBars = Math.floor(percentage * length);
        let emptyBars = length - filledBars;
        return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
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

    // Function to get rarity text
    function getRarityText(rarity) {
        switch(rarity) {
            case 'common': return 'Common';
            case 'rare': return 'Rare';
            case 'legendary': return 'Legendary';
            default: return 'Common';
        }
    }

    // Pet data with rarity
    let pets = [
        { name: 'Cat', emoji: '🐈', key: 'cat', exp: 'catexp', rarity: 'common' },
        { name: 'Dog', emoji: '🐕', key: 'dog', exp: 'dogexp', rarity: 'common' },
        { name: 'Horse', emoji: '🐎', key: 'horse', exp: 'horseexp', rarity: 'common' },
        { name: 'Fox', emoji: '🦊', key: 'fox', exp: 'foxexp', rarity: 'common' },
        { name: 'Robo', emoji: '🤖', key: 'robo', exp: 'roboexp', rarity: 'common' },
        { name: 'Dragon', emoji: '🐉', key: 'dragon', exp: 'dragonexp', rarity: 'common' },
        { name: 'Unicorn', emoji: '🦄', key: 'unicorn', exp: 'unicornexp', rarity: 'rare' },
        { name: 'Dino', emoji: '🦖', key: 'dino', exp: 'dinoexp', rarity: 'rare' },
        { name: 'Tano', emoji: '🦕', key: 'tano', exp: 'tanoexp', rarity: 'legendary' }
    ];

    let ownedPets = [];

    // Check each pet and add to owned list if user has it
    for (let pet of pets) {
        let petLevel = user[pet.key] || 0;
        if (petLevel > 0) {
            let petExp = user[pet.exp] || 0;
            let requiredExp = getExpRequirement(petLevel, pet.rarity);
            let expBar = createExpBar(petExp, requiredExp);
            let percentage = Math.floor((petExp / requiredExp) * 100);
            let rarityText = getRarityText(pet.rarity);
            
            ownedPets.push({
                ...pet,
                level: petLevel,
                currentExp: petExp,
                requiredExp: requiredExp,
                expBar: expBar,
                percentage: percentage,
                rarityText: rarityText
            });
        }
    }

    // If no pets owned
    if (ownedPets.length === 0) {
        return m.reply(`
╭─『 🐾 MY PETS 🐾 』
│ 
│ ❌ You don't have any pets yet!
│ 
│ 💡 Get pets by using commands like:
│ • ${usedPrefix}petshop cat
│ • ${usedPrefix}gacha (to gacha pets)
│ 
╰─────────────────────
        `.trim());
    }

    // Build pet list display
    let petList = `╭─『 🐾 MY PETS 🐾 』\n`;
    
    for (let i = 0; i < ownedPets.length; i++) {
        let pet = ownedPets[i];
        petList += `│ \n`;
        petList += `│ ${pet.emoji} ${pet.name} (${pet.rarityText})\n`;
        petList += `│ 🚀 Level: ${pet.level}/10\n`;
        petList += `│ 📊 EXP: [${pet.expBar}]\n`;
        petList += `│ 💫 ${pet.currentExp}/${pet.requiredExp} (${pet.percentage}%)\n`;
        
        if (i < ownedPets.length - 1) {
            petList += `│ ─────────────────\n`;
        }
    }
    
    petList += `│ \n`;
    petList += `╰─────────────────────\n`;
    petList += `\n💡 Use ${usedPrefix}feed <pet> to feed your pets!`;

    m.reply(petList);
};

handler.help = ["pet", "pets", "mypet"];
handler.tags = ["rpg"];
handler.command = /^(pet|pets|mypet)$/i;

handler.register = true;
handler.group = true;
handler.rpg = true;

export default handler;