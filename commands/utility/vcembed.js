const { EmbedBuilder } = require("discord.js");
const { GuildStats } = require("../../models/schemas");

// ─────────────────────────────────────────────────────
//  /vcembed send — posts a top-10 voice time leaderboard
//  embed that auto-refreshes every 60 seconds
// ─────────────────────────────────────────────────────

const liveEmbeds = new Map();

function formatTime(seconds) {
  if (seconds < 60)   return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

async function buildEmbed(guild) {
  // Fetch all records, add live VC time for anyone currently in VC
  const records = await GuildStats.find({ guildId: guild.id }).lean();

  // Add current live session time
  const now = Date.now();
  const processed = records.map(r => ({
    ...r,
    totalSeconds: r.voiceSeconds + (r.voiceJoinedAt ? Math.floor((now - r.voiceJoinedAt) / 1000) : 0)
  }));

  const top = processed
    .filter(r => r.totalSeconds > 0)
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .slice(0, 10);

  const medals = ["🥇", "🥈", "🥉"];

  const rows = top.map((entry, i) => {
    const medal = medals[i] ?? `**${i + 1}.**`;
    const name  = entry.username || `<@${entry.userId}>`;
    const time  = formatTime(entry.totalSeconds);
    const live  = entry.voiceJoinedAt ? " 🔴" : "";
    return `${medal} **${name}** — \`${time}\`${live}`;
  });

  return new EmbedBuilder()
    .setColor(0x43c98a)
    .setTitle("🎙️ Top 10 — Most Time in Voice")
    .setDescription(rows.length ? rows.join("\n") : "*No VC data yet. Join a voice channel!*")
    .setFooter({ text: `${guild.name} · 🔴 = currently in VC · Updates every 60s` })
    .setTimestamp();
}

function startVcembedLoop(client) {
  setInterval(async () => {
    for (const [guildId, msg] of liveEmbeds.entries()) {
      try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) { liveEmbeds.delete(guildId); continue; }
        const embed = await buildEmbed(guild);
        await msg.edit({ embeds: [embed] });
      } catch {
        liveEmbeds.delete(guildId);
      }
    }
  }, 60_000);
}

module.exports = {
  name: "vcembed",
  description: "Send a live top-10 voice time leaderboard embed.",
  slashOnly: true,
  startVcembedLoop,

  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageGuild"))
      return interaction.reply({ content: "❌ You need **Manage Server** permission.", ephemeral: true });

    let sub;
    try { sub = interaction.options.getSubcommand(); }
    catch { return interaction.reply({ content: "❌ Use `/vcembed send`.", ephemeral: true }); }

    if (sub === "send") {
      await interaction.deferReply({ ephemeral: true });

      const embed = await buildEmbed(interaction.guild);
      const sent  = await interaction.channel.send({ embeds: [embed] });

      liveEmbeds.set(interaction.guild.id, sent);

      return interaction.editReply({ content: `✅ Voice leaderboard posted in ${interaction.channel}. It will refresh every 60 seconds.\n🔴 = currently in a voice channel.` });
    }
  }
};