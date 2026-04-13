const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { EcoUser } = require("../../models/schemas");

module.exports = {
  name: "rich",
  aliases: ["richlist", "wealthy", "topmoney", "richest"],

  async execute(message) {
    const all = await EcoUser.find({}).limit(500);
    all.sort((a, b) => ((b.wallet || 0) + (b.bank || 0)) - ((a.wallet || 0) + (a.bank || 0)));

    if (!all.length) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setAuthor({ name: `${message.guild.name} — Richest Members`, iconURL: message.guild.iconURL() || undefined })
          .setDescription("No economy data yet. Start earning with `,work`")
        ]
      });
    }

    const userCache = new Map();
    for (const u of all) {
      try {
        const member = await message.guild.members.fetch(u.userId);
        userCache.set(u.userId, member);
      } catch { }
    }

    const filtered = all.filter(u => userCache.has(u.userId));
    if (!filtered.length) return message.reply({ embeds: [new EmbedBuilder().setColor(0xFFB6C1).setDescription("No data found.")] });

    const pages  = Math.max(1, Math.ceil(filtered.length / 10));
    let   page   = 0;
    const medals = ["🥇", "🥈", "🥉"];

    const myEntry = filtered.findIndex(u => u.userId === message.author.id);

    async function buildEmbed(p) {
      const slice = filtered.slice(p * 10, p * 10 + 10);

      const lines = slice.map((u, i) => {
        const rank   = p * 10 + i + 1;
        const badge  = rank <= 3 ? medals[rank - 1] : `\`${rank}.\``;
        const name   = userCache.get(u.userId)?.displayName || "Unknown";
        const total  = (u.wallet || 0) + (u.bank || 0);
        return `${badge} ${name} — **${total.toLocaleString()}**`;
      });

      const footer = myEntry !== -1
        ? `Your rank: #${myEntry + 1}  •  Page ${p + 1} of ${pages}`
        : `Page ${p + 1} of ${pages}`;

      return new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setAuthor({ name: `${message.guild.name} — Richest Members`, iconURL: message.guild.iconURL() || undefined })
        .setDescription(lines.join("\n"))
        .setFooter({ text: footer });
    }

    const buildRow = (p, disabled = false) => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("rich_prev").setLabel("←").setStyle(ButtonStyle.Secondary).setDisabled(disabled || p === 0),
      new ButtonBuilder().setCustomId("rich_next").setLabel("→").setStyle(ButtonStyle.Secondary).setDisabled(disabled || p >= pages - 1)
    );

    const msg = await message.reply({ embeds: [await buildEmbed(0)], components: pages > 1 ? [buildRow(0)] : [] });
    if (pages <= 1) return;

    const col = msg.createMessageComponentCollector({ time: 60_000 });

    col.on("collect", async interaction => {
      if (interaction.customId === "rich_prev") page--;
      if (interaction.customId === "rich_next") page++;
      await interaction.update({ embeds: [await buildEmbed(page)], components: [buildRow(page)] });
    });

    col.on("end", () => msg.edit({ components: [buildRow(page, true)] }).catch(() => {}));
  }
};