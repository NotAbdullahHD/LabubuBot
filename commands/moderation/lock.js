const { PermissionsBitField, EmbedBuilder } = require("discord.js");

const WARN = "<:warning:1497240331756769280>";
const TICK = "<:tick_shield:1497240302522732757>";

module.exports = {
  name: "lock",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`${WARN} Missing **Manage Channels** permission.`)] });

    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });

    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xED4245)
      .setDescription(`${TICK} **${channel.name}** has been locked.`)
    ]});
  }
};