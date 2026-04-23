const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { EcoUser } = require("../../models/schemas");

module.exports = {
  name: "ecoreset",
  aliases: ["reseteco"],

  async execute(message) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ You need **Administrator** permission.");
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("eco_reset_confirm").setLabel("Yes, reset everyone").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("eco_reset_cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xED4245)
      .setDescription("⚠️ **Are you sure?**\nThis will reset **everyone's** wallet and bank to 0.\nThis cannot be undone.")
    ], components: [row]});

    const col = msg.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 30_000 });

    col.on("collect", async i => {
      if (i.customId === "eco_reset_confirm") {
        await EcoUser.updateMany({}, { $set: { wallet: 0, bank: 0 } });
        await i.update({ embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setDescription("✅ All economy balances have been reset to 0.")
        ], components: [] });
      } else {
        await i.update({ embeds: [new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setDescription("❌ Reset cancelled.")
        ], components: [] });
      }
    });

    col.on("end", (_, reason) => {
      if (reason === "time") msg.edit({ components: [] }).catch(() => {});
    });
  }
};