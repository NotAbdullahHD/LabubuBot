const { EmbedBuilder } = require("discord.js");
const https = require("https");

// ─────────────────────────────────────────────────────
//  ,google <query>
//  Uses Google Custom Search API (free, 100/day)
//  Requires in .env:
//    GOOGLE_API_KEY=your_key
//    GOOGLE_CSE_ID=your_search_engine_id
// ─────────────────────────────────────────────────────

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

    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId  = process.env.GOOGLE_CSE_ID;

    if (!apiKey || !cseId) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ Google Search is not configured yet. Ask the bot owner to add the API key.")] });
    }

    const query = args.join(" ");

    // Show typing indicator
    await message.channel.sendTyping().catch(() => {});

    try {
      const encoded = encodeURIComponent(query);
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encoded}&num=4&safe=active`;

      const data = await fetchJSON(url);

      // Handle API errors
      if (data.error) {
        if (data.error.code === 429) {
          return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ Daily search limit reached (100/day). Try again tomorrow!")] });
        }
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ API Error: \`${data.error.message}\``)] });
      }

      const items = data.items;
      if (!items || items.length === 0) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setDescription(`🔍 No results found for **${query}**`)] });
      }

      // Build results
      const results = items.slice(0, 4).map((item, i) => {
        const title   = item.title?.slice(0, 80)   || "No title";
        const snippet = item.snippet?.slice(0, 120) || "No description";
        const link    = item.link;
        // Clean up domain for display
        const domain  = link.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
        return `**${i + 1}.** [${title}](${link})\n> ${snippet}\n> \`${domain}\``;
      });

      // Get thumbnail from first result if available
      const thumbnail = data.items[0]?.pagemap?.cse_image?.[0]?.src
                     || data.items[0]?.pagemap?.cse_thumbnail?.[0]?.src
                     || null;

      const embed = new EmbedBuilder()
        .setColor(0x4285F4)  // Google blue
        .setTitle(`🔍 Results for: ${query.slice(0, 100)}`)
        .setDescription(results.join("\n\n"))
        .setFooter({
          text: `Google Custom Search  •  ${data.searchInformation?.totalResults ? Number(data.searchInformation.totalResults).toLocaleString() : "?"} results`,
          iconURL: "https://www.google.com/favicon.ico"
        })
        .setTimestamp();

      if (thumbnail) {
        try { new URL(thumbnail); embed.setThumbnail(thumbnail); } catch {}
      }

      return message.reply({ embeds: [embed] });

    } catch (err) {
      console.error("[,google] Error:", err.message);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ Something went wrong while searching. Try again!")] });
    }
  }
};