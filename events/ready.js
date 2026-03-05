const { ActivityType, SlashCommandBuilder } = require("discord.js");
const giveawayCommand      = require("../commands/admin/giveaway.js");
const { startVoiceIncome } = require("../commands/economy/economy.js");
const { startMembedLoop }  = require("../commands/utility/membed.js");
const { startVcembedLoop } = require("../commands/utility/vcembed.js");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    client.user.setPresence({
      activities: [{ name: "Deli by Ice Spice", type: ActivityType.Listening }],
      status: "online"
    });

    giveawayCommand.startChecker(client);
    startVoiceIncome(client);
    startMembedLoop(client);
    startVcembedLoop(client);

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
        .addChannelOption(o => o.setName("channel").setDescription("Channel (leave empty = same channel)").setRequired(false)))
      .addSubcommand(s => s.setName("multiplier").setDescription("Set XP multiplier")
        .addNumberOption(o => o.setName("value").setDescription("Multiplier 0.1-10").setRequired(true)))
      .addSubcommand(s => s.setName("message").setDescription("Set custom level-up embed (opens form)"))
      .addSubcommand(s => s.setName("add").setDescription("Add a role reward")
        .addIntegerOption(o => o.setName("level").setDescription("Level required").setRequired(true))
        .addRoleOption(o => o.setName("role").setDescription("Role to award").setRequired(true)))
      .addSubcommand(s => s.setName("remove").setDescription("Remove a role reward")
        .addIntegerOption(o => o.setName("level").setDescription("Level to remove").setRequired(true)))
      .addSubcommand(s => s.setName("rewards").setDescription("List all role rewards"))
      .addSubcommand(s => s.setName("reset").setDescription("Reset a user XP")
        .addUserOption(o => o.setName("user").setDescription("User to reset").setRequired(true)))
      .addSubcommand(s => s.setName("info").setDescription("View leveling settings"));

    const starboardCommand = new SlashCommandBuilder()
      .setName("starboard").setDescription("Configure the starboard system")
      .addSubcommand(s => s.setName("set").setDescription("Set up starboard")
        .addChannelOption(o => o.setName("channel").setDescription("Starboard channel").setRequired(true))
        .addStringOption(o => o.setName("emoji").setDescription("Reaction emoji (default star)").setRequired(false))
        .addIntegerOption(o => o.setName("threshold").setDescription("Reactions needed (default 3)").setRequired(false)))
      .addSubcommand(s => s.setName("enable").setDescription("Enable starboard"))
      .addSubcommand(s => s.setName("disable").setDescription("Disable starboard"))
      .addSubcommand(s => s.setName("info").setDescription("View starboard settings"));

    const ticketCommand = new SlashCommandBuilder()
      .setName("ticket").setDescription("Configure the ticket system")
      .addSubcommand(s => s.setName("setup").setDescription("Set up ticket system")
        .addChannelOption(o => o.setName("category").setDescription("Category for tickets").setRequired(false))
        .addRoleOption(o => o.setName("role").setDescription("Support role").setRequired(false))
        .addChannelOption(o => o.setName("logs").setDescription("Log channel").setRequired(false)))
      .addSubcommand(s => s.setName("panel").setDescription("Post the open-ticket button")
        .addStringOption(o => o.setName("title").setDescription("Panel title").setRequired(false))
        .addStringOption(o => o.setName("description").setDescription("Panel description").setRequired(false))
        .addStringOption(o => o.setName("color").setDescription("Embed color hex").setRequired(false)))
      .addSubcommand(s => s.setName("add").setDescription("Add a user to this ticket")
        .addUserOption(o => o.setName("user").setDescription("User to add").setRequired(true)))
      .addSubcommand(s => s.setName("remove").setDescription("Remove a user from this ticket")
        .addUserOption(o => o.setName("user").setDescription("User to remove").setRequired(true)));

    const automodCommand = new SlashCommandBuilder()
      .setName("automod").setDescription("Configure the automod system")
      .addSubcommand(s => s.setName("enable").setDescription("Enable automod"))
      .addSubcommand(s => s.setName("disable").setDescription("Disable automod"))
      .addSubcommand(s => s.setName("badwords").setDescription("Manage bad word filter")
        .addStringOption(o => o.setName("toggle").setDescription("Action").setRequired(true)
          .addChoices(
            { name: "on",     value: "on"     },
            { name: "off",    value: "off"    },
            { name: "add",    value: "add"    },
            { name: "remove", value: "remove" },
            { name: "list",   value: "list"   }
          ))
        .addStringOption(o => o.setName("word").setDescription("Word to add or remove").setRequired(false)))
      .addSubcommand(s => s.setName("antispam").setDescription("Configure anti-spam")
        .addStringOption(o => o.setName("toggle").setDescription("Action").setRequired(true)
          .addChoices(
            { name: "on",  value: "on"  },
            { name: "off", value: "off" },
            { name: "set", value: "set" }
          ))
        .addIntegerOption(o => o.setName("count").setDescription("Max messages before trigger").setRequired(false))
        .addIntegerOption(o => o.setName("seconds").setDescription("Time window in seconds").setRequired(false)))
      .addSubcommand(s => s.setName("antiinvite").setDescription("Block Discord invite links")
        .addStringOption(o => o.setName("toggle").setDescription("on or off").setRequired(true)
          .addChoices(
            { name: "on",  value: "on"  },
            { name: "off", value: "off" }
          )))
      .addSubcommand(s => s.setName("action").setDescription("Set punishment for violations")
        .addStringOption(o => o.setName("type").setDescription("Punishment type").setRequired(true)
          .addChoices(
            { name: "Delete message only", value: "delete"  },
            { name: "Delete + warn user",  value: "warn"    },
            { name: "Delete + timeout",    value: "timeout" }
          ))
        .addIntegerOption(o => o.setName("timeout_mins").setDescription("Timeout duration in minutes").setRequired(false)))
      .addSubcommand(s => s.setName("exempt").setDescription("Exempt roles or channels from automod")
        .addStringOption(o => o.setName("type").setDescription("Role or channel").setRequired(true)
          .addChoices(
            { name: "role",    value: "role"    },
            { name: "channel", value: "channel" }
          ))
        .addStringOption(o => o.setName("action").setDescription("Add or remove").setRequired(true)
          .addChoices(
            { name: "add",    value: "add"    },
            { name: "remove", value: "remove" }
          ))
        .addRoleOption(o => o.setName("role").setDescription("Role to exempt").setRequired(false))
        .addChannelOption(o => o.setName("channel").setDescription("Channel to exempt").setRequired(false)))
      .addSubcommand(s => s.setName("logs").setDescription("Set automod log channel")
        .addChannelOption(o => o.setName("channel").setDescription("Log channel (leave empty to clear)").setRequired(false)))
      .addSubcommand(s => s.setName("info").setDescription("View all automod settings"));

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
        ticketCommand.toJSON(),
        automodCommand.toJSON()
      ]);
      console.log("✅ Registered: /poj /boosterrole /welcome /announce /membed /vcembed /levels /starboard /ticket /automod");
    } catch (err) {
      console.error("❌ Slash command registration error:", err);
    }
  }
};