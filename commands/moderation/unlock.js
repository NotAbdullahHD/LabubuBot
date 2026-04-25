const { PermissionsBitField, EmbedBuilder } = require("discord.js");

const WARN = "<:warning:1497240331756769280>";
const TICK = "<:tick_correct:1497240255085150408>";

module.exports = {
  name: "unlock",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`${WARN} Missing **Manage Channels** permission.`)] });

    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });

    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0x57F287)
      .setDescription(`${TICK} **${channel.name}** has been unlocked.`)
    ]});
  }
};