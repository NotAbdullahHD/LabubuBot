const eco = require("./economy");
module.exports = {
  name: "work",
  async execute(message, args) {
    await eco._handle(message, args, "work");
  }
};
