const { EmbedBuilder } = require("discord.js");
const { Config } = require("../models/schemas");

module.exports = {
  name: "guildMemberUpdate",
  async execute(oldMember, newMember, client) {
    // Only fire when someone starts boosting
    if (oldMember.premiumSince || !newMember.premiumSince) return;

    let data;
    try {
      data = await Config.findOne({ guildId: newMember.guild.id });
    } catch (err) {
      return console.log("[BoostDetector] DB error:", err.message);
    }

    if (!data?.booster?.channelId) return;

    const channel = newMember.guild.channels.cache.get(data.booster.channelId);
    if (!channel) return;

    // ✅ FIXED: now actually awards the saved reward role when someone boosts
    if (data.booster.roleId) {
      const role = newMember.guild.roles.cache.get(data.booster.roleId);
      if (role) await newMember.roles.add(role).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setTitle("🚀 New Server Booster!")
      .setDescription(`Thank you ${newMember} for boosting the server! 💖`)
      .setColor("#ff73fa")
      .setThumbnail(newMember.user.displayAvatarURL())
      .setFooter({ text: `Total Boosts: ${newMember.guild.premiumSubscriptionCount}` });

    try {
      await channel.send({ content: `${newMember}`, embeds: [embed] });
    } catch (err) {
      console.log("[BoostDetector] Could not send boost message:", err.message);
    }
  }
};