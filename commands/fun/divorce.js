const { EmbedBuilder } = require("discord.js");
const { Family } = require("../../models/schemas");

const fail = (desc) => new EmbedBuilder().setColor(0xED4245).setDescription(desc);

module.exports = {
  name: "divorce",
  async execute(message, args, client) {
    const data = await Family.findOne({ userId: message.author.id });
    if (!data || !data.partnerId) return message.reply({ embeds: [fail("You are not married.")] });

    const partnerData = await Family.findOne({ userId: data.partnerId });
    const partnerId   = data.partnerId;

    data.partnerId = null;
    if (partnerData) { partnerData.partnerId = null; await partnerData.save(); }
    await data.save();

    message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
      .setDescription(`💔 You divorced <@${partnerId}>.`)
    ]});
  }
};