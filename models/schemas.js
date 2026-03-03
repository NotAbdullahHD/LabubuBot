const mongoose = require("mongoose");

// 1. USER
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  afk: {
    isAfk:     { type: Boolean, default: false },
    reason:    { type: String,  default: null },
    timestamp: { type: Number,  default: null }
  }
});

// 2. FAMILY
const familySchema = new mongoose.Schema({
  userId:    { type: String, required: true, unique: true },
  partnerId: { type: String, default: null },
  parent:    { type: String, default: null },
  children:  { type: Array,  default: [] }
});

// 3. CONFIG
const configSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  poj: {
    channel: { type: String, default: null },
    time:    { type: Number, default: 5000 }
  },
  booster: {
    channelId: { type: String, default: null },
    roleId:    { type: String, default: null }
  },
  welcome: {
    channel:   { type: String, default: null },
    embedCode: { type: String, default: null }
  }
});

// 4. GIVEAWAY
const giveawaySchema = new mongoose.Schema({
  messageId:    { type: String,  required: true, unique: true },
  channelId:    { type: String,  required: true },
  guildId:      { type: String,  required: true },
  prize:        { type: String,  required: true },
  endTime:      { type: Number,  required: true },
  winnersCount: { type: Number,  required: true },
  participants: { type: Array,   default: [] },
  ended:        { type: Boolean, default: false },
  hostedBy:     { type: String,  required: true }
});

// 5. LAST FM
const lastFmSchema = new mongoose.Schema({
  userId:   { type: String, required: true, unique: true },
  username: { type: String, required: true }
});

// 6. SOBS
const sobsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  count:  { type: Number, default: 0 }
});

// 7. BOOSTER ROLE
const boosterRoleSchema = new mongoose.Schema({
  userId:  { type: String, required: true, unique: true },
  guildId: { type: String, required: true },
  roleId:  { type: String, default: null }
});

// 8. ECONOMY USER
const ecoUserSchema = new mongoose.Schema({
  userId:      { type: String,  required: true, unique: true },
  wallet:      { type: Number,  default: 0 },
  bank:        { type: Number,  default: 0 },
  aura:        { type: Number,  default: 0 },
  lastWork:    { type: Number,  default: 0 },
  lastDaily:   { type: Number,  default: 0 },
  welcomeSent: { type: Boolean, default: false }
});

// 9. GUILD STATS
const guildStatsSchema = new mongoose.Schema({
  guildId:       { type: String, required: true },
  userId:        { type: String, required: true },
  username:      { type: String, default: "Unknown" },
  messageCount:  { type: Number, default: 0 },
  voiceSeconds:  { type: Number, default: 0 },
  voiceJoinedAt: { type: Number, default: null }
});
guildStatsSchema.index({ guildId: 1, userId: 1 }, { unique: true });

// 10. LEVEL USER
const levelUserSchema = new mongoose.Schema({
  guildId:  { type: String, required: true },
  userId:   { type: String, required: true },
  username: { type: String, default: "Unknown" },
  xp:       { type: Number, default: 0 },
  level:    { type: Number, default: 0 },
  lastXpAt: { type: Number, default: 0 }
});
levelUserSchema.index({ guildId: 1, userId: 1 }, { unique: true });
levelUserSchema.index({ guildId: 1, xp: -1 });

// 11. LEVEL CONFIG
const levelConfigSchema = new mongoose.Schema({
  guildId:    { type: String, required: true, unique: true },
  enabled:    { type: Boolean, default: true },
  channel:    { type: String,  default: null },
  embedCode:  { type: String,  default: null },
  rewards:    { type: Array,   default: [] },
  multiplier: { type: Number,  default: 1.0 }
});

// 12. STARBOARD CONFIG
const starboardConfigSchema = new mongoose.Schema({
  guildId:   { type: String,  required: true, unique: true },
  enabled:   { type: Boolean, default: true },
  channelId: { type: String,  default: null },
  emoji:     { type: String,  default: "⭐" },
  threshold: { type: Number,  default: 3 }
});

// 13. STARBOARD ENTRY — tracks which messages have already been posted
const starboardEntrySchema = new mongoose.Schema({
  guildId:        { type: String, required: true },
  originalMsgId:  { type: String, required: true, unique: true },
  starboardMsgId: { type: String, default: null }
});

// 14. TICKET CONFIG
const ticketConfigSchema = new mongoose.Schema({
  guildId:     { type: String, required: true, unique: true },
  categoryId:  { type: String, default: null },
  supportRole: { type: String, default: null },
  logChannel:  { type: String, default: null },
  counter:     { type: Number, default: 0 }
});

// 15. TICKET
const ticketSchema = new mongoose.Schema({
  guildId:   { type: String, required: true },
  channelId: { type: String, required: true, unique: true },
  userId:    { type: String, required: true },
  claimedBy: { type: String, default: null },
  ticketNum: { type: Number, required: true },
  createdAt: { type: Number, default: () => Date.now() }
});
ticketSchema.index({ guildId: 1, ticketNum: -1 });

module.exports = {
  User:           mongoose.model("User",           userSchema),
  Family:         mongoose.model("Family",         familySchema),
  Config:         mongoose.model("Config",         configSchema),
  Giveaway:       mongoose.model("Giveaway",       giveawaySchema),
  LastFm:         mongoose.model("LastFm",         lastFmSchema),
  Sobs:           mongoose.model("Sobs",           sobsSchema),
  BoosterRole:    mongoose.model("BoosterRole",    boosterRoleSchema),
  EcoUser:        mongoose.model("EcoUser",        ecoUserSchema),
  GuildStats:     mongoose.model("GuildStats",     guildStatsSchema),
  LevelUser:      mongoose.model("LevelUser",      levelUserSchema),
  LevelConfig:    mongoose.model("LevelConfig",    levelConfigSchema),
  StarboardConfig: mongoose.model("StarboardConfig", starboardConfigSchema),
  StarboardEntry:  mongoose.model("StarboardEntry",  starboardEntrySchema),
  TicketConfig:   mongoose.model("TicketConfig",   ticketConfigSchema),
  Ticket:         mongoose.model("Ticket",         ticketSchema)
};