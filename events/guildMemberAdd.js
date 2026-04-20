const { EmbedBuilder } = require("discord.js");
const { Config }       = require("../models/schemas");
const { sendLog }      = require("../commands/setup/logHelper");
const { parseCustomEmbed } = require("../commands/setup/parseCustomEmbed");

module.exports = {
  name: "guildMemberAdd",
  async execute(member, client) {
    if (!member.guild || !member.user) return;

    // ── POJ + Welcome (existing) ──────────────────────────────
    let data;
    try { data = await Config.findOne({ guildId: member.guild.id }); } catch { return; }

    if (data?.poj?.channel) {
      const pojChannel = member.guild.channels.cache.get(data.poj.channel);
      if (pojChannel) {
        const msg = await pojChannel.send(`${member}`).catch(() => null);
        if (msg) setTimeout(() => msg.delete().catch(() => {}), data.poj.time || 5000);
      }
    }

    if (data?.welcome?.channel && data?.welcome?.embedCode) {
      const welcomeChannel = member.guild.channels.cache.get(data.welcome.channel);
      if (welcomeChannel) {
        try {
          const embed = parseCustomEmbed(data.welcome.embedCode, { member, user: member.user, guild: member.guild });
          await welcomeChannel.send({ embeds: [embed] });
        } catch {}
      }
    }

    // ── Member Join Log ───────────────────────────────────────
    const created  = Math.floor(member.user.createdTimestamp / 1000);
    const embed    = new EmbedBuilder()
      .setColor(0x57F287)
      .setAuthor({ name: `${member.user.tag} joined`, iconURL: member.user.displayAvatarURL() })
      .addFields(
        { name: "User",         value: `${member}`,               inline: true },
        { name: "Account Age",  value: `<t:${created}:R>`,        inline: true },
        { name: "Member Count", value: `**${member.guild.memberCount}**`, inline: true }
      )
      .setFooter({ text: `ID: ${member.id}` })
      .setTimestamp();

    await sendLog(member.guild, "member", embed);
  }
};