const { EmbedBuilder } = require("discord.js");
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

module.exports = {
  name: "google",
  aliases: ["search", "g"],

  async execute(message, args) {
    if (!args.length) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ Usage: `,google <search query>`")] });
    }

    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ Google Search is not configured. Ask the bot owner to add `SERPAPI_KEY` to Railway variables.")] });
    }

    const query = args.join(" ");
    await message.channel.sendTyping().catch(() => {});

    try {
      const encoded = encodeURIComponent(query);
      const url = `https://serpapi.com/search.json?q=${encoded}&api_key=${apiKey}&num=4&safe=active&engine=google`;

      const data = await fetchJSON(url);

      // Handle errors
      if (data.error) {
        console.error("[Google] SerpApi Error:", data.error);
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ Search error: \`${data.error}\``)] });
      }

      const items = data.organic_results;
      if (!items || items.length === 0) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setDescription(`🔍 No results found for **${query}**`)] });
      }

      const results = items.slice(0, 4).map((item, i) => {
        const title   = item.title?.slice(0, 80)   || "No title";
        const snippet = item.snippet?.slice(0, 120) || "No description";
        const link    = item.link;
        const domain  = link.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
        return `**${i + 1}.** [${title}](${link})\n> ${snippet}\n> \`${domain}\``;
      });

      // Thumbnail from knowledge graph or first result image
      const thumbnail = data.knowledge_graph?.thumbnail
                     || data.organic_results?.[0]?.thumbnail
                     || null;

      const embed = new EmbedBuilder()
        .setColor(0x4285F4)
        .setTitle(`🔍 Results for: ${query.slice(0, 100)}`)
        .setDescription(results.join("\n\n"))
        .setFooter({
          text: `Google Search via SerpApi`,
          iconURL: "https://www.google.com/favicon.ico"
        })
        .setTimestamp();

      if (thumbnail) {
        try { new URL(thumbnail); embed.setThumbnail(thumbnail); } catch {}
      }

      return message.reply({ embeds: [embed] });

    } catch (err) {
      console.error("[,google] Error:", err.message);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ Error: \`${err.message}\``)] });
    }
  }
};