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

    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId  = process.env.GOOGLE_CSE_ID;

    if (!apiKey || !cseId) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ Google Search is not configured. Ask the bot owner to add `GOOGLE_API_KEY` and `GOOGLE_CSE_ID` to Railway variables.")] });
    }

    const query = args.join(" ");
    await message.channel.sendTyping().catch(() => {});

    try {
      const encoded = encodeURIComponent(query);
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encoded}&num=4&safe=active`;

      const data = await fetchJSON(url);

      // Show full error details so we can debug
      if (data.error) {
        const code     = data.error.code;
        const message_ = data.error.message;
        const status   = data.error.status || "unknown";
        const reason   = data.error.errors?.[0]?.reason || "unknown";

        console.error("[Google] API Error:", JSON.stringify(data.error));

        if (code === 429) {
          return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ Daily search limit reached (100/day). Try again tomorrow!")] });
        }

        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle("❌ Google API Error")
            .addFields(
              { name: "Code",    value: `\`${code}\``,     inline: true },
              { name: "Status",  value: `\`${status}\``,   inline: true },
              { name: "Reason",  value: `\`${reason}\``,   inline: true },
              { name: "Message", value: `\`${message_}\`` }
            )]
        });
      }

      const items = data.items;
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

      const thumbnail = data.items[0]?.pagemap?.cse_image?.[0]?.src
                     || data.items[0]?.pagemap?.cse_thumbnail?.[0]?.src
                     || null;

      const embed = new EmbedBuilder()
        .setColor(0x4285F4)
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
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ Error: \`${err.message}\``)] });
    }
  }
};