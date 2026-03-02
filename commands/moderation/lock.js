const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "lock",
  async execute(message, args, client) {
    const errorEmbed = (msg) => new EmbedBuilder().setDescription(msg).setColor(0xED4245);
    const successEmbed = (msg) => new EmbedBuilder().setDescription(msg).setColor(0x57F287);

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) 
      return message.reply({ embeds: [errorEmbed("❌ Missing **Manage Channels** permission.")] });

    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });

    message.reply({ embeds: [successEmbed(`🔒 **${channel.name}** has been locked.`)] });
  }
};