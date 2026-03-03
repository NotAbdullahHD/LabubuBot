const { EmbedBuilder, SlashCommandBuilder, ChannelType } = require("discord.js");
const { StarboardConfig } = require("../../models/schemas");

module.exports = {
  name: "starboard",
  description: "Configure the starboard system",
  slashOnly: true,

  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has("ManageGuild")) {
        return interaction.reply({ content: "❌ You need **Manage Server** permission.", ephemeral: true });
      }

      let sub;
      try { sub = interaction.options.getSubcommand(); }
      catch { return interaction.reply({ content: "❌ Use a valid subcommand.", ephemeral: true }); }

      const guildId = interaction.guild.id;

      // ── set ──────────────────────────────────────────────
      if (sub === "set") {
        const channel   = interaction.options.getChannel("channel");
        const emoji     = interaction.options.getString("emoji") || "⭐";
        const threshold = interaction.options.getInteger("threshold") || 3;

        // Validate emoji — accept unicode emoji or custom emoji format <:name:id> or <a:name:id>
        const unicodeEmojiRegex = /\p{Emoji}/u;
        const customEmojiRegex  = /^<a?:\w+:\d+>$/;
        if (!unicodeEmojiRegex.test(emoji) && !customEmojiRegex.test(emoji)) {
          return interaction.reply({ content: "❌ Invalid emoji. Use a standard emoji like ⭐ 😭 🔥 or a server emoji.", ephemeral: true });
        }

        if (threshold < 1 || threshold > 100) {
          return interaction.reply({ content: "❌ Threshold must be between 1 and 100.", ephemeral: true });
        }

        await StarboardConfig.findOneAndUpdate(
          { guildId },
          { $set: { channelId: channel.id, emoji, threshold, enabled: true } },
          { upsert: true }
        );

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFFAC33)
              .setTitle("⭐ Starboard Configured")
              .addFields(
                { name: "Channel",   value: `${channel}`,       inline: true },
                { name: "Emoji",     value: emoji,              inline: true },
                { name: "Threshold", value: `${threshold} reactions`, inline: true }
              )
              .setFooter({ text: "Messages that hit the threshold will be posted in the starboard!" })
          ],
          ephemeral: true
        });
      }

      // ── disable ───────────────────────────────────────────
      if (sub === "disable") {
        await StarboardConfig.findOneAndUpdate({ guildId }, { $set: { enabled: false } }, { upsert: true });
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("🔕 Starboard has been **disabled**.")],
          ephemeral: true
        });
      }

      // ── enable ────────────────────────────────────────────
      if (sub === "enable") {
        const config = await StarboardConfig.findOne({ guildId });
        if (!config?.channelId) {
          return interaction.reply({ content: "❌ Set a channel first with `/starboard set`.", ephemeral: true });
        }
        await StarboardConfig.findOneAndUpdate({ guildId }, { $set: { enabled: true } });
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0x57F287).setDescription("✅ Starboard has been **enabled**.")],
          ephemeral: true
        });
      }

      // ── info ──────────────────────────────────────────────
      if (sub === "info") {
        const config = await StarboardConfig.findOne({ guildId });
        if (!config?.channelId) {
          return interaction.reply({ content: "❌ Starboard not configured yet. Use `/starboard set` first.", ephemeral: true });
        }
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFFAC33)
              .setTitle("⭐ Starboard Settings")
              .addFields(
                { name: "Status",    value: config.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
                { name: "Channel",   value: `<#${config.channelId}>`,                      inline: true },
                { name: "Emoji",     value: config.emoji,                                  inline: true },
                { name: "Threshold", value: `${config.threshold} reactions`,               inline: true }
              )
          ],
          ephemeral: true
        });
      }

    } catch (err) {
      console.error("[/starboard] Error:", err);
      const msg = { content: `❌ Error: \`${err.message}\``, ephemeral: true };
      if (interaction.replied || interaction.deferred) return interaction.followUp(msg);
      return interaction.reply(msg);
    }
  }
};