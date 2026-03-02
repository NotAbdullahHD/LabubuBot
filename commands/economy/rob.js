const eco = require("./economy");
module.exports = {
  name: "rob",
  async execute(message, args) {
    await eco._handle(message, args, "rob");
  }
};
