const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "snipe",
  async execute(message, args, client) {
    const snipe = client.snipes.get(message.channel.id);

    if (!snipe) {
      return message.reply("❌ Nothing to snipe!");
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: snipe.author, iconURL: snipe.avatar })
      .setDescription(snipe.content)
      .setFooter({ text: `Deleted ${Math.floor((Date.now() - snipe.time) / 1000)}s ago` })
      .setColor("Red");

    if (snipe.image) embed.setImage(snipe.image);

    message.reply({ embeds: [embed] });
  }
};