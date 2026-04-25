const { PermissionsBitField, EmbedBuilder } = require("discord.js");

const WARN = "<:warning:1497240331756769280>";
const TICK = "<:tick_correct:1497240255085150408>";

module.exports = {
  name: "clear",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`${WARN} Missing **Manage Messages** permission.`)] });

    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100)
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`${WARN} Usage: \`,clear 1-100\``)] });

    await message.channel.bulkDelete(amount, true);
    const msg = await message.channel.send({ embeds: [new EmbedBuilder()
      .setColor(0x57F287)
      .setDescription(`${TICK} Cleared **${amount}** messages.`)
    ]});
    setTimeout(() => msg.delete().catch(() => {}), 3000);
  }
};