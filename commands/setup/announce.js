const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { parseCustomEmbed } = require("./parseCustomEmbed");

// ─────────────────────────────────────────────────────
//  /announce — Send a custom embed to any channel
//
//  Usage:
//    /announce channel:#announcements message:{embed}$v{...}
// ─────────────────────────────────────────────────────

module.exports = {
  name: "announce",
  description: "Send a custom embed to a channel using Embed Builder code.",
  slashOnly: true,

  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageMessages")) {
      return interaction.reply({ content: "❌ You need **Manage Messages** permission.", ephemeral: true });
    }

    const channel     = interaction.options.getChannel("channel");
    const embedString = interaction.options.getString("message");

    await interaction.deferReply({ ephemeral: true });

    // Validate
    if (!embedString.trim().startsWith("{embed}")) {
      return interaction.editReply({
        content: "❌ Invalid embed code. It must start with `{embed}`.\nBuild one at the **Embed Builder** on the bot website."
      });
    }

    // Parse — resolver uses the person who ran the command for {user} variables
    let embed;
    try {
      embed = parseCustomEmbed(embedString, {
        member: interaction.member,
        user:   interaction.user,
        guild:  interaction.guild
      });
    } catch (err) {
      return interaction.editReply({ content: `❌ Embed code error: \`${err.message}\`` });
    }

    // Check the bot can actually send to that channel
    const botPerms = channel.permissionsFor(interaction.guild.members.me);
    if (!botPerms?.has(PermissionFlagsBits.SendMessages) || !botPerms?.has(PermissionFlagsBits.EmbedLinks)) {
      return interaction.editReply({
        content: `❌ I don't have **Send Messages** or **Embed Links** permission in ${channel}.`
      });
    }

    // Send
    try {
      await channel.send({ embeds: [embed] });
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`✅ Embed sent to ${channel}!`)
        ]
      });
    } catch (err) {
      console.error("[/announce]", err);
      return interaction.editReply({ content: `❌ Failed to send: \`${err.message}\`` });
    }
  }
};