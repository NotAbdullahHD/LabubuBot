const { ActivityType, SlashCommandBuilder } = require("discord.js");
const giveawayCommand  = require("../commands/admin/giveaway.js");
const { startVoiceIncome }  = require("../commands/economy/economy.js");
const { startMembedLoop }   = require("../commands/utility/membed.js");
const { startVcembedLoop }  = require("../commands/utility/vcembed.js");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    const totalMembers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
    client.user.setPresence({
      activities: [{ name: `${totalMembers} users`, type: ActivityType.Watching }],
      status: "online"
    });

    // Force mobile/phone status
    client.ws.shards.forEach(shard => {
      shard.send({
        op: 3,
        d: {
          since: null,
          activities: [{ name: `${totalMembers} users`, type: 3 }],
          status: "online",
          afk: false
        }
      });
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

    // ── /levels ───────────────────────────────────────────
    const levelsCommand = new SlashCommandBuilder()
      .setName("levels").setDescription("Configure the leveling system")
      .addSubcommand(s => s.setName("enable").setDescription("Enable XP leveling"))
      .addSubcommand(s => s.setName("disable").setDescription("Disable XP leveling"))
      .addSubcommand(s => s.setName("channel").setDescription("Set level-up announcement channel")
        .addChannelOption(o => o.setName("channel").setDescription("Channel (leave empty = same channel as message)").setRequired(false)))
      .addSubcommand(s => s.setName("multiplier").setDescription("Set XP multiplier (default 1×)")
        .addNumberOption(o => o.setName("value").setDescription("Multiplier 0.1–10 (e.g. 2 = double XP)").setRequired(true)))
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

    const autoReactCommand = new SlashCommandBuilder()
      .setName("autoreact").setDescription("Auto react to every message in a channel")
      .addSubcommand(s => s.setName("set").setDescription("Set auto react for a channel")
        .addChannelOption(o => o.setName("channel").setDescription("Channel").setRequired(true))
        .addStringOption(o => o.setName("emojis").setDescription("Emojis to react with (space separated, max 5)").setRequired(true)))
      .addSubcommand(s => s.setName("remove").setDescription("Remove auto react from a channel")
        .addChannelOption(o => o.setName("channel").setDescription("Channel").setRequired(true)))
      .addSubcommand(s => s.setName("list").setDescription("List all auto react channels"));

    const treactionCommand = new SlashCommandBuilder()
      .setName("treaction").setDescription("React with emoji when a trigger word is said")
      .addSubcommand(s => s.setName("set").setDescription("Add a trigger reaction")
        .addStringOption(o => o.setName("trigger").setDescription("Word or phrase to trigger on").setRequired(true))
        .addStringOption(o => o.setName("emoji").setDescription("Emoji to react with").setRequired(true)))
      .addSubcommand(s => s.setName("remove").setDescription("Remove a trigger reaction")
        .addStringOption(o => o.setName("trigger").setDescription("Trigger to remove").setRequired(true)))
      .addSubcommand(s => s.setName("list").setDescription("List all trigger reactions"));

    const vcRoleCommand = new SlashCommandBuilder()
      .setName("vcrole").setDescription("Give a role to users while in a voice channel")
      .addSubcommand(s => s.setName("set").setDescription("Set the VC role")
        .addRoleOption(o => o.setName("role").setDescription("Role to give").setRequired(true)))
      .addSubcommand(s => s.setName("remove").setDescription("Remove VC role config"))
      .addSubcommand(s => s.setName("info").setDescription("View current VC role"));

    try {
      await client.application.commands.set([
        pojCommand.toJSON(),
        boosterCommand.toJSON(),
        welcomeCommand.toJSON(),
        announceCommand.toJSON(),
        membedCommand.toJSON(),
        vcembedCommand.toJSON(),
        levelsCommand.toJSON(),
        autoReactCommand.toJSON(),
        treactionCommand.toJSON(),
        vcRoleCommand.toJSON()
      ]);
      console.log("✅ Registered: /poj /boosterrole /welcome /announce /membed /vcembed /levels /autoreact /treaction /vcrole");
    } catch (err) {
      console.error("❌ Slash command registration error:", err);
    }
  }
};