// Alias — delegates to google.js with image mode
// The google.js command detects ,image prefix automatically
const google = require("./google");

module.exports = {
  name: "image",
  aliases: ["img", "im"],
  execute: google.execute
};