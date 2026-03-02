const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { Giveaway } = require("../../models/schemas");

function parseDuration(input) {
  const match = input?.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}

async function endGiveaway(client, giveawayData) {
  const channel = client.channels.cache.get(giveawayData.channelId);
  if (!channel) return;

  try {
    const msg = await channel.messages.fetch(giveawayData.messageId);
    const reaction = msg.reactions.cache.get("🎉");

    if (!reaction) {
      await Giveaway.updateOne({ messageId: giveawayData.messageId }, { ended: true });
      return msg.reply("❌ Giveaway ended, but no reactions found.");
    }

    const users = await reaction.users.fetch();
    const validUsers = users.filter(u => !u.bot).map(u => u.id);

    if (validUsers.length === 0) {
      await msg.reply("❌ Giveaway ended, but no valid participants.");
    } else {
      const winners = [];
      const pool = [...validUsers];
      // ✅ FIXED: was giveawayData.winners — schema field is winnersCount
      for (let i = 0; i < giveawayData.winnersCount; i++) {
        if (pool.length === 0) break;
        const rand = Math.floor(Math.random() * pool.length);
        winners.push(pool.splice(rand, 1)[0]);
      }

      const winnerMentions = winners.map(id => `<@${id}>`).join(", ");

      const winEmbed = new EmbedBuilder()
        .setTitle("🎉 GIVEAWAY ENDED 🎉")
        .setDescription(`**Prize:** ${giveawayData.prize}\n**Winner(s):** ${winnerMentions}\n**Hosted by:** <@${giveawayData.hostedBy}>`)
        .setColor(0xFFAC33);

      await msg.reply({ content: `Congratulations ${winnerMentions}!`, embeds: [winEmbed] });
    }
  } catch (e) {
    console.log(`Giveaway message ${giveawayData.messageId} not found or deleted.`);
  }

  await Giveaway.updateOne({ messageId: giveawayData.messageId }, { ended: true });
}

module.exports = {
  name: "giveaway",

  startChecker(client) {
    setInterval(async () => {
      const now = Date.now();
      const ended = await Giveaway.find({ ended: false, endTime: { $lte: now } });
      for (const g of ended) {
        await endGiveaway(client, g);
      }
    }, 5000);
  },

  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
      return message.reply("❌ You need **Manage Guild** permission.");

    const sub = args[0]?.toLowerCase();

    if (sub === "start") {
      const duration = parseDuration(args[1]);
      const winnerCount = parseInt(args[2]);
      const prize = args.slice(3).join(" ");

      if (!duration || !winnerCount || !prize)
        return message.reply("Usage: `,giveaway start <time> <winners> <prize>`\nExample: `,giveaway start 1h 1 Nitro`");

      const endTime = Date.now() + duration;

      const embed = new EmbedBuilder()
        .setTitle(prize)
        .setDescription(`React with 🎉 to enter!\n\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>\n**Hosted by:** ${message.author}\n**Winners:** ${winnerCount}`)
        .setColor(0xFFAC33)
        .setFooter({ text: "Ends at" })
        .setTimestamp(endTime);

      const msg = await message.channel.send({ embeds: [embed] });
      await msg.react("🎉");

      await Giveaway.create({
        messageId: msg.id,
        channelId: message.channel.id,
        guildId: message.guild.id,
        prize: prize,
        winnersCount: winnerCount, // ✅ FIXED: was 'winners', schema field is 'winnersCount'
        endTime: endTime,
        hostedBy: message.author.id,
        ended: false
      });

      return message.reply(`✅ Giveaway started for **${prize}**!`);
    }

    else if (sub === "reroll") {
      const link = args[1];
      if (!link) return message.reply("Usage: `,giveaway reroll <message_link>`");

      const messageId = link.split("/").pop();
      const msg = await message.channel.messages.fetch(messageId).catch(() => null);
      if (!msg) return message.reply("❌ Message not found.");

      const reaction = msg.reactions.cache.get("🎉");
      if (!reaction) return message.reply("❌ No 🎉 reaction found.");

      const users = await reaction.users.fetch();
      const validUsers = users.filter(u => !u.bot).map(u => u.id);

      if (validUsers.length === 0) return message.reply("❌ No participants.");

      const winner = validUsers[Math.floor(Math.random() * validUsers.length)];
      message.reply(`🎉 **New Winner:** <@${winner}>`);
    }

    else if (sub === "end") {
      const link = args[1];
      if (!link) return message.reply("Usage: `,giveaway end <message_link>`");

      const messageId = link.split("/").pop();
      const giveawayData = await Giveaway.findOne({ messageId: messageId, ended: false });
      if (!giveawayData) return message.reply("❌ Giveaway not found or already ended.");

      await endGiveaway(client, giveawayData);
    }

    else if (sub === "list") {
      const giveaways = await Giveaway.find({ guildId: message.guild.id, ended: false });

      if (giveaways.length === 0) return message.reply("❌ No active giveaways running.");

      const description = giveaways.map((g, i) => {
        return `**${i + 1}.** [${g.prize}](https://discord.com/channels/${g.guildId}/${g.channelId}/${g.messageId})\n` +
          `• Ends: <t:${Math.floor(g.endTime / 1000)}:R>\n` +
          `• Host: <@${g.hostedBy}>`;
      }).join("\n\n");

      const embed = new EmbedBuilder()
        .setTitle("🎉 Active Giveaways")
        .setDescription(description)
        .setColor(0xFFAC33);

      message.reply({ embeds: [embed] });
    }

    else {
      message.reply("Usage:\n`,giveaway start <time> <winners> <prize>`\n`,giveaway end <link>`\n`,giveaway reroll <link>`\n`,giveaway list`");
    }
  }
};