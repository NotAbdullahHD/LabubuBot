const economyModule    = require("../commands/economy/economy");
const { handleXp }     = require("../commands/leveling/levelEngine");
const { User, GuildStats, AutoReact, TriggerReact } = require("../models/schemas");

const handleEconomyCommands = typeof economyModule.handleEconomyCommands === "function"
  ? economyModule.handleEconomyCommands
  : () => false;

const handleIncomeEvents = typeof economyModule.handleIncomeEvents === "function"
  ? economyModule.handleIncomeEvents
  : () => {};

module.exports = {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    // ── 1. Track message count ────────────────────────────
    GuildStats.findOneAndUpdate(
      { guildId: message.guild.id, userId: message.author.id },
      {
        $inc: { messageCount: 1 },
        $set: { username: message.member?.displayName || message.author.username }
      },
      { upsert: true }
    ).catch(() => {});

    // ── 2. XP / Leveling ──────────────────────────────────
    handleXp(message).catch(err => console.error("[Leveling] XP error:", err.message));

    // ── 3. Economy passive income ─────────────────────────
    await handleIncomeEvents(message).catch(() => {});

    // ── 4. AFK: welcome back ──────────────────────────────
    try {
      const userData = await User.findOne({ userId: message.author.id });

      if (userData?.afk?.isAfk) {
        const afkSince = userData.afk.timestamp
          ? `<t:${Math.floor(userData.afk.timestamp / 1000)}:R>`
          : "recently";

        await User.findOneAndUpdate(
          { userId: message.author.id },
          { $set: { "afk.isAfk": false, "afk.reason": null, "afk.timestamp": null } }
        );

        const reply = await message.reply({
          content: `👋 Welcome back, **${message.author.username}**! Your AFK has been removed.\n> You went AFK ${afkSince} — *${userData.afk.reason || "AFK"}*`
        }).catch(() => null);

        if (reply) setTimeout(() => reply.delete().catch(() => {}), 6000);
      }

      // ── 5. AFK: ping notification ─────────────────────
      if (message.mentions.users.size > 0) {
        for (const [, mentionedUser] of message.mentions.users) {
          if (mentionedUser.bot || mentionedUser.id === message.author.id) continue;
          const mentionedData = await User.findOne({ userId: mentionedUser.id });
          if (!mentionedData?.afk?.isAfk) continue;
          const afkSince = mentionedData.afk.timestamp
            ? `<t:${Math.floor(mentionedData.afk.timestamp / 1000)}:R>`
            : "a while ago";
          const notify = await message.reply({
            content: `💤 **${mentionedUser.username}** is currently AFK ${afkSince}\n> *${mentionedData.afk.reason || "AFK"}*`
          }).catch(() => null);
          if (notify) setTimeout(() => notify.delete().catch(() => {}), 7000);
        }
      }
    } catch (err) {
      console.error("[messageCreate] AFK error:", err.message);
    }

    // ── 6. Auto React — react to every message in configured channels ──
    try {
      const autoReacts = await AutoReact.find({ guildId: message.guild.id, channelId: message.channel.id });
      for (const ar of autoReacts) {
        for (const emoji of ar.emojis) {
          await message.react(emoji).catch(() => {});
        }
      }
    } catch {}

    // ── 7. Trigger React — react when message contains trigger word ──
    try {
      const triggers = await TriggerReact.find({ guildId: message.guild.id });
      const content  = message.content.toLowerCase();
      for (const tr of triggers) {
        if (content.includes(tr.trigger)) {
          await message.react(tr.emoji).catch(() => {});
        }
      }
    } catch {}

    // ── 8. Command routing ────────────────────────────────
    const prefixes   = [">", ",", "!"];
    const prefix     = prefixes.find(p => message.content.startsWith(p));
    if (!prefix) return;

    const args        = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    try {
      const handled = await handleEconomyCommands(message, args, commandName);
      if (handled) return;
    } catch (err) {
      console.error("[messageCreate] Economy error:", err.message);
    }

    const command = client.commands.get(commandName);
    if (!command || command.slashOnly) return;

    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error("[messageCreate] Command error:", error);
      message.reply("❌ There was an error!").catch(() => {});
    }
  }
};