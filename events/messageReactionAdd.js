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
    // ✅ FIXED: removed early return — was killing starboard code for 😭 emoji
    if (reaction.emoji.name === "😭") {
      const messageAuthor = message.author;
      if (messageAuthor && !messageAuthor.bot && messageAuthor.id !== user.id) {
        await Sobs.findOneAndUpdate(
          { userId: messageAuthor.id },
          { $inc: { count: 1 } },
          { upsert: true }
        ).catch(() => {});
      }
    }

    // ── Starboard ─────────────────────────────────────────
    try {
      const config = await StarboardConfig.findOne({ guildId: guild.id });
      if (!config || !config.enabled || !config.channelId) return;

      // ✅ FIXED: strip variation selectors from both sides before comparing
      // Unicode variation selectors (like \uFE0F) can silently break emoji matching
      const normalize = (str) => str?.replace(/\uFE0F/g, "").trim() ?? "";

      let emojiMatch = false;
      if (reaction.emoji.id) {
        // Custom server emoji — match as <:name:id> or <a:name:id>
        const full = `<${reaction.emoji.animated ? "a" : ""}:${reaction.emoji.name}:${reaction.emoji.id}>`;
        emojiMatch = full === config.emoji;
      } else {
        // Unicode emoji — normalize both before comparing
        emojiMatch = normalize(reaction.emoji.name) === normalize(config.emoji);
      }

      if (!emojiMatch) return;

      // Don't starboard bot messages or messages inside the starboard channel itself
      if (message.author?.bot) return;
      if (message.channel.id === config.channelId) return;

      // Check reaction count meets threshold
      const count = reaction.count;
      if (count < config.threshold) return;

      // Already posted? Just update the count line
      const existing = await StarboardEntry.findOne({ originalMsgId: message.id });
      if (existing?.starboardMsgId) {
        const sbChannel = guild.channels.cache.get(config.channelId);
        if (sbChannel) {
          const sbMsg = await sbChannel.messages.fetch(existing.starboardMsgId).catch(() => null);
          if (sbMsg) {
            await sbMsg.edit({
              content: `${config.emoji} **${count}** · <#${message.channel.id}>`
            }).catch(() => {});
          }
        }
        return;
      }
      if (existing) return; // posted but message was deleted — skip

      // Get starboard channel
      const sbChannel = guild.channels.cache.get(config.channelId);
      if (!sbChannel) return;

      // Build embed
      const embed = new EmbedBuilder()
        .setColor(0xFFAC33)
        .setAuthor({
          name:    message.author.username,
          iconURL: message.author.displayAvatarURL({ size: 128 })
        })
        .setTimestamp(message.createdAt);

      if (message.content) {
        embed.setDescription(message.content.slice(0, 4096));
      }

      // Include image attachment if any
      const image = message.attachments.find(a => a.contentType?.startsWith("image/"));
      if (image) embed.setImage(image.url);

      embed.addFields(
        { name: "Source",  value: `[Jump to message](${message.url})`, inline: true },
        { name: "Channel", value: `<#${message.channel.id}>`,          inline: true }
      );

      // Send to starboard
      const sbMsg = await sbChannel.send({
        content: `${config.emoji} **${count}** · <#${message.channel.id}>`,
        embeds:  [embed]
      });

      // Save so we don't double-post
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