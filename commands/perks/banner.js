const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "banner",
  async execute(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    const fetchedUser = await client.users.fetch(user.id, { force: true });

    if (!fetchedUser.banner) {
      return message.reply("❌ This user has no banner.");
    }

    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Banner`)
      .setImage(fetchedUser.bannerURL({ size: 1024, dynamic: true }))
      .setColor("Purple");

    message.reply({ embeds: [embed] });
  }
};