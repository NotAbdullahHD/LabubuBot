const eco = require("./economy");
module.exports = {
  name: "deposit",
  async execute(message, args) {
    await eco._handle(message, args, "deposit");
  }
};
