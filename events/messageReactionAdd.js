const { EmbedBuilder } = require("discord.js");
const { Sobs, StarboardConfig, StarboardEntry } = require("../models/schemas");
const { handleReactionIncome } = require("../commands/economy/economy");

module.exports = {
  name: "messageReactionAdd",
  async execute(reaction, user, client) {
    // Fetch partials
    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }
    if (reaction.message.partial) {
      try { await reaction.message.fetch(); } catch { return; }
    }

    if (user.bot) return;

    const message = reaction.message;
    const guild   = message.guild;
    if (!guild) return;

    // ── Economy reaction income ───────────────────────────
    await handleReactionIncome(reaction, user);

    // ── Sobs counter ──────────────────────────────────────
    if (reaction.emoji.name === "😭") {
      const messageAuthor = message.author;
      if (!messageAuthor || messageAuthor.bot || messageAuthor.id === user.id) return;

      await Sobs.findOneAndUpdate(
        { userId: messageAuthor.id },
        { $inc: { count: 1 } },
        { upsert: true }
      );
    }

    // ── Starboard ─────────────────────────────────────────
    try {
      const config = await StarboardConfig.findOne({ guildId: guild.id });

      // Not configured, disabled, or no channel set
      if (!config || !config.enabled || !config.channelId) return;

      // Check if this reaction matches the configured emoji
      const emojiMatch = reaction.emoji.id
        ? `<${reaction.emoji.animated ? "a" : ""}:${reaction.emoji.name}:${reaction.emoji.id}>` === config.emoji
        : reaction.emoji.name === config.emoji;

      if (!emojiMatch) return;

      // Don't starboard the bot's own messages or messages in the starboard channel
      if (message.author?.bot) return;
      if (message.channel.id === config.channelId) return;

      // Check reaction count
      const count = reaction.count;
      if (count < config.threshold) return;

      // Already posted?
      const existing = await StarboardEntry.findOne({ originalMsgId: message.id });
      if (existing) {
        // Update the count on the existing starboard post
        if (existing.starboardMsgId) {
          const sbChannel = guild.channels.cache.get(config.channelId);
          if (sbChannel) {
            const sbMsg = await sbChannel.messages.fetch(existing.starboardMsgId).catch(() => null);
            if (sbMsg) {
              const newContent = `${config.emoji} **${count}** · <#${message.channel.id}>`;
              await sbMsg.edit({ content: newContent }).catch(() => {});
            }
          }
        }
        return;
      }

      // Get the starboard channel
      const sbChannel = guild.channels.cache.get(config.channelId);
      if (!sbChannel) return;

      // Build the starboard embed
      const embed = new EmbedBuilder()
        .setColor(0xFFAC33)
        .setAuthor({
          name:    message.author.username,
          iconURL: message.author.displayAvatarURL({ size: 128 })
        })
        .setTimestamp(message.createdAt);

      // Add message content if any
      if (message.content) {
        embed.setDescription(message.content.slice(0, 4096));
      }

      // Add image if attached
      const image = message.attachments.find(a => a.contentType?.startsWith("image/"));
      if (image) embed.setImage(image.url);

      // Add jump link field
      embed.addFields({ name: "Source", value: `[Jump to message](${message.url})`, inline: true });
      embed.addFields({ name: "Channel", value: `<#${message.channel.id}>`, inline: true });

      // Send to starboard
      const sbMsg = await sbChannel.send({
        content: `${config.emoji} **${count}** · <#${message.channel.id}>`,
        embeds:  [embed]
      });

      // Save entry so we don't double-post
      await StarboardEntry.create({
        guildId:        guild.id,
        originalMsgId:  message.id,
        starboardMsgId: sbMsg.id
      });

    } catch (err) {
      console.error("[Starboard] Error:", err.message);
    }
  }
};