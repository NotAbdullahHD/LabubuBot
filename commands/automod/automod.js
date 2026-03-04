const { EmbedBuilder } = require("discord.js");
const { AutomodConfig } = require("../../models/schemas");

module.exports = {
  name: "automod",
  description: "Configure the automod system",
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

      const getConfig = () => AutomodConfig.findOneAndUpdate(
        { guildId },
        { $setOnInsert: { guildId } },
        { upsert: true, new: true }
      );

      // ── enable / disable ──────────────────────────────────
      if (sub === "enable") {
        await AutomodConfig.findOneAndUpdate({ guildId }, { $set: { enabled: true } }, { upsert: true });
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0x57F287).setDescription("✅ Automod **enabled**.")],
          ephemeral: true
        });
      }

      if (sub === "disable") {
        await AutomodConfig.findOneAndUpdate({ guildId }, { $set: { enabled: false } }, { upsert: true });
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("🔕 Automod **disabled**.")],
          ephemeral: true
        });
      }

      // ── badwords ──────────────────────────────────────────
      if (sub === "badwords") {
        const toggle = interaction.options.getString("toggle");
        const word   = interaction.options.getString("word")?.toLowerCase().trim();

        if (toggle === "on" || toggle === "off") {
          await AutomodConfig.findOneAndUpdate(
            { guildId },
            { $set: { badwords: toggle === "on" } },
            { upsert: true }
          );
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(toggle === "on" ? 0x57F287 : 0xED4245)
              .setDescription(`${toggle === "on" ? "✅" : "🔕"} Bad word filter **${toggle === "on" ? "enabled" : "disabled"}**.`)],
            ephemeral: true
          });
        }

        if (toggle === "add" && word) {
          await AutomodConfig.findOneAndUpdate(
            { guildId },
            { $addToSet: { wordList: word } },
            { upsert: true }
          );
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`✅ Added \`${word}\` to the bad word list.`)],
            ephemeral: true
          });
        }

        if (toggle === "remove" && word) {
          await AutomodConfig.findOneAndUpdate(
            { guildId },
            { $pull: { wordList: word } }
          );
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`✅ Removed \`${word}\` from the bad word list.`)],
            ephemeral: true
          });
        }

        if (toggle === "list") {
          const config = await getConfig();
          const words = config.wordList;
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(0x5865F2)
              .setTitle("🚫 Bad Word List")
              .setDescription(words.length ? words.map(w => `\`${w}\``).join(", ") : "No words added yet.")],
            ephemeral: true
          });
        }
      }

      // ── antispam ──────────────────────────────────────────
      if (sub === "antispam") {
        const toggle  = interaction.options.getString("toggle");
        const count   = interaction.options.getInteger("count");
        const seconds = interaction.options.getInteger("seconds");

        if (toggle === "on" || toggle === "off") {
          await AutomodConfig.findOneAndUpdate(
            { guildId },
            { $set: { antispam: toggle === "on" } },
            { upsert: true }
          );
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(toggle === "on" ? 0x57F287 : 0xED4245)
              .setDescription(`${toggle === "on" ? "✅" : "🔕"} Anti-spam **${toggle === "on" ? "enabled" : "disabled"}**.`)],
            ephemeral: true
          });
        }

        if (toggle === "set") {
          if (!count || !seconds) {
            return interaction.reply({ content: "❌ Provide both `count` and `seconds`.", ephemeral: true });
          }
          if (count < 2 || count > 30)   return interaction.reply({ content: "❌ Count must be 2–30.", ephemeral: true });
          if (seconds < 1 || seconds > 30) return interaction.reply({ content: "❌ Seconds must be 1–30.", ephemeral: true });

          await AutomodConfig.findOneAndUpdate(
            { guildId },
            { $set: { spamCount: count, spamSeconds: seconds } },
            { upsert: true }
          );
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(0x57F287)
              .setDescription(`✅ Spam threshold set to **${count} messages** in **${seconds} seconds**.`)],
            ephemeral: true
          });
        }
      }

      // ── antiinvite ────────────────────────────────────────
      if (sub === "antiinvite") {
        const toggle = interaction.options.getString("toggle");
        await AutomodConfig.findOneAndUpdate(
          { guildId },
          { $set: { antiinvite: toggle === "on" } },
          { upsert: true }
        );
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(toggle === "on" ? 0x57F287 : 0xED4245)
            .setDescription(`${toggle === "on" ? "✅" : "🔕"} Anti-invite **${toggle === "on" ? "enabled" : "disabled"}**.`)],
          ephemeral: true
        });
      }

      // ── action ────────────────────────────────────────────
      if (sub === "action") {
        const action     = interaction.options.getString("type");
        const timeoutMins = interaction.options.getInteger("timeout_mins") ?? 5;

        await AutomodConfig.findOneAndUpdate(
          { guildId },
          { $set: { action, timeoutMins } },
          { upsert: true }
        );

        const actionText = action === "delete"  ? "🗑️ Delete message only"
                         : action === "warn"    ? "⚠️ Delete + warn user"
                         : `⏱️ Delete + timeout user for ${timeoutMins} minute(s)`;

        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0x57F287)
            .setDescription(`✅ Automod action set to: **${actionText}**`)],
          ephemeral: true
        });
      }

      // ── exempt ────────────────────────────────────────────
      if (sub === "exempt") {
        const type    = interaction.options.getString("type");
        const role    = interaction.options.getRole("role");
        const channel = interaction.options.getChannel("channel");
        const action  = interaction.options.getString("action");

        if (type === "role" && role) {
          const update = action === "add"
            ? { $addToSet: { exemptRoles: role.id } }
            : { $pull:     { exemptRoles: role.id } };
          await AutomodConfig.findOneAndUpdate({ guildId }, update, { upsert: true });
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(0x57F287)
              .setDescription(`✅ ${action === "add" ? "Added" : "Removed"} ${role} ${action === "add" ? "to" : "from"} exempt roles.`)],
            ephemeral: true
          });
        }

        if (type === "channel" && channel) {
          const update = action === "add"
            ? { $addToSet: { exemptChannels: channel.id } }
            : { $pull:     { exemptChannels: channel.id } };
          await AutomodConfig.findOneAndUpdate({ guildId }, update, { upsert: true });
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(0x57F287)
              .setDescription(`✅ ${action === "add" ? "Added" : "Removed"} ${channel} ${action === "add" ? "to" : "from"} exempt channels.`)],
            ephemeral: true
          });
        }
      }

      // ── logs ──────────────────────────────────────────────
      if (sub === "logs") {
        const channel = interaction.options.getChannel("channel");
        await AutomodConfig.findOneAndUpdate(
          { guildId },
          { $set: { logChannel: channel?.id ?? null } },
          { upsert: true }
        );
        const text = channel ? `✅ Automod logs will be sent to ${channel}.` : "✅ Automod log channel cleared.";
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(text)],
          ephemeral: true
        });
      }

      // ── info ──────────────────────────────────────────────
      if (sub === "info") {
        const config = await getConfig();
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x5865F2)
              .setTitle("🛡️ Automod Settings")
              .addFields(
                { name: "Status",       value: config.enabled    ? "✅ Enabled"  : "❌ Disabled",  inline: true },
                { name: "Bad Words",    value: config.badwords   ? "✅ On"       : "❌ Off",        inline: true },
                { name: "Anti-Spam",    value: config.antispam   ? "✅ On"       : "❌ Off",        inline: true },
                { name: "Anti-Invite",  value: config.antiinvite ? "✅ On"       : "❌ Off",        inline: true },
                { name: "Spam Limit",   value: `${config.spamCount} msgs / ${config.spamSeconds}s`, inline: true },
                { name: "Action",       value: config.action,                                        inline: true },
                { name: "Timeout",      value: `${config.timeoutMins} min(s)`,                      inline: true },
                { name: "Word List",    value: `${config.wordList.length} words`,                   inline: true },
                { name: "Log Channel",  value: config.logChannel ? `<#${config.logChannel}>` : "*(none)*", inline: true },
                { name: "Exempt Roles",    value: config.exemptRoles.length    ? config.exemptRoles.map(r => `<@&${r}>`).join(" ")    : "*(none)*", inline: false },
                { name: "Exempt Channels", value: config.exemptChannels.length ? config.exemptChannels.map(c => `<#${c}>`).join(" ") : "*(none)*", inline: false }
              )
          ],
          ephemeral: true
        });
      }

    } catch (err) {
      console.error("[/automod] Error:", err);
      const msg = { content: `❌ Error: \`${err.message}\``, ephemeral: true };
      if (interaction.replied || interaction.deferred) return interaction.followUp(msg);
      return interaction.reply(msg);
    }
  }
};