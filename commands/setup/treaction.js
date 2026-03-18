const { EmbedBuilder } = require("discord.js");
const { TriggerReact } = require("../../models/schemas");

module.exports = {
  name: "treaction",
  description: "React with an emoji when a trigger word is detected",
  slashOnly: true,

  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageGuild")) {
      return interaction.reply({ content: "❌ You need **Manage Server** permission.", ephemeral: true });
    }

    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // ── set ───────────────────────────────────────────────
    if (sub === "set") {
      const trigger = interaction.options.getString("trigger").toLowerCase().trim();
      const emoji   = interaction.options.getString("emoji").trim();

      await TriggerReact.findOneAndUpdate(
        { guildId, trigger },
        { $set: { emoji } },
        { upsert: true }
      );

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle("✅ Trigger Reaction Set")
          .setDescription(`Bot will react with ${emoji} when someone says **${trigger}**`)
        ],
        ephemeral: true
      });
    }

    // ── remove ────────────────────────────────────────────
    if (sub === "remove") {
      const trigger = interaction.options.getString("trigger").toLowerCase().trim();
      const deleted = await TriggerReact.deleteOne({ guildId, trigger });
      if (!deleted.deletedCount) return interaction.reply({ content: `❌ No trigger found for \`${trigger}\``, ephemeral: true });
      return interaction.reply({ content: `✅ Removed trigger reaction for \`${trigger}\``, ephemeral: true });
    }

    // ── list ──────────────────────────────────────────────
    if (sub === "list") {
      const all = await TriggerReact.find({ guildId });
      if (!all.length) return interaction.reply({ content: "No trigger reactions set up.", ephemeral: true });

      const lines = all.map(e => `${e.emoji} — \`${e.trigger}\``).join("\n");
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x2b2d31).setTitle("Trigger Reactions").setDescription(lines)],
        ephemeral: true
      });
    }
  }
};