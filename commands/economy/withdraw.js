const eco = require("./economy");
module.exports = {
  name: "withdraw",
  async execute(message, args) {
    await eco._handle(message, args, "withdraw");
  }
};
