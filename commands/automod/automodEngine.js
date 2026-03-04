const { EmbedBuilder } = require("discord.js");
const { AutomodConfig, AutomodWarn } = require("../../models/schemas");

// ─────────────────────────────────────────────────────
//  In-memory spam tracker: Map<guildId_userId, number[]>
//  Stores timestamps of recent messages per user per guild
// ─────────────────────────────────────────────────────
const spamTracker = new Map();

function getSpamKey(guildId, userId) {
  return `${guildId}_${userId}`;
}

// Clean up old spam tracker entries every 60s to avoid memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of spamTracker.entries()) {
    const fresh = timestamps.filter(t => now - t < 60_000);
    if (fresh.length === 0) spamTracker.delete(key);
    else spamTracker.set(key, fresh);
  }
}, 60_000);

// ─────────────────────────────────────────────────────
//  Main automod handler — called from messageCreate
// ─────────────────────────────────────────────────────
async function handleAutomod(message) {
  if (!message.guild || message.author.bot) return;

  const guildId = message.guild.id;
  const config  = await AutomodConfig.findOne({ guildId });

  // Automod not set up or disabled
  if (!config || !config.enabled) return;

  // Check exempt roles
  if (config.exemptRoles.length) {
    const memberRoles = message.member?.roles?.cache;
    if (memberRoles && config.exemptRoles.some(r => memberRoles.has(r))) return;
  }

  // Check exempt channels
  if (config.exemptChannels.includes(message.channel.id)) return;

  // Never automod admins or manage-guild users
  if (message.member?.permissions.has("ManageGuild")) return;

  let triggered = false;
  let reason    = "";

  // ── 1. Bad Words ──────────────────────────────────────
  if (config.badwords && config.wordList.length) {
    const content = message.content.toLowerCase();
    const matched = config.wordList.find(w => content.includes(w.toLowerCase()));
    if (matched) {
      triggered = true;
      reason    = `Bad word detected: \`${matched}\``;
    }
  }

  // ── 2. Anti-Invite ────────────────────────────────────
  if (!triggered && config.antiinvite) {
    const inviteRegex = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9]+/i;
    if (inviteRegex.test(message.content)) {
      triggered = true;
      reason    = "Discord invite link detected";
    }
  }

  // ── 3. Anti-Spam ──────────────────────────────────────
  if (!triggered && config.antispam) {
    const key       = getSpamKey(guildId, message.author.id);
    const now       = Date.now();
    const windowMs  = (config.spamSeconds || 3) * 1000;
    const limit     = config.spamCount || 5;

    // Get existing timestamps, add current
    const timestamps = (spamTracker.get(key) || []).filter(t => now - t < windowMs);
    timestamps.push(now);
    spamTracker.set(key, timestamps);

    if (timestamps.length >= limit) {
      triggered = true;
      reason    = `Spam detected (${timestamps.length} messages in ${config.spamSeconds}s)`;
      spamTracker.delete(key); // reset after triggering
    }
  }

  if (!triggered) return;

  // ── Take action ───────────────────────────────────────
  // Always delete the message first
  await message.delete().catch(() => {});

  const action = config.action || "delete";

  // DM the user
  const dmEmbed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle(`🛡️ Automod — ${message.guild.name}`)
    .setDescription(`Your message was removed.\n**Reason:** ${reason}`)
    .setTimestamp();

  await message.author.send({ embeds: [dmEmbed] }).catch(() => {});

  // Warn action
  if (action === "warn" || action === "timeout") {
    await AutomodWarn.findOneAndUpdate(
      { guildId, userId: message.author.id },
      {
        $inc: { warns: 1 },
        $push: { history: { reason, timestamp: Date.now() } }
      },
      { upsert: true }
    );
  }

  // Timeout action
  if (action === "timeout") {
    const ms = (config.timeoutMins || 5) * 60 * 1000;
    await message.member?.timeout(ms, reason).catch(() => {});
  }

  // Log to log channel
  if (config.logChannel) {
    const logChannel = message.guild.channels.cache.get(config.logChannel);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("🛡️ Automod Action")
        .addFields(
          { name: "User",    value: `${message.author} (\`${message.author.tag}\`)`, inline: true },
          { name: "Channel", value: `<#${message.channel.id}>`,                      inline: true },
          { name: "Action",  value: action,                                           inline: true },
          { name: "Reason",  value: reason,                                           inline: false },
          { name: "Message", value: message.content.slice(0, 500) || "*(empty)*",    inline: false }
        )
        .setTimestamp();
      await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }
  }
}

module.exports = { handleAutomod };