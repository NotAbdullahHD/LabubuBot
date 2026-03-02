const { User } = require("../../models/schemas"); // Make sure path matches your folder structure!

module.exports = {
  name: "afk",
  description: "Set your AFK status",
  async execute(message, args, client) {
    const reason = args.join(" ") || "AFK";

    try {
      // Save to MongoDB
      await User.findOneAndUpdate(
        { userId: message.author.id },
        { 
          afk: {
            isAfk: true,
            reason: reason,
            timestamp: Date.now()
          }
        },
        { upsert: true, new: true } // Create if doesn't exist
      );

      return message.reply(`💤 You are now AFK: **${reason}**`);
    } catch (err) {
      console.error(err);
      return message.reply("❌ Database error. Make sure schemas.js is updated.");
    }
  }
};