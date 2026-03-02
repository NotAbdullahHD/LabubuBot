const eco = require("./economy");
module.exports = {
  name: "with",
  async execute(message, args) {
    await eco._handle(message, args, "with");
  }
};
