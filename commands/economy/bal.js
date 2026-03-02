const eco = require("./economy");
module.exports = {
  name: "bal",
  async execute(message, args) {
    await eco._handle(message, args, "bal");
  }
};
