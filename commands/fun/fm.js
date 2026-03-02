const { EmbedBuilder } = require("discord.js");
const { LastFm } = require("../../models/schemas");
const axios = require("axios"); // You MUST run: npm install axios

// 🔴 YOU MUST REPLACE THIS WITH YOUR OWN LAST.FM API KEY!
// Get one here: https://www.last.fm/api/account/create
const LASTFM_API_KEY = "12f73c6eef7830de5bcb6d96c911e9d2"; 

module.exports = {
  name: "fm",
  description: "See what you are listening to on Last.fm",
  async execute(message, args, client) {

    const sub = args[0]?.toLowerCase();

    // --- 1. SET USERNAME ---
    if (sub === "set") {
      const username = args[1];
      if (!username) return message.reply("❌ Usage: `,fm set <your_lastfm_username>`");

      await LastFm.findOneAndUpdate(
        { userId: message.author.id },
        { username: username },
        { upsert: true, new: true }
      );
      return message.reply(`✅ Last.fm username set to: **${username}**`);
    }

    // --- 2. GET CURRENT SONG ---
    // If no subcommand, we just fetch the song
    try {
      // Find user in database
      const user = await LastFm.findOne({ userId: message.author.id });
      if (!user) return message.reply("❌ You haven't set your username! Use `,fm set <name>`");

      // Fetch from Last.fm API
      const url = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user.username}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;
      const response = await axios.get(url);

      const track = response.data.recenttracks.track[0];
      if (!track) return message.reply("❌ No recent tracks found.");

      const isPlaying = track["@attr"] && track["@attr"].nowplaying === "true";
      const trackName = track.name;
      const artistName = track.artist["#text"];
      const albumName = track.album["#text"];
      const albumArt = track.image[2]["#text"]; // Large image

      const embed = new EmbedBuilder()
        .setColor(isPlaying ? "#00FF00" : "#2b2d31")
        .setAuthor({ name: `Last.fm: ${user.username}`, iconURL: message.author.displayAvatarURL() })
        .setTitle(`🎵 ${trackName}`)
        .setDescription(`**Artist:** ${artistName}\n**Album:** ${albumName}`)
        .setThumbnail(albumArt || null)
        .setFooter({ text: isPlaying ? "Now Playing..." : "Last scrobbled" });

      return message.reply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      return message.reply("❌ Error talking to Last.fm. (Did you add your API Key in the code?)");
    }
  }
};