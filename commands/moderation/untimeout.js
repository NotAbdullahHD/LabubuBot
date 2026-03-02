const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "untimeout",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return err("❌ You need **Moderate Members** permission.");

    const target = message.mentions.members.first();
    if (!target) return err("❌ Usage: `,untimeout @user`");

    if (!target.communicationDisabledUntil)
      return err("❌ That user is not currently timed out.");

    await target.timeout(null);

    return message.reply({
      embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`✅ Timeout removed from **${target.user.username}**.`)]
    });
  }
};