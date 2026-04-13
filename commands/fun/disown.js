const { EmbedBuilder } = require("discord.js");
const { Family } = require("../../models/schemas");

const fail = (desc) => new EmbedBuilder().setColor(0xED4245).setDescription(desc);

module.exports = {
  name: "disown",
  async execute(message, args, client) {
    const target = message.mentions.users.first();

    if (!target) return message.reply({ embeds: [fail("Mention a child to disown.")] });

    const authorData = await Family.findOne({ userId: message.author.id });
    if (!authorData || !authorData.children.includes(target.id))
      return message.reply({ embeds: [fail("That user is not your child.")] });

    authorData.children = authorData.children.filter(id => id !== target.id);
    await authorData.save();

    if (authorData.partnerId) {
      const partnerData = await Family.findOne({ userId: authorData.partnerId });
      if (partnerData) {
        partnerData.children = partnerData.children.filter(id => id !== target.id);
        await partnerData.save();
      }
    }

    const childData = await Family.findOne({ userId: target.id });
    if (childData) { childData.parent = null; await childData.save(); }

    message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
      .setDescription(`🚪 **${target.username}** is no longer part of your family.`)
    ]});
  }
};