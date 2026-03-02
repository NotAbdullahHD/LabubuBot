const eco = require("./economy");
module.exports = {
  name: "plinko",
  async execute(message, args) {
    await eco._handle(message, args, "plinko");
  }
};
