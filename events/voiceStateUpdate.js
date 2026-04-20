const { EmbedBuilder } = require("discord.js");
const { GuildStats, VcRole } = require("../models/schemas");
const { sendLog }            = require("../commands/setup/logHelper");

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    const member  = newState.member || oldState.member;
    if (!member || member.user?.bot) return;

    const userId   = member.user?.id;
    const guildId  = newState.guild?.id || oldState.guild?.id;
    const guild    = newState.guild    || oldState.guild;
    const username = member.displayName || member.user?.username || "Unknown";
    if (!userId || !guildId) return;

    const wasInVC = !!oldState.channelId;
    const isInVC  = !!newState.channelId;

    // ── VC Role ───────────────────────────────────────────────
    try {
      const vcRoleData = await VcRole.findOne({ guildId });
      if (vcRoleData?.roleId) {
        const role = guild?.roles.cache.get(vcRoleData.roleId);
        if (role) {
          if (!wasInVC && isInVC)  await member.roles.add(role).catch(() => {});
          if (wasInVC  && !isInVC) await member.roles.remove(role).catch(() => {});
        }
      }
    } catch {}

    // ── Economy voice income tracking ────────────────────────
    if (!wasInVC && isInVC) {
      await GuildStats.findOneAndUpdate(
        { guildId, userId },
        { $set: { voiceJoinedAt: Date.now(), username } },
        { upsert: true }
      ).catch(() => {});
    }

    if (wasInVC && !isInVC) {
      const record = await GuildStats.findOne({ guildId, userId }).catch(() => null);
      if (record?.voiceJoinedAt) {
        const elapsed = Math.floor((Date.now() - record.voiceJoinedAt) / 1000);
        await GuildStats.findOneAndUpdate(
          { guildId, userId },
          { $inc: { voiceSeconds: elapsed }, $set: { voiceJoinedAt: null, username } }
        ).catch(() => {});
      }
    }

    if (wasInVC && isInVC && oldState.channelId !== newState.channelId) {
      await GuildStats.findOneAndUpdate(
        { guildId, userId },
        { $set: { username } },
        { upsert: true }
      ).catch(() => {});
    }

    // ── Voice Log ─────────────────────────────────────────────
    let description, color;
    if (!wasInVC && isInVC) {
      description = `🔊 **${member.user.tag}** joined **${newState.channel.name}**`;
      color = 0x57F287;
    } else if (wasInVC && !isInVC) {
      description = `🔇 **${member.user.tag}** left **${oldState.channel.name}**`;
      color = 0xED4245;
    } else if (wasInVC && isInVC && oldState.channelId !== newState.channelId) {
      description = `🔀 **${member.user.tag}** moved from **${oldState.channel.name}** → **${newState.channel.name}**`;
      color = 0xFEE75C;
    } else return;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(description)
      .setFooter({ text: `ID: ${userId}` })
      .setTimestamp();

    await sendLog(guild, "voice", embed);
  }
};