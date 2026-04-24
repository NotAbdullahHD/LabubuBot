const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "untimeout",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return err("<:warning:1497240331756769280> You need **Moderate Members** permission.");

    const target = message.mentions.members.first();
    if (!target) return err("<:warning:1497240331756769280> Usage: `,untimeout @user`");

    if (!target.communicationDisabledUntil)
      return err("<:x_decline:1497240273116336332> That user is not currently timed out.");

    await target.timeout(null);

    return message.reply({
      embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`<:tick_correct:1497240255085150408> Timeout removed from **${target.user.username}**.`)]
    });
  }
};