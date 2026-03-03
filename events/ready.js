const { ActivityType, SlashCommandBuilder, ChannelType } = require("discord.js");
const giveawayCommand      = require("../commands/admin/giveaway.js");
const { startVoiceIncome } = require("../commands/economy/economy.js");
const { startMembedLoop }  = require("../commands/utility/membed.js");
const { startVcembedLoop } = require("../commands/utility/vcembed.js");

module.exports = {
  name: "clientReady",   // ✅ FIXED: renamed from "ready" to silence deprecation warning
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    const totalMembers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
    client.user.setPresence({
      activities: [{ name: `${totalMembers} members`, type: ActivityType.Watching }],
      status: "online"
    });

    giveawayCommand.startChecker(client);
    startVoiceIncome(client);
    startMembedLoop(client);
    startVcembedLoop(client);

    // ── Slash Command Definitions ─────────────────────────

    const pojCommand = new SlashCommandBuilder()
      .setName("poj").setDescription("Ping on join system")
      .addSubcommand(s => s.setName("setup").setDescription("Setup POJ")
        .addChannelOption(o => o.setName("channel").setDescription("Channel").setRequired(true))
        .addIntegerOption(o => o.setName("time").setDescription("Delete time in ms").setRequired(true)))
      .addSubcommand(s => s.setName("unset").setDescription("Disable POJ"));

    const boosterCommand = new SlashCommandBuilder()
      .setName("boosterrole").setDescription("Booster role configuration")
      .addSubcommand(s => s.setName("award").setDescription("Set reward role")
        .addRoleOption(o => o.setName("role").setDescription("Reward role").setRequired(true))
        .addChannelOption(o => o.setName("channel").setDescription("Thank you channel").setRequired(true)))
      .addSubcommand(s => s.setName("unset").setDescription("Clear settings"))
      .addSubcommand(s => s.setName("list").setDescription("View settings"));

    const welcomeCommand = new SlashCommandBuilder()
      .setName("welcome").setDescription("Configure the welcome embed")
      .addSubcommand(s => s.setName("set").setDescription("Set welcome embed (opens form)")
        .addChannelOption(o => o.setName("channel").setDescription("Channel to send in").setRequired(true)))
      .addSubcommand(s => s.setName("preview").setDescription("Preview current welcome embed"))
      .addSubcommand(s => s.setName("disable").setDescription("Disable welcome system"));

    const announceCommand = new SlashCommandBuilder()
      .setName("announce").setDescription("Send a custom embed to a channel")
      .addChannelOption(o => o.setName("channel").setDescription("Target channel").setRequired(true))
      .addStringOption(o => o.setName("message").setDescription("Embed Builder code").setRequired(true));

    const membedCommand = new SlashCommandBuilder()
      .setName("membed").setDescription("Post live top-10 message leaderboard")
      .addSubcommand(s => s.setName("send").setDescription("Send to this channel"));

    const vcembedCommand = new SlashCommandBuilder()
      .setName("vcembed").setDescription("Post live top-10 voice time leaderboard")
      .addSubcommand(s => s.setName("send").setDescription("Send to this channel"));

    const levelsCommand = new SlashCommandBuilder()
      .setName("levels").setDescription("Configure the leveling system")
      .addSubcommand(s => s.setName("enable").setDescription("Enable XP leveling"))
      .addSubcommand(s => s.setName("disable").setDescription("Disable XP leveling"))
      .addSubcommand(s => s.setName("channel").setDescription("Set level-up announcement channel")
        .addChannelOption(o => o.setName("channel").setDescription("Channel (leave empty = same channel as message)").setRequired(false)))
      .addSubcommand(s => s.setName("multiplier").setDescription("Set XP multiplier (default 1×)")
        .addNumberOption(o => o.setName("value").setDescription("Multiplier 0.1–10").setRequired(true)))
      .addSubcommand(s => s.setName("message").setDescription("Set custom level-up embed (opens form)"))
      .addSubcommand(s => s.setName("add").setDescription("Add a role reward for reaching a level")
        .addIntegerOption(o => o.setName("level").setDescription("Level required").setRequired(true))
        .addRoleOption(o => o.setName("role").setDescription("Role to award").setRequired(true)))
      .addSubcommand(s => s.setName("remove").setDescription("Remove a role reward")
        .addIntegerOption(o => o.setName("level").setDescription("Level to remove reward from").setRequired(true)))
      .addSubcommand(s => s.setName("rewards").setDescription("List all role rewards"))
      .addSubcommand(s => s.setName("reset").setDescription("Reset a user's XP and level")
        .addUserOption(o => o.setName("user").setDescription("User to reset").setRequired(true)))
      .addSubcommand(s => s.setName("info").setDescription("View current leveling settings"));

    // ── /starboard ────────────────────────────────────────
    const starboardCommand = new SlashCommandBuilder()
      .setName("starboard").setDescription("Configure the starboard system")
      .addSubcommand(s => s.setName("set").setDescription("Set up starboard channel, emoji and threshold")
        .addChannelOption(o => o.setName("channel").setDescription("Starboard channel").setRequired(true))
        .addStringOption(o => o.setName("emoji").setDescription("Reaction emoji to watch (default ⭐)").setRequired(false))
        .addIntegerOption(o => o.setName("threshold").setDescription("Reactions needed (default 3)").setRequired(false)))
      .addSubcommand(s => s.setName("enable").setDescription("Enable starboard"))
      .addSubcommand(s => s.setName("disable").setDescription("Disable starboard"))
      .addSubcommand(s => s.setName("info").setDescription("View current starboard settings"));

    // ── /ticket ───────────────────────────────────────────
    const ticketCommand = new SlashCommandBuilder()
      .setName("ticket").setDescription("Configure and manage the ticket system")
      .addSubcommand(s => s.setName("setup").setDescription("Set up ticket system")
        .addChannelOption(o => o.setName("category").setDescription("Category for ticket channels").setRequired(false))
        .addRoleOption(o => o.setName("role").setDescription("Support role that can see tickets").setRequired(false))
        .addChannelOption(o => o.setName("logs").setDescription("Channel to send closed ticket logs").setRequired(false)))
      .addSubcommand(s => s.setName("panel").setDescription("Post the open-ticket button panel")
        .addStringOption(o => o.setName("title").setDescription("Panel title").setRequired(false))
        .addStringOption(o => o.setName("description").setDescription("Panel description").setRequired(false))
        .addStringOption(o => o.setName("color").setDescription("Embed color hex e.g. #5865F2").setRequired(false)))
      .addSubcommand(s => s.setName("add").setDescription("Add a user to the current ticket")
        .addUserOption(o => o.setName("user").setDescription("User to add").setRequired(true)))
      .addSubcommand(s => s.setName("remove").setDescription("Remove a user from the current ticket")
        .addUserOption(o => o.setName("user").setDescription("User to remove").setRequired(true)));

    try {
      await client.application.commands.set([
        pojCommand.toJSON(),
        boosterCommand.toJSON(),
        welcomeCommand.toJSON(),
        announceCommand.toJSON(),
        membedCommand.toJSON(),
        vcembedCommand.toJSON(),
        levelsCommand.toJSON(),
        starboardCommand.toJSON(),
        ticketCommand.toJSON()
      ]);
      console.log("✅ Registered: /poj /boosterrole /welcome /announce /membed /vcembed /levels /starboard /ticket");
    } catch (err) {
      console.error("❌ Slash command registration error:", err);
    }
  }
};