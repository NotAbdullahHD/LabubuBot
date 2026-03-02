const { GuildStats } = require("../models/schemas");

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    // ✅ FIXED: check both old and new state for bot users (was only checking newState)
    const member = newState.member || oldState.member;
    if (!member) return;
    if (member.user?.bot) return;

    const userId  = member.user?.id;
    const guildId = newState.guild?.id || oldState.guild?.id;
    if (!userId || !guildId) return;

    const username = member.displayName || member.user?.username || "Unknown";

    const wasInVC = !!oldState.channelId;
    const isInVC  = !!newState.channelId;

    // ── Joined a VC ───────────────────────────────────────────
    if (!wasInVC && isInVC) {
      await GuildStats.findOneAndUpdate(
        { guildId, userId },
        { $set: { voiceJoinedAt: Date.now(), username } },
        { upsert: true }
      ).catch(() => {});
    }

    // ── Left VC ───────────────────────────────────────────────
    if (wasInVC && !isInVC) {
      const record = await GuildStats.findOne({ guildId, userId }).catch(() => null);
      if (!record?.voiceJoinedAt) return;

      const elapsed = Math.floor((Date.now() - record.voiceJoinedAt) / 1000);

      await GuildStats.findOneAndUpdate(
        { guildId, userId },
        {
          $inc: { voiceSeconds: elapsed },
          $set: { voiceJoinedAt: null, username }
        }
      ).catch(() => {});
    }

    // ── Switched channels — just keep join time, update name ──
    if (wasInVC && isInVC && oldState.channelId !== newState.channelId) {
      await GuildStats.findOneAndUpdate(
        { guildId, userId },
        { $set: { username } },
        { upsert: true }
      ).catch(() => {});
    }
  }
};