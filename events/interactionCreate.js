const { EmbedBuilder } = require("discord.js");
const { Config, LevelConfig } = require("../models/schemas");
const { parseCustomEmbed } = require("../commands/setup/parseCustomEmbed");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {

    // ── Slash Commands ────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        return interaction.reply({ content: "❌ Command not found.", ephemeral: true });
      }
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        const errMsg = { content: "❌ There was an error executing this command!", ephemeral: true };
        if (interaction.replied || interaction.deferred) await interaction.followUp(errMsg);
        else await interaction.reply(errMsg);
      }
    }

    // ── Modal Submissions ─────────────────────────────────
    if (interaction.isModalSubmit()) {

      // /welcome set modal
      if (interaction.customId.startsWith("welcome_set_")) {
        const channelId  = interaction.customId.replace("welcome_set_", "");
        const embedCode  = interaction.fields.getTextInputValue("embedCode").trim();
        const channel    = interaction.guild.channels.cache.get(channelId);

        await interaction.deferReply({ ephemeral: true });

        if (!channel) {
          return interaction.editReply({ content: "❌ That channel no longer exists. Run `/welcome set` again." });
        }

        const botPerms = channel.permissionsFor(interaction.guild.members.me);
        if (!botPerms?.has("SendMessages") || !botPerms?.has("EmbedLinks")) {
          return interaction.editReply({
            content: `❌ I don't have **Send Messages** or **Embed Links** in ${channel}.`
          });
        }

        if (!embedCode.startsWith("{embed}")) {
          return interaction.editReply({
            content: "❌ Invalid embed code — must start with `{embed}`.\nBuild one at the **Embed Builder** on the website."
          });
        }

        try {
          parseCustomEmbed(embedCode, { guild: interaction.guild });
        } catch (err) {
          return interaction.editReply({ content: `❌ Embed code error: \`${err.message}\`` });
        }

        await Config.findOneAndUpdate(
          { guildId: interaction.guild.id },
          { $set: { "welcome.channel": channelId, "welcome.embedCode": embedCode } },
          { upsert: true, new: true }
        );

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x57F287)
              .setTitle("✅ Welcome System Configured")
              .setDescription(`New members will receive the welcome embed in ${channel}.`)
              .addFields({ name: "Variables", value: "`{user}` `{user.name}` `{user.avatar}` `{server}` `{server.count}` `{date}`" })
              .setFooter({ text: "Use /welcome preview to test it" })
          ]
        });
      }

      // /levels message modal
      if (interaction.customId === "levels_message_modal") {
        const embedCode = interaction.fields.getTextInputValue("embedCode").trim();

        await interaction.deferReply({ ephemeral: true });

        // Empty = reset to default
        if (!embedCode) {
          await LevelConfig.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { $set: { embedCode: null } },
            { upsert: true }
          );
          return interaction.editReply({
            embeds: [new EmbedBuilder().setColor(0x57F287).setDescription("✅ Level-up message reset to default.")]
          });
        }

        if (!embedCode.startsWith("{embed}")) {
          return interaction.editReply({
            content: "❌ Embed code must start with `{embed}`. Build one on the **Embed Builder** website."
          });
        }

        // Test parse — use level vars so it doesn't error on {level} placeholder
        const testCode = embedCode
          .replace(/\{level\}/g,    "5")
          .replace(/\{xp\}/g,       "500")
          .replace(/\{next\.xp\}/g, "878");

        try {
          parseCustomEmbed(testCode, {
            member: interaction.member,
            user:   interaction.user,
            guild:  interaction.guild
          });
        } catch (err) {
          return interaction.editReply({ content: `❌ Embed code error: \`${err.message}\`` });
        }

        await LevelConfig.findOneAndUpdate(
          { guildId: interaction.guild.id },
          { $set: { embedCode } },
          { upsert: true }
        );

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x57F287)
              .setTitle("✅ Custom Level-Up Embed Saved")
              .addFields({
                name: "Level Variables",
                value: "`{level}` `{xp}` `{next.xp}` `{user}` `{user.name}` `{user.avatar}` `{server}`"
              })
              .setFooter({ text: "Test it by earning XP in chat" })
          ]
        });
      }
    }
  }
};