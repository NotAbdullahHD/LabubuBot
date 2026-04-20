const { EmbedBuilder } = require("discord.js");
const { LogConfig } = require("../../models/schemas");

module.exports = {
  name: "logs",
  description: "Configure server logging",
  slashOnly: true,

  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageGuild")) {
      return interaction.reply({ content: "❌ You need **Manage Server** permission.", ephemeral: true });
    }

    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "set") {
      const type    = interaction.options.getString("type");
      const channel = interaction.options.getChannel("channel");

      await LogConfig.findOneAndUpdate(
        { guildId },
        { $set: { [type]: channel.id } },
        { upsert: true }
      );

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setDescription(`✅ **${type}** logs will be sent to ${channel}`)
        ],
        ephemeral: true
      });
    }

    if (sub === "disable") {
      const type = interaction.options.getString("type");
      await LogConfig.findOneAndUpdate({ guildId }, { $unset: { [type]: "" } });
      return interaction.reply({ content: `✅ **${type}** logs disabled.`, ephemeral: true });
    }

    if (sub === "view") {
      const config = await LogConfig.findOne({ guildId });
      if (!config) return interaction.reply({ content: "No log channels set up yet.", ephemeral: true });

      const types = ["default", "member", "message", "moderation", "voice", "role"];
      const lines = types.map(t => {
        const id = config[t];
        return `**${t}:** ${id ? `<#${id}>` : "not set"}`;
      }).join("\n");

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setAuthor({ name: `${interaction.guild.name} — Log Channels`, iconURL: interaction.guild.iconURL() || undefined })
          .setDescription(lines)
        ],
        ephemeral: true
      });
    }

    if (sub === "reset") {
      await LogConfig.deleteOne({ guildId });
      return interaction.reply({ content: "✅ All log channels cleared.", ephemeral: true });
    }
  }
};