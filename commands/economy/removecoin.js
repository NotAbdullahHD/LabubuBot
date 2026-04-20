const { EmbedBuilder } = require("discord.js");
const { EcoUser } = require("../../models/schemas");

module.exports = {
  name: "removecoin",
  aliases: ["removecoins", "deduct"],

  async execute(message, args) {
    if (!message.member.permissions.has("ManageGuild")) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ You don't have permission to use this.")] });
    }

    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ Usage: `,removecoin @user <amount>`")] });
    if (!amount || isNaN(amount) || amount <= 0) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ Usage: `,removecoin @user <amount>`")] });

    const data = await EcoUser.findOne({ userId: target.id });
    if (!data) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ That user has no economy data.")] });

    const total = (data.wallet || 0) + (data.bank || 0);
    if (amount > total) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ They only have **${total.toLocaleString()}** coins total.`)] });

    // Deduct from wallet first, then bank if needed
    const fromWallet = Math.min(amount, data.wallet);
    const fromBank   = amount - fromWallet;

    data.wallet = Math.max(0, data.wallet - fromWallet);
    data.bank   = Math.max(0, data.bank - fromBank);
    await data.save();

    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xFFB6C1)
      .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
      .setDescription(`🗑️ Removed **${amount.toLocaleString()}** coins from **${target.username}**`)
      .addFields(
        { name: "👛 New Wallet", value: `**${data.wallet.toLocaleString()}**`, inline: true },
        { name: "🏦 New Bank",   value: `**${data.bank.toLocaleString()}**`,   inline: true }
      )
      .setFooter({ text: "Coins permanently deleted" })
    ]});
  }
};