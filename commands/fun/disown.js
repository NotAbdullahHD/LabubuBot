const { EmbedBuilder } = require("discord.js");
const { Family } = require("../../models/schemas");

module.exports = {
  name: "disown",
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    const createEmbed = (title, desc, color) => new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color).setFooter({ text: "Family System" });

    if (!target) return message.reply({ embeds: [createEmbed("Error", "Mention a valid child.", 0xed4245)] });

    let authorData = await Family.findOne({ userId: message.author.id });
    if (!authorData || !authorData.children.includes(target.id)) 
      return message.reply({ embeds: [createEmbed("Error", "That user is not your child.", 0xed4245)] });

    // Remove from Author
    authorData.children = authorData.children.filter(id => id !== target.id);
    await authorData.save();

    // Remove from Partner (if any)
    if (authorData.partnerId) {
      let partnerData = await Family.findOne({ userId: authorData.partnerId });
      if (partnerData) {
        partnerData.children = partnerData.children.filter(id => id !== target.id);
        await partnerData.save();
      }
    }

    // Update Child
    let childData = await Family.findOne({ userId: target.id });
    if (childData) {
      childData.parent = null;
      await childData.save();
    }

    message.reply({ embeds: [createEmbed("🚪 Disowned", `${target} is no longer part of the family.`, 0xffa500)] });
  }
};