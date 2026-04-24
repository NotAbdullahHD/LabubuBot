const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "unlock",
  async execute(message, args, client) {
    const errorEmbed = (msg) => new EmbedBuilder().setDescription(msg).setColor(0xED4245);
    const successEmbed = (msg) => new EmbedBuilder().setDescription(msg).setColor(0x57F287);

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) 
      return message.reply({ embeds: [errorEmbed("<:warning:1497240331756769280> Missing **Manage Channels** permission.")] });

    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });

    message.reply({ embeds: [successEmbed(`🔓 **${channel.name}** has been unlocked.`)] });
  }
};