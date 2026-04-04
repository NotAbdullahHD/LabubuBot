const { Client, GatewayIntentBits, Collection } = require("discord.js");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

require("dotenv").config();
const TOKEN     = process.env.TOKEN;
const MONGO_URI = process.env.MONGO_URI;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions
  ],
  ws: {
    properties: {
      browser: "Discord iOS"
    }
  }
});

client.commands = new Collection();
client.snipes   = new Collection();

/* ── Database ── */
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

/* ── Load Commands ── */
const foldersPath = path.join(__dirname, "commands");
for (const folder of fs.readdirSync(foldersPath)) {
  const commandsPath = path.join(foldersPath, folder);
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
    const command = require(path.join(commandsPath, file));
    if ("name" in command && "execute" in command) {
      client.commands.set(command.name, command);
      console.log(`🔹 Loaded: ${command.name}`);
    }
  }
}

/* ── Load Events ── */
const eventsPath = path.join(__dirname, "events");
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`🔸 Loaded Event: ${event.name}`);
}

client.login(TOKEN);
// Koyeb web service keep-alive
require("./server");