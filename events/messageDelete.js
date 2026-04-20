const { EmbedBuilder } = require("discord.js");
const { sendLog }      = require("../commands/setup/logHelper");

module.exports = {
  name: "messageDelete",
  async execute(message, client) {
    if (!message.guild || message.author?.bot) return;

    // Save snipe (existing)
    if (client.snipes) {
      client.snipes.set(message.channel.id, {
        content: message.content || "*No text (Image/Embed)*",
        author:  message.author?.tag,
        avatar:  message.author?.displayAvatarURL(),
        time:    Date.now(),
        image:   message.attachments.first()?.proxyURL || null
      });
    }

    if (!message.author) return;

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({ name: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setDescription(`**Message deleted in** ${message.channel}\n\n${message.content || "*No content*"}`)
      .setFooter({ text: `User ID: ${message.author.id}` })
      .setTimestamp();

    if (message.attachments.size > 0) {
      embed.addFields({ name: "Attachment", value: message.attachments.first().url });
    }

    await sendLog(message.guild, "message", embed);
  }
};