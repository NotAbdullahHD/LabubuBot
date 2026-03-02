const eco = require("./economy");
module.exports = {
  name: "dep",
  async execute(message, args) {
    await eco._handle(message, args, "dep");
  }
};
