const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "kick",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });
    const ok  = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return err("❌ You need **Kick Members** permission.");

    const member = message.mentions.members.first();
    if (!member) return err("❌ Usage: `,kick @user [reason]`");
    if (!member.kickable) return err("❌ I cannot kick this user (check role hierarchy).");
    if (member.id === message.author.id) return err("❌ You cannot kick yourself.");

    // ✅ ADDED: reason support + DM notification
    const reason = args.slice(1).join(" ") || "No reason provided";

    await member.user.send({
      embeds: [new EmbedBuilder().setColor(0xFEE75C).setTitle(`👢 Kicked from ${message.guild.name}`).setDescription(`**Reason:** ${reason}`)]
    }).catch(() => {});

    await member.kick(reason);
    return ok(`✅ **${member.user.tag}** has been kicked.\n**Reason:** ${reason}`);
  }
};