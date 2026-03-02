const { EmbedBuilder } = require("discord.js");
const { LevelUser } = require("../../models/schemas");

// ,lb  or  ,leaderboard — top 10 XP leaderboard

module.exports = {
  name: "lb",
  aliases: ["leaderboard"],   // ✅ FIXED: removed "levels" alias — conflicts with /levels slash command
  async execute(message) {
    const top = await LevelUser.find({ guildId: message.guild.id })
      .sort({ xp: -1 })
      .limit(10)
      .lean();

    if (!top.length) {
      return message.reply({
        embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription("No one has earned any XP yet. Start chatting!")]
      });
    }

    const medals = ["🥇", "🥈", "🥉"];
    const rows = top.map((entry, i) => {
      const medal = medals[i] ?? `\`${i + 1}.\``;
      const name  = entry.username || `<@${entry.userId}>`;
      return `${medal} **${name}** — Level **${entry.level}** · \`${entry.xp.toLocaleString()} XP\``;
    });

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`🏆 ${message.guild.name} — Level Leaderboard`)
          .setDescription(rows.join("\n"))
          .setThumbnail(message.guild.iconURL({ size: 128 }))
          .setFooter({ text: "Use ,rank to check your position" })
          .setTimestamp()
      ]
    });
  }
};