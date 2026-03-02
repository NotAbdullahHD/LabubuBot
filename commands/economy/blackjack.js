const eco = require("./economy");
module.exports = {
  name: "blackjack",
  async execute(message, args) {
    await eco._handle(message, args, "blackjack");
  }
};
