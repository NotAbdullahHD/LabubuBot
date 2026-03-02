const eco = require("./economy");
module.exports = {
  name: "gamble",
  async execute(message, args) {
    await eco._handle(message, args, "gamble");
  }
};
