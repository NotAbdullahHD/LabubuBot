const { PermissionsBitField, EmbedBuilder } = require("discord.js");

// ,timeout @user <duration> [reason]
// Duration: 10m, 1h, 2d  (max 28d per Discord limit)

module.exports = {
  name: "timeout",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return err("<:warning:1497240331756769280> You need **Moderate Members** permission.");

    const target = message.mentions.members.first();
    if (!target) return err("<:warning:1497240331756769280> Usage: `,timeout @user <duration> [reason]`\n**Duration examples:** `10m` `1h` `2d`");

    const durationStr = args[1];
    if (!durationStr) return err("<:warning:1497240331756769280> Please provide a duration. Examples: `10m` `1h` `2d`");

    // Parse duration string → ms
    const match = durationStr.match(/^(\d+)(s|m|h|d)$/i);
    if (!match) return err("<:warning:1497240331756769280> Invalid duration format. Use `10m`, `2h`, `1d` etc.");

    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const ms = parseInt(match[1]) * units[match[2].toLowerCase()];

    const MAX_MS = 28 * 24 * 60 * 60 * 1000; // 28 days Discord limit
    if (ms > MAX_MS) return err("<:x_decline:1497240273116336332> Maximum timeout duration is 28 days.");
    if (ms < 5000)   return err("<:x_decline:1497240273116336332> Minimum timeout duration is 5 seconds.");

    const reason = args.slice(2).join(" ") || "No reason provided";

    if (!target.moderatable) return err("<:x_decline:1497240273116336332> I can't timeout this user (check my role position).");

    await target.timeout(ms, reason);

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFEE75C)
          .setDescription(`⏱️ **${target.user.username}** timed out for **${durationStr}**.\n**Reason:** ${reason}`)
      ]
    });
  }
};