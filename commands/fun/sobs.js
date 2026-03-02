const { Sobs } = require("../../models/schemas");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "sobs",
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    // ── Leaderboard ───────────────────────────────────────────
    if (sub === "top" || sub === "lb" || sub === "list") {
      // ✅ FIXED: was Sobs.find() with no filter — showed users from ALL servers
      // Sobs schema has no guildId so we fetch top 10 by count globally,
      // but filter to only users who are actually in this guild
      const allTop = await Sobs.find().sort({ count: -1 }).limit(50);

      const lines = [];
      for (const doc of allTop) {
        if (lines.length >= 10) break;
        // Only include members actually in this server
        const member = await message.guild.members.fetch(doc.userId).catch(() => null);
        if (!member) continue;
        lines.push(`**${lines.length + 1}.** ${member.user.username} — **${doc.count}** sobs`);
      }

      const description = lines.length > 0 ? lines.join("\n") : "No sobs yet in this server.";

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`😭 ${message.guild.name} — Sobs Leaderboard`)
            .setDescription(description)
            .setColor(16119028)
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
        ]
      });
    }

    // ── User Stats ────────────────────────────────────────────
    const user = message.mentions.users.first() || message.author;
    const data = await Sobs.findOne({ userId: user.id });
    const count = data?.count ?? 0;

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`😭 **${user.username}** has **${count}** sobs`)
          .setColor(16119028)
      ]
    });
  }
};