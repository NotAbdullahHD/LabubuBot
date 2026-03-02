const eco = require("./economy");
module.exports = {
  name: "mines",
  async execute(message, args) {
    await eco._handle(message, args, "mines");
  }
};
