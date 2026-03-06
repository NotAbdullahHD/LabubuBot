const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { TriviaScore } = require("../../models/schemas");

module.exports = {
  name: "trivialb",
  aliases: ["triviaboard", "trivialeaderboard"],

  async execute(message) {
    const guildId = message.guild.id;
    const total   = await TriviaScore.countDocuments({ guildId });
    const pages   = Math.max(1, Math.ceil(total / 10));
    let   page    = 0;

    async function buildEmbed(p) {
      const entries = await TriviaScore.find({ guildId }).sort({ score: -1 }).skip(p * 10).limit(10);
      if (!entries.length) {
        return new EmbedBuilder()
          .setTitle("🧠 Trivia Leaderboard")
          .setDescription("No scores yet! Start a game with `,trivia`")
          .setColor(0x5865F2);
      }
      const list = entries.map((e, i) => `${p * 10 + i + 1}. ${e.username} — **${e.score}** points`).join("\n");
      return new EmbedBuilder()
        .setTitle("🧠 Trivia Leaderboard")
        .setDescription(`Top trivia players in the server\n\n${list}`)
        .setColor(0x5865F2)
        .setFooter({ text: `Page ${p + 1}/${pages}` });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("tlb_prev").setEmoji("◀").setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId("tlb_next").setEmoji("▶").setStyle(ButtonStyle.Secondary).setDisabled(pages <= 1)
    );

    const msg = await message.reply({ embeds: [await buildEmbed(0)], components: [row] });

    const col = msg.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 60_000 });

    col.on("collect", async interaction => {
      if (interaction.customId === "tlb_prev") page--;
      if (interaction.customId === "tlb_next") page++;

      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("tlb_prev").setEmoji("◀").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId("tlb_next").setEmoji("▶").setStyle(ButtonStyle.Secondary).setDisabled(page >= pages - 1)
      );

      await interaction.update({ embeds: [await buildEmbed(page)], components: [updatedRow] });
    });

    col.on("end", () => msg.edit({ components: [] }).catch(() => {}));
  }
};