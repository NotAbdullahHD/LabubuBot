const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { GuildStats } = require("../../models/schemas");

// ─────────────────────────────────────────────────────
//  /membed send — posts a top-10 message leaderboard
//  embed that auto-refreshes every 60 seconds
// ─────────────────────────────────────────────────────

// Store live message objects so we can edit them: Map<guildId, Message>
const liveEmbeds = new Map();

async function buildEmbed(guild) {
  const top = await GuildStats.find({ guildId: guild.id })
    .sort({ messageCount: -1 })
    .limit(10)
    .lean();

  const medals = ["🥇", "🥈", "🥉"];

  const rows = top.map((entry, i) => {
    const medal = medals[i] ?? `**${i + 1}.**`;
    const name  = entry.username || `<@${entry.userId}>`;
    const count = entry.messageCount.toLocaleString();
    return `${medal} **${name}** — \`${count}\` messages`;
  });

  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle("💬 Top 10 — Most Messages")
    .setDescription(rows.length ? rows.join("\n") : "*No data yet. Start chatting!*")
    .setFooter({ text: `${guild.name} · Updates every 60s` })
    .setTimestamp();
}

// Called from ready.js to start the refresh loop
function startMembedLoop(client) {
  setInterval(async () => {
    for (const [guildId, msg] of liveEmbeds.entries()) {
      try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) { liveEmbeds.delete(guildId); continue; }
        const embed = await buildEmbed(guild);
        await msg.edit({ embeds: [embed] });
      } catch (err) {
        // Message was deleted — remove from map
        liveEmbeds.delete(guildId);
      }
    }
  }, 60_000);
}

module.exports = {
  name: "membed",
  description: "Send a live top-10 message leaderboard embed.",
  slashOnly: true,
  startMembedLoop,

  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageGuild"))
      return interaction.reply({ content: "❌ You need **Manage Server** permission.", ephemeral: true });

    let sub;
    try { sub = interaction.options.getSubcommand(); }
    catch { return interaction.reply({ content: "❌ Use `/membed send`.", ephemeral: true }); }

    if (sub === "send") {
      await interaction.deferReply({ ephemeral: true });

      const embed = await buildEmbed(interaction.guild);
      const sent  = await interaction.channel.send({ embeds: [embed] });

      // Register this message for auto-refresh
      liveEmbeds.set(interaction.guild.id, sent);

      return interaction.editReply({ content: `✅ Message leaderboard posted in ${interaction.channel}. It will refresh every 60 seconds.` });
    }
  }
};