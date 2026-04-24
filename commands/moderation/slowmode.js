const { PermissionsBitField, EmbedBuilder } = require("discord.js");

// ,slowmode <seconds>   (0 to disable, max 21600 = 6h)

module.exports = {
  name: "slowmode",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return err("<:warning:1497240331756769280> You need **Manage Channels** permission.");

    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600)
      return err("<:warning:1497240331756769280> Usage: `,slowmode <0-21600>`\n`0` disables slowmode. Max is `21600` (6 hours).");

    await message.channel.setRateLimitPerUser(seconds);

    const text = seconds === 0
      ? "🔓 Slowmode **disabled** in this channel."
      : `🐢 Slowmode set to **${seconds}s** in this channel.`;

    return message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription(text)] });
  }
};