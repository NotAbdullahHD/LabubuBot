const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { EcoUser } = require('../../models/schemas');

const C = {
  MAIN:    0xFFB6C1,
  GREEN:   0x57F287,
  RED:     0xED4245,
  GOLD:    0xFEE75C,
  BLUE:    0x5865F2,
  WELCOME: 0xFFB6C1
};

const CURRENCY = 'coins';

async function checkAndSendWelcome(user, data) {
  if (data.welcomeSent) return;
  const result = await EcoUser.findOneAndUpdate(
    { userId: user.id, welcomeSent: false },
    { $set: { welcomeSent: true } },
    { new: false }
  );
  if (!result) return;
  const embed = new EmbedBuilder()
    .setTitle('Welcome to the Economy!')
    .setDescription(
      'Earn coins by being active!\n\n' +
      '💬 **Chatting** — 5 coins/message\n' +
      '🎙️ **Voice Chat** — 50 coins/minute\n' +
      '👍 **Reactions** — 3 coins per reaction\n' +
      '🔔 **Mentions** — 15 coins per mention\n\n' +
      'Use `,ecohelp` to see all commands!'
    )
    .setColor(C.WELCOME)
    .setTimestamp();
  try { await user.send({ embeds: [embed] }); } catch {}
}

async function getEcoUser(id) {
  let u = await EcoUser.findOne({ userId: id });
  if (!u) u = await EcoUser.create({ userId: id });
  return u;
}

// ── SILENT WEALTH TAX ────────────────────────────────────────
async function silentWealthTax(data) {
  const total = (data.wallet || 0) + (data.bank || 0);
  if (total < 2_000_000) return;
  const now = Date.now();
  const lastTax = data._lastTax || 0;
  if (now - lastTax < 20 * 60 * 60 * 1000) return;
  let taxRate = 0;
  if (total >= 10_000_000_000) taxRate = 0.025;
  else if (total >= 1_000_000_000) taxRate = 0.018;
  else if (total >= 100_000_000)   taxRate = 0.012;
  else if (total >= 10_000_000)    taxRate = 0.007;
  else if (total >= 2_000_000)     taxRate = 0.003;
  const taxAmount = Math.floor(data.bank * taxRate);
  if (taxAmount <= 0) return;
  data.bank = Math.max(0, data.bank - taxAmount);
  data._lastTax = now;
}

// ── PASSIVE INCOME ───────────────────────────────────────────
async function handleIncomeEvents(message) {
  if (!message || !message.guild || message.author.bot) return;
  await EcoUser.findOneAndUpdate({ userId: message.author.id }, { $inc: { wallet: 5 } }, { upsert: true });
  for (const [, target] of message.mentions.users) {
    if (!target.bot && target.id !== message.author.id) {
      await EcoUser.findOneAndUpdate({ userId: target.id }, { $inc: { wallet: 15 } }, { upsert: true });
    }
  }
}

async function handleReactionIncome(reaction, user) {
  if (user.bot) return;
  if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
  if (reaction.message.partial) { try { await reaction.message.fetch(); } catch { return; } }
  await EcoUser.findOneAndUpdate({ userId: user.id }, { $inc: { wallet: 3 } }, { upsert: true });
  if (reaction.message.author && !reaction.message.author.bot && reaction.message.author.id !== user.id) {
    await EcoUser.findOneAndUpdate({ userId: reaction.message.author.id }, { $inc: { wallet: 2 } }, { upsert: true });
  }
}

function startVoiceIncome(client) {
  setInterval(async () => {
    for (const [, guild] of client.guilds.cache) {
      try { await guild.members.fetch(); } catch { continue; }
      for (const [, member] of guild.members.cache) {
        if (member.voice.channel && !member.voice.selfMute && !member.voice.selfDeaf && !member.voice.serverMute && !member.user.bot) {
          await EcoUser.findOneAndUpdate({ userId: member.id }, { $inc: { wallet: 50 } }, { upsert: true }).catch(() => {});
        }
      }
    }
  }, 60 * 1000);
}

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
  if (!ECO_CMDS.has(cmd)) return false;

  const user   = message.author;
  const avatar = user.displayAvatarURL();
  const data   = await getEcoUser(user.id);

  await silentWealthTax(data);
  await checkAndSendWelcome(user, data);

  // ── HELP ─────────────────────────────────────────────────
  if (cmd === 'help' || cmd === 'economy' || cmd === 'ecohelp') {
    const mainEmbed = new EmbedBuilder()
      .setAuthor({ name: 'Economy', iconURL: avatar })
      .setColor(C.MAIN)
      .addFields(
        { name: '🎮 Player',  value: '`work` `daily` `fame`',              inline: false },
        { name: '🎰 Casino',  value: '`gamble` `mines` `bj` `plinko`',     inline: false },
        { name: '💰 Wallet',  value: '`bal` `dep` `with` `rob` `give`',    inline: false }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('eco_main').setLabel('Home').setStyle(ButtonStyle.Secondary).setEmoji('🏠'),
      new ButtonBuilder().setCustomId('eco_player').setLabel('Player').setStyle(ButtonStyle.Secondary).setEmoji('🎮'),
      new ButtonBuilder().setCustomId('eco_casino').setLabel('Casino').setStyle(ButtonStyle.Secondary).setEmoji('🎰'),
      new ButtonBuilder().setCustomId('eco_bank').setLabel('Wallet').setStyle(ButtonStyle.Secondary).setEmoji('💰')
    );

    const msg = await message.reply({ embeds: [mainEmbed], components: [row] });
    const col = msg.createMessageComponentCollector({ filter: i => i.user.id === user.id, time: 60000 });

    col.on('collect', async i => {
      let e = new EmbedBuilder().setColor(C.MAIN).setAuthor({ name: 'Economy', iconURL: avatar });
      if (i.customId === 'eco_player') {
        e.setDescription('`,work` — Earn coins (1h cooldown)\n`,daily` — Claim 250 free coins\n`,fame @user` — View & vote aura\n`,pet` — View your pet');
      } else if (i.customId === 'eco_casino') {
        e.setDescription('`,gamble <amt>` — 50/50\n`,mines <amt>` — 60% safe, 1.5x\n`,bj <amt>` — Blackjack (interactive)\n`,plinko <amt>` — Ball drop (max 2x)');
      } else if (i.customId === 'eco_bank') {
        e.setDescription('`,bal` — Balance\n`,dep <amt|all>` — Deposit\n`,with <amt|all>` — Withdraw\n`,rob @user` — Rob (40% chance)\n`,give @user <amt>` — Send coins');
      } else { e = mainEmbed; }
      await i.update({ embeds: [e], components: [row] });
    });

    col.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    return true;
  }

  // ── WORK ─────────────────────────────────────────────────
  if (cmd === 'work') {
    const now = Date.now();
    const cooldown = 3600000;
    if (now - data.lastWork < cooldown) {
      const min = Math.ceil((data.lastWork + cooldown - now) / 60000);
      return message.reply(`⏳ You're tired! Work again in **${min} minute(s)**.`);
    }

    const jobs = [
      { title: 'Coder',        emoji: '💻' },
      { title: 'Burger Flipper', emoji: '🍔' },
      { title: 'Server Mod',   emoji: '🛡️' },
      { title: 'Taxi Driver',  emoji: '🚕' },
      { title: 'Chef',         emoji: '👨‍🍳' },
      { title: 'Streamer',     emoji: '🎥' },
      { title: 'Trader',       emoji: '📈' },
      { title: 'DJ',           emoji: '🎧' },
      { title: 'Artist',       emoji: '🎨' },
    ];

    const job  = jobs[Math.floor(Math.random() * jobs.length)];
    let earn   = Math.floor(Math.random() * 50) + 30;

    // Cat pet bonus
    const { Pet } = require('../../models/schemas');
    const pet = await Pet.findOne({ userId: user.id }).catch(() => null);
    if (pet?.type === 'cat') {
      const bonus = Math.floor(earn * 0.3);
      earn += bonus;
    }

    data.wallet += earn;
    data.lastWork = now;
    await data.save();
    return message.reply(`${job.emoji} Worked as **${job.title}** and earned **${earn}** ${CURRENCY}.`);
  }

  // ── DAILY ────────────────────────────────────────────────
  if (cmd === 'daily') {
    const now = Date.now();
    let cooldown = 86400000;

    // Bunny pet reduces cooldown by 4hrs
    const { Pet } = require('../../models/schemas');
    const pet = await Pet.findOne({ userId: user.id }).catch(() => null);
    if (pet?.type === 'bunny') cooldown -= 4 * 3600000;

    if (now - data.lastDaily < cooldown) {
      const hrs = Math.ceil((data.lastDaily + cooldown - now) / 3600000);
      return message.reply(`⏳ Come back in **${hrs} hour(s)** for your daily.`);
    }

    data.wallet += 250;
    data.lastDaily = now;
    await data.save();
    return message.reply(`🎁 Claimed your daily **250** ${CURRENCY}! Wallet: **${data.wallet.toLocaleString()}**`);
  }

  // ── BALANCE ──────────────────────────────────────────────
  if (cmd === 'bal' || cmd === 'balance') {
    const target = message.mentions.users.first() || user;
    const tData  = await getEcoUser(target.id);
    const total  = tData.wallet + tData.bank;
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(C.MAIN)
      .setAuthor({ name: `${target.username}'s Balance`, iconURL: target.displayAvatarURL() })
      .addFields(
        { name: '👛 Wallet', value: `**${tData.wallet.toLocaleString()}** ${CURRENCY}`, inline: true },
        { name: '🏦 Bank',   value: `**${tData.bank.toLocaleString()}** ${CURRENCY}`,   inline: true },
        { name: '📈 Total',  value: `**${total.toLocaleString()}** ${CURRENCY}`,        inline: true }
      )
    ]});
  }

  // ── DEPOSIT ──────────────────────────────────────────────
  if (cmd === 'dep' || cmd === 'deposit') {
    const amount = args[0] === 'all' ? data.wallet : parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,dep <amount|all>`');
    if (amount > data.wallet) return message.reply("❌ Not enough coins in your wallet.");
    data.wallet -= amount;
    data.bank   += amount;
    await data.save();
    return message.reply(`✅ Deposited **${amount.toLocaleString()}** ${CURRENCY}. Bank: **${data.bank.toLocaleString()}**`);
  }

  // ── WITHDRAW ─────────────────────────────────────────────
  if (cmd === 'with' || cmd === 'withdraw') {
    const amount = args[0] === 'all' ? data.bank : parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,with <amount|all>`');
    if (amount > data.bank) return message.reply("❌ Not enough coins in your bank.");
    data.bank   -= amount;
    data.wallet += amount;
    await data.save();
    return message.reply(`✅ Withdrew **${amount.toLocaleString()}** ${CURRENCY}. Wallet: **${data.wallet.toLocaleString()}**`);
  }

  // ── GIVE ─────────────────────────────────────────────────
  if (cmd === 'give') {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    if (!target)                         return message.reply('❌ Usage: `,give @user <amount>`');
    if (target.id === user.id)           return message.reply("❌ You can't give coins to yourself.");
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,give @user <amount>`');
    if (data.wallet < amount)            return message.reply("❌ Not enough coins in your wallet.");
    const tData = await getEcoUser(target.id);
    data.wallet  -= amount;
    tData.wallet += amount;
    await data.save();
    await tData.save();
    return message.reply(`💸 Sent **${amount.toLocaleString()}** ${CURRENCY} to **${target.username}**.`);
  }

  // ── ROB ──────────────────────────────────────────────────
  if (cmd === 'rob') {
    const target = message.mentions.users.first();
    if (!target || target.id === user.id) return message.reply('❌ Mention a valid user to rob.');
    if (target.bot)                       return message.reply("❌ You can't rob a bot.");
    const tData = await getEcoUser(target.id);
    if (tData.wallet < 50)                return message.reply("❌ They're too poor to rob.");

    // Dog pet protects from rob
    const { Pet } = require('../../models/schemas');
    const targetPet = await Pet.findOne({ userId: target.id }).catch(() => null);
    if (targetPet?.type === 'dog') {
      const fine = Math.min(200, data.wallet);
      data.wallet = Math.max(0, data.wallet - fine);
      await data.save();
      return message.reply(`🐶 **${target.username}**'s dog stopped you! You paid a **${fine}** coin fine.`);
    }

    if (Math.random() < 0.4) {
      const stolen = Math.max(1, Math.floor(Math.random() * (tData.wallet / 2)));
      tData.wallet -= stolen;
      data.wallet  += stolen;
      await tData.save();
      await data.save();
      return message.reply(`😈 Robbed **${stolen.toLocaleString()}** ${CURRENCY} from **${target.username}**!`);
    } else {
      const fine = Math.min(200, data.wallet);
      data.wallet = Math.max(0, data.wallet - 200);
      await data.save();
      return message.reply(`👮 Caught! Paid a **${fine.toLocaleString()}** coin fine.`);
    }
  }

  // ── GAMBLE ───────────────────────────────────────────────
  if (cmd === 'gamble') {
    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,gamble <amount>`');
    if (amount > data.wallet)                    return message.reply("❌ Not enough coins in your wallet.");
    const roll = Math.floor(Math.random() * 100) + 1;
    if (roll > 50) {
      data.wallet += amount;
      await data.save();
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(C.GREEN)
        .setAuthor({ name: `${user.username} gambled`, iconURL: avatar })
        .setDescription('🎰 **You won!**')
        .addFields(
          { name: '🎲 Roll',   value: `**${roll}**/100`,                       inline: true },
          { name: '💰 Won',    value: `**${amount.toLocaleString()}** ${CURRENCY}`, inline: true },
          { name: '👛 Wallet', value: `**${data.wallet.toLocaleString()}**`,   inline: true }
        )
      ]});
    } else {
      data.wallet -= amount;
      await data.save();
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(C.RED)
        .setAuthor({ name: `${user.username} gambled`, iconURL: avatar })
        .setDescription('🎰 **You lost!**')
        .addFields(
          { name: '🎲 Roll',   value: `**${roll}**/100`,                       inline: true },
          { name: '💸 Lost',   value: `**${amount.toLocaleString()}** ${CURRENCY}`, inline: true },
          { name: '👛 Wallet', value: `**${data.wallet.toLocaleString()}**`,   inline: true }
        )
      ]});
    }
  }

  // ── MINES ────────────────────────────────────────────────
  if (cmd === 'mines') {
    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,mines <amount>`');
    if (amount > data.wallet)                    return message.reply("❌ Not enough coins in your wallet.");
    if (Math.random() > 0.4) {
      const profit = Math.floor(amount * 0.5);
      data.wallet += profit;
      await data.save();
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(C.GREEN)
        .setAuthor({ name: `${user.username} played mines`, iconURL: avatar })
        .setDescription('💎 **Safe! No mines found!**')
        .addFields(
          { name: '💰 Profit',  value: `**+${profit.toLocaleString()}** ${CURRENCY}`, inline: true },
          { name: '👛 Wallet',  value: `**${data.wallet.toLocaleString()}**`,          inline: true }
        )
      ]});
    } else {
      data.wallet -= amount;
      await data.save();
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(C.RED)
        .setAuthor({ name: `${user.username} played mines`, iconURL: avatar })
        .setDescription('💥 **BOOM! You hit a mine!**')
        .addFields(
          { name: '💸 Lost',   value: `**${amount.toLocaleString()}** ${CURRENCY}`, inline: true },
          { name: '👛 Wallet', value: `**${data.wallet.toLocaleString()}**`,         inline: true }
        )
      ]});
    }
  }

  // ── PLINKO (max 2x win, 0.5x loss) ──────────────────────
  if (cmd === 'plinko') {
    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,plinko <amount>`');
    if (amount > data.wallet)                    return message.reply("❌ Not enough coins in your wallet.");

    // Weighted: 0.5x (40%), 1x (30%), 1.5x (20%), 2x (10%)
    const roll = Math.random();
    let multi;
    if      (roll < 0.40) multi = 0.5;
    else if (roll < 0.70) multi = 1.0;
    else if (roll < 0.90) multi = 1.5;
    else                  multi = 2.0;

    const win  = Math.floor(amount * multi);
    const diff = win - amount;
    data.wallet = data.wallet - amount + win;
    await data.save();

    const sign = diff >= 0 ? '+' : '';
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(multi >= 1 ? C.GREEN : C.RED)
      .setAuthor({ name: `${user.username} played plinko`, iconURL: avatar })
      .setDescription(`🎯 **${multi}x Multiplier!**`)
      .addFields(
        { name: '💰 Payout',  value: `**${win.toLocaleString()}** ${CURRENCY}`,       inline: true },
        { name: '📊 Change',  value: `**${sign}${diff.toLocaleString()}** ${CURRENCY}`, inline: true },
        { name: '👛 Wallet',  value: `**${data.wallet.toLocaleString()}**`,            inline: true }
      )
    ]});
  }

  // ── BLACKJACK (interactive with buttons) ─────────────────
  if (cmd === 'bj' || cmd === 'blackjack') {
    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0) return message.reply('❌ Usage: `,bj <amount>`');
    if (amount > data.wallet)                    return message.reply("❌ Not enough coins in your wallet.");

    const cardVal = () => {
      const v = Math.floor(Math.random() * 13) + 1;
      return v === 1 ? 11 : Math.min(v, 10);
    };
    const cardName = () => {
      const names = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
      return names[Math.floor(Math.random() * 13)];
    };

    // Build hand object { value, display }
    const dealCard = () => {
      const n = cardName();
      let v = ['J','Q','K'].includes(n) ? 10 : (n === 'A' ? 11 : parseInt(n));
      return { name: n, value: v };
    };

    let playerHand = [dealCard(), dealCard()];
    let dealerHand = [dealCard(), dealCard()];

    const handValue = (hand) => {
      let total = hand.reduce((s, c) => s + c.value, 0);
      let aces  = hand.filter(c => c.name === 'A').length;
      while (total > 21 && aces > 0) { total -= 10; aces--; }
      return total;
    };

    const handDisplay = (hand, hideSecond = false) =>
      hideSecond
        ? `\`${hand[0].name}\` \`?\``
        : hand.map(c => `\`${c.name}\``).join(' ');

    const buildEmbed = (pHand, dHand, hideDealer = true, resultText = null) => {
      const pVal = handValue(pHand);
      const dVal = handValue(dHand);
      return new EmbedBuilder()
        .setColor(resultText ? (resultText.includes('win') ? C.GREEN : resultText.includes('Tie') ? C.GOLD : C.RED) : C.BLUE)
        .setAuthor({ name: `${user.username} — Blackjack`, iconURL: avatar })
        .addFields(
          { name: `Your Hand (${pVal})`,   value: handDisplay(pHand),          inline: true },
          { name: `Dealer Hand`,           value: handDisplay(dHand, hideDealer), inline: true }
        )
        .setDescription(resultText ? `**${resultText}**` : 'Hit or Stand?')
        .setFooter({ text: `Bet: ${amount.toLocaleString()} coins` });
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('bj_stand').setStyle(ButtonStyle.Secondary).setLabel('Stand')
    );
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit').setStyle(ButtonStyle.Primary).setDisabled(true),
      new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand').setStyle(ButtonStyle.Secondary).setDisabled(true)
    );

    // Check immediate blackjack
    if (handValue(playerHand) === 21) {
      data.wallet += amount;
      await data.save();
      return message.reply({ embeds: [buildEmbed(playerHand, dealerHand, false, `Blackjack! You win ${amount.toLocaleString()} coins!`)] });
    }

    const msg = await message.reply({ embeds: [buildEmbed(playerHand, dealerHand)], components: [row] });

    const col = msg.createMessageComponentCollector({
      filter: i => i.user.id === user.id,
      time: 30_000
    });

    col.on('collect', async i => {
      if (i.customId === 'bj_hit') {
        playerHand.push(dealCard());
        const pVal = handValue(playerHand);

        if (pVal > 21) {
          col.stop('bust');
          data.wallet -= amount;
          await data.save();
          await i.update({ embeds: [buildEmbed(playerHand, dealerHand, false, `Bust! You lost ${amount.toLocaleString()} coins.`)], components: [disabledRow] });
          return;
        }
        if (pVal === 21) {
          col.stop('stand');
          return i.update({ embeds: [buildEmbed(playerHand, dealerHand)], components: [row] });
        }
        await i.update({ embeds: [buildEmbed(playerHand, dealerHand)], components: [row] });
      }

      if (i.customId === 'bj_stand') {
        col.stop('stand');
        // Dealer draws until 17+
        while (handValue(dealerHand) < 17) dealerHand.push(dealCard());
        const pVal = handValue(playerHand);
        const dVal = handValue(dealerHand);

        let resultText;
        if (dVal > 21 || pVal > dVal) {
          data.wallet += amount;
          resultText = `You win! +${amount.toLocaleString()} coins`;
        } else if (pVal === dVal) {
          resultText = `Tie! Bet returned.`;
        } else {
          data.wallet -= amount;
          resultText = `Dealer wins. -${amount.toLocaleString()} coins`;
        }
        await data.save();
        await i.update({ embeds: [buildEmbed(playerHand, dealerHand, false, resultText)], components: [disabledRow] });
      }
    });

    col.on('end', async (_, reason) => {
      if (reason === 'time') {
        // Auto stand on timeout
        while (handValue(dealerHand) < 17) dealerHand.push(dealCard());
        const pVal = handValue(playerHand);
        const dVal = handValue(dealerHand);
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
        await msg.edit({ embeds: [buildEmbed(playerHand, dealerHand, false, resultText)], components: [disabledRow] }).catch(() => {});
      }
    });
    return true;
  }

  // ── FAME ─────────────────────────────────────────────────
  if (cmd === 'fame') {
    const target = message.mentions.users.first() || user;
    const tData  = await getEcoUser(target.id);
    const embed  = new EmbedBuilder()
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
      if (i.user.id === target.id) return i.reply({ content: "❌ You can't vote on yourself.", flags: MessageFlags.Ephemeral });
      const tUser = await getEcoUser(target.id);
      if (i.customId.startsWith('bst')) { tUser.aura += 1; await i.reply({ content: `✅ Boosted **${target.username}**'s aura!`, flags: MessageFlags.Ephemeral }); }
      else { tUser.aura -= 1; await i.reply({ content: `📉 Negged **${target.username}**'s aura.`, flags: MessageFlags.Ephemeral }); }
      await tUser.save();
      embed.setDescription(`❄️ **Aura Points:** ${tUser.aura}`);
      await msg.edit({ embeds: [embed] }).catch(() => {});
    });
    col.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    return true;
  }

  return true;
}

module.exports = {
  name: 'eco_module',
  execute: () => {},
  handleEconomyCommands,
  _handle: handleEconomyCommands,
  startVoiceIncome,
  handleIncomeEvents,
  handleReactionIncome
};