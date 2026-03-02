const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "warn",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return err("❌ You need **Moderate Members** permission.");

    const target = message.mentions.members.first();
    if (!target) return err("❌ Usage: `,warn @user [reason]`");

    const reason = args.slice(1).join(" ") || "No reason provided";

    // DM the user their warning
    const dmEmbed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle(`⚠️ Warning — ${message.guild.name}`)
      .setDescription(`You have been warned by **${message.author.username}**.\n**Reason:** ${reason}`)
      .setTimestamp();

    await target.user.send({ embeds: [dmEmbed] }).catch(() => {});

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFEE75C)
          .setDescription(`⚠️ **${target.user.username}** has been warned.\n**Reason:** ${reason}`)
      ]
    });
  }
};