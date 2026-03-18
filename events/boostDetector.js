const { EmbedBuilder } = require("discord.js");
const { Config, BoosterRole } = require("../models/schemas");

module.exports = {
  name: "guildMemberUpdate",
  async execute(oldMember, newMember, client) {

    // ── Boost STARTED ─────────────────────────────────────
    if (!oldMember.premiumSince && newMember.premiumSince) {
      let data;
      try {
        data = await Config.findOne({ guildId: newMember.guild.id });
      } catch (err) {
        return console.log("[BoostDetector] DB error:", err.message);
      }

      if (data?.booster?.channelId) {
        const channel = newMember.guild.channels.cache.get(data.booster.channelId);

        if (data.booster.roleId) {
          const role = newMember.guild.roles.cache.get(data.booster.roleId);
          if (role) await newMember.roles.add(role).catch(() => {});
        }

        if (channel) {
          const embed = new EmbedBuilder()
            .setTitle("🚀 New Server Booster!")
            .setDescription(`Thank you ${newMember} for boosting the server! 💖`)
            .setColor("#ff73fa")
            .setThumbnail(newMember.user.displayAvatarURL())
            .setFooter({ text: `Total Boosts: ${newMember.guild.premiumSubscriptionCount}` });

          await channel.send({ content: `${newMember}`, embeds: [embed] }).catch(err => {
            console.log("[BoostDetector] Could not send boost message:", err.message);
          });
        }
      }
    }

    // ── Boost ENDED — remove booster reward role AND custom role ─
    if (oldMember.premiumSince && !newMember.premiumSince) {
      try {
        // Remove the configured reward role
        const data = await Config.findOne({ guildId: newMember.guild.id });
        if (data?.booster?.roleId) {
          const role = newMember.guild.roles.cache.get(data.booster.roleId);
          if (role && newMember.roles.cache.has(role.id)) {
            await newMember.roles.remove(role).catch(() => {});
          }
        }

        // Remove their custom booster role if they had one
        const boosterEntry = await BoosterRole.findOne({
          guildId: newMember.guild.id,
          userId:  newMember.id
        });
        if (boosterEntry?.roleId) {
          const customRole = newMember.guild.roles.cache.get(boosterEntry.roleId);
          if (customRole) {
            await newMember.roles.remove(customRole).catch(() => {});
            await customRole.delete("Boost ended").catch(() => {});
          }
          await BoosterRole.deleteOne({ guildId: newMember.guild.id, userId: newMember.id });
        }
      } catch (err) {
        console.log("[BoostDetector] Boost end cleanup error:", err.message);
      }
    }
  }
};