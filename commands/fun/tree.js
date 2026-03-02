const { EmbedBuilder } = require("discord.js");
const { Family } = require("../../models/schemas");

module.exports = {
  name: "tree",
  async execute(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    let data = await Family.findOne({ userId: user.id });

    if (!data) data = { partnerId: null, children: [] };

    const partner = data.partnerId ? `<@${data.partnerId}>` : "None";
    const children = data.children.length > 0 ? data.children.map(id => `<@${id}>`).join(", ") : "None";

    const embed = new EmbedBuilder()
      .setTitle("🌳 Family Tree")
      .setDescription(`**Partner:** ${partner}\n**Children:** ${children}`)
      .setColor(0x2f3136)
      .setFooter({ text: "Family System" });

    message.reply({ embeds: [embed] });
  }
};