const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { LevelConfig, LevelUser } = require("../../models/schemas");

module.exports = {
  name: "levels",
  description: "Configure the leveling system.",
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

      const getConfig = () => LevelConfig.findOneAndUpdate(
        { guildId },
        { $setOnInsert: { guildId } },
        { upsert: true, new: true }
      );

      // ── enable ────────────────────────────────────────
      if (sub === "enable") {
        await LevelConfig.findOneAndUpdate({ guildId }, { $set: { enabled: true } }, { upsert: true });
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0x57F287).setDescription("✅ Leveling system **enabled**.")],
          ephemeral: true
        });
      }

      // ── disable ───────────────────────────────────────
      if (sub === "disable") {
        await LevelConfig.findOneAndUpdate({ guildId }, { $set: { enabled: false } }, { upsert: true });
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("🔕 Leveling system **disabled**.")],
          ephemeral: true
        });
      }

      // ── channel ───────────────────────────────────────
      if (sub === "channel") {
        const channel = interaction.options.getChannel("channel");
        await LevelConfig.findOneAndUpdate({ guildId }, { $set: { channel: channel?.id ?? null } }, { upsert: true });
        const text = channel
          ? `✅ Level-up messages will now be sent to ${channel}.`
          : "✅ Level-up messages will now reply in the same channel as the message.";
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(text)],
          ephemeral: true
        });
      }

      // ── multiplier ────────────────────────────────────
      if (sub === "multiplier") {
        const mult = interaction.options.getNumber("value");
        if (mult < 0.1 || mult > 10)
          return interaction.reply({ content: "❌ Multiplier must be between 0.1 and 10.", ephemeral: true });
        await LevelConfig.findOneAndUpdate({ guildId }, { $set: { multiplier: mult } }, { upsert: true });
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`✅ XP multiplier set to **${mult}×**.`)],
          ephemeral: true
        });
      }

      // ── message — opens modal to paste embed code ─────
      if (sub === "message") {
        // Fetch current saved embed code to pre-fill the modal (if any)
        const config = await LevelConfig.findOne({ guildId });
        const savedCode = config?.embedCode ?? "";

        const modal = new ModalBuilder()
          .setCustomId("levels_message_modal")
          .setTitle("Custom Level-Up Embed Code");

        const input = new TextInputBuilder()
          .setCustomId("embedCode")
          .setLabel("Paste Embed code (empty = reset to default)")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("{embed}$v{title: 🎉 {user.name} leveled up!}$v{description: You reached Level {level}!}")
          .setRequired(false)
          .setMaxLength(4000);

        // Only call setValue if there's an actual non-empty string — empty/null crashes discord.js
        if (savedCode && savedCode.length > 0) {
          input.setValue(savedCode);
        }

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      // ── add role reward ───────────────────────────────
      if (sub === "add") {
        const level = interaction.options.getInteger("level");
        const role  = interaction.options.getRole("role");

        if (level < 1 || level > 500)
          return interaction.reply({ content: "❌ Level must be between 1 and 500.", ephemeral: true });
        if (role.managed || role.id === interaction.guild.id)
          return interaction.reply({ content: "❌ That role cannot be used as a reward.", ephemeral: true });

        const config = await getConfig();
        const idx = config.rewards.findIndex(r => r.level === level);
        if (idx !== -1) config.rewards[idx] = { level, roleId: role.id };
        else config.rewards.push({ level, roleId: role.id });
        config.rewards.sort((a, b) => a.level - b.level);
        config.markModified("rewards");
        await config.save();

        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(
            `✅ Members who reach **Level ${level}** will receive <@&${role.id}>.`
          )],
          ephemeral: true
        });
      }

      // ── remove role reward ────────────────────────────
      if (sub === "remove") {
        const level  = interaction.options.getInteger("level");
        const config = await getConfig();
        const before = config.rewards.length;
        config.rewards = config.rewards.filter(r => r.level !== level);
        config.markModified("rewards");
        await config.save();

        if (config.rewards.length === before)
          return interaction.reply({ content: `❌ No reward was set for Level ${level}.`, ephemeral: true });

        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`✅ Removed role reward for Level ${level}.`)],
          ephemeral: true
        });
      }

      // ── rewards list ──────────────────────────────────
      if (sub === "rewards") {
        const config = await getConfig();
        if (!config.rewards?.length)
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription("No level rewards configured yet.\nUse `/levels add <level> @role` to add one.")],
            ephemeral: true
          });

        const rows = config.rewards.map(r => `**Level ${r.level}** → <@&${r.roleId}>`).join("\n");
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle("🏆 Level Role Rewards").setDescription(rows)],
          ephemeral: true
        });
      }

      // ── reset user ────────────────────────────────────
      if (sub === "reset") {
        const target = interaction.options.getUser("user");
        await LevelUser.findOneAndDelete({ guildId, userId: target.id });
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`✅ Reset XP and level for **${target.username}**.`)],
          ephemeral: true
        });
      }

      // ── info ──────────────────────────────────────────
      if (sub === "info") {
        const config = await getConfig();
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x5865F2)
              .setTitle("⚙️ Leveling Configuration")
              .addFields(
                { name: "Status",       value: config.enabled !== false ? "✅ Enabled" : "❌ Disabled",  inline: true },
                { name: "Channel",      value: config.channel ? `<#${config.channel}>` : "Same channel", inline: true },
                { name: "Multiplier",   value: `${config.multiplier ?? 1}×`,                             inline: true },
                { name: "Role Rewards", value: `${config.rewards?.length ?? 0} configured`,              inline: true },
                { name: "Custom Embed", value: config.embedCode ? "✅ Set" : "❌ Default",                inline: true }
              )
              .setFooter({ text: "/levels message to set custom embed · /levels add to set role rewards" })
          ],
          ephemeral: true
        });
      }

    } catch (err) {
      // Log the REAL error so we can debug it from console
      console.error("[/levels] Error:", err);
      const msg = { content: `❌ Error: \`${err.message}\``, ephemeral: true };
      if (interaction.replied || interaction.deferred) return interaction.followUp(msg);
      return interaction.reply(msg);
    }
  }
};