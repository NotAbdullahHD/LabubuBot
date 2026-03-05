const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { FlagScore } = require("../../models/schemas");

// ─────────────────────────────────────────────────────────────
//  FLAG DATABASE — emoji flag + all accepted answers
// ─────────────────────────────────────────────────────────────
const FLAGS = [
  { emoji: "🇦🇫", name: "Afghanistan", answers: ["afghanistan", "afghan"] },
  { emoji: "🇦🇱", name: "Albania", answers: ["albania"] },
  { emoji: "🇩🇿", name: "Algeria", answers: ["algeria"] },
  { emoji: "🇦🇩", name: "Andorra", answers: ["andorra"] },
  { emoji: "🇦🇴", name: "Angola", answers: ["angola"] },
  { emoji: "🇦🇬", name: "Antigua and Barbuda", answers: ["antigua", "barbuda", "antigua and barbuda"] },
  { emoji: "🇦🇷", name: "Argentina", answers: ["argentina"] },
  { emoji: "🇦🇲", name: "Armenia", answers: ["armenia"] },
  { emoji: "🇦🇺", name: "Australia", answers: ["australia"] },
  { emoji: "🇦🇹", name: "Austria", answers: ["austria"] },
  { emoji: "🇦🇿", name: "Azerbaijan", answers: ["azerbaijan"] },
  { emoji: "🇧🇸", name: "Bahamas", answers: ["bahamas", "the bahamas"] },
  { emoji: "🇧🇭", name: "Bahrain", answers: ["bahrain"] },
  { emoji: "🇧🇩", name: "Bangladesh", answers: ["bangladesh"] },
  { emoji: "🇧🇧", name: "Barbados", answers: ["barbados"] },
  { emoji: "🇧🇾", name: "Belarus", answers: ["belarus"] },
  { emoji: "🇧🇪", name: "Belgium", answers: ["belgium"] },
  { emoji: "🇧🇿", name: "Belize", answers: ["belize"] },
  { emoji: "🇧🇯", name: "Benin", answers: ["benin"] },
  { emoji: "🇧🇹", name: "Bhutan", answers: ["bhutan"] },
  { emoji: "🇧🇴", name: "Bolivia", answers: ["bolivia"] },
  { emoji: "🇧🇦", name: "Bosnia and Herzegovina", answers: ["bosnia", "herzegovina", "bosnia and herzegovina"] },
  { emoji: "🇧🇼", name: "Botswana", answers: ["botswana"] },
  { emoji: "🇧🇷", name: "Brazil", answers: ["brazil"] },
  { emoji: "🇧🇳", name: "Brunei", answers: ["brunei"] },
  { emoji: "🇧🇬", name: "Bulgaria", answers: ["bulgaria"] },
  { emoji: "🇧🇫", name: "Burkina Faso", answers: ["burkina faso", "burkina"] },
  { emoji: "🇧🇮", name: "Burundi", answers: ["burundi"] },
  { emoji: "🇨🇻", name: "Cape Verde", answers: ["cape verde", "cabo verde"] },
  { emoji: "🇰🇭", name: "Cambodia", answers: ["cambodia"] },
  { emoji: "🇨🇲", name: "Cameroon", answers: ["cameroon"] },
  { emoji: "🇨🇦", name: "Canada", answers: ["canada"] },
  { emoji: "🇨🇫", name: "Central African Republic", answers: ["central african republic", "car"] },
  { emoji: "🇹🇩", name: "Chad", answers: ["chad"] },
  { emoji: "🇨🇱", name: "Chile", answers: ["chile"] },
  { emoji: "🇨🇳", name: "China", answers: ["china", "prc", "peoples republic of china"] },
  { emoji: "🇨🇴", name: "Colombia", answers: ["colombia"] },
  { emoji: "🇰🇲", name: "Comoros", answers: ["comoros"] },
  { emoji: "🇨🇬", name: "Congo", answers: ["congo", "republic of congo"] },
  { emoji: "🇨🇩", name: "DR Congo", answers: ["dr congo", "democratic republic of congo", "drc", "zaire"] },
  { emoji: "🇨🇷", name: "Costa Rica", answers: ["costa rica"] },
  { emoji: "🇭🇷", name: "Croatia", answers: ["croatia"] },
  { emoji: "🇨🇺", name: "Cuba", answers: ["cuba"] },
  { emoji: "🇨🇾", name: "Cyprus", answers: ["cyprus"] },
  { emoji: "🇨🇿", name: "Czech Republic", answers: ["czech republic", "czechia", "czech"] },
  { emoji: "🇩🇰", name: "Denmark", answers: ["denmark", "danish"] },
  { emoji: "🇩🇯", name: "Djibouti", answers: ["djibouti"] },
  { emoji: "🇩🇲", name: "Dominica", answers: ["dominica"] },
  { emoji: "🇩🇴", name: "Dominican Republic", answers: ["dominican republic"] },
  { emoji: "🇪🇨", name: "Ecuador", answers: ["ecuador"] },
  { emoji: "🇪🇬", name: "Egypt", answers: ["egypt"] },
  { emoji: "🇸🇻", name: "El Salvador", answers: ["el salvador", "salvador"] },
  { emoji: "🇬🇶", name: "Equatorial Guinea", answers: ["equatorial guinea"] },
  { emoji: "🇪🇷", name: "Eritrea", answers: ["eritrea"] },
  { emoji: "🇪🇪", name: "Estonia", answers: ["estonia"] },
  { emoji: "🇸🇿", name: "Eswatini", answers: ["eswatini", "swaziland"] },
  { emoji: "🇪🇹", name: "Ethiopia", answers: ["ethiopia"] },
  { emoji: "🇫🇯", name: "Fiji", answers: ["fiji"] },
  { emoji: "🇫🇮", name: "Finland", answers: ["finland"] },
  { emoji: "🇫🇷", name: "France", answers: ["france", "french"] },
  { emoji: "🇬🇦", name: "Gabon", answers: ["gabon"] },
  { emoji: "🇬🇲", name: "Gambia", answers: ["gambia", "the gambia"] },
  { emoji: "🇬🇪", name: "Georgia", answers: ["georgia"] },
  { emoji: "🇩🇪", name: "Germany", answers: ["germany", "deutschland"] },
  { emoji: "🇬🇭", name: "Ghana", answers: ["ghana"] },
  { emoji: "🇬🇷", name: "Greece", answers: ["greece"] },
  { emoji: "🇬🇩", name: "Grenada", answers: ["grenada"] },
  { emoji: "🇬🇹", name: "Guatemala", answers: ["guatemala"] },
  { emoji: "🇬🇳", name: "Guinea", answers: ["guinea"] },
  { emoji: "🇬🇼", name: "Guinea-Bissau", answers: ["guinea-bissau", "guinea bissau"] },
  { emoji: "🇬🇾", name: "Guyana", answers: ["guyana"] },
  { emoji: "🇭🇹", name: "Haiti", answers: ["haiti"] },
  { emoji: "🇭🇳", name: "Honduras", answers: ["honduras"] },
  { emoji: "🇭🇺", name: "Hungary", answers: ["hungary"] },
  { emoji: "🇮🇸", name: "Iceland", answers: ["iceland"] },
  { emoji: "🇮🇳", name: "India", answers: ["india"] },
  { emoji: "🇮🇩", name: "Indonesia", answers: ["indonesia"] },
  { emoji: "🇮🇷", name: "Iran", answers: ["iran"] },
  { emoji: "🇮🇶", name: "Iraq", answers: ["iraq"] },
  { emoji: "🇮🇪", name: "Ireland", answers: ["ireland", "republic of ireland"] },
  { emoji: "🇮🇱", name: "Israel", answers: ["israel"] },
  { emoji: "🇮🇹", name: "Italy", answers: ["italy", "italia"] },
  { emoji: "🇯🇲", name: "Jamaica", answers: ["jamaica"] },
  { emoji: "🇯🇵", name: "Japan", answers: ["japan"] },
  { emoji: "🇯🇴", name: "Jordan", answers: ["jordan"] },
  { emoji: "🇰🇿", name: "Kazakhstan", answers: ["kazakhstan"] },
  { emoji: "🇰🇪", name: "Kenya", answers: ["kenya"] },
  { emoji: "🇰🇮", name: "Kiribati", answers: ["kiribati"] },
  { emoji: "🇽🇰", name: "Kosovo", answers: ["kosovo"] },
  { emoji: "🇰🇼", name: "Kuwait", answers: ["kuwait"] },
  { emoji: "🇰🇬", name: "Kyrgyzstan", answers: ["kyrgyzstan"] },
  { emoji: "🇱🇦", name: "Laos", answers: ["laos"] },
  { emoji: "🇱🇻", name: "Latvia", answers: ["latvia"] },
  { emoji: "🇱🇧", name: "Lebanon", answers: ["lebanon"] },
  { emoji: "🇱🇸", name: "Lesotho", answers: ["lesotho"] },
  { emoji: "🇱🇷", name: "Liberia", answers: ["liberia"] },
  { emoji: "🇱🇾", name: "Libya", answers: ["libya"] },
  { emoji: "🇱🇮", name: "Liechtenstein", answers: ["liechtenstein"] },
  { emoji: "🇱🇹", name: "Lithuania", answers: ["lithuania"] },
  { emoji: "🇱🇺", name: "Luxembourg", answers: ["luxembourg"] },
  { emoji: "🇲🇬", name: "Madagascar", answers: ["madagascar"] },
  { emoji: "🇲🇼", name: "Malawi", answers: ["malawi"] },
  { emoji: "🇲🇾", name: "Malaysia", answers: ["malaysia"] },
  { emoji: "🇲🇻", name: "Maldives", answers: ["maldives"] },
  { emoji: "🇲🇱", name: "Mali", answers: ["mali"] },
  { emoji: "🇲🇹", name: "Malta", answers: ["malta"] },
  { emoji: "🇲🇭", name: "Marshall Islands", answers: ["marshall islands"] },
  { emoji: "🇲🇷", name: "Mauritania", answers: ["mauritania"] },
  { emoji: "🇲🇺", name: "Mauritius", answers: ["mauritius"] },
  { emoji: "🇲🇽", name: "Mexico", answers: ["mexico"] },
  { emoji: "🇫🇲", name: "Micronesia", answers: ["micronesia"] },
  { emoji: "🇲🇩", name: "Moldova", answers: ["moldova"] },
  { emoji: "🇲🇨", name: "Monaco", answers: ["monaco"] },
  { emoji: "🇲🇳", name: "Mongolia", answers: ["mongolia"] },
  { emoji: "🇲🇪", name: "Montenegro", answers: ["montenegro"] },
  { emoji: "🇲🇦", name: "Morocco", answers: ["morocco"] },
  { emoji: "🇲🇿", name: "Mozambique", answers: ["mozambique"] },
  { emoji: "🇲🇲", name: "Myanmar", answers: ["myanmar", "burma"] },
  { emoji: "🇳🇦", name: "Namibia", answers: ["namibia"] },
  { emoji: "🇳🇷", name: "Nauru", answers: ["nauru"] },
  { emoji: "🇳🇵", name: "Nepal", answers: ["nepal"] },
  { emoji: "🇳🇱", name: "Netherlands", answers: ["netherlands", "holland", "dutch"] },
  { emoji: "🇳🇿", name: "New Zealand", answers: ["new zealand"] },
  { emoji: "🇳🇮", name: "Nicaragua", answers: ["nicaragua"] },
  { emoji: "🇳🇪", name: "Niger", answers: ["niger"] },
  { emoji: "🇳🇬", name: "Nigeria", answers: ["nigeria"] },
  { emoji: "🇲🇰", name: "North Macedonia", answers: ["north macedonia", "macedonia"] },
  { emoji: "🏴󠁧󠁢󠁮󠁩󠁲󠁿", name: "Northern Ireland", answers: ["northern ireland"] },
  { emoji: "🇰🇵", name: "North Korea", answers: ["north korea", "dprk"] },
  { emoji: "🇳🇴", name: "Norway", answers: ["norway"] },
  { emoji: "🇴🇲", name: "Oman", answers: ["oman"] },
  { emoji: "🇵🇰", name: "Pakistan", answers: ["pakistan"] },
  { emoji: "🇵🇼", name: "Palau", answers: ["palau"] },
  { emoji: "🇵🇸", name: "Palestine", answers: ["palestine", "palestinian"] },
  { emoji: "🇵🇦", name: "Panama", answers: ["panama"] },
  { emoji: "🇵🇬", name: "Papua New Guinea", answers: ["papua new guinea", "png"] },
  { emoji: "🇵🇾", name: "Paraguay", answers: ["paraguay"] },
  { emoji: "🇵🇪", name: "Peru", answers: ["peru"] },
  { emoji: "🇵🇭", name: "Philippines", answers: ["philippines", "the philippines"] },
  { emoji: "🇵🇱", name: "Poland", answers: ["poland"] },
  { emoji: "🇵🇹", name: "Portugal", answers: ["portugal"] },
  { emoji: "🇶🇦", name: "Qatar", answers: ["qatar"] },
  { emoji: "🇷🇴", name: "Romania", answers: ["romania"] },
  { emoji: "🇷🇺", name: "Russia", answers: ["russia", "russian federation"] },
  { emoji: "🇷🇼", name: "Rwanda", answers: ["rwanda"] },
  { emoji: "🇰🇳", name: "Saint Kitts and Nevis", answers: ["saint kitts", "st kitts", "st kitts and nevis"] },
  { emoji: "🇱🇨", name: "Saint Lucia", answers: ["saint lucia", "st lucia"] },
  { emoji: "🇻🇨", name: "Saint Vincent", answers: ["saint vincent", "st vincent"] },
  { emoji: "🇼🇸", name: "Samoa", answers: ["samoa"] },
  { emoji: "🇸🇲", name: "San Marino", answers: ["san marino"] },
  { emoji: "🇸🇹", name: "Sao Tome and Principe", answers: ["sao tome", "sao tome and principe"] },
  { emoji: "🇸🇦", name: "Saudi Arabia", answers: ["saudi arabia", "saudi"] },
  { emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", name: "Scotland", answers: ["scotland"] },
  { emoji: "🇸🇳", name: "Senegal", answers: ["senegal"] },
  { emoji: "🇷🇸", name: "Serbia", answers: ["serbia"] },
  { emoji: "🇸🇨", name: "Seychelles", answers: ["seychelles"] },
  { emoji: "🇸🇱", name: "Sierra Leone", answers: ["sierra leone"] },
  { emoji: "🇸🇬", name: "Singapore", answers: ["singapore"] },
  { emoji: "🇸🇰", name: "Slovakia", answers: ["slovakia"] },
  { emoji: "🇸🇮", name: "Slovenia", answers: ["slovenia"] },
  { emoji: "🇸🇧", name: "Solomon Islands", answers: ["solomon islands"] },
  { emoji: "🇸🇴", name: "Somalia", answers: ["somalia"] },
  { emoji: "🇿🇦", name: "South Africa", answers: ["south africa"] },
  { emoji: "🇰🇷", name: "South Korea", answers: ["south korea", "korea", "republic of korea"] },
  { emoji: "🇸🇸", name: "South Sudan", answers: ["south sudan"] },
  { emoji: "🇪🇸", name: "Spain", answers: ["spain", "espana"] },
  { emoji: "🇱🇰", name: "Sri Lanka", answers: ["sri lanka"] },
  { emoji: "🇸🇩", name: "Sudan", answers: ["sudan"] },
  { emoji: "🇸🇷", name: "Suriname", answers: ["suriname"] },
  { emoji: "🇸🇪", name: "Sweden", answers: ["sweden"] },
  { emoji: "🇨🇭", name: "Switzerland", answers: ["switzerland", "swiss"] },
  { emoji: "🇸🇾", name: "Syria", answers: ["syria"] },
  { emoji: "🇹🇼", name: "Taiwan", answers: ["taiwan"] },
  { emoji: "🇹🇯", name: "Tajikistan", answers: ["tajikistan"] },
  { emoji: "🇹🇿", name: "Tanzania", answers: ["tanzania"] },
  { emoji: "🇹🇭", name: "Thailand", answers: ["thailand"] },
  { emoji: "🇹🇱", name: "Timor-Leste", answers: ["timor-leste", "timor leste", "east timor"] },
  { emoji: "🇹🇬", name: "Togo", answers: ["togo"] },
  { emoji: "🇹🇴", name: "Tonga", answers: ["tonga"] },
  { emoji: "🇹🇹", name: "Trinidad and Tobago", answers: ["trinidad", "tobago", "trinidad and tobago"] },
  { emoji: "🇹🇳", name: "Tunisia", answers: ["tunisia"] },
  { emoji: "🇹🇷", name: "Turkey", answers: ["turkey", "turkiye"] },
  { emoji: "🇹🇲", name: "Turkmenistan", answers: ["turkmenistan"] },
  { emoji: "🇹🇻", name: "Tuvalu", answers: ["tuvalu"] },
  { emoji: "🇺🇬", name: "Uganda", answers: ["uganda"] },
  { emoji: "🇺🇦", name: "Ukraine", answers: ["ukraine"] },
  { emoji: "🇦🇪", name: "United Arab Emirates", answers: ["uae", "united arab emirates"] },
  { emoji: "🇬🇧", name: "United Kingdom", answers: ["uk", "united kingdom", "britain", "great britain"] },
  { emoji: "🇺🇸", name: "United States", answers: ["usa", "united states", "america", "us"] },
  { emoji: "🇺🇾", name: "Uruguay", answers: ["uruguay"] },
  { emoji: "🇺🇿", name: "Uzbekistan", answers: ["uzbekistan"] },
  { emoji: "🇻🇺", name: "Vanuatu", answers: ["vanuatu"] },
  { emoji: "🇻🇦", name: "Vatican City", answers: ["vatican", "vatican city", "holy see"] },
  { emoji: "🇻🇪", name: "Venezuela", answers: ["venezuela"] },
  { emoji: "🇻🇳", name: "Vietnam", answers: ["vietnam", "viet nam"] },
  { emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", name: "Wales", answers: ["wales"] },
  { emoji: "🇾🇪", name: "Yemen", answers: ["yemen"] },
  { emoji: "🇿🇲", name: "Zambia", answers: ["zambia"] },
  { emoji: "🇿🇼", name: "Zimbabwe", answers: ["zimbabwe"] }
];

// ─────────────────────────────────────────────────────────────
//  Active games per channel: Map<channelId, { flag, timeout, hintUsed }>
// ─────────────────────────────────────────────────────────────
const activeGames = new Map();

// Build hint string: "Z******e (8 letters)"
function buildHint(name) {
  const first = name[0];
  const last  = name[name.length - 1];
  const stars = "*".repeat(name.length - 2);
  return `${first}${stars}${last} (${name.length} letters)`;
}

module.exports = {
  name: "flag",
  aliases: ["flags"],

  async execute(message, args) {
    const channelId = message.channel.id;

    // Already a game running in this channel
    if (activeGames.has(channelId)) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription("❌ A flag game is already running in this channel!")] });
    }

    // Pick random flag
    const flag = FLAGS[Math.floor(Math.random() * FLAGS.length)];

    // Build embed exactly like the image
    const embed = new EmbedBuilder()
      .setTitle("Guess the Flag")
      .setDescription(`You have 10 seconds to guess!\nType your answer in chat!`)
      .setThumbnail(`https://flagcdn.com/w160/${getFlagCode(flag.emoji)}.png`)
      .setColor(0x2b2d31);

    // Fallback: show emoji if image fails
    const displayFlag = flag.emoji;

    const embedWithFlag = new EmbedBuilder()
      .setTitle("Guess the Flag")
      .setDescription(`${displayFlag}\n\nYou have 10 seconds to guess!\nType your answer in chat!`)
      .setColor(0x2b2d31);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`flag_hint_${channelId}`)
        .setEmoji("❓")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`flag_lb_${channelId}`)
        .setEmoji("📊")
        .setStyle(ButtonStyle.Secondary)
    );

    const gameMsg = await message.reply({ content: `${message.author}`, embeds: [embedWithFlag], components: [row] });

    // Store game state
    const gameState = {
      flag,
      hintUsed:  false,
      startedBy: message.author.id,
      messageId: gameMsg.id,
      gameMsg
    };
    activeGames.set(channelId, gameState);

    // ── 10 second message collector ───────────────────────
    const msgCollector = message.channel.createMessageCollector({
      filter: m => !m.author.bot,
      time:   10_000
    });

    msgCollector.on("collect", async m => {
      const guess   = m.content.trim().toLowerCase();
      const correct = flag.answers.some(a => a.toLowerCase() === guess);

      if (!correct) return;

      // Correct answer!
      msgCollector.stop("correct");

      // Award points
      await FlagScore.findOneAndUpdate(
        { guildId: message.guild.id, userId: m.author.id },
        { $inc: { score: 1 }, $set: { username: m.author.username } },
        { upsert: true }
      ).catch(() => {});

      // Update game message
      const winEmbed = new EmbedBuilder()
        .setColor(0x57F287)
        .setDescription(`✅ **${m.author}** got it! The answer was **${flag.name}** ${flag.emoji}\n+1 point!`);

      await gameMsg.edit({ embeds: [winEmbed], components: [] }).catch(() => {});
      activeGames.delete(channelId);
    });

    msgCollector.on("end", async (_, reason) => {
      if (reason === "correct") return;

      // Time's up!
      activeGames.delete(channelId);

      const timeupEmbed = new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription(`⏰ Time's up! The correct answer was: **${flag.name}** ${flag.emoji}`);

      await gameMsg.edit({ embeds: [timeupEmbed], components: [] }).catch(() => {});
    });

    // ── Button collector ───────────────────────────────────
    const btnCollector = gameMsg.createMessageComponentCollector({ time: 10_000 });

    btnCollector.on("collect", async interaction => {
      // Hint button
      if (interaction.customId === `flag_hint_${channelId}`) {
        const game = activeGames.get(channelId);
        if (!game) return interaction.deferUpdate();

        const hint = buildHint(flag.name);
        await interaction.reply({
          content: `🔵 **${interaction.user}** requested a hint:\n${flag.emoji} Hint: \`${hint}\``,
          fetchReply: false
        });
        return;
      }

      // Leaderboard button
      if (interaction.customId === `flag_lb_${channelId}`) {
        const top = await FlagScore.find({ guildId: message.guild.id })
          .sort({ score: -1 })
          .limit(10);

        if (!top.length) {
          return interaction.reply({ content: "No scores yet!", ephemeral: true });
        }

        const list = top.map((e, i) => `${i + 1}. ${e.username} — **${e.score}** points`).join("\n");

        const lbEmbed = new EmbedBuilder()
          .setTitle(",flags leaderboard")
          .setDescription(`Top flag guessers in the server\n\n${list}`)
          .setColor(0x2b2d31)
          .setFooter({ text: `Page 1/${Math.ceil(top.length / 10)}` });

        return interaction.reply({ embeds: [lbEmbed], ephemeral: false });
      }
    });
  }
};

// Convert flag emoji to country code for flagcdn.com
function getFlagCode(emoji) {
  try {
    const codePoints = [...emoji].map(c => c.codePointAt(0));
    return codePoints
      .filter(cp => cp >= 0x1F1E6 && cp <= 0x1F1FF)
      .map(cp => String.fromCharCode(cp - 0x1F1E6 + 65).toLowerCase())
      .join("");
  } catch {
    return "";
  }
}