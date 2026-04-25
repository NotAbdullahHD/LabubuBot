const { PermissionsBitField, EmbedBuilder } = require("discord.js");

const WARN = "<:warning:1497240331756769280>";
const X    = "<:x_decline:1497240273116336332>";
const TICK = "<:tick_correct:1497240255085150408>";

module.exports = {
  name: "nick",
  aliases: ["nickname"],
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames))
      return err(`${WARN} You need **Manage Nicknames** permission.`);

    const target = message.mentions.members.first();
    if (!target) return err(`${WARN} Usage: \`,nick @user <new nickname>\` or \`,nick @user\` to reset.`);

    const newNick = args.slice(1).join(" ").trim() || null;

    if (!target.manageable) return err(`${X} I can't change this user's nickname (check role hierarchy).`);

    const old = target.nickname || target.user.username;
    await target.setNickname(newNick);

    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0x57F287)
      .setDescription(`${TICK} Changed **${target.user.username}**'s nickname.\n**Before:** ${old}\n**After:** ${newNick || target.user.username}`)
    ]});
  }
};