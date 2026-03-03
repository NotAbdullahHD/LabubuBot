const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require("discord.js");
const { Config, LevelConfig, TicketConfig, Ticket } = require("../models/schemas");
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

    // ── Button Interactions ───────────────────────────────
    if (interaction.isButton()) {

      // ── Open Ticket button ────────────────────────────
      if (interaction.customId === "ticket_open") {
        await interaction.deferReply({ ephemeral: true });

        const guildId = interaction.guild.id;
        const config  = await TicketConfig.findOne({ guildId });

        if (!config) {
          return interaction.editReply({ content: "❌ Ticket system not configured. Ask an admin to run `/ticket setup`." });
        }

        // Check if user already has an open ticket
        const existing = await Ticket.findOne({ guildId, userId: interaction.user.id });
        if (existing) {
          return interaction.editReply({ content: `❌ You already have an open ticket: <#${existing.channelId}>` });
        }

        // Increment ticket counter
        const updatedConfig = await TicketConfig.findOneAndUpdate(
          { guildId },
          { $inc: { counter: 1 } },
          { new: true }
        );
        const ticketNum = updatedConfig.counter;
        const ticketName = `ticket-${String(ticketNum).padStart(4, "0")}`;

        // Build permission overwrites
        const overwrites = [
          {
            id:    interaction.guild.roles.everyone.id,
            deny:  [PermissionFlagsBits.ViewChannel]
          },
          {
            id:    interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          {
            id:    interaction.guild.members.me.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels]
          }
        ];

        // Add support role if configured
        if (config.supportRole) {
          overwrites.push({
            id:    config.supportRole,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          });
        }

        // Create the ticket channel
        const channelOptions = {
          name:                 ticketName,
          type:                 ChannelType.GuildText,
          topic:                `Ticket #${ticketNum} | Opened by ${interaction.user.tag}`,
          permissionOverwrites: overwrites
        };
        if (config.categoryId) channelOptions.parent = config.categoryId;

        const ticketChannel = await interaction.guild.channels.create(channelOptions);

        // Save ticket to DB
        await Ticket.create({
          guildId,
          channelId: ticketChannel.id,
          userId:    interaction.user.id,
          ticketNum
        });

        // Send welcome message inside the ticket
        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`🎫 Ticket #${ticketNum}`)
          .setDescription(
            `Welcome ${interaction.user}! Support will be with you shortly.\n\n` +
            `Please describe your issue in detail and be patient.\n\n` +
            `> Use the buttons below to manage this ticket.`
          )
          .setFooter({ text: `Opened by ${interaction.user.tag}` })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("Close Ticket")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🔒"),
          new ButtonBuilder()
            .setCustomId("ticket_claim")
            .setLabel("Claim")
            .setStyle(ButtonStyle.Success)
            .setEmoji("✋")
        );

        const pingContent = config.supportRole
          ? `${interaction.user} | <@&${config.supportRole}>`
          : `${interaction.user}`;

        await ticketChannel.send({ content: pingContent, embeds: [welcomeEmbed], components: [row] });

        return interaction.editReply({ content: `✅ Your ticket has been opened: ${ticketChannel}` });
      }

      // ── Claim Ticket button ───────────────────────────
      if (interaction.customId === "ticket_claim") {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        if (!ticket) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });

        if (ticket.claimedBy) {
          return interaction.reply({ content: `❌ Already claimed by <@${ticket.claimedBy}>.`, ephemeral: true });
        }

        await Ticket.findOneAndUpdate(
          { channelId: interaction.channel.id },
          { $set: { claimedBy: interaction.user.id } }
        );

        await interaction.channel.setTopic(`Ticket #${ticket.ticketNum} | Claimed by ${interaction.user.tag}`).catch(() => {});

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x57F287)
              .setDescription(`✋ **${interaction.user}** has claimed this ticket and will assist you.`)
          ]
        });
      }

      // ── Close Ticket button ───────────────────────────
      if (interaction.customId === "ticket_close") {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        if (!ticket) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });

        await interaction.deferReply();

        // Collect transcript
        let transcript = `Ticket #${ticket.ticketNum} — Opened by <@${ticket.userId}>\n`;
        transcript += `Closed by: ${interaction.user.tag} at ${new Date().toUTCString()}\n`;
        transcript += `${"─".repeat(60)}\n\n`;

        try {
          const messages = await interaction.channel.messages.fetch({ limit: 100 });
          const sorted = [...messages.values()].reverse();
          for (const msg of sorted) {
            if (msg.author.bot && msg.embeds.length && !msg.content) continue;
            const time = msg.createdAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
            transcript += `[${time}] ${msg.author.tag}: ${msg.content || "*(embed)*"}\n`;
          }
        } catch {}

        // Send transcript to log channel
        const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
        if (config?.logChannel) {
          const logCh = interaction.guild.channels.cache.get(config.logChannel);
          if (logCh) {
            const logEmbed = new EmbedBuilder()
              .setColor(0xED4245)
              .setTitle(`🎫 Ticket #${ticket.ticketNum} Closed`)
              .addFields(
                { name: "Opened by", value: `<@${ticket.userId}>`,       inline: true },
                { name: "Closed by", value: `${interaction.user}`,       inline: true },
                { name: "Claimed by", value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : "*(unclaimed)*", inline: true }
              )
              .setTimestamp();

            // Send transcript as a text attachment
            const { AttachmentBuilder } = require("discord.js");
            const buffer = Buffer.from(transcript, "utf-8");
            const attachment = new AttachmentBuilder(buffer, { name: `ticket-${ticket.ticketNum}.txt` });
            await logCh.send({ embeds: [logEmbed], files: [attachment] }).catch(() => {});
          }
        }

        // Delete from DB
        await Ticket.findOneAndDelete({ channelId: interaction.channel.id });

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("🔒 Ticket closing in 5 seconds...")]
        });

        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      }
    }

    // ── Modal Submissions ─────────────────────────────────
    if (interaction.isModalSubmit()) {

      // /welcome set modal
      if (interaction.customId.startsWith("welcome_set_")) {
        const channelId = interaction.customId.replace("welcome_set_", "");
        const embedCode = interaction.fields.getTextInputValue("embedCode").trim();
        const channel   = interaction.guild.channels.cache.get(channelId);

        await interaction.deferReply({ ephemeral: true });

        if (!channel) {
          return interaction.editReply({ content: "❌ That channel no longer exists. Run `/welcome set` again." });
        }

        const botPerms = channel.permissionsFor(interaction.guild.members.me);
        if (!botPerms?.has("SendMessages") || !botPerms?.has("EmbedLinks")) {
          return interaction.editReply({ content: `❌ I don't have **Send Messages** or **Embed Links** in ${channel}.` });
        }

        if (!embedCode.startsWith("{embed}")) {
          return interaction.editReply({ content: "❌ Invalid embed code — must start with `{embed}`.\nBuild one at the **Embed Builder** on the website." });
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
          return interaction.editReply({ content: "❌ Embed code must start with `{embed}`. Build one on the **Embed Builder** website." });
        }

        const testCode = embedCode
          .replace(/\{level\}/g,    "5")
          .replace(/\{xp\}/g,       "500")
          .replace(/\{next\.xp\}/g, "878");

        try {
          parseCustomEmbed(testCode, { member: interaction.member, user: interaction.user, guild: interaction.guild });
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
              .addFields({ name: "Level Variables", value: "`{level}` `{xp}` `{next.xp}` `{user}` `{user.name}` `{user.avatar}` `{server}`" })
              .setFooter({ text: "Test it by earning XP in chat" })
          ]
        });
      }
    }
  }
};