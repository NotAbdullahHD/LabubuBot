const eco = require("./economy");
module.exports = {
  name: "daily",
  async execute(message, args) {
    await eco._handle(message, args, "daily");
  }
};
