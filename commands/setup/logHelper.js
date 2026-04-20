const { EmbedBuilder } = require("discord.js");
const { LogConfig } = require("../../models/schemas");

async function sendLog(guild, type, embed) {
  try {
    const config = await LogConfig.findOne({ guildId: guild.id });
    if (!config) return;

    const channelId = config[type] || config.default;
    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    await channel.send({ embeds: [embed] });
  } catch {}
}

module.exports = { sendLog };