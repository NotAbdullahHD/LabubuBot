const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "mod", 
  // We will handle subcommands (kick, ban, etc) here by checking the alias or just making separate files. 
  // Since you want separate files for categories, let's actually split them for you to make it easier.
  execute(message, args, client) { message.reply("Use specific commands: kick, ban, lock, unlock, clear"); }
};