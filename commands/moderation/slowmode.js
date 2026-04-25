const { PermissionsBitField, EmbedBuilder } = require("discord.js");

const WARN = "<:warning:1497240331756769280>";
const GEAR = "<:gear_setting:1497240236760236114>";
const TICK = "<:tick_correct:1497240255085150408>";

module.exports = {
  name: "slowmode",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return err(`${WARN} You need **Manage Channels** permission.`);

    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600)
      return err(`${WARN} Usage: \`,slowmode <0-21600>\`\n\`0\` disables slowmode. Max is \`21600\` (6 hours).`);

    await message.channel.setRateLimitPerUser(seconds);

    const text = seconds === 0
      ? `${TICK} Slowmode **disabled** in this channel.`
      : `${GEAR} Slowmode set to **${seconds}s** in this channel.`;

    return message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription(text)] });
  }
};