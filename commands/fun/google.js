const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const https = require("https");

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error("Failed to parse response")); }
      });
    }).on("error", reject);
  });
}

// ── Build embed for a single result page ─────────────────
function buildEmbed(item, index, total, query, type) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: message_author_placeholder })  // filled in below
    .setColor(0x4285F4)
    .setFooter({
      text: `Page ${index + 1}/${total} of Google ${type === "image" ? "Images" : "Search"} (Safe Mode)`,
      iconURL: "https://www.google.com/favicon.ico"
    });

  if (type === "image") {
    embed.setTitle(`${item.title?.slice(0, 100) || "Image result"}`);
    if (item.original) embed.setImage(item.original);
    else if (item.thumbnail) embed.setImage(item.thumbnail);
    const domain = item.link?.replace(/https?:\/\/(www\.)?/, "").split("/")[0] || "";
    if (domain) embed.setDescription(`[${domain}](${item.link})`);
  } else {
    const title   = item.title?.slice(0, 80) || "No title";
    const snippet = item.snippet?.slice(0, 300) || "No description";
    const link    = item.link || "";
    const domain  = link.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
    embed.setTitle(title).setURL(link).setDescription(`${snippet}\n\n\`${domain}\``);
    if (item.thumbnail) embed.setThumbnail(item.thumbnail);
  }

  return embed;
}

// ── Build pagination row ──────────────────────────────────
function buildRow(index, total, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("gsearch_prev")
      .setEmoji("◀")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled || index === 0),
    new ButtonBuilder()
      .setCustomId("gsearch_next")
      .setEmoji("▶")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled || index >= total - 1),
    new ButtonBuilder()
      .setCustomId("gsearch_close")
      .setEmoji("✖")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled)
  );
}

module.exports = {
  name: "google",
  aliases: ["search", "g"],

  async execute(message, args) {
    if (!args.length) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ Usage: `,google <query>` or `,image <query>`")] });
    }

    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ Search not configured. Ask the bot owner to add `SERPAPI_KEY`.")] });
    }

    // Detect if this was called as ,image
    const type = (message.content.startsWith(",image") || message.content.startsWith(">image") || message.content.startsWith("!image")) ? "image" : "web";
    const query = args.join(" ");

    await message.channel.sendTyping().catch(() => {});

    try {
      const encoded = encodeURIComponent(query);
      const url = type === "image"
        ? `https://serpapi.com/search.json?q=${encoded}&api_key=${apiKey}&engine=google_images&safe=active&num=10`
        : `https://serpapi.com/search.json?q=${encoded}&api_key=${apiKey}&engine=google&safe=active&num=10`;

      const data = await fetchJSON(url);

      if (data.error) {
        console.error("[Google] SerpApi Error:", data.error);
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ Search error: \`${data.error}\``)] });
      }

      const items = type === "image" ? data.images_results : data.organic_results;
      if (!items || items.length === 0) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setDescription(`🔍 No results found for **${query}**`)] });
      }

      let index = 0;
      const total = Math.min(items.length, 10);

      // Build first embed
      const makeEmbed = (i) => {
        const item = items[i];
        const embed = new EmbedBuilder()
          .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
          .setColor(0x4285F4)
          .setFooter({
            text: `Page ${i + 1}/${total} of Google ${type === "image" ? "Images" : "Search"} (Safe Mode)`,
            iconURL: "https://www.google.com/favicon.ico"
          });

        if (type === "image") {
          embed.setTitle(item.title?.slice(0, 100) || "Image result");
          const img = item.original || item.thumbnail;
          if (img) embed.setImage(img);
          const domain = item.link?.replace(/https?:\/\/(www\.)?/, "").split("/")[0] || "";
          if (domain) embed.setDescription(`[${domain}](${item.link})`);
        } else {
          const title   = item.title?.slice(0, 80)   || "No title";
          const snippet = item.snippet?.slice(0, 300) || "No description";
          const link    = item.link || "";
          const domain  = link.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
          embed.setTitle(title).setURL(link).setDescription(`${snippet}\n\n\`${domain}\``);
          if (item.thumbnail) embed.setThumbnail(item.thumbnail);
        }

        return embed;
      };

      const reply = await message.reply({
        embeds:     [makeEmbed(index)],
        components: [buildRow(index, total)]
      });

      // ── Button collector ─────────────────────────────
      const collector = reply.createMessageComponentCollector({
        filter: i => i.user.id === message.author.id,
        time:   120_000  // 2 minutes
      });

      collector.on("collect", async interaction => {
        if (interaction.customId === "gsearch_prev" && index > 0) index--;
        else if (interaction.customId === "gsearch_next" && index < total - 1) index++;
        else if (interaction.customId === "gsearch_close") {
          collector.stop("closed");
          await reply.delete().catch(() => {});
          return;
        }

        await interaction.update({
          embeds:     [makeEmbed(index)],
          components: [buildRow(index, total)]
        }).catch(() => {});
      });

      collector.on("end", (_, reason) => {
        if (reason === "closed") return;
        // Disable buttons after timeout
        reply.edit({ components: [buildRow(index, total, true)] }).catch(() => {});
      });

    } catch (err) {
      console.error("[,google] Error:", err.message);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ Error: \`${err.message}\``)] });
    }
  }
};