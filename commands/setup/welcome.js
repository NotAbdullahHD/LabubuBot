const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { Config } = require("../../models/schemas");
const { parseCustomEmbed } = require("./parseCustomEmbed");

// ─────────────────────────────────────────────────────
//  /welcome — Configure the welcome embed
//
//  WHY A MODAL?
//  Discord limits slash command string options to 100 chars.
//  Embed codes are always longer than that, so we use a
//  modal (popup form) which supports up to 4000 characters.
//
//  Subcommands:
//    /welcome set     → opens a modal to paste the embed code
//    /welcome preview → shows the saved embed with resolved vars
//    /welcome disable → clears the welcome config
// ─────────────────────────────────────────────────────

module.exports = {
  name: "welcome",
  description: "Configure the welcome embed sent when new members join.",
  slashOnly: true,

  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageGuild")) {
      return interaction.reply({
        content: "❌ You need **Manage Server** permission.",
        ephemeral: true
      });
    }

    let sub;
    try { sub = interaction.options.getSubcommand(); }
    catch {
      return interaction.reply({
        content: "❌ Use a valid subcommand: `set`, `preview`, or `disable`.",
        ephemeral: true
      });
    }

    // ── /welcome set ─────────────────────────────────
    if (sub === "set") {
      const channel = interaction.options.getChannel("channel");

      // Build a modal — no character limit issue
      const modal = new ModalBuilder()
        .setCustomId(`welcome_set_${channel.id}`)
        .setTitle("Paste Your Embed Builder Code");

      const embedInput = new TextInputBuilder()
        .setCustomId("embedCode")
        .setLabel("Embed Code (from the Embed Builder website)")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("{embed}$v{title: Welcome!}$v{description: Hey {user}!}")
        .setRequired(true)
        .setMinLength(7)   // minimum is just "{embed}"
        .setMaxLength(4000);

      modal.addComponents(new ActionRowBuilder().addComponents(embedInput));

      // Show the modal — the response is handled in interactionCreate
      return interaction.showModal(modal);
    }

    // ── /welcome preview ─────────────────────────────
    if (sub === "preview") {
      const data = await Config.findOne({ guildId: interaction.guild.id });

      if (!data?.welcome?.embedCode) {
        return interaction.reply({
          content: "❌ No welcome embed set yet. Use `/welcome set` first.",
          ephemeral: true
        });
      }

      let embed;
      try {
        embed = parseCustomEmbed(data.welcome.embedCode, {
          member: interaction.member,
          user:   interaction.user,
          guild:  interaction.guild
        });
      } catch (err) {
        return interaction.reply({
          content: `❌ Error parsing saved embed: \`${err.message}\``,
          ephemeral: true
        });
      }

      return interaction.reply({
        content: `👀 **Preview** — this is what new members will see:\n*(Variables resolved using your info)*`,
        embeds:  [embed],
        ephemeral: true
      });
    }

    // ── /welcome disable ─────────────────────────────
    if (sub === "disable") {
      await Config.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $unset: { "welcome.channel": "", "welcome.embedCode": "" } },
        { upsert: true }
      );

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xf04747)
            .setDescription("🔕 Welcome system disabled. Members will no longer receive a welcome embed.")
        ],
        ephemeral: true
      });
    }
  }
};