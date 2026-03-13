const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { EcoUser } = require("../../models/schemas");

module.exports = {
  name: "rich",
  aliases: ["richlist", "wealthy", "topmoney", "richest"],

  async execute(message) {
    const guildId = message.guild.id;

    // Fetch all users with money, sorted by total (wallet + bank)
    const all = await EcoUser.find({}).sort({ wallet: -1 }).limit(100);

    // Filter to guild members only
    const members = await message.guild.members.fetch();
    const memberIds = new Set(members.map(m => m.id));

    const filtered = all
      .filter(u => memberIds.has(u.userId))
      .slice(0, 50);

    if (!filtered.length) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x2b2d31)
          .setDescription("No economy data yet! Start earning with `,work` and `,daily`")
        ]
      });
    }

    const pages = Math.max(1, Math.ceil(filtered.length / 10));
    let page = 0;

    async function buildEmbed(p) {
      const slice = filtered.slice(p * 10, p * 10 + 10);
      const medals = ["🥇", "🥈", "🥉"];

      const lines = await Promise.all(slice.map(async (u, i) => {
        const rank   = p * 10 + i + 1;
        const medal  = rank <= 3 ? medals[rank - 1] : `**${rank}.**`;
        const member = members.get(u.userId);
        const name   = member ? member.displayName : u.userId;
        const total  = (u.wallet || 0) + (u.bank || 0);
        return `${medal} **${name}** — 💰 ${total.toLocaleString()} coins`;
      }));

      // Highlight requester's rank
      const myEntry = filtered.findIndex(u => u.userId === message.author.id);
      const myRank  = myEntry !== -1 ? `\nYour rank: **#${myEntry + 1}**` : "";

      return new EmbedBuilder()
        .setTitle("💰 Richest Members")
        .setDescription(lines.join("\n") + myRank)
        .setColor(0xFFD700)
        .setThumbnail(message.guild.iconURL())
        .setFooter({ text: `Page ${p + 1}/${pages} • Total tracked: ${filtered.length} members` });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("rich_prev").setEmoji("◀").setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId("rich_next").setEmoji("▶").setStyle(ButtonStyle.Secondary).setDisabled(pages <= 1)
    );

    const msg = await message.reply({ embeds: [await buildEmbed(0)], components: pages > 1 ? [row] : [] });

    if (pages <= 1) return;

    const col = msg.createMessageComponentCollector({ time: 60_000 });

    col.on("collect", async interaction => {
      if (interaction.customId === "rich_prev") page--;
      if (interaction.customId === "rich_next") page++;

      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("rich_prev").setEmoji("◀").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId("rich_next").setEmoji("▶").setStyle(ButtonStyle.Secondary).setDisabled(page >= pages - 1)
      );

      await interaction.update({ embeds: [await buildEmbed(page)], components: [updatedRow] });
    });

    col.on("end", () => msg.edit({ components: [] }).catch(() => {}));
  }
};