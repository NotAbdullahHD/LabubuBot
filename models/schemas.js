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
  welcomeSent: { type: Boolean, default: false },
  _lastTax:    { type: Number,  default: 0 }
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

// 13. STARBOARD ENTRY
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

// 16. AUTOMOD CONFIG
const automodConfigSchema = new mongoose.Schema({
  guildId:      { type: String,  required: true, unique: true },
  enabled:      { type: Boolean, default: false },
  // bad words
  badwords:     { type: Boolean, default: false },
  wordList:     { type: Array,   default: [] },
  // anti-spam
  antispam:     { type: Boolean, default: false },
  spamCount:    { type: Number,  default: 5  },   // messages
  spamSeconds:  { type: Number,  default: 3  },   // within X seconds
  // anti-invite
  antiinvite:   { type: Boolean, default: false },
  // punishment: "delete" | "warn" | "timeout"
  action:       { type: String,  default: "delete" },
  timeoutMins:  { type: Number,  default: 5 },
  // exempt roles & channels — never automod these
  exemptRoles:    { type: Array, default: [] },
  exemptChannels: { type: Array, default: [] },
  // log channel
  logChannel:   { type: String, default: null }
});

// 18. FLAG SCORE — per user per guild flag game score
const flagScoreSchema = new mongoose.Schema({
  guildId:  { type: String, required: true },
  userId:   { type: String, required: true },
  username: { type: String, default: "Unknown" },
  score:    { type: Number, default: 0 }
});
flagScoreSchema.index({ guildId: 1, userId: 1 }, { unique: true });
flagScoreSchema.index({ guildId: 1, score: -1 });

// 17. AUTOMOD WARNS — track warn count per user per guild
const automodWarnSchema = new mongoose.Schema({
  guildId:  { type: String, required: true },
  userId:   { type: String, required: true },
  warns:    { type: Number, default: 0 },
  history:  { type: Array,  default: [] }  // [{ reason, timestamp }]
});
automodWarnSchema.index({ guildId: 1, userId: 1 }, { unique: true });

// 19. TRIVIA SCORE
const triviaScoreSchema = new mongoose.Schema({
  guildId:  { type: String, required: true },
  userId:   { type: String, required: true },
  username: { type: String, required: true },
  score:    { type: Number, default: 0 }
});
triviaScoreSchema.index({ guildId: 1, userId: 1 }, { unique: true });
triviaScoreSchema.index({ guildId: 1, score: -1 });

// 20. SHOP ITEM — items owned by users that generate passive income
const shopItemSchema = new mongoose.Schema({
  userId:      { type: String, required: true },
  itemId:      { type: String, required: true },
  name:        { type: String, required: true },
  incomePerHr: { type: Number, required: true },
  lastPaid:    { type: Number, default: Date.now }
});
shopItemSchema.index({ userId: 1, itemId: 1 }, { unique: true });

// 21. AUTO REACT — auto react to every message in specific channels
const autoReactSchema = new mongoose.Schema({
  guildId:   { type: String, required: true },
  channelId: { type: String, required: true },
  emojis:    [{ type: String }]
});
autoReactSchema.index({ guildId: 1, channelId: 1 }, { unique: true });

// 22. TRIGGER REACT — react to messages containing a trigger word
const triggerReactSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  trigger: { type: String, required: true },
  emoji:   { type: String, required: true }
});
triggerReactSchema.index({ guildId: 1, trigger: 1 }, { unique: true });

// 23. VC ROLE — role given to users while in a voice channel
const vcRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  roleId:  { type: String, required: true }
});

// 24. LOG CONFIG — channels for different log types
const logConfigSchema = new mongoose.Schema({
  guildId:    { type: String, required: true, unique: true },
  default:    { type: String, default: null }, // fallback channel
  member:     { type: String, default: null }, // join/leave
  message:    { type: String, default: null }, // delete/edit
  moderation: { type: String, default: null }, // ban/kick/warn
  voice:      { type: String, default: null }, // vc join/leave
  role:       { type: String, default: null }, // role/nickname changes
});

module.exports = {
  User:            mongoose.model("User",            userSchema),
  Family:          mongoose.model("Family",          familySchema),
  Config:          mongoose.model("Config",          configSchema),
  Giveaway:        mongoose.model("Giveaway",        giveawaySchema),
  LastFm:          mongoose.model("LastFm",          lastFmSchema),
  Sobs:            mongoose.model("Sobs",            sobsSchema),
  BoosterRole:     mongoose.model("BoosterRole",     boosterRoleSchema),
  EcoUser:         mongoose.model("EcoUser",         ecoUserSchema),
  GuildStats:      mongoose.model("GuildStats",      guildStatsSchema),
  LevelUser:       mongoose.model("LevelUser",       levelUserSchema),
  LevelConfig:     mongoose.model("LevelConfig",     levelConfigSchema),
  StarboardConfig: mongoose.model("StarboardConfig", starboardConfigSchema),
  StarboardEntry:  mongoose.model("StarboardEntry",  starboardEntrySchema),
  TicketConfig:    mongoose.model("TicketConfig",    ticketConfigSchema),
  Ticket:          mongoose.model("Ticket",          ticketSchema),
  AutomodConfig:   mongoose.model("AutomodConfig",   automodConfigSchema),
  AutomodWarn:     mongoose.model("AutomodWarn",     automodWarnSchema),
  FlagScore:       mongoose.model("FlagScore",       flagScoreSchema),
  TriviaScore:     mongoose.model("TriviaScore",     triviaScoreSchema),
  ShopItem:        mongoose.model("ShopItem",        shopItemSchema),
  LogConfig:       mongoose.model("LogConfig",       logConfigSchema),
  AutoReact:       mongoose.model("AutoReact",       autoReactSchema),
  TriggerReact:    mongoose.model("TriggerReact",    triggerReactSchema),
  VcRole:          mongoose.model("VcRole",          vcRoleSchema)
};