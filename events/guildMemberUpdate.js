const { EmbedBuilder } = require("discord.js");
const { Config, BoosterRole } = require("../models/schemas");
const { sendLog }             = require("../commands/setup/logHelper");

module.exports = {
  name: "guildMemberUpdate",
  async execute(oldMember, newMember, client) {

    // ── Boost STARTED ─────────────────────────────────────────
    if (!oldMember.premiumSince && newMember.premiumSince) {
      try {
        const data = await Config.findOne({ guildId: newMember.guild.id });
        if (data?.booster?.channelId) {
          const channel = newMember.guild.channels.cache.get(data.booster.channelId);
          if (data.booster.roleId) {
            const role = newMember.guild.roles.cache.get(data.booster.roleId);
            if (role) await newMember.roles.add(role).catch(() => {});
          }
          if (channel) {
            const { EmbedBuilder: EB } = require("discord.js");
            const embed = new EB()
              .setTitle("🚀 New Server Booster!")
              .setDescription(`Thank you ${newMember} for boosting the server! 💖`)
              .setColor("#ff73fa")
              .setThumbnail(newMember.user.displayAvatarURL())
              .setFooter({ text: `Total Boosts: ${newMember.guild.premiumSubscriptionCount}` });
            await channel.send({ content: `${newMember}`, embeds: [embed] }).catch(() => {});
          }
        }
      } catch {}
    }

    // ── Boost ENDED ───────────────────────────────────────────
    if (oldMember.premiumSince && !newMember.premiumSince) {
      try {
        const data = await Config.findOne({ guildId: newMember.guild.id });
        if (data?.booster?.roleId) {
          const role = newMember.guild.roles.cache.get(data.booster.roleId);
          if (role && newMember.roles.cache.has(role.id)) await newMember.roles.remove(role).catch(() => {});
        }
        const boosterEntry = await BoosterRole.findOne({ guildId: newMember.guild.id, userId: newMember.id });
        if (boosterEntry?.roleId) {
          const customRole = newMember.guild.roles.cache.get(boosterEntry.roleId);
          if (customRole) { await newMember.roles.remove(customRole).catch(() => {}); await customRole.delete("Boost ended").catch(() => {}); }
          await BoosterRole.deleteOne({ guildId: newMember.guild.id, userId: newMember.id });
        }
      } catch {}
    }

    // ── Nickname Change Log ───────────────────────────────────
    if (oldMember.nickname !== newMember.nickname) {
      const embed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setAuthor({ name: `${newMember.user.tag}`, iconURL: newMember.user.displayAvatarURL() })
        .setDescription(`**Nickname changed**`)
        .addFields(
          { name: "Before", value: oldMember.nickname || "*None*", inline: true },
          { name: "After",  value: newMember.nickname || "*None*", inline: true }
        )
        .setFooter({ text: `ID: ${newMember.id}` })
        .setTimestamp();
      await sendLog(newMember.guild, "role", embed);
    }

    // ── Role Change Log ───────────────────────────────────────
    const addedRoles   = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

    if (addedRoles.size > 0) {
      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setAuthor({ name: `${newMember.user.tag}`, iconURL: newMember.user.displayAvatarURL() })
        .setDescription(`**Role added:** ${addedRoles.map(r => r.toString()).join(", ")}`)
        .setFooter({ text: `ID: ${newMember.id}` })
        .setTimestamp();
      await sendLog(newMember.guild, "role", embed);
    }

    if (removedRoles.size > 0) {
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setAuthor({ name: `${newMember.user.tag}`, iconURL: newMember.user.displayAvatarURL() })
        .setDescription(`**Role removed:** ${removedRoles.map(r => r.toString()).join(", ")}`)
        .setFooter({ text: `ID: ${newMember.id}` })
        .setTimestamp();
      await sendLog(newMember.guild, "role", embed);
    }
  }
};