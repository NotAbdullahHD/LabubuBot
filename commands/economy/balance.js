const eco = require("./economy");
module.exports = {
  name: "balance",
  async execute(message, args) {
    await eco._handle(message, args, "balance");
  }
};
