const { EmbedBuilder } = require("discord.js");
const { Config } = require("../../models/schemas");

module.exports = {
  name: "poj",
  description: "Ping on Join Setup",
  slashOnly: true,

  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageGuild")) {
      return interaction.reply({ content: "❌ You need Manage Server permissions.", ephemeral: true });
    }

    let sub;
    try { sub = interaction.options.getSubcommand(); }
    catch { return interaction.reply({ content: "❌ Use: `/poj setup` or `/poj unset`", ephemeral: true }); }

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel");
      const time    = interaction.options.getInteger("time");

      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $set: { "poj.channel": channel.id, "poj.time": time } },
        { upsert: true, new: true }
      );

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle("✅ POJ Configured")
            .addFields(
              { name: "Channel", value: `${channel}`, inline: true },
              { name: "Delete After", value: `${time}ms`, inline: true }
            )
        ],
        ephemeral: true
      });
    }

    if (sub === "unset") {
      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $set: { "poj.channel": null, "poj.time": 5000 } },
        { upsert: true }
      );

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("🔕 Ping on Join has been disabled.")],
        ephemeral: true
      });
    }
  }
};