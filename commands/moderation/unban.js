const { PermissionsBitField, EmbedBuilder } = require("discord.js");

// ,unban <userId> [reason]

module.exports = {
  name: "unban",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return err("<:warning:1497240331756769280> You need **Ban Members** permission.");

    const userId = args[0];
    if (!userId || !/^\d{17,20}$/.test(userId))
      return err("<:warning:1497240331756769280> Usage: `,unban <userId> [reason]`\nYou must use the user's **ID** (they're banned so can't be mentioned).");

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await message.guild.bans.remove(userId, reason);
      return message.reply({
        embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`<:tick_correct:1497240255085150408> Unbanned user \`${userId}\`.\n**Reason:** ${reason}`)]
      });
    } catch {
      return err(`<:x_decline:1497240273116336332 Could not unban \`${userId}\`. They may not be banned, or the ID is wrong.`);
    }
  }
};