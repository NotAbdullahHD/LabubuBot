const { EmbedBuilder } = require("discord.js");
const { AutoReact } = require("../../models/schemas");

module.exports = {
  name: "autoreact",
  description: "Auto react to every message in a channel",
  slashOnly: true,

  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageGuild")) {
      return interaction.reply({ content: "❌ You need **Manage Server** permission.", ephemeral: true });
    }

    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // ── set ───────────────────────────────────────────────
    if (sub === "set") {
      const channel = interaction.options.getChannel("channel");
      const raw     = interaction.options.getString("emojis");
      const emojis  = raw.trim().split(/\s+/).slice(0, 5); // max 5 emojis

      await AutoReact.findOneAndUpdate(
        { guildId, channelId: channel.id },
        { $set: { emojis } },
        { upsert: true }
      );

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle("✅ Auto React Set")
          .setDescription(`Bot will react with ${emojis.join(" ")} to every message in ${channel}`)
        ],
        ephemeral: true
      });
    }

    // ── remove ────────────────────────────────────────────
    if (sub === "remove") {
      const channel = interaction.options.getChannel("channel");
      await AutoReact.deleteOne({ guildId, channelId: channel.id });
      return interaction.reply({ content: `✅ Auto react removed from ${channel}`, ephemeral: true });
    }

    // ── list ──────────────────────────────────────────────
    if (sub === "list") {
      const all = await AutoReact.find({ guildId });
      if (!all.length) return interaction.reply({ content: "No auto react channels set up.", ephemeral: true });

      const lines = all.map(e => `<#${e.channelId}> — ${e.emojis.join(" ")}`).join("\n");
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x2b2d31).setTitle("Auto React Channels").setDescription(lines)],
        ephemeral: true
      });
    }
  }
};