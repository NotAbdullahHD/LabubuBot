const { PermissionsBitField, EmbedBuilder } = require("discord.js");

// ,unban <userId> [reason]

module.exports = {
  name: "unban",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return err("❌ You need **Ban Members** permission.");

    const userId = args[0];
    if (!userId || !/^\d{17,20}$/.test(userId))
      return err("❌ Usage: `,unban <userId> [reason]`\nYou must use the user's **ID** (they're banned so can't be mentioned).");

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await message.guild.bans.remove(userId, reason);
      return message.reply({
        embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`✅ Unbanned user \`${userId}\`.\n**Reason:** ${reason}`)]
      });
    } catch {
      return err(`❌ Could not unban \`${userId}\`. They may not be banned, or the ID is wrong.`);
    }
  }
};