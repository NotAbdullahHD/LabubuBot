const eco = require("./economy");
module.exports = {
  name: "give",
  async execute(message, args) {
    await eco._handle(message, args, "give");
  }
};
