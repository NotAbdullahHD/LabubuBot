const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { TriviaScore } = require("../../models/schemas");

const QUESTIONS = [
  // ── General Knowledge ─────────────────────────────────
  { q: "What is the capital of France?",                          a: "paris",          category: "🌍 Geography" },
  { q: "How many continents are there on Earth?",                 a: "7",              category: "🌍 Geography" },
  { q: "What is the largest ocean on Earth?",                     a: "pacific",        category: "🌍 Geography" },
  { q: "What country has the most natural lakes?",                a: "canada",         category: "🌍 Geography" },
  { q: "What is the capital of Japan?",                           a: "tokyo",          category: "🌍 Geography" },
  { q: "What is the longest river in the world?",                 a: "nile",           category: "🌍 Geography" },
  { q: "What is the smallest country in the world?",              a: "vatican",        category: "🌍 Geography" },
  { q: "What is the capital of Australia?",                       a: "canberra",       category: "🌍 Geography" },
  { q: "Which country has the largest population?",               a: "india",          category: "🌍 Geography" },
  { q: "What is the tallest mountain in the world?",              a: "everest",        category: "🌍 Geography" },
  { q: "What is the capital of Brazil?",                          a: "brasilia",       category: "🌍 Geography" },
  { q: "Which desert is the largest in the world?",               a: "sahara",         category: "🌍 Geography" },

  // ── Science ───────────────────────────────────────────
  { q: "What planet is closest to the Sun?",                      a: "mercury",        category: "🔬 Science" },
  { q: "What is the chemical symbol for water?",                  a: "h2o",            category: "🔬 Science" },
  { q: "How many bones are in the adult human body?",             a: "206",            category: "🔬 Science" },
  { q: "What gas do plants absorb from the atmosphere?",          a: "carbon dioxide", category: "🔬 Science" },
  { q: "What is the speed of light in km/s? (approx)",            a: "300000",         category: "🔬 Science" },
  { q: "What is the hardest natural substance on Earth?",         a: "diamond",        category: "🔬 Science" },
  { q: "How many chromosomes do humans have?",                    a: "46",             category: "🔬 Science" },
  { q: "What is the chemical symbol for gold?",                   a: "au",             category: "🔬 Science" },
  { q: "What planet is known as the Red Planet?",                 a: "mars",           category: "🔬 Science" },
  { q: "What is the powerhouse of the cell?",                     a: "mitochondria",   category: "🔬 Science" },
  { q: "What force keeps planets in orbit around the Sun?",       a: "gravity",        category: "🔬 Science" },
  { q: "What is the most abundant gas in Earth's atmosphere?",    a: "nitrogen",       category: "🔬 Science" },

  // ── Gaming ────────────────────────────────────────────
  { q: "What game features a character named Master Chief?",      a: "halo",           category: "🎮 Gaming" },
  { q: "In Minecraft, what do you need to make a cake?",          a: "milk",           category: "🎮 Gaming" },
  { q: "What is the best-selling video game of all time?",        a: "minecraft",      category: "🎮 Gaming" },
  { q: "What company made the PlayStation?",                      a: "sony",           category: "🎮 Gaming" },
  { q: "In Among Us, what are players trying to find?",           a: "impostor",       category: "🎮 Gaming" },
  { q: "What game has characters named Mario and Luigi?",         a: "mario",          category: "🎮 Gaming" },
  { q: "What is the name of Link's horse in Zelda?",              a: "epona",          category: "🎮 Gaming" },
  { q: "In Fortnite what is the highest rarity?",                 a: "mythic",         category: "🎮 Gaming" },
  { q: "What game is set in Night City?",                         a: "cyberpunk",      category: "🎮 Gaming" },
  { q: "How many players start in a standard Fortnite match?",    a: "100",            category: "🎮 Gaming" },
  { q: "What company makes the Xbox?",                            a: "microsoft",      category: "🎮 Gaming" },
  { q: "What game features a battle royale on an island called Erangel?", a: "pubg",   category: "🎮 Gaming" },

  // ── Music ─────────────────────────────────────────────
  { q: "What artist released the album 'Anti'?",                  a: "rihanna",        category: "🎵 Music" },
  { q: "How many members are in BTS?",                            a: "7",              category: "🎵 Music" },
  { q: "What is Drake's real first name?",                        a: "aubrey",         category: "🎵 Music" },
  { q: "What artist is known as the Queen of Pop?",               a: "madonna",        category: "🎵 Music" },
  { q: "What year did Michael Jackson release Thriller?",         a: "1982",           category: "🎵 Music" },
  { q: "What instrument does a pianist play?",                    a: "piano",          category: "🎵 Music" },
  { q: "Who sings 'Sicko Mode'?",                                 a: "travis scott",   category: "🎵 Music" },
  { q: "What artist released 'Deli'?",                            a: "ice spice",      category: "🎵 Music" },
  { q: "What rapper is known as Slim Shady?",                     a: "eminem",         category: "🎵 Music" },
  { q: "What city is known as the birthplace of hip hop?",        a: "new york",       category: "🎵 Music" },
  { q: "Who sings 'Blinding Lights'?",                            a: "the weeknd",     category: "🎵 Music" },
  { q: "What artist released 'God's Plan'?",                      a: "drake",          category: "🎵 Music" },

  // ── Movies & TV ───────────────────────────────────────
  { q: "What movie features the line 'I'll be back'?",            a: "terminator",     category: "🎬 Movies & TV" },
  { q: "Who directed Pulp Fiction?",                              a: "tarantino",      category: "🎬 Movies & TV" },
  { q: "What show features characters Walter White and Jesse?",   a: "breaking bad",   category: "🎬 Movies & TV" },
  { q: "What is the highest-grossing film of all time?",          a: "avatar",         category: "🎬 Movies & TV" },
  { q: "What streaming service made Squid Game?",                 a: "netflix",        category: "🎬 Movies & TV" },
  { q: "What Marvel hero wields a hammer called Mjolnir?",        a: "thor",           category: "🎬 Movies & TV" },
  { q: "How many seasons does Game of Thrones have?",             a: "8",              category: "🎬 Movies & TV" },
  { q: "What movie features the Joker saying 'Why so serious?'",  a: "dark knight",    category: "🎬 Movies & TV" },
  { q: "What show is set in Hawkins, Indiana?",                   a: "stranger things",category: "🎬 Movies & TV" },
  { q: "Who plays Tony Stark in the MCU?",                        a: "robert downey",  category: "🎬 Movies & TV" },
  { q: "What animated movie features a clownfish named Nemo?",    a: "finding nemo",   category: "🎬 Movies & TV" },
  { q: "What year was the first Star Wars movie released?",       a: "1977",           category: "🎬 Movies & TV" },

  // ── Sports ────────────────────────────────────────────
  { q: "How many players are on a football (soccer) team?",       a: "11",             category: "⚽ Sports" },
  { q: "What country invented basketball?",                       a: "usa",            category: "⚽ Sports" },
  { q: "How many rings does the Olympic flag have?",              a: "5",              category: "⚽ Sports" },
  { q: "What sport is played at Wimbledon?",                      a: "tennis",         category: "⚽ Sports" },
  { q: "How many points is a touchdown worth in American football?", a: "6",           category: "⚽ Sports" },
  { q: "What country has won the most FIFA World Cups?",          a: "brazil",         category: "⚽ Sports" },
  { q: "What is the diameter of a basketball hoop in inches?",    a: "18",             category: "⚽ Sports" },
  { q: "In what sport would you perform a slam dunk?",            a: "basketball",     category: "⚽ Sports" },
  { q: "Who is known as the GOAT of football (soccer)?",          a: "messi",          category: "⚽ Sports" },
  { q: "What sport uses a puck?",                                 a: "hockey",         category: "⚽ Sports" },

  // ── History ───────────────────────────────────────────
  { q: "In what year did World War II end?",                      a: "1945",           category: "📜 History" },
  { q: "Who was the first President of the United States?",       a: "washington",     category: "📜 History" },
  { q: "What ancient wonder was located in Alexandria?",          a: "lighthouse",     category: "📜 History" },
  { q: "What year did the Berlin Wall fall?",                     a: "1989",           category: "📜 History" },
  { q: "Who invented the telephone?",                             a: "bell",           category: "📜 History" },
  { q: "What empire was Julius Caesar part of?",                  a: "roman",          category: "📜 History" },
  { q: "What year did the Titanic sink?",                         a: "1912",           category: "📜 History" },
  { q: "Who painted the Mona Lisa?",                              a: "da vinci",       category: "📜 History" },
  { q: "What country did Napoleon Bonaparte come from?",          a: "france",         category: "📜 History" },
  { q: "In what year did man first land on the Moon?",            a: "1969",           category: "📜 History" },

  // ── General Knowledge ─────────────────────────────────
  { q: "How many sides does a hexagon have?",                     a: "6",              category: "🧠 General" },
  { q: "What is the most spoken language in the world?",          a: "mandarin",       category: "🧠 General" },
  { q: "How many hours are in a week?",                           a: "168",            category: "🧠 General" },
  { q: "What color is the sun?",                                  a: "white",          category: "🧠 General" },
  { q: "How many seconds are in a minute?",                       a: "60",             category: "🧠 General" },
  { q: "What is the longest word in the English language?",       a: "pneumonoultramicroscopicsilicovolcanoconiosis", category: "🧠 General" },
  { q: "What is 15% of 200?",                                     a: "30",             category: "🧠 General" },
  { q: "How many letters are in the alphabet?",                   a: "26",             category: "🧠 General" },
  { q: "What animal is known as man's best friend?",              a: "dog",            category: "🧠 General" },
  { q: "What is the opposite of 'ancient'?",                      a: "modern",         category: "🧠 General" },
];

const activeGames = new Map();

module.exports = {
  name: "trivia",
  aliases: ["triv"],

  async execute(message) {
    const channelId = message.channel.id;

    if (activeGames.has(channelId)) {
      return message.channel.send("❌ A trivia game is already running in this channel!");
    }

    // Pick random question
    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

    const embed = new EmbedBuilder()
      .setTitle("🧠 Trivia Time!")
      .setDescription(`**${q.q}**\n\nType your answer in chat! You have **15 seconds**.`)
      .setColor(0x5865F2)
      .setFooter({ text: q.category })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`trivia_hint_${channelId}`)
        .setEmoji("❓")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`trivia_lb_${channelId}`)
        .setEmoji("📊")
        .setStyle(ButtonStyle.Secondary)
    );

    const gameMsg = await message.reply({ embeds: [embed], components: [row] });
    activeGames.set(channelId, { q, gameMsg });

    // ── 15 second message collector ───────────────────────
    const msgCol = message.channel.createMessageCollector({
      filter: m => !m.author.bot,
      time:   15_000
    });

    msgCol.on("collect", async m => {
      const guess   = m.content.trim().toLowerCase();
      const correct = q.a.split("|").some(ans => guess.includes(ans.trim()));
      if (!correct) return;

      msgCol.stop("correct");
      activeGames.delete(channelId);

      await TriviaScore.findOneAndUpdate(
        { guildId: message.guild.id, userId: m.author.id },
        { $inc: { score: 1 }, $set: { username: m.author.username } },
        { upsert: true }
      ).catch(() => {});

      // Disable buttons
      const disabledRow = new ActionRowBuilder().addComponents(
        row.components.map(b => ButtonBuilder.from(b).setDisabled(true))
      );
      await gameMsg.edit({ components: [disabledRow] }).catch(() => {});

      await message.channel.send(`✅ **${m.author.username}** got it! The answer was **${q.a}** — +1 point!`);
    });

    msgCol.on("end", async (_, reason) => {
      if (reason === "correct") return;
      activeGames.delete(channelId);

      const disabledRow = new ActionRowBuilder().addComponents(
        row.components.map(b => ButtonBuilder.from(b).setDisabled(true))
      );
      await gameMsg.edit({ components: [disabledRow] }).catch(() => {});

      await message.channel.send(`⏰ ${message.author} Time's up! The correct answer was: **${q.a}**`);
    });

    // ── Button collector ──────────────────────────────────
    const btnCol = gameMsg.createMessageComponentCollector({ time: 17_000 });

    btnCol.on("collect", async interaction => {

      // ❓ Hint — first letter + length
      if (interaction.customId === `trivia_hint_${channelId}`) {
        const answer = q.a;
        const first  = answer[0].toUpperCase();
        const stars  = "*".repeat(Math.max(0, answer.length - 1));
        const hint   = `${first}${stars} (${answer.length} letters)`;
        await interaction.deferUpdate();
        await message.channel.send(`🔵 **${interaction.user.username}** requested a hint:\nHint: \`${hint}\``);
        return;
      }

      // 📊 Leaderboard
      if (interaction.customId === `trivia_lb_${channelId}`) {
        const top = await TriviaScore.find({ guildId: message.guild.id })
          .sort({ score: -1 })
          .limit(10);

        await interaction.deferUpdate();

        if (!top.length) {
          await message.channel.send("No trivia scores yet! Be the first to answer correctly.");
          return;
        }

        const total = await TriviaScore.countDocuments({ guildId: message.guild.id });
        const list  = top.map((e, i) => `${i + 1}. ${e.username} — **${e.score}** points`).join("\n");

        await message.channel.send({
          embeds: [new EmbedBuilder()
            .setTitle("🧠 Trivia Leaderboard")
            .setDescription(`Top trivia players in the server\n\n${list}`)
            .setColor(0x5865F2)
            .setFooter({ text: `Page 1/${Math.ceil(total / 10)}` })
          ]
        });
      }
    });
  }
};

// ,trivialb — standalone leaderboard