const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { EcoUser } = require('../../models/schemas');

const C = {
  MAIN: 0x2b2d31,
  GREEN: 0x43b581,
  RED: 0xf04747,
  GOLD: 0xffac33,
  WELCOME: 7208536
};

// ============================================================
// WELCOME DM — Atomic DB check, race-condition safe, survives restarts
// ============================================================
async function checkAndSendWelcome(user, data) {
  if (data.welcomeSent) return;

  // Atomic: only succeeds if welcomeSent is still false in DB right now
  const result = await EcoUser.findOneAndUpdate(
    { userId: user.id, welcomeSent: false },
    { $set: { welcomeSent: true } },
    { new: false }
  );

  // null = another process already claimed it, bail out
  if (!result) return;

  const embed = new EmbedBuilder()
    .setTitle('👋 Welcome to the Economy System!')
    .setDescription(
      'Earn coins by being active in the server!\n\n' +
      '**Earning Methods:**\n\n' +
      '🎙️ **Voice Chat** — 120 coins/minute\n' +
      '💬 **Chatting** — 20 coins/message\n' +
      '👍 **Reactions** — 10 coins per reaction given\n' +
      '🔔 **Mentions** — 40 coins per mention received\n\n' +
      'Use `,help` to see all commands!'
    )
    .setColor(C.WELCOME)
    .setTimestamp();

  try {
    await user.send({ embeds: [embed] });
  } catch {
    // DM disabled — flag already saved so we won't retry
  }
}

async function getEcoUser(id) {
  let u = await EcoUser.findOne({ userId: id });
  if (!u) u = await EcoUser.create({ userId: id });
  return u;
}

// ============================================================
// SILENT WEALTH CONTROL — invisible economy balancing
// Nobody sees this. No messages. No logs. Just happens.
// ============================================================

// Tax thresholds — silently skims from bank each time they use economy
// Triggers at most once every 20 hours per user to feel natural
async function silentWealthTax(data) {
  const total = (data.wallet || 0) + (data.bank || 0);
  if (total < 2_000_000) return; // only affects top earners

  const now = Date.now();
  const lastTax = data._lastTax || 0;
  if (now - lastTax < 20 * 60 * 60 * 1000) return; // max once per 20hrs

  // Tax rate scales with wealth — feels like normal variance
  let taxRate = 0;
  if (total >= 10_000_000_000) taxRate = 0.025; // 2.5% — billionaires
  else if (total >= 1_000_000_000) taxRate = 0.018; // 1.8%
  else if (total >= 100_000_000)  taxRate = 0.012; // 1.2%
  else if (total >= 10_000_000)   taxRate = 0.007; // 0.7%
  else if (total >= 2_000_000)    taxRate = 0.003; // 0.3%

  // Take from bank silently — wallet stays so they don't immediately notice
  const taxAmount = Math.floor(data.bank * taxRate);
  if (taxAmount <= 0) return;

  data.bank = Math.max(0, data.bank - taxAmount);
  data._lastTax = now;
}

// Returns a penalty multiplier for gambling — richer = slightly worse odds
// Scaled so it feels like normal luck variance, not a punishment
function wealthOddsPenalty(data) {
  const total = (data.wallet || 0) + (data.bank || 0);
  if (total < 500_000)       return 1.00; // normal
  if (total < 5_000_000)     return 0.97; // -3% win chance
  if (total < 50_000_000)    return 0.93; // -7%
  if (total < 500_000_000)   return 0.88; // -12%
  if (total < 5_000_000_000) return 0.82; // -18%
  return 0.75;                            // -25% — billionaires
}

// Bet cap scales inversely with wealth so whales can't multiply billions
function maxBetAllowed(data) {
  const total = (data.wallet || 0) + (data.bank || 0);
  if (total >= 1_000_000_000) return 100_000;   // 100k cap
  if (total >= 100_000_000)   return 500_000;   // 500k cap
  if (total >= 10_000_000)    return 2_000_000; // 2M cap
  if (total >= 1_000_000)     return 5_000_000; // 5M cap
  return Infinity;                              // no cap for normal users
}

// ============================================================
// PASSIVE INCOME — wired into messageCreate in messageCreate.js
// ============================================================
async function handleIncomeEvents(message) {
  if (!message || !message.guild || message.author.bot) return;

  await EcoUser.findOneAndUpdate(
    { userId: message.author.id },
    { $inc: { wallet: 20 } },
    { upsert: true }
  );

  // for...of so each await actually waits
  for (const [, target] of message.mentions.users) {
    if (!target.bot && target.id !== message.author.id) {
      await EcoUser.findOneAndUpdate(
        { userId: target.id },
        { $inc: { wallet: 40 } },
        { upsert: true }
      );
    }
  }
}

// ============================================================
// REACTION INCOME — wired into messageReactionAdd in its event file
// ============================================================
async function handleReactionIncome(reaction, user) {
  if (user.bot) return;

  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }
  if (reaction.message.partial) {
    try { await reaction.message.fetch(); } catch { return; }
  }

  await EcoUser.findOneAndUpdate({ userId: user.id }, { $inc: { wallet: 10 } }, { upsert: true });

  if (reaction.message.author && !reaction.message.author.bot && reaction.message.author.id !== user.id) {
    await EcoUser.findOneAndUpdate(
      { userId: reaction.message.author.id },
      { $inc: { wallet: 5 } },
      { upsert: true }
    );
  }
}

// ============================================================
// VOICE INCOME — called from ready.js
// ============================================================
function startVoiceIncome(client) {
  setInterval(async () => {
    for (const [, guild] of client.guilds.cache) {
      try { await guild.members.fetch(); } catch { continue; }

      for (const [, member] of guild.members.cache) {
        if (
          member.voice.channel &&
          !member.voice.selfMute &&
          !member.voice.selfDeaf &&
          !member.voice.serverMute &&
          !member.user.bot
        ) {
          await EcoUser.findOneAndUpdate(
            { userId: member.id },
            { $inc: { wallet: 120 } },
            { upsert: true }
          ).catch(() => {});
        }
      }
    }
  }, 60 * 1000);
}

// ============================================================
// ALL ECONOMY COMMANDS
// ============================================================
const ECO_CMDS = new Set([
  'help','economy','ecohelp',
  'work','daily',
  'bal','balance',
  'dep','deposit','with','withdraw',
  'give','rob',
  'gamble','mines','plinko','bj','blackjack',
  'fame'
]);

async function handleEconomyCommands(message, args, cmd) {
  if (!ECO_CMDS.has(cmd)) return false; // not our command

  const user = message.author;
  const avatar = user.displayAvatarURL();
  const data = await getEcoUser(user.id);

  // Silent wealth control — runs invisibly on every economy command
  await silentWealthTax(data);

  await checkAndSendWelcome(user, data);

  // ----------------------------------------------------------
  // HELP
  // ----------------------------------------------------------
  if (cmd === 'help' || cmd === 'economy' || cmd === 'ecohelp') {
    const mainEmbed = new EmbedBuilder()
      .setAuthor({ name: 'Economy Dashboard', iconURL: avatar })
      .setDescription(`Welcome **${user.username}**.\nUse the buttons below to explore modules.`)
      .setThumbnail(avatar)
      .addFields(
        { name: '🎮 Player Zone',    value: '> `work`, `daily`, `fame`',             inline: false },
        { name: '🎰 Casino Floor',   value: '> `gamble`, `mines`, `bj`, `plinko`',   inline: false },
        { name: '💰 Bank & Economy', value: '> `bal`, `dep`, `with`, `rob`, `give`', inline: false }
      )
      .setColor(C.MAIN)
      .setFooter({ text: 'Select a module below' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('eco_main').setLabel('Home').setStyle(ButtonStyle.Secondary).setEmoji('🏠'),
      new ButtonBuilder().setCustomId('eco_player').setLabel('Player').setStyle(ButtonStyle.Secondary).setEmoji('🎮'),
      new ButtonBuilder().setCustomId('eco_casino').setLabel('Casino').setStyle(ButtonStyle.Secondary).setEmoji('🎰'),
      new ButtonBuilder().setCustomId('eco_bank').setLabel('Economy').setStyle(ButtonStyle.Secondary).setEmoji('💰')
    );

    const msg = await message.reply({ embeds: [mainEmbed], components: [row] });
    const col = msg.createMessageComponentCollector({ filter: i => i.user.id === user.id, time: 60000 });

    col.on('collect', async i => {
      let e = new EmbedBuilder().setColor(C.MAIN).setAuthor({ name: 'Dashboard', iconURL: avatar });
      if (i.customId === 'eco_player') {
        e.setTitle('🎮 Player Commands').setDescription('`,work` — Earn salary (1h cooldown)\n`,daily` — Claim 500 free coins\n`,fame @user` — View & vote on aura');
      } else if (i.customId === 'eco_casino') {
        e.setTitle('🎰 Casino Commands').setDescription('`,gamble <amt>` — 50/50 dice roll\n`,mines <amt>` — 60% safe, 1.5x reward\n`,bj <amt>` — Blackjack\n`,plinko <amt>` — Ball drop multiplier');
      } else if (i.customId === 'eco_bank') {
        e.setTitle('💰 Economy Commands').setDescription('`,bal` — Check balance\n`,dep <amt|all>` — Deposit to bank\n`,with <amt|all>` — Withdraw from bank\n`,rob @user` — Steal (40% chance)\n`,give @user <amt>` — Send coins');
      } else {
        e = mainEmbed;
      }
      await i.update({ embeds: [e], components: [row] });
    });

    col.on('end', () => {
      const disabled = new ActionRowBuilder().addComponents(
        row.components.map(b => ButtonBuilder.from(b).setDisabled(true))
      );
      msg.edit({ components: [disabled] }).catch(() => {});
    });
    return true;
  }

  // ----------------------------------------------------------
  // WORK
  // ----------------------------------------------------------
  if (cmd === 'work') {
    const now = Date.now();
    const cooldown = 3600000;
    if (now - data.lastWork < cooldown) {
      const min = Math.ceil((data.lastWork + cooldown - now) / 60000);
      return message.reply({ embeds: [new EmbedBuilder().setColor(C.RED).setDescription(`⏳ You're tired! Work again in **${min} minute(s)**.`)] });
    }
    const jobs = ['Coder', 'Burger Flipper', 'Server Mod', 'Taxi Driver', 'Chef', 'Streamer', 'Trader'];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earn = Math.floor(Math.random() * 150) + 50;
    data.wallet += earn;
    data.lastWork = now;
    await data.save();
    return message.reply({ embeds: [new EmbedBuilder().setColor(C.GREEN).setDescription(`🔨 Worked as **${job}** and earned **${earn}** coins.`)] });
  }

  // ----------------------------------------------------------
  // DAILY
  // ----------------------------------------------------------
  if (cmd === 'daily') {
    const now = Date.now();
    const cooldown = 86400000;
    if (now - data.lastDaily < cooldown) {
      const hrs = Math.ceil((data.lastDaily + cooldown - now) / 3600000);
      return message.reply({ embeds: [new EmbedBuilder().setColor(C.RED).setDescription(`⏳ Come back in **${hrs} hour(s)**.`)] });
    }
    data.wallet += 500;
    data.lastDaily = now;
    await data.save();
    return message.reply({ embeds: [new EmbedBuilder().setColor(C.GREEN).setDescription('✅ Claimed **500** daily coins!')] });
  }

  // ----------------------------------------------------------
  // BALANCE
  // ----------------------------------------------------------
  if (cmd === 'bal' || cmd === 'balance') {
    const target = message.mentions.users.first() || user;
    const tData = await getEcoUser(target.id);
    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(C.MAIN)
        .setAuthor({ name: `${target.username}'s Balance`, iconURL: target.displayAvatarURL() })
        .setDescription(
          `👛 **Wallet:** ${tData.wallet.toLocaleString()} coins\n` +
          `🏦 **Bank:** ${tData.bank.toLocaleString()} coins\n` +
          `📈 **Total:** ${(tData.wallet + tData.bank).toLocaleString()} coins`
        )]
    });
  }

  // ----------------------------------------------------------
  // DEPOSIT
  // ----------------------------------------------------------
  if (cmd === 'dep' || cmd === 'deposit') {
    const amount = args[0] === 'all' ? data.wallet : parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,dep <amount|all>`');
    if (amount > data.wallet) return message.reply("❌ You don't have that many coins in your wallet.");
    data.wallet -= amount;
    data.bank += amount;
    await data.save();
    return message.reply({ embeds: [new EmbedBuilder().setColor(C.GREEN).setDescription(`✅ Deposited **${amount.toLocaleString()}** coins into your bank.`)] });
  }

  // ----------------------------------------------------------
  // WITHDRAW
  // ----------------------------------------------------------
  if (cmd === 'with' || cmd === 'withdraw') {
    const amount = args[0] === 'all' ? data.bank : parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,with <amount|all>`');
    if (amount > data.bank) return message.reply("❌ You don't have that many coins in your bank.");
    data.bank -= amount;
    data.wallet += amount;
    await data.save();
    return message.reply({ embeds: [new EmbedBuilder().setColor(C.GREEN).setDescription(`✅ Withdrew **${amount.toLocaleString()}** coins to your wallet.`)] });
  }

  // ----------------------------------------------------------
  // GIVE
  // ----------------------------------------------------------
  if (cmd === 'give') {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]); // args[0] = raw mention, args[1] = number
    if (!target) return message.reply('❌ Usage: `,give @user <amount>`');
    if (target.id === user.id) return message.reply("❌ You can't give coins to yourself.");
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,give @user <amount>`');
    if (data.wallet < amount) return message.reply("❌ Not enough coins in your wallet.");
    const tData = await getEcoUser(target.id);
    data.wallet -= amount;
    tData.wallet += amount;
    await data.save();
    await tData.save();
    return message.reply({ embeds: [new EmbedBuilder().setColor(C.GREEN).setDescription(`🎁 Sent **${amount.toLocaleString()}** coins to **${target.username}**.`)] });
  }

  // ----------------------------------------------------------
  // ROB
  // ----------------------------------------------------------
  if (cmd === 'rob') {
    const target = message.mentions.users.first();
    if (!target || target.id === user.id) return message.reply('❌ Mention a valid user to rob.');
    if (target.bot) return message.reply("❌ You can't rob a bot.");
    const tData = await getEcoUser(target.id);
    if (tData.wallet < 50) return message.reply("❌ They're too poor to rob (under 50 coins).");

    if (Math.random() < 0.4) {
      const stolen = Math.max(1, Math.floor(Math.random() * (tData.wallet / 2)));
      tData.wallet -= stolen;
      data.wallet += stolen;
      await tData.save();
      await data.save();
      return message.reply({ embeds: [new EmbedBuilder().setColor(C.GREEN).setDescription(`😈 You robbed **${stolen}** coins from **${target.username}**!`)] });
    } else {
      const fine = Math.min(200, data.wallet);
      data.wallet = Math.max(0, data.wallet - 200);
      await data.save();
      return message.reply({ embeds: [new EmbedBuilder().setColor(C.RED).setDescription(`👮 Caught! You paid a **${fine}** coin fine.`)] });
    }
  }

  // ----------------------------------------------------------
  // GAMBLE
  // ----------------------------------------------------------
  if (cmd === 'gamble') {
    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,gamble <amount>`');
    if (amount > data.wallet) return message.reply("❌ Not enough coins in your wallet.");

    // Silent bet cap

    const roll = Math.floor(Math.random() * 100) + 1;
    if (roll > 50) {
      data.wallet += amount;
      await data.save();
      return message.reply({ embeds: [new EmbedBuilder().setColor(C.GREEN).setDescription(`🎰 **WIN!** (Roll: ${roll})\nYou won **${amount}** coins!`)] });
    } else {
      data.wallet -= amount;
      await data.save();
      return message.reply({ embeds: [new EmbedBuilder().setColor(C.RED).setDescription(`🎰 **LOSE** (Roll: ${roll})\nYou lost **${amount}** coins.`)] });
    }
  }

  // ----------------------------------------------------------
  // MINES
  // ----------------------------------------------------------
  if (cmd === 'mines') {
    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,mines <amount>`');
    if (amount > data.wallet) return message.reply("❌ Not enough coins in your wallet.");


    if (Math.random() < 0.70) {
      const profit = Math.floor(amount * 0.20);
      data.wallet += profit;
      await data.save();
      return message.reply(`💎 Safe! +**${profit.toLocaleString()}** coins earned.`);
    } else {
      data.wallet -= amount;
      await data.save();
      return message.reply(`💥 BOOM! Lost **${amount.toLocaleString()}** coins.`);
    }
  }

  // ----------------------------------------------------------
  // PLINKO
  // ----------------------------------------------------------
  if (cmd === 'plinko') {
    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,plinko <amount>`');
    if (amount > data.wallet) return message.reply("❌ Not enough coins in your wallet.");


    // Weighted: 0x(20%) 0.5x(30%) 1x(25%) 1.5x(15%) 2x(10%)
    const roll = Math.random();
    let multi;
    if      (roll < 0.20) multi = 0;
    else if (roll < 0.50) multi = 0.5;
    else if (roll < 0.75) multi = 1.0;
    else if (roll < 0.90) multi = 1.5;
    else                  multi = 2.0;

    const win  = Math.floor(amount * multi);
    const diff = win - amount;
    data.wallet = data.wallet - amount + win;
    await data.save();

    const sign  = diff >= 0 ? '+' : '';
    const color = multi === 0 ? C.RED : multi >= 1 ? C.GREEN : 0xFEE75C;
    const label = multi === 0 ? '💀 0x — Lost everything' : `🎯 ${multi}x Multiplier`;
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(color)
      .setDescription(`${label}\n${sign}**${Math.abs(diff).toLocaleString()}** coins — Wallet: **${data.wallet.toLocaleString()}**`)
    ]});
  }

  // ----------------------------------------------------------
  // BLACKJACK — react ✅ to Hit, 🛑 to Stand
  // ----------------------------------------------------------
  if (cmd === 'bj' || cmd === 'blackjack') {
    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,bj <amount>`');
    if (amount > data.wallet) return message.reply("❌ Not enough coins in your wallet.");

    const dealCard = () => {
      const names = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
      const n = names[Math.floor(Math.random() * 13)];
      const v = n === 'A' ? 11 : ['J','Q','K'].includes(n) ? 10 : parseInt(n);
      return { name: n, value: v };
    };
    const handVal = (hand) => {
      let total = hand.reduce((s, c) => s + c.value, 0);
      let aces  = hand.filter(c => c.name === 'A').length;
      while (total > 21 && aces-- > 0) total -= 10;
      return total;
    };
    const showHand = (hand) => hand.map(c => '`' + c.name + '`').join(' ');

    let playerHand = [dealCard(), dealCard()];
    let dealerHand = [dealCard(), dealCard()];

    const buildEmbed = (done = false, resultText = null) => {
      const pVal  = handVal(playerHand);
      const dVal  = handVal(dealerHand);
      const color = !done ? C.BLUE : resultText.includes('+') ? C.GREEN : resultText.includes('Tie') ? C.GOLD : C.RED;
      const dealerShow = done ? showHand(dealerHand) : ('`' + dealerHand[0].name + '` `?`');
      return new EmbedBuilder()
        .setColor(color)
        .setDescription(`🃏 **Blackjack**\n\n**Your hand** (${pVal}): ${showHand(playerHand)}\n**Dealer** (${done ? dVal : '?'}): ${dealerShow}\n\n` + (resultText ? `**${resultText}**` : 'React ✅ to **Hit** or 🛑 to **Stand**'))
        .setFooter({ text: `Bet: ${amount.toLocaleString()} coins` });
    };

    if (handVal(playerHand) === 21) {
      data.wallet += amount;
      await data.save();
      return message.reply({ embeds: [buildEmbed(true, `Blackjack! +${amount.toLocaleString()} coins`)] });
    }

    const msg = await message.reply({ embeds: [buildEmbed()] });
    await msg.react('✅');
    await msg.react('🛑');

    let done = false;
    const filter = (reaction, u) => ['✅','🛑'].includes(reaction.emoji.name) && u.id === user.id;
    const collector = msg.createReactionCollector({ filter, time: 30_000 });

    collector.on('collect', async (reaction) => {
      if (done) return;
      reaction.users.remove(user.id).catch(() => {});

      if (reaction.emoji.name === '✅') {
        playerHand.push(dealCard());
        if (handVal(playerHand) > 21) {
          done = true;
          collector.stop();
          data.wallet -= amount;
          await data.save();
          await msg.edit({ embeds: [buildEmbed(true, `Bust! -${amount.toLocaleString()} coins`)] });
          await msg.reactions.removeAll().catch(() => {});
          return;
        }
        await msg.edit({ embeds: [buildEmbed()] });
      }

      if (reaction.emoji.name === '🛑') {
        done = true;
        collector.stop('stand');
      }
    });

    collector.on('end', async (_, reason) => {
      if (done && reason !== 'stand') return;
      done = true;
      while (handVal(dealerHand) < 17) dealerHand.push(dealCard());
      const pVal = handVal(playerHand);
      const dVal = handVal(dealerHand);
      let resultText;
      if (dVal > 21 || pVal > dVal) {
        data.wallet += amount;
        resultText = `You win! +${amount.toLocaleString()} coins`;
      } else if (pVal === dVal) {
        resultText = 'Tie! Bet returned.';
      } else {
        data.wallet -= amount;
        resultText = `Dealer wins. -${amount.toLocaleString()} coins`;
      }
      await data.save();
      await msg.edit({ embeds: [buildEmbed(true, resultText)] });
      await msg.reactions.removeAll().catch(() => {});
    });
    return true;
  }

  // ----------------------------------------------------------
  // FAME / AURA
  // ----------------------------------------------------------
  if (cmd === 'fame') {
    const target = message.mentions.users.first() || user;
    const tData = await getEcoUser(target.id);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${target.username}'s Aura`, iconURL: target.displayAvatarURL() })
      .setDescription(`❄️ **Aura Points:** ${tData.aura}`)
      .setColor(C.MAIN);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bst_${target.id}`).setLabel('⬆ Boost').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`neg_${target.id}`).setLabel('⬇ Neg').setStyle(ButtonStyle.Danger)
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const col = msg.createMessageComponentCollector({ filter: i => !i.user.bot, time: 30000 });

    col.on('collect', async i => {
      if (i.user.id === target.id) {
        return i.reply({ content: "❌ You can't vote on yourself.", flags: MessageFlags.Ephemeral });
      }
      const tUser = await getEcoUser(target.id);
      if (i.customId.startsWith('bst')) {
        tUser.aura += 1;
        await i.reply({ content: `✅ Boosted **${target.username}**'s aura!`, flags: MessageFlags.Ephemeral });
      } else {
        tUser.aura -= 1;
        await i.reply({ content: `📉 Negged **${target.username}**'s aura.`, flags: MessageFlags.Ephemeral });
      }
      await tUser.save();
      embed.setDescription(`❄️ **Aura Points:** ${tUser.aura}`);
      await msg.edit({ embeds: [embed] }).catch(() => {});
    });

    col.on('end', () => {
      const disabled = new ActionRowBuilder().addComponents(
        row.components.map(b => ButtonBuilder.from(b).setDisabled(true))
      );
      msg.edit({ components: [disabled] }).catch(() => {});
    });
    return true;
  }

  return true;
}

module.exports = {
  name: 'eco_module',
  execute: () => {},        // placeholder so the loader does not warn
  handleEconomyCommands,
  _handle: handleEconomyCommands,  // alias used by alias files (give.js, bal.js etc)
  startVoiceIncome,
  handleIncomeEvents,
  handleReactionIncome
};