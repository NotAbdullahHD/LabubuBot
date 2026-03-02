const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "clear",
  async execute(message, args, client) {
    const errorEmbed = (msg) => new EmbedBuilder().setDescription(msg).setColor(0xED4245);
    const successEmbed = (msg) => new EmbedBuilder().setDescription(msg).setColor(0x57F287);

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) 
      return message.reply({ embeds: [errorEmbed("❌ Missing **Manage Messages** permission.")] });

    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) 
      return message.reply({ embeds: [errorEmbed("Usage: `>clear 1-100`")] });

    await message.channel.bulkDelete(amount, true);
    message.channel.send({ embeds: [successEmbed(`🧹 Cleared **${amount}** messages.`)] })
      .then(msg => setTimeout(() => msg.delete(), 3000));
  }
};