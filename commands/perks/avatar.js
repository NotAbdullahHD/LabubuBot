const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "avatar",
  async execute(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Avatar`)
      .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
      .setColor("Blurple");

    message.reply({ embeds: [embed] });
  }
};