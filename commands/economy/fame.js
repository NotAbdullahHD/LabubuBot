const eco = require("./economy");
module.exports = {
  name: "fame",
  async execute(message, args) {
    await eco._handle(message, args, "fame");
  }
};
