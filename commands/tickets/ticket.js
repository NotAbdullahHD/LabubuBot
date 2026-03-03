const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionFlagsBits
} = require("discord.js");
const { TicketConfig, Ticket } = require("../../models/schemas");

module.exports = {
  name: "ticket",
  description: "Configure the ticket system",
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

      // ── setup ─────────────────────────────────────────────
      if (sub === "setup") {
        const category    = interaction.options.getChannel("category");
        const supportRole = interaction.options.getRole("role");
        const logChannel  = interaction.options.getChannel("logs");

        await TicketConfig.findOneAndUpdate(
          { guildId },
          {
            $set: {
              categoryId:  category?.id  ?? null,
              supportRole: supportRole?.id ?? null,
              logChannel:  logChannel?.id  ?? null
            }
          },
          { upsert: true }
        );

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x5865F2)
              .setTitle("🎫 Ticket System Configured")
              .addFields(
                { name: "Category",     value: category    ? category.name       : "*(none — tickets go to root)*", inline: true },
                { name: "Support Role", value: supportRole ? `${supportRole}`    : "*(none set)*",                  inline: true },
                { name: "Log Channel",  value: logChannel  ? `${logChannel}`     : "*(none set)*",                  inline: true }
              )
              .setFooter({ text: "Use /ticket panel to post the open-ticket button" })
          ],
          ephemeral: true
        });
      }

      // ── panel ─────────────────────────────────────────────
      if (sub === "panel") {
        const config = await TicketConfig.findOne({ guildId });
        if (!config) {
          return interaction.reply({ content: "❌ Run `/ticket setup` first.", ephemeral: true });
        }

        const title       = interaction.options.getString("title")       || "🎫 Support Tickets";
        const description = interaction.options.getString("description") || "Click the button below to open a support ticket.\nOur team will assist you as soon as possible.";
        const color       = interaction.options.getString("color")       || "#5865F2";

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

        try { embed.setColor(color); } catch { embed.setColor(0x5865F2); }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_open")
            .setLabel("Open Ticket")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("🎫")
        );

        await interaction.reply({ content: "✅ Panel posted!", ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: [row] });
      }

      // ── add ───────────────────────────────────────────────
      if (sub === "add") {
        const target  = interaction.options.getUser("user");
        const channel = interaction.channel;

        const ticket = await Ticket.findOne({ channelId: channel.id });
        if (!ticket) {
          return interaction.reply({ content: "❌ This is not a ticket channel.", ephemeral: true });
        }

        await channel.permissionOverwrites.edit(target.id, {
          ViewChannel:    true,
          SendMessages:   true,
          ReadMessageHistory: true
        });

        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`✅ Added ${target} to this ticket.`)]
        });
      }

      // ── remove ────────────────────────────────────────────
      if (sub === "remove") {
        const target  = interaction.options.getUser("user");
        const channel = interaction.channel;

        const ticket = await Ticket.findOne({ channelId: channel.id });
        if (!ticket) {
          return interaction.reply({ content: "❌ This is not a ticket channel.", ephemeral: true });
        }

        if (target.id === ticket.userId) {
          return interaction.reply({ content: "❌ You can't remove the ticket creator.", ephemeral: true });
        }

        await channel.permissionOverwrites.edit(target.id, { ViewChannel: false });

        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`✅ Removed ${target} from this ticket.`)]
        });
      }

    } catch (err) {
      console.error("[/ticket] Error:", err);
      const msg = { content: `❌ Error: \`${err.message}\``, ephemeral: true };
      if (interaction.replied || interaction.deferred) return interaction.followUp(msg);
      return interaction.reply(msg);
    }
  }
};