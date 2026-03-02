const { EmbedBuilder } = require("discord.js");

// YOUR bot owner Discord user ID — only this person can change the bot's global avatar/name
// ✅ FIXED: was checking guild owner ID which lets ANY server owner change your bot's face
const BOT_OWNER_ID = process.env.BOT_OWNER_ID || "REPLACE_WITH_YOUR_DISCORD_ID";

module.exports = {
  name: "customize",
  description: "Change or reset the bot's avatar, banner, or name (bot owner only)",
  async execute(message, args, client) {

    // ✅ FIXED: now checks BOT_OWNER_ID (your personal Discord ID) not server owner
    if (message.author.id !== BOT_OWNER_ID) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ Only the **bot owner** can use this command.")] });
    }

    const sub        = args[0]?.toLowerCase();
    const value      = args.slice(1).join(" ");
    const attachment = message.attachments.first();

    if (!sub) {
      return message.reply("Usage:\n`,customize avatar <url or upload>`\n`,customize banner <url or upload>`\n`,customize name <new name>`\n`,customize reset <avatar|banner>`");
    }

    if (sub === "reset") {
      const type = args[1]?.toLowerCase();
      if (type === "avatar" || type === "pfp") {
        try { await client.user.setAvatar(null); return message.reply("✅ Avatar reset."); }
        catch { return message.reply("❌ Failed (rate limited?)."); }
      }
      if (type === "banner") {
        try { await client.user.setBanner(null); return message.reply("✅ Banner removed."); }
        catch { return message.reply("❌ Failed."); }
      }
      return message.reply("Usage: `,customize reset avatar` or `,customize reset banner`");
    }

    if (sub === "avatar" || sub === "pfp") {
      const url = attachment?.url || value;
      if (!url) return message.reply("❌ Provide an image URL or upload a file.");
      try { await client.user.setAvatar(url); return message.reply("✅ Avatar updated!"); }
      catch { return message.reply("❌ Failed. Changing too fast?"); }
    }

    if (sub === "banner") {
      const url = attachment?.url || value;
      if (!url) return message.reply("❌ Provide an image URL or upload a file.");
      try { await client.user.setBanner(url); return message.reply("✅ Banner updated!"); }
      catch { return message.reply("❌ Failed. Does the bot have Nitro/banner slot?"); }
    }

    if (sub === "name" || sub === "username") {
      if (!value) return message.reply("❌ Provide a new name.");
      try { await client.user.setUsername(value); return message.reply(`✅ Username changed to: **${value}**`); }
      catch { return message.reply("❌ Failed. Changing too fast?"); }
    }
  }
};