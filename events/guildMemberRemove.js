const { EmbedBuilder } = require("discord.js");
const { sendLog }      = require("../commands/setup/logHelper");

module.exports = {
  name: "guildMemberRemove",
  async execute(member, client) {
    if (!member.guild || !member.user) return;

    const roles = member.roles.cache
      .filter(r => r.id !== member.guild.id)
      .map(r => r.toString())
      .join(", ") || "None";

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({ name: `${member.user.tag} left`, iconURL: member.user.displayAvatarURL() })
      .addFields(
        { name: "User",   value: `${member}`,  inline: true },
        { name: "Roles",  value: roles,         inline: false }
      )
      .setFooter({ text: `ID: ${member.id}` })
      .setTimestamp();

    await sendLog(member.guild, "member", embed);
  }
};