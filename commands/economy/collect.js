const { EmbedBuilder } = require("discord.js");
const { EcoUser, ShopItem } = require("../../models/schemas");

module.exports = {
  name: "collect",
  aliases: ["claim"],

  async execute(message) {
    const user  = message.author;
    const owned = await ShopItem.find({ userId: user.id });

    if (!owned.length) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xED4245)
          .setDescription("❌ You don't own any shop items! Buy one with `,shop`")
        ]
      });
    }

    const now = Date.now();
    let totalEarned = 0;
    const lines = [];

    for (const item of owned) {
      const hoursElapsed = (now - item.lastPaid) / 3_600_000;
      const earned       = Math.floor(hoursElapsed * item.incomePerHr);

      if (earned <= 0) {
        lines.push(`📦 **${item.name}** — nothing to collect yet`);
        continue;
      }

      totalEarned   += earned;
      item.lastPaid  = now;
      await item.save();

      lines.push(`📦 **${item.name}** — +**${earned.toLocaleString()}** coins`);
    }

    if (totalEarned === 0) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xFEE75C)
          .setDescription("⏳ Nothing to collect yet! Come back in a bit.")
        ]
      });
    }

    await EcoUser.findOneAndUpdate(
      { userId: user.id },
      { $inc: { wallet: totalEarned } },
      { upsert: true }
    );

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x57F287)
        .setAuthor({ name: `${user.username}'s Collection`, iconURL: user.displayAvatarURL() })
        .setDescription(lines.join("\n"))
        .addFields({ name: "💰 Total Collected", value: `**${totalEarned.toLocaleString()}** coins added to your wallet!` })
        .setFooter({ text: "Items generate income every hour" })
      ]
    });
  }
};