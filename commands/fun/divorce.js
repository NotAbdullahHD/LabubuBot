const { EmbedBuilder } = require("discord.js");
const { Family } = require("../../models/schemas");

module.exports = {
  name: "divorce",
  async execute(message, args, client) {
    const createEmbed = (title, desc, color) => new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color).setFooter({ text: "Family System" });

    let data = await Family.findOne({ userId: message.author.id });
    if (!data || !data.partnerId) return message.reply({ embeds: [createEmbed("Error", "You are not married.", 0xed4245)] });

    const partnerId = data.partnerId;
    let partnerData = await Family.findOne({ userId: partnerId });

    // Update DB
    data.partnerId = null;
    if (partnerData) {
      partnerData.partnerId = null;
      await partnerData.save();
    }
    await data.save();

    message.reply({ embeds: [createEmbed("💔 Divorce Complete", "You are now single.", 0xed4245)] });
  }
};