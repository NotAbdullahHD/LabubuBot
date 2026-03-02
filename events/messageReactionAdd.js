const { Sobs } = require('../models/schemas');
const { handleReactionIncome } = require('../commands/economy/economy');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user, client) {
    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }
    if (reaction.message.partial) {
      try { await reaction.message.fetch(); } catch { return; }
    }

    if (user.bot) return;

    // Economy: reaction income for the person who reacted
    await handleReactionIncome(reaction, user);

    // Sobs counter — give the sob to the AUTHOR of the message, not the reactor
    if (reaction.emoji.name === '😭') {
      const messageAuthor = reaction.message.author;

      // Don't count if someone sobs their own message
      if (!messageAuthor || messageAuthor.bot || messageAuthor.id === user.id) return;

      await Sobs.findOneAndUpdate(
        { userId: messageAuthor.id },
        { $inc: { count: 1 } },
        { upsert: true }
      );
    }
  }
};