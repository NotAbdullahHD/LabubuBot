const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");

// Fun compatibility messages based on %
function getCompatMessage(pct) {
  if (pct >= 95) return "soulmates 💞";
  if (pct >= 85) return "perfect match 💘";
  if (pct >= 75) return "really good together 💕";
  if (pct >= 65) return "pretty compatible 💓";
  if (pct >= 50) return "could work 💛";
  if (pct >= 35) return "it's complicated 🤔";
  if (pct >= 20) return "not really... 😬";
  if (pct >= 10) return "run away 💀";
  return "absolutely not 🚫";
}

// Bar color based on %
function getBarColor(pct) {
  if (pct >= 75) return "#ff6b9d";
  if (pct >= 50) return "#ffaa00";
  if (pct >= 25) return "#ff6b35";
  return "#555555";
}

// Draw circular clipped avatar
async function drawCircleAvatar(ctx, url, x, y, size) {
  try {
    const img = await loadImage(url);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();
  } catch {
    // fallback: gray circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#555";
    ctx.fill();
    ctx.restore();
  }
}

module.exports = {
  name: "ship",
  aliases: ["compatibility", "love"],

  async execute(message, args) {
    // Parse users — ,ship @user1 @user2 or ,ship @user (pairs with author)
    const mentions = message.mentions.users;
    let user1, user2;

    if (mentions.size >= 2) {
      const arr = [...mentions.values()];
      user1 = arr[0];
      user2 = arr[1];
    } else if (mentions.size === 1) {
      user1 = message.author;
      user2 = mentions.first();
    } else {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xED4245)
          .setDescription("❌ Usage: `,ship @user` or `,ship @user1 @user2`")
        ]
      });
    }

    if (user1.id === user2.id) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xFF6B9D)
          .setDescription("💭 Self-love is valid but... that's a bit much 😭")
        ]
      });
    }

    // Deterministic % so same pair always gets same score
    const seed  = (BigInt(user1.id) + BigInt(user2.id)) % 101n;
    const pct   = Number(seed);
    const msg   = getCompatMessage(pct);
    const color = getBarColor(pct);

    // ── Canvas image ──────────────────────────────────────
    const W = 600, H = 200;
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#1e1f22";
    ctx.fillRect(0, 0, W, H);

    // Avatar size & positions
    const AVA = 120;
    const AY  = (H - AVA) / 2;
    const A1X = 30;
    const A2X = W - AVA - 30;

    // Avatar 1
    const av1url = user1.displayAvatarURL({ extension: "png", size: 256 });
    await drawCircleAvatar(ctx, av1url, A1X, AY, AVA);

    // Avatar 2
    const av2url = user2.displayAvatarURL({ extension: "png", size: 256 });
    await drawCircleAvatar(ctx, av2url, A2X, AY, AVA);

    // Heart in the middle
    ctx.font      = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff6b9d";
    ctx.fillText("💗", W / 2, H / 2 - 10);

    // Compatibility % text
    ctx.font      = "bold 22px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${pct}%`, W / 2, H / 2 + 30);

    // Progress bar background
    const BAR_W = 260, BAR_H = 14;
    const BAR_X = (W - BAR_W) / 2;
    const BAR_Y = H / 2 + 45;
    const RADIUS = BAR_H / 2;

    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.roundRect(BAR_X, BAR_Y, BAR_W, BAR_H, RADIUS);
    ctx.fill();

    // Progress bar fill
    const fillW = Math.max(RADIUS * 2, (pct / 100) * BAR_W);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(BAR_X, BAR_Y, fillW, BAR_H, RADIUS);
    ctx.fill();

    // Username 1 below avatar
    ctx.font      = "bold 14px sans-serif";
    ctx.fillStyle = "#cccccc";
    ctx.textAlign = "center";
    const name1 = user1.username.length > 10 ? user1.username.slice(0, 9) + "…" : user1.username;
    const name2 = user2.username.length > 10 ? user2.username.slice(0, 9) + "…" : user2.username;
    ctx.fillText(name1, A1X + AVA / 2, AY + AVA + 18);
    ctx.fillText(name2, A2X + AVA / 2, AY + AVA + 18);

    // Convert to buffer
    const buffer     = canvas.toBuffer("image/png");
    const attachment = new AttachmentBuilder(buffer, { name: "ship.png" });

    // Embed
    const embed = new EmbedBuilder()
      .setColor(0xFF6B9D)
      .setTitle(`💘 ${user1.username} & ${user2.username}`)
      .setDescription(`**${pct}%** compatibility — *${msg}*`)
      .setImage("attachment://ship.png")
      .setFooter({ text: `Requested by ${message.author.username}` });

    return message.reply({ embeds: [embed], files: [attachment] });
  }
};