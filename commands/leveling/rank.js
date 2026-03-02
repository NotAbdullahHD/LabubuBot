const { EmbedBuilder } = require("discord.js");
const { LevelUser } = require("../../models/schemas");
const { xpForNextLevel, xpInCurrentLevel, makeProgressBar } = require("./levelEngine");

// ,rank [@user] — show someone's level card

module.exports = {
  name: "rank",
  async execute(message, args) {
    const target = message.mentions.users.first() ?? message.author;
    const member = message.guild.members.cache.get(target.id);

    const record = await LevelUser.findOne({ guildId: message.guild.id, userId: target.id });

    if (!record || record.xp === 0) {
      return message.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`**${target.username}** hasn't earned any XP yet.`)]
      });
    }

    // Calculate rank position
    const rank = await LevelUser.countDocuments({
      guildId: message.guild.id,
      xp:      { $gt: record.xp }
    }) + 1;

    const currentXp = xpInCurrentLevel(record.xp, record.level);
    const neededXp  = xpForNextLevel(record.level);
    const bar       = makeProgressBar(record.xp, record.level, 12);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({
        name:    `${target.username}'s Rank`,
        iconURL: target.displayAvatarURL({ size: 128 })
      })
      .addFields(
        { name: "Level",       value: `**${record.level}**`,                   inline: true },
        { name: "Rank",        value: `**#${rank}**`,                           inline: true },
        { name: "Total XP",    value: `**${record.xp.toLocaleString()}**`,      inline: true }
      )
      .setDescription(
        `${bar}\n\`${currentXp.toLocaleString()} / ${neededXp.toLocaleString()} XP\` to Level ${record.level + 1}`
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};