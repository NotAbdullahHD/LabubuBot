const eco = require("./economy");
module.exports = {
  name: "help",
  async execute(message, args) {
    await eco._handle(message, args, "ecohelp");
  }
};