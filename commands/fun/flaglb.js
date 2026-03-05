const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { FlagScore } = require("../../models/schemas");

module.exports = {
  name: "flaglb",
  aliases: ["flagleaderboard", "flags"],

  async execute(message) {
    const guildId = message.guild.id;
    const total = await FlagScore.countDocuments({ guildId });
    if (!total) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setDescription("No flag scores yet! Start a game with `,flag`")] });
    }

    const pageSize = 10;
    let page = 0;
    const totalPages = Math.ceil(total / pageSize);

    const getPage = async (p) => {
      const entries = await FlagScore.find({ guildId })
        .sort({ score: -1 })
        .skip(p * pageSize)
        .limit(pageSize);

      const list = entries.map((e, i) =>
        `${p * pageSize + i + 1}. ${e.username} — **${e.score}** points`
      ).join("\n");

      return new EmbedBuilder()
        .setTitle(",flags leaderboard")
        .setDescription(`Top flag guessers in the server\n\n${list}`)
        .setColor(0x2b2d31)
        .setFooter({ text: `Page ${p + 1}/${totalPages}` });
    };

    const buildRow = (p, disabled = false) => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("flb_prev").setEmoji("◀").setStyle(ButtonStyle.Secondary).setDisabled(disabled || p === 0),
      new ButtonBuilder().setCustomId("flb_next").setEmoji("▶").setStyle(ButtonStyle.Secondary).setDisabled(disabled || p >= totalPages - 1)
    );

    const msg = await message.reply({ embeds: [await getPage(page)], components: totalPages > 1 ? [buildRow(page)] : [] });
    if (totalPages <= 1) return;

    const col = msg.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 60_000 });

    col.on("collect", async i => {
      if (i.customId === "flb_prev" && page > 0) page--;
      else if (i.customId === "flb_next" && page < totalPages - 1) page++;
      await i.update({ embeds: [await getPage(page)], components: [buildRow(page)] });
    });

    col.on("end", () => msg.edit({ components: [buildRow(page, true)] }).catch(() => {}));
  }
};