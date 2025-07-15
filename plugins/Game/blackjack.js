const items = ["money", "chip", "diamond", "bank", "emerald", "gold"];

async function handler(m, { conn, usedPrefix, command, text }) {
  conn.bj = conn.bj ? conn.bj : {};
  
  if (m.sender in conn.bj)
    return m.reply("You are still in the game, wait until it finishes!!");

  try {
    let cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    let suits = ["♠", "♥", "♦", "♣"];
    
    let calculateTotal = (cardArray) => {
      let total = 0;
      let aces = 0;
      
      for (let card of cardArray) {
        let value = card.replace(/[♠♥♦♣]/g, '');
        if (value === "A") {
          total += 11;
          aces++;
        } else if (value === "K" || value === "Q" || value === "J") {
          total += 10;
        } else {
          total += parseInt(value);
        }
      }
      
      while (aces > 0 && total > 21) {
        total -= 10;
        aces--;
      }
      
      return total;
    };

    let pickCard = () => {
      let card = cards[Math.floor(Math.random() * cards.length)];
      let suit = suits[Math.floor(Math.random() * suits.length)];
      return card + suit;
    };

    // Function to ensure low starting hand (under 10)
    let pickLowCard = () => {
      let lowCards = ["A", "2", "3", "4", "5", "6", "7", "8", "9"];
      let card = lowCards[Math.floor(Math.random() * lowCards.length)];
      let suit = suits[Math.floor(Math.random() * suits.length)];
      return card + suit;
    };

    let getCardValue = (card) => {
      return card.replace(/[♠♥♦♣]/g, '');
    };

    let isPair = (cards) => {
      if (cards.length !== 2) return false;
      return getCardValue(cards[0]) === getCardValue(cards[1]);
    };

    let isBlackjack = (cards) => {
      if (cards.length !== 2) return false;
      let values = cards.map(card => getCardValue(card));
      return (values.includes("A") && (values.includes("10") || values.includes("J") || values.includes("Q") || values.includes("K")));
    };

    if (!text) {
      return conn.reply(m.chat, `*🎰 BLACKJACK CASINO 🎰*

*Available Items:*
- 💰 money
- ♋ chip
- 💎 diamond
- 🏦 bank
- ❇️ emerald
- 🪙 gold

*Basic Commands:*
${usedPrefix + command} <item> <amount>

*In-Game Commands:*
- hit = Take another card
- stand = End your turn
- double = Double bet + 1 card only
- split = Split pair into 2 hands
- insurance = Protect against dealer blackjack
- surrender = Forfeit, lose 50% bet

*Example:*
${usedPrefix + command} money 1000`, m, {
        contextInfo: {
          externalAdReply: {
            title: "🎰 BLACKJACK CASINO",
            body: "How to Play",
            thumbnailUrl: "https://telegra.ph/file/1703cff0a758d0ef8f84f.png",
            sourceUrl: "",
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      });
    }

    let [type, betText] = text.split(' ');
    type = type.toLowerCase();
    
    if (!items.includes(type))
      return conn.reply(m.chat, `*Available Items:*
- 💰 money
- ♋ chip
- 💎 diamond
- 🏦 bank
- ❇️ emerald
- 🪙 gold

*Example:* ${usedPrefix + command} money 1000`, m, {
        contextInfo: {
          externalAdReply: {
            title: "🎰 BLACKJACK CASINO",
            body: "Select Item",
            thumbnailUrl: "https://telegra.ph/file/1703cff0a758d0ef8f84f.png",
            sourceUrl: "",
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      });

    let bet = parseInt(betText);
    if (isNaN(bet) || bet <= 0) {
      return m.reply(`*Example:* ${usedPrefix + command} money 1000`);
    }
    
    if (global.db.data.users[m.sender][type] < bet) {
      return m.reply(`Insufficient ${type}`);
    }

    // Initialize game with low starting cards
    let playerCards = [pickLowCard(), pickLowCard()];
    // Ensure total is under 10
    while (calculateTotal(playerCards) >= 10) {
      playerCards = [pickLowCard(), pickLowCard()];
    }
    
    let dealerCards = [pickCard(), pickCard()];
    let playerTotal = calculateTotal(playerCards);
    let dealerTotal = calculateTotal(dealerCards);
    let dealerShowCard = dealerCards[0];
    let dealerShowValue = getCardValue(dealerShowCard);

    // Check for natural blackjacks (won't happen with low cards, but keep for safety)
    let playerBJ = isBlackjack(playerCards);
    let dealerBJ = isBlackjack(dealerCards);

    if (playerBJ && dealerBJ) {
      let message = `*🎰 BLACKJACK RESULT 🎰*

╭─ 🃏 YOUR HAND
│ Cards: ${playerCards.join(" ")}
│ Total: ${playerTotal} (BLACKJACK!)
├─ 🤖 DEALER HAND
│ Cards: ${dealerCards.join(" ")}
│ Total: ${dealerTotal} (BLACKJACK!)
╰─ 🤝 PUSH (TIE)

*No money lost or gained*`;

      return conn.reply(m.chat, message, m, {
        contextInfo: {
          externalAdReply: {
            title: "🎰 BLACKJACK CASINO",
            body: "Push - Both Blackjack",
            thumbnailUrl: "https://telegra.ph/file/1703cff0a758d0ef8f84f.png",
            sourceUrl: "",
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      });
    }

    if (playerBJ && !dealerBJ) {
      let winAmount = Math.floor(bet * 1.5);
      global.db.data.users[m.sender][type] += winAmount;
      
      let message = `*🎰 BLACKJACK RESULT 🎰*

╭─ 🃏 YOUR HAND
│ Cards: ${playerCards.join(" ")}
│ Total: ${playerTotal} (BLACKJACK!)
├─ 🤖 DEALER HAND
│ Cards: ${dealerCards.join(" ")}
│ Total: ${dealerTotal}
╰─ 🏆 BLACKJACK WIN!

*+${winAmount} ${type}* (1.5x payout)`;

      return conn.reply(m.chat, message, m, {
        contextInfo: {
          externalAdReply: {
            title: "🎰 BLACKJACK CASINO",
            body: "Blackjack Victory!",
            thumbnailUrl: "https://telegra.ph/file/1703cff0a758d0ef8f84f.png",
            sourceUrl: "",
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      });
    }

    // Deduct initial bet
    global.db.data.users[m.sender][type] -= bet;

    // Setup game state - unified hands system
    conn.bj[m.sender] = {
      playerHands: [{ cards: playerCards, bet: bet, status: 'active' }],
      dealerCards: dealerCards,
      currentHand: 0,
      totalBet: bet,
      type: type,
      canDouble: true,
      canSplit: isPair(playerCards),
      canInsurance: dealerShowValue === "A",
      insuranceBet: 0,
      timeout: setTimeout(() => {
        m.reply("⏰ Time's up! Game forfeited.");
        delete conn.bj[m.sender];
      }, 300000), // 5 minutes
    };

    // Build options - always show same options for consistency
    let options = [];
    if (conn.bj[m.sender].canInsurance) options.push("insurance");
    if (conn.bj[m.sender].canSplit) options.push("split");
    if (conn.bj[m.sender].canDouble) options.push("double");
    options.push("hit", "stand", "surrender");

    let message = `*🎰 BLACKJACK CASINO 🎰*

╭─ 🃏 YOUR HAND
│ Cards: ${playerCards.join(" ")}
│ Total: ${playerTotal}
├─ 🤖 DEALER HAND
│ Cards: ${dealerShowCard} [?]
├─ 💰 BET
│ Amount: ${bet} ${type}
╰─ ⚙️ OPTIONS

${options.map(opt => `- ${opt}`).join("\n")}`;

    conn.reply(m.chat, message, m, {
      contextInfo: {
        externalAdReply: {
          title: "🎰 BLACKJACK CASINO",
          body: "Make your move",
          thumbnailUrl: "https://telegra.ph/file/1703cff0a758d0ef8f84f.png",
          sourceUrl: "",
          mediaType: 1,
          renderLargerThumbnail: true,
        },
      },
    });

  } catch (e) {
    console.error(e);
    conn.reply(m.chat, "❌ Game error occurred", m);
    if (m.sender in conn.bj) {
      clearTimeout(conn.bj[m.sender].timeout);
      delete conn.bj[m.sender];
    }
  }
}

handler.before = async (m) => {
  conn.bj = conn.bj ? conn.bj : {};
  if (!(m.sender in conn.bj)) return;
  if (m.isBaileys) return;

  let bjData = conn.bj[m.sender];
  let txt = (m.msg.selectedDisplayText ? m.msg.selectedDisplayText : m.text ? m.text : "").toLowerCase();
  
  // Simplified command system - always use basic commands
  let validCommands = ["hit", "stand", "double", "split", "insurance", "surrender"];
  if (!validCommands.includes(txt)) return;

  let cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  let suits = ["♠", "♥", "♦", "♣"];

  let calculateTotal = (cardArray) => {
    let total = 0;
    let aces = 0;
    
    for (let card of cardArray) {
      let value = card.replace(/[♠♥♦♣]/g, '');
      if (value === "A") {
        total += 11;
        aces++;
      } else if (value === "K" || value === "Q" || value === "J") {
        total += 10;
      } else {
        total += parseInt(value);
      }
    }
    
    while (aces > 0 && total > 21) {
      total -= 10;
      aces--;
    }
    
    return total;
  };

  let pickCard = () => {
    let card = cards[Math.floor(Math.random() * cards.length)];
    let suit = suits[Math.floor(Math.random() * suits.length)];
    return card + suit;
  };

  let getCardValue = (card) => {
    return card.replace(/[♠♥♦♣]/g, '');
  };

  let isBlackjack = (cards) => {
    if (cards.length !== 2) return false;
    let values = cards.map(card => getCardValue(card));
    return (values.includes("A") && (values.includes("10") || values.includes("J") || values.includes("Q") || values.includes("K")));
  };

  let resolveGame = async () => {
    // Dealer plays
    let dealerTotal = calculateTotal(bjData.dealerCards);
    while (dealerTotal < 17) {
      bjData.dealerCards.push(pickCard());
      dealerTotal = calculateTotal(bjData.dealerCards);
    }

    let results = [];
    let totalWin = 0;

    // Check insurance
    if (bjData.insuranceBet > 0) {
      let dealerBJ = isBlackjack(bjData.dealerCards);
      if (dealerBJ) {
        totalWin += bjData.insuranceBet * 2;
        results.push(`Insurance: +${bjData.insuranceBet * 2} ${bjData.type}`);
      } else {
        results.push(`Insurance: Lost`);
      }
    }

    // Resolve each hand
    for (let i = 0; i < bjData.playerHands.length; i++) {
      let hand = bjData.playerHands[i];
      let handLabel = bjData.playerHands.length > 1 ? `Hand ${i + 1}` : "Hand";
      
      if (hand.status === 'bust') {
        results.push(`${handLabel}: BUST (-${hand.bet} ${bjData.type})`);
        continue;
      }
      if (hand.status === 'blackjack') {
        let winAmount = Math.floor(hand.bet * 1.5);
        totalWin += hand.bet + winAmount;
        results.push(`${handLabel}: BLACKJACK (+${winAmount} ${bjData.type})`);
        continue;
      }

      let playerTotal = calculateTotal(hand.cards);
      
      // FIXED: Handle 21 points properly
      if (playerTotal === 21 && hand.status === 'stand') {
        if (dealerTotal > 21) {
          totalWin += hand.bet * 2;
          results.push(`${handLabel}: WIN 21 (+${hand.bet} ${bjData.type})`);
        } else if (dealerTotal === 21) {
          totalWin += hand.bet;
          results.push(`${handLabel}: PUSH 21 (${hand.bet} ${bjData.type} returned)`);
        } else {
          totalWin += hand.bet * 2;
          results.push(`${handLabel}: WIN 21 (+${hand.bet} ${bjData.type})`);
        }
        continue;
      }
      
      if (dealerTotal > 21) {
        totalWin += hand.bet * 2;
        results.push(`${handLabel}: WIN (+${hand.bet} ${bjData.type})`);
      } else if (playerTotal > dealerTotal) {
        totalWin += hand.bet * 2;
        results.push(`${handLabel}: WIN (+${hand.bet} ${bjData.type})`);
      } else if (playerTotal < dealerTotal) {
        results.push(`${handLabel}: LOSE (-${hand.bet} ${bjData.type})`);
      } else {
        totalWin += hand.bet;
        results.push(`${handLabel}: PUSH (${hand.bet} ${bjData.type} returned)`);
      }
    }

    global.db.data.users[m.sender][bjData.type] += totalWin;

    // Display hands properly
    let handsDisplay;
    if (bjData.playerHands.length === 1) {
      handsDisplay = `${bjData.playerHands[0].cards.join(" ")} = ${calculateTotal(bjData.playerHands[0].cards)}`;
    } else {
      handsDisplay = bjData.playerHands.map((hand, i) => 
        `Hand ${i + 1}: ${hand.cards.join(" ")} = ${calculateTotal(hand.cards)}`
      ).join("\n│ ");
    }

    let message = `*🎰 BLACKJACK RESULT 🎰*

╭─ 🃏 YOUR HAND${bjData.playerHands.length > 1 ? 'S' : ''}
│ ${handsDisplay}
├─ 🤖 DEALER HAND
│ Cards: ${bjData.dealerCards.join(" ")}
│ Total: ${dealerTotal}
├─ 💰 RESULTS
│ ${results.join("\n│ ")}
╰─ 🏆 FINAL

*Net: ${totalWin - bjData.totalBet >= 0 ? '+' : ''}${totalWin - bjData.totalBet} ${bjData.type}*`;

    await conn.reply(m.chat, message, m, {
      contextInfo: {
        externalAdReply: {
          title: "🎰 BLACKJACK CASINO",
          body: "Game Complete",
          thumbnailUrl: "https://telegra.ph/file/1703cff0a758d0ef8f84f.png",
          sourceUrl: "",
          mediaType: 1,
          renderLargerThumbnail: true,
        },
      },
    });

    clearTimeout(bjData.timeout);
    delete conn.bj[m.sender];
  };

  try {
    if (txt === "insurance" && bjData.canInsurance) {
      let insuranceCost = Math.floor(bjData.totalBet / 2);
      if (global.db.data.users[m.sender][bjData.type] < insuranceCost) {
        return m.reply(`Insufficient ${bjData.type} for insurance`);
      }
      
      global.db.data.users[m.sender][bjData.type] -= insuranceCost;
      bjData.insuranceBet = insuranceCost;
      bjData.canInsurance = false;
      
      m.reply(`✅ Insurance purchased: ${insuranceCost} ${bjData.type}`);
      return;
    }

    if (txt === "surrender") {
      let returnAmount = Math.floor(bjData.totalBet / 2);
      global.db.data.users[m.sender][bjData.type] += returnAmount;
      
      let message = `*🎰 SURRENDER 🎰*

╭─ 🏳️ SURRENDERED
│ Returned: ${returnAmount} ${bjData.type}
╰─ 💸 Lost: ${bjData.totalBet - returnAmount} ${bjData.type}`;

      await conn.reply(m.chat, message, m, {
        contextInfo: {
          externalAdReply: {
            title: "🎰 BLACKJACK CASINO",
            body: "Surrendered",
            thumbnailUrl: "https://telegra.ph/file/1703cff0a758d0ef8f84f.png",
            sourceUrl: "",
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      });
      clearTimeout(bjData.timeout);
      delete conn.bj[m.sender];
      return;
    }

    if (txt === "split" && bjData.canSplit) {
      if (global.db.data.users[m.sender][bjData.type] < bjData.playerHands[0].bet) {
        return m.reply(`Insufficient ${bjData.type} for split`);
      }

      global.db.data.users[m.sender][bjData.type] -= bjData.playerHands[0].bet;
      bjData.totalBet += bjData.playerHands[0].bet;

      let firstCard = bjData.playerHands[0].cards[0];
      let secondCard = bjData.playerHands[0].cards[1];

      bjData.playerHands = [
        { cards: [firstCard, pickCard()], bet: bjData.playerHands[0].bet, status: 'active' },
        { cards: [secondCard, pickCard()], bet: bjData.playerHands[0].bet, status: 'active' }
      ];

      bjData.canSplit = false;
      bjData.canDouble = true;
      bjData.currentHand = 0;

      let message = `*🎰 SPLIT HANDS 🎰*

╭─ 🃏 HAND 1 (Current)
│ Cards: ${bjData.playerHands[0].cards.join(" ")}  
│ Total: ${calculateTotal(bjData.playerHands[0].cards)}
├─ 🃏 HAND 2 (Waiting)
│ Cards: ${bjData.playerHands[1].cards.join(" ")}
│ Total: ${calculateTotal(bjData.playerHands[1].cards)}
├─ 🤖 DEALER
│ Cards: ${bjData.dealerCards[0]} [?]
╰─ ⚙️ OPTIONS

- hit
- stand
- double`;

      await conn.reply(m.chat, message, m, {
        contextInfo: {
          externalAdReply: {
            title: "🎰 BLACKJACK CASINO",
            body: "Split Complete",
            thumbnailUrl: "https://telegra.ph/file/1703cff0a758d0ef8f84f.png",
            sourceUrl: "",
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      });
      return;
    }

    if (txt === "double") {
      let handIndex = bjData.currentHand;
      let hand = bjData.playerHands[handIndex];
      
      if (hand.status !== 'active') return;
      
      if (global.db.data.users[m.sender][bjData.type] < hand.bet) {
        return m.reply(`Insufficient ${bjData.type} for double down`);
      }

      global.db.data.users[m.sender][bjData.type] -= hand.bet;
      bjData.totalBet += hand.bet;
      hand.bet *= 2;
      
      hand.cards.push(pickCard());
      let total = calculateTotal(hand.cards);
      
      if (total > 21) {
        hand.status = 'bust';
      } else {
        hand.status = 'stand';
      }

      // Move to next hand or resolve
      if (bjData.playerHands.length > 1) {
        let nextHand = bjData.playerHands.find(h => h.status === 'active');
        if (nextHand) {
          bjData.currentHand = bjData.playerHands.indexOf(nextHand);
          let message = `*🎰 DOUBLE DOWN 🎰*

╭─ 🃏 HAND ${handIndex + 1} (Doubled)
│ Cards: ${hand.cards.join(" ")}
│ Total: ${total} ${total > 21 ? '(BUST)' : ''}
├─ 🃏 HAND ${bjData.currentHand + 1} (Current)
│ Cards: ${bjData.playerHands[bjData.currentHand].cards.join(" ")}
│ Total: ${calculateTotal(bjData.playerHands[bjData.currentHand].cards)}
╰─ ⚙️ OPTIONS

- hit
- stand
- double`;

          await conn.reply(m.chat, message, m, {
            contextInfo: {
              externalAdReply: {
                title: "🎰 BLACKJACK CASINO",
                body: "Doubled Down",
                thumbnailUrl: "https://telegra.ph/file/1703cff0a758d0ef8f84f.png",
                sourceUrl: "",
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          });
          return;
        }
      }
      
      await resolveGame();
      return;
    }

    if (txt === "hit") {
      let handIndex = bjData.currentHand;
      let hand = bjData.playerHands[handIndex];
      
      if (hand.status !== 'active') return;

      hand.cards.push(pickCard());
      let total = calculateTotal(hand.cards);
      bjData.canDouble = false;

      // FIXED: Handle 21 points correctly
      if (total > 21) {
        hand.status = 'bust';
      } else if (total === 21) {
        if (hand.cards.length === 2) {
          hand.status = 'blackjack';
        } else {
          hand.status = 'stand';
          // Auto-resolve if player gets 21
          if (bjData.playerHands.length === 1) {
            await resolveGame();
            return;
          }
        }
      }

      // Check if this was the last active hand
      if (bjData.playerHands.length > 1) {
        let nextHand = bjData.playerHands.find(h => h.status === 'active');
        if (nextHand) {
          bjData.currentHand = bjData.playerHands.indexOf(nextHand);
          
          let message = `*🎰 HIT CARD 🎰*

╭─ 🃏 HAND ${handIndex + 1}
│ Cards: ${hand.cards.join(" ")}
│ Total: ${total} ${total > 21 ? '(BUST)' : total === 21 ? '(21!)' : ''}
├─ 🃏 HAND ${bjData.currentHand + 1} (Current)
│ Cards: ${bjData.playerHands[bjData.currentHand].cards.join(" ")}
│ Total: ${calculateTotal(bjData.playerHands[bjData.currentHand].cards)}
╰─ ⚙️ OPTIONS

- hit
- stand
- double`;

          await conn.reply(m.chat, message, m, {
            contextInfo: {
              externalAdReply: {
                title: "🎰 BLACKJACK CASINO",
                body: "Card Dealt",
                thumbnailUrl: "https://telegra.ph/file/1703cff0a758d0ef8f84f.png",
                sourceUrl: "",
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          });
          return;
        }
      } else {
        if (total > 21) {
          let message = `*🎰 BUST! 🎰*

╭─ 🃏 YOUR HAND
│ Cards: ${hand.cards.join(" ")}
│ Total: ${total}
╰─ 💸 RESULT

*-${hand.bet} ${bjData.type}*`;

          await conn.reply(m.chat, message, m, {
            contextInfo: {
              externalAdReply: {
                title: "🎰 BLACKJACK CASINO",
                body: "Bust!",
                thumbnailUrl: "https://telegra.ph/file/1703cff0a758d0ef8f84f.png",
                sourceUrl: "",
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          });
          clearTimeout(bjData.timeout);
          delete conn.bj[m.sender];
          return;
        }

        // If total is 21, auto-resolve game
        if (total === 21) {
          await resolveGame();
          return;
        }

        let options = ["hit", "stand"];
        if (bjData.canDouble) options.push("double");

        let message = `*🎰 BLACKJACK CASINO 🎰*

╭─ 🃏 YOUR HAND
│ Cards: ${hand.cards.join(" ")}
│ Total: ${total}
├─ 🤖 DEALER HAND
│ Cards: ${bjData.dealerCards[0]} [?]
╰─ ⚙️ OPTIONS

${options.map(opt => `- ${opt}`).join("\n")}`;

        await conn.reply(m.chat, message, m, {
          contextInfo: {
            externalAdReply: {
              title: "🎰 BLACKJACK CASINO",
              body: "Card Dealt",
              thumbnailUrl: "https://telegra.ph/file/1703cff0a758d0ef8f84f.png",
              sourceUrl: "",
              mediaType: 1,
              renderLargerThumbnail: true,
            },
          },
        });
        return;
      }

      await resolveGame();
      return;
    }

    if (txt === "stand") {
      let handIndex = bjData.currentHand;
      let hand = bjData.playerHands[handIndex];
      
      if (hand.status !== 'active') return;
      
      hand.status = 'stand';

      // Check for next active hand
      if (bjData.playerHands.length > 1) {
        let nextHand = bjData.playerHands.find(h => h.status === 'active');
        if (nextHand) {
          bjData.currentHand = bjData.playerHands.indexOf(nextHand);
          
          let message = `*🎰 STAND 🎰*

╭─ 🃏 HAND ${handIndex + 1} (Standing)
│ Cards: ${hand.cards.join(" ")}
│ Total: ${calculateTotal(hand.cards)}
├─ 🃏 HAND ${bjData.currentHand + 1} (Current)
│ Cards: ${bjData.playerHands[bjData.currentHand].cards.join(" ")}
│ Total: ${calculateTotal(bjData.playerHands[bjData.currentHand].cards)}
╰─ ⚙️ OPTIONS

- hit
- stand
- double`;

          await conn.reply(m.chat, message, m, {
            contextInfo: {
              externalAdReply: {
                title: "🎰 BLACKJACK CASINO",
                body: "Standing",
                thumbnailUrl: "https://telegra.ph/file/1703cff0a758d0ef8f84f.png",
                sourceUrl: "",
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          });
          return;
        }
      }

      await resolveGame();
      return;
    }

  } catch (e) {
    console.error(e);
    conn.reply(m.chat, "❌ Game error occurred", m);
    clearTimeout(bjData.timeout);
    delete conn.bj[m.sender];
  }
};

handler.command = handler.help = ["blackjack", "bj"];
handler.tags = ["game"];
handler.register = true;
handler.limit = false;
handler.group = true;

export default handler;