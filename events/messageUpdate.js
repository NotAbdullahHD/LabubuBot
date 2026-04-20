const { EmbedBuilder } = require("discord.js");
const { sendLog }      = require("../commands/setup/logHelper");

module.exports = {
  name: "messageUpdate",
  async execute(oldMessage, newMessage, client) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setAuthor({ name: `${newMessage.author.tag}`, iconURL: newMessage.author.displayAvatarURL() })
      .setDescription(`**Message edited in** ${newMessage.channel} — [Jump](${newMessage.url})`)
      .addFields(
        { name: "Before", value: oldMessage.content?.slice(0, 1024) || "*No content*" },
        { name: "After",  value: newMessage.content?.slice(0, 1024) || "*No content*" }
      )
      .setFooter({ text: `User ID: ${newMessage.author.id}` })
      .setTimestamp();

    await sendLog(newMessage.guild, "message", embed);
  }
};