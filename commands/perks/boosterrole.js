const { EmbedBuilder } = require("discord.js");
const { Config, BoosterRole } = require("../../models/schemas");

// ── /boosterrole ──────────────────────────────────────────────
//  award  — set the thank-you channel (role stored separately via BoosterRole schema)
//  unset  — clear settings
//  list   — show current settings

module.exports = {
  name: "boosterrole",
  description: "Configure Booster Role Rewards",
  slashOnly: true,

  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageGuild")) {
      return interaction.reply({ content: "❌ You need **Manage Server** permission.", ephemeral: true });
    }

    let sub;
    try { sub = interaction.options.getSubcommand(); }
    catch {
      return interaction.reply({ content: "❌ Use a valid subcommand: `award`, `unset`, or `list`.", ephemeral: true });
    }

    if (sub === "award") {
      const role    = interaction.options.getRole("role");
      const channel = interaction.options.getChannel("channel");

      // ✅ FIXED: was only saving channel, never saving the role
      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $set: { "booster.channelId": channel.id, "booster.roleId": role.id } },
        { upsert: true }
      );

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF73FA)
            .setTitle("✅ Booster System Configured")
            .addFields(
              { name: "📢 Thank-You Channel", value: `${channel}`, inline: true },
              { name: "🎁 Reward Role",        value: `${role}`,    inline: true }
            )
        ],
        ephemeral: true
      });
    }

    if (sub === "unset") {
      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $unset: { booster: "" } }
      );
      return interaction.reply({ content: "✅ Booster settings cleared.", ephemeral: true });
    }

    if (sub === "list") {
      const data = await Config.findOne({ guildId: interaction.guild.id });
      if (!data?.booster?.channelId) {
        return interaction.reply({ content: "❌ No booster settings found. Use `/boosterrole award` first.", ephemeral: true });
      }
      const roleText = data.booster.roleId ? `<@&${data.booster.roleId}>` : "*(not set)*";
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF73FA)
            .setTitle("🚀 Booster Settings")
            .addFields(
              { name: "Channel", value: `<#${data.booster.channelId}>`, inline: true },
              { name: "Role",    value: roleText,                        inline: true }
            )
        ],
        ephemeral: true
      });
    }
  }
};