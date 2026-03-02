const eco = require("./economy");
module.exports = {
  name: "bj",
  async execute(message, args) {
    await eco._handle(message, args, "bj");
  }
};
