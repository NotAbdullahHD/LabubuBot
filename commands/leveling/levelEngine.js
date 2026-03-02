const { EmbedBuilder } = require("discord.js");
const { LevelUser, LevelConfig } = require("../../models/schemas");
const { parseCustomEmbed, resolveVariables } = require("../setup/parseCustomEmbed");

// ─────────────────────────────────────────────────────
//  XP FORMULA — tuned to feel like bleed:
//
//  XP per message: 15–25 (random), 60s cooldown between gains
//  XP needed for level N: 100 * (N ^ 1.65)
//
//  This gives a curve like:
//    Level 1  →   100 XP  (a few minutes of chatting)
//    Level 5  →   878 XP  (~30 min active)
//    Level 10 →  2824 XP  (~2 hours)
//    Level 20 →  8986 XP  (~6 hours)
//    Level 50 → 42567 XP  (~30 hours)
//
//  Not too easy, not grindy. Active chatters reach level 10
//  within a week of normal use.
// ─────────────────────────────────────────────────────

const XP_MIN       = 15;
const XP_MAX       = 25;
const XP_COOLDOWN  = 60_000; // ms — one XP grant per minute max

function xpForLevel(level) {
  if (level <= 0) return 0;
  return Math.floor(100 * Math.pow(level, 1.65));
}

function levelFromXp(totalXp) {
  let level = 0;
  let accumulated = 0;
  while (true) {
    const needed = xpForLevel(level + 1);
    if (accumulated + needed > totalXp) break;
    accumulated += needed;
    level++;
    if (level >= 500) break; // safety cap
  }
  return level;
}

function xpInCurrentLevel(totalXp, level) {
  let accumulated = 0;
  for (let l = 1; l <= level; l++) accumulated += xpForLevel(l);
  return totalXp - accumulated;
}

function xpForNextLevel(level) {
  return xpForLevel(level + 1);
}

// ─────────────────────────────────────────────────────
//  Main XP grant — called from messageCreate
// ─────────────────────────────────────────────────────
async function handleXp(message) {
  if (message.author.bot) return;
  if (!message.guild)     return;

  // Check if leveling is enabled for this guild
  const config = await LevelConfig.findOne({ guildId: message.guild.id });
  if (config && !config.enabled) return;

  const now = Date.now();

  // Get or create level record, enforce cooldown
  let record = await LevelUser.findOne({ guildId: message.guild.id, userId: message.author.id });

  if (record && (now - record.lastXpAt) < XP_COOLDOWN) return; // still on cooldown

  const xpGain = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
  const multiplier = config?.multiplier ?? 1.0;
  const xpToAdd = Math.floor(xpGain * multiplier);

  if (!record) {
    record = await LevelUser.create({
      guildId:  message.guild.id,
      userId:   message.author.id,
      username: message.member?.displayName || message.author.username,
      xp:       xpToAdd,
      level:    0,
      lastXpAt: now
    });
  } else {
    record.xp      += xpToAdd;
    record.lastXpAt = now;
    record.username = message.member?.displayName || message.author.username;
    await record.save();
  }

  const newLevel = levelFromXp(record.xp);

  if (newLevel > record.level) {
    record.level = newLevel;
    await record.save();

    // Award any role rewards for this level
    await applyRewards(message.member, newLevel, config);

    // Send level-up message
    await sendLevelUp(message, record, config);
  }
}

// ─────────────────────────────────────────────────────
//  Role rewards — assign all roles earned up to this level
// ─────────────────────────────────────────────────────
async function applyRewards(member, newLevel, config) {
  if (!config?.rewards?.length) return;

  for (const reward of config.rewards) {
    if (reward.level <= newLevel) {
      const role = member.guild.roles.cache.get(reward.roleId);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(() => {});
      }
    }
  }
}

// ─────────────────────────────────────────────────────
//  Level-up announcement
// ─────────────────────────────────────────────────────
async function sendLevelUp(message, record, config) {
  const channel = config?.channel
    ? message.guild.channels.cache.get(config.channel) ?? message.channel
    : message.channel;

  if (!channel) return;

  const context = {
    member: message.member,
    user:   message.author,
    guild:  message.guild,
    // Extra level vars resolved below
    level:  record.level
  };

  // If a custom embed code is set, use it
  if (config?.embedCode) {
    try {
      // Inject level-specific variables before parsing
      let code = config.embedCode
        .replace(/\{level\}/g,    String(record.level))
        .replace(/\{xp\}/g,       String(record.xp))
        .replace(/\{next\.xp\}/g, String(xpForNextLevel(record.level)));

      const embed = parseCustomEmbed(code, context);
      await channel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
      return;
    } catch (err) {
      console.warn("[Leveling] Custom embed error:", err.message);
      // Fall through to default
    }
  }

  // Default level-up embed
  const progressBar = makeProgressBar(record.xp, record.level);
  const xpNeeded    = xpForNextLevel(record.level);
  const xpCurrent   = xpInCurrentLevel(record.xp, record.level);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({
      name:    `${message.author.username} leveled up!`,
      iconURL: message.author.displayAvatarURL({ size: 128 })
    })
    .setDescription(
      `🎉 You reached **Level ${record.level}**!\n\n` +
      `${progressBar}\n` +
      `\`${xpCurrent.toLocaleString()} / ${xpNeeded.toLocaleString()} XP\``
    )
    .setFooter({ text: `Total XP: ${record.xp.toLocaleString()}` })
    .setTimestamp();

  await channel.send({ content: `<@${message.author.id}>`, embeds: [embed] }).catch(() => {});
}

function makeProgressBar(totalXp, level, bars = 10) {
  const current  = xpInCurrentLevel(totalXp, level);
  const needed   = xpForNextLevel(level);
  const filled   = Math.round((current / needed) * bars);
  const empty    = bars - filled;
  return "▓".repeat(filled) + "░".repeat(empty);
}

// Export helpers for use in /rank, /leaderboard etc.
module.exports = {
  handleXp,
  xpForLevel,
  xpForNextLevel,
  xpInCurrentLevel,
  levelFromXp,
  makeProgressBar
};