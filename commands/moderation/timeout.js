const { PermissionsBitField, EmbedBuilder } = require("discord.js");

const WARN = "<:warning:1497240331756769280>";
const X    = "<:x_decline:1497240273116336332>";
const GEAR = "<:gear_setting:1497240236760236114>";

module.exports = {
  name: "timeout",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return err(`${WARN} You need **Moderate Members** permission.`);

    const target = message.mentions.members.first();
    if (!target) return err(`${WARN} Usage: \`,timeout @user <duration> [reason]\`\nExamples: \`10m\` \`1h\` \`2d\``);

    const durationStr = args[1];
    if (!durationStr) return err(`${WARN} Please provide a duration. Examples: \`10m\` \`1h\` \`2d\``);

    const match = durationStr.match(/^(\d+)(s|m|h|d)$/i);
    if (!match) return err(`${WARN} Invalid duration format. Use \`10m\`, \`2h\`, \`1d\` etc.`);

    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const ms    = parseInt(match[1]) * units[match[2].toLowerCase()];

    if (ms > 28 * 24 * 60 * 60 * 1000) return err(`${X} Maximum timeout duration is 28 days.`);
    if (ms < 5000)                      return err(`${X} Minimum timeout duration is 5 seconds.`);

    const reason = args.slice(2).join(" ") || "No reason provided";
    if (!target.moderatable) return err(`${X} I can't timeout this user (check my role position).`);

    await target.timeout(ms, reason);

    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xFEE75C)
      .setDescription(`${GEAR} **${target.user.username}** timed out for **${durationStr}**.\n**Reason:** ${reason}`)
    ]});
  }
};