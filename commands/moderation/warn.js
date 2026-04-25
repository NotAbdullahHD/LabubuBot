const { PermissionsBitField, EmbedBuilder } = require("discord.js");

const WARN = "<:warning:1497240331756769280>";
const TICK = "<:tick_correct:1497240255085150408>";
const X    = "<:x_decline:1497240273116336332>";

module.exports = {
  name: "warn",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return err(`${WARN} You need **Moderate Members** permission.`);

    const target = message.mentions.members.first();
    if (!target) return err(`${WARN} Usage: \`,warn @user [reason]\``);

    const reason = args.slice(1).join(" ") || "No reason provided";

    await target.user.send({ embeds: [new EmbedBuilder()
      .setColor(0xFEE75C)
      .setAuthor({ name: `Warning — ${message.guild.name}`, iconURL: message.guild.iconURL() || undefined })
      .setDescription(`You were warned by **${message.author.username}**.\n**Reason:** ${reason}`)
      .setTimestamp()
    ]}).catch(() => {});

    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xFEE75C)
      .setDescription(`${WARN} **${target.user.username}** has been warned.\n**Reason:** ${reason}`)
    ]});
  }
};