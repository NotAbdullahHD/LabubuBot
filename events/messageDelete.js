module.exports = {
  name: "messageDelete",
  execute(message, client) {
    if (!message.guild || message.author?.bot) return;

    // Save to the client.snipes Collection
    client.snipes.set(message.channel.id, {
      content: message.content || "*No text (Image/Embed)*",
      author: message.author.tag,
      avatar: message.author.displayAvatarURL(),
      time: Date.now(),
      image: message.attachments.first() ? message.attachments.first().proxyURL : null
    });
  }
};