const { Config } = require("../models/schemas");
const { parseCustomEmbed } = require("../commands/setup/parseCustomEmbed");

module.exports = {
  name: "guildMemberAdd",
  async execute(member, client) {
    // ✅ FIXED: guard against partial members where member.user may not be available yet
    if (!member.guild || !member.user) return;

    let data;
    try {
      data = await Config.findOne({ guildId: member.guild.id });
    } catch (err) {
      console.error("[guildMemberAdd] DB error:", err.message);
      return;
    }

    if (!data) return;

    // ── 1. POJ (Ping on Join) ─────────────────────────────────
    if (data.poj?.channel) {
      const pojChannel = member.guild.channels.cache.get(data.poj.channel);
      if (pojChannel) {
        try {
          const msg = await pojChannel.send(`${member}`);
          setTimeout(() => msg.delete().catch(() => {}), data.poj.time || 5000);
        } catch (err) {
          console.log("[POJ] Error:", err.message);
        }
      }
    }

    // ── 2. Welcome Embed ──────────────────────────────────────
    if (data.welcome?.channel && data.welcome?.embedCode) {
      const welcomeChannel = member.guild.channels.cache.get(data.welcome.channel);
      if (!welcomeChannel) return;

      try {
        const embed = parseCustomEmbed(data.welcome.embedCode, {
          member: member,
          user:   member.user,   // ✅ FIXED: explicitly pass user so {user.name} etc. resolves
          guild:  member.guild
        });
        await welcomeChannel.send({ embeds: [embed] });
      } catch (err) {
        console.log("[Welcome] Error:", err.message);
      }
    }
  }
};