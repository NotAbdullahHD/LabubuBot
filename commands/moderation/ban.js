const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ban",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });
    const ok  = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return err("❌ You need **Ban Members** permission.");

    const member = message.mentions.members.first();
    if (!member) return err("❌ Usage: `,ban @user [reason]`");
    if (!member.bannable) return err("❌ I cannot ban this user (check role hierarchy).");
    if (member.id === message.author.id) return err("❌ You cannot ban yourself.");

    // ✅ ADDED: reason support + DM notification before ban
    const reason = args.slice(1).join(" ") || "No reason provided";

    await member.user.send({
      embeds: [new EmbedBuilder().setColor(0xED4245).setTitle(`🔨 Banned from ${message.guild.name}`).setDescription(`**Reason:** ${reason}`)]
    }).catch(() => {}); // DM may be closed — that's ok

    await member.ban({ reason });
    return ok(`✅ **${member.user.tag}** has been banned.\n**Reason:** ${reason}`);
  }
};