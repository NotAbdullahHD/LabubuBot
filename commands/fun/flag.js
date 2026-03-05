const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { FlagScore } = require("../../models/schemas");

const FLAGS = [
  { img: "af", name: "Afghanistan",            answers: ["afghanistan", "afghan"] },
  { img: "al", name: "Albania",                answers: ["albania"] },
  { img: "dz", name: "Algeria",                answers: ["algeria"] },
  { img: "ad", name: "Andorra",                answers: ["andorra"] },
  { img: "ao", name: "Angola",                 answers: ["angola"] },
  { img: "ag", name: "Antigua and Barbuda",    answers: ["antigua", "barbuda", "antigua and barbuda"] },
  { img: "ar", name: "Argentina",              answers: ["argentina"] },
  { img: "am", name: "Armenia",                answers: ["armenia"] },
  { img: "au", name: "Australia",              answers: ["australia"] },
  { img: "at", name: "Austria",                answers: ["austria"] },
  { img: "az", name: "Azerbaijan",             answers: ["azerbaijan"] },
  { img: "bs", name: "Bahamas",                answers: ["bahamas", "the bahamas"] },
  { img: "bh", name: "Bahrain",                answers: ["bahrain"] },
  { img: "bd", name: "Bangladesh",             answers: ["bangladesh"] },
  { img: "bb", name: "Barbados",               answers: ["barbados"] },
  { img: "by", name: "Belarus",                answers: ["belarus"] },
  { img: "be", name: "Belgium",                answers: ["belgium"] },
  { img: "bz", name: "Belize",                 answers: ["belize"] },
  { img: "bj", name: "Benin",                  answers: ["benin"] },
  { img: "bt", name: "Bhutan",                 answers: ["bhutan"] },
  { img: "bo", name: "Bolivia",                answers: ["bolivia"] },
  { img: "ba", name: "Bosnia and Herzegovina", answers: ["bosnia", "herzegovina", "bosnia and herzegovina"] },
  { img: "bw", name: "Botswana",               answers: ["botswana"] },
  { img: "br", name: "Brazil",                 answers: ["brazil"] },
  { img: "bn", name: "Brunei",                 answers: ["brunei"] },
  { img: "bg", name: "Bulgaria",               answers: ["bulgaria"] },
  { img: "bf", name: "Burkina Faso",           answers: ["burkina faso", "burkina"] },
  { img: "bi", name: "Burundi",                answers: ["burundi"] },
  { img: "cv", name: "Cape Verde",             answers: ["cape verde", "cabo verde"] },
  { img: "kh", name: "Cambodia",               answers: ["cambodia"] },
  { img: "cm", name: "Cameroon",               answers: ["cameroon"] },
  { img: "ca", name: "Canada",                 answers: ["canada"] },
  { img: "cf", name: "Central African Republic", answers: ["central african republic", "car"] },
  { img: "td", name: "Chad",                   answers: ["chad"] },
  { img: "cl", name: "Chile",                  answers: ["chile"] },
  { img: "cn", name: "China",                  answers: ["china", "prc"] },
  { img: "co", name: "Colombia",               answers: ["colombia"] },
  { img: "km", name: "Comoros",                answers: ["comoros"] },
  { img: "cg", name: "Congo",                  answers: ["congo", "republic of congo"] },
  { img: "cd", name: "DR Congo",               answers: ["dr congo", "democratic republic of congo", "drc"] },
  { img: "cr", name: "Costa Rica",             answers: ["costa rica"] },
  { img: "hr", name: "Croatia",                answers: ["croatia"] },
  { img: "cu", name: "Cuba",                   answers: ["cuba"] },
  { img: "cy", name: "Cyprus",                 answers: ["cyprus"] },
  { img: "cz", name: "Czech Republic",         answers: ["czech republic", "czechia", "czech"] },
  { img: "dk", name: "Denmark",                answers: ["denmark"] },
  { img: "dj", name: "Djibouti",               answers: ["djibouti"] },
  { img: "dm", name: "Dominica",               answers: ["dominica"] },
  { img: "do", name: "Dominican Republic",     answers: ["dominican republic"] },
  { img: "ec", name: "Ecuador",                answers: ["ecuador"] },
  { img: "eg", name: "Egypt",                  answers: ["egypt"] },
  { img: "sv", name: "El Salvador",            answers: ["el salvador", "salvador"] },
  { img: "gq", name: "Equatorial Guinea",      answers: ["equatorial guinea"] },
  { img: "er", name: "Eritrea",                answers: ["eritrea"] },
  { img: "ee", name: "Estonia",                answers: ["estonia"] },
  { img: "sz", name: "Eswatini",               answers: ["eswatini", "swaziland"] },
  { img: "et", name: "Ethiopia",               answers: ["ethiopia"] },
  { img: "fj", name: "Fiji",                   answers: ["fiji"] },
  { img: "fi", name: "Finland",                answers: ["finland"] },
  { img: "fr", name: "France",                 answers: ["france"] },
  { img: "ga", name: "Gabon",                  answers: ["gabon"] },
  { img: "gm", name: "Gambia",                 answers: ["gambia", "the gambia"] },
  { img: "ge", name: "Georgia",                answers: ["georgia"] },
  { img: "de", name: "Germany",                answers: ["germany", "deutschland"] },
  { img: "gh", name: "Ghana",                  answers: ["ghana"] },
  { img: "gr", name: "Greece",                 answers: ["greece"] },
  { img: "gd", name: "Grenada",                answers: ["grenada"] },
  { img: "gt", name: "Guatemala",              answers: ["guatemala"] },
  { img: "gn", name: "Guinea",                 answers: ["guinea"] },
  { img: "gw", name: "Guinea-Bissau",          answers: ["guinea-bissau", "guinea bissau"] },
  { img: "gy", name: "Guyana",                 answers: ["guyana"] },
  { img: "ht", name: "Haiti",                  answers: ["haiti"] },
  { img: "hn", name: "Honduras",               answers: ["honduras"] },
  { img: "hu", name: "Hungary",                answers: ["hungary"] },
  { img: "is", name: "Iceland",                answers: ["iceland"] },
  { img: "in", name: "India",                  answers: ["india"] },
  { img: "id", name: "Indonesia",              answers: ["indonesia"] },
  { img: "ir", name: "Iran",                   answers: ["iran"] },
  { img: "iq", name: "Iraq",                   answers: ["iraq"] },
  { img: "ie", name: "Ireland",                answers: ["ireland", "republic of ireland"] },
  { img: "il", name: "Israel",                 answers: ["israel"] },
  { img: "it", name: "Italy",                  answers: ["italy", "italia"] },
  { img: "jm", name: "Jamaica",                answers: ["jamaica"] },
  { img: "jp", name: "Japan",                  answers: ["japan"] },
  { img: "jo", name: "Jordan",                 answers: ["jordan"] },
  { img: "kz", name: "Kazakhstan",             answers: ["kazakhstan"] },
  { img: "ke", name: "Kenya",                  answers: ["kenya"] },
  { img: "ki", name: "Kiribati",               answers: ["kiribati"] },
  { img: "xk", name: "Kosovo",                 answers: ["kosovo"] },
  { img: "kw", name: "Kuwait",                 answers: ["kuwait"] },
  { img: "kg", name: "Kyrgyzstan",             answers: ["kyrgyzstan"] },
  { img: "la", name: "Laos",                   answers: ["laos"] },
  { img: "lv", name: "Latvia",                 answers: ["latvia"] },
  { img: "lb", name: "Lebanon",                answers: ["lebanon"] },
  { img: "ls", name: "Lesotho",                answers: ["lesotho"] },
  { img: "lr", name: "Liberia",                answers: ["liberia"] },
  { img: "ly", name: "Libya",                  answers: ["libya"] },
  { img: "li", name: "Liechtenstein",          answers: ["liechtenstein"] },
  { img: "lt", name: "Lithuania",              answers: ["lithuania"] },
  { img: "lu", name: "Luxembourg",             answers: ["luxembourg"] },
  { img: "mg", name: "Madagascar",             answers: ["madagascar"] },
  { img: "mw", name: "Malawi",                 answers: ["malawi"] },
  { img: "my", name: "Malaysia",               answers: ["malaysia"] },
  { img: "mv", name: "Maldives",               answers: ["maldives"] },
  { img: "ml", name: "Mali",                   answers: ["mali"] },
  { img: "mt", name: "Malta",                  answers: ["malta"] },
  { img: "mh", name: "Marshall Islands",       answers: ["marshall islands"] },
  { img: "mr", name: "Mauritania",             answers: ["mauritania"] },
  { img: "mu", name: "Mauritius",              answers: ["mauritius"] },
  { img: "mx", name: "Mexico",                 answers: ["mexico"] },
  { img: "fm", name: "Micronesia",             answers: ["micronesia"] },
  { img: "md", name: "Moldova",                answers: ["moldova"] },
  { img: "mc", name: "Monaco",                 answers: ["monaco"] },
  { img: "mn", name: "Mongolia",               answers: ["mongolia"] },
  { img: "me", name: "Montenegro",             answers: ["montenegro"] },
  { img: "ma", name: "Morocco",                answers: ["morocco"] },
  { img: "mz", name: "Mozambique",             answers: ["mozambique"] },
  { img: "mm", name: "Myanmar",                answers: ["myanmar", "burma"] },
  { img: "na", name: "Namibia",                answers: ["namibia"] },
  { img: "nr", name: "Nauru",                  answers: ["nauru"] },
  { img: "np", name: "Nepal",                  answers: ["nepal"] },
  { img: "nl", name: "Netherlands",            answers: ["netherlands", "holland"] },
  { img: "nz", name: "New Zealand",            answers: ["new zealand"] },
  { img: "ni", name: "Nicaragua",              answers: ["nicaragua"] },
  { img: "ne", name: "Niger",                  answers: ["niger"] },
  { img: "ng", name: "Nigeria",                answers: ["nigeria"] },
  { img: "mk", name: "North Macedonia",        answers: ["north macedonia", "macedonia"] },
  { img: "gb-nir", name: "Northern Ireland",   answers: ["northern ireland"] },
  { img: "kp", name: "North Korea",            answers: ["north korea", "dprk"] },
  { img: "no", name: "Norway",                 answers: ["norway"] },
  { img: "om", name: "Oman",                   answers: ["oman"] },
  { img: "pk", name: "Pakistan",               answers: ["pakistan"] },
  { img: "pw", name: "Palau",                  answers: ["palau"] },
  { img: "ps", name: "Palestine",              answers: ["palestine", "palestinian"] },
  { img: "pa", name: "Panama",                 answers: ["panama"] },
  { img: "pg", name: "Papua New Guinea",       answers: ["papua new guinea", "png"] },
  { img: "py", name: "Paraguay",               answers: ["paraguay"] },
  { img: "pe", name: "Peru",                   answers: ["peru"] },
  { img: "ph", name: "Philippines",            answers: ["philippines"] },
  { img: "pl", name: "Poland",                 answers: ["poland"] },
  { img: "pt", name: "Portugal",               answers: ["portugal"] },
  { img: "qa", name: "Qatar",                  answers: ["qatar"] },
  { img: "ro", name: "Romania",                answers: ["romania"] },
  { img: "ru", name: "Russia",                 answers: ["russia"] },
  { img: "rw", name: "Rwanda",                 answers: ["rwanda"] },
  { img: "kn", name: "Saint Kitts and Nevis",  answers: ["saint kitts", "st kitts", "st kitts and nevis"] },
  { img: "lc", name: "Saint Lucia",            answers: ["saint lucia", "st lucia"] },
  { img: "vc", name: "Saint Vincent",          answers: ["saint vincent", "st vincent"] },
  { img: "ws", name: "Samoa",                  answers: ["samoa"] },
  { img: "sm", name: "San Marino",             answers: ["san marino"] },
  { img: "st", name: "Sao Tome and Principe",  answers: ["sao tome", "sao tome and principe"] },
  { img: "sa", name: "Saudi Arabia",           answers: ["saudi arabia", "saudi"] },
  { img: "gb-sct", name: "Scotland",           answers: ["scotland"] },
  { img: "sn", name: "Senegal",                answers: ["senegal"] },
  { img: "rs", name: "Serbia",                 answers: ["serbia"] },
  { img: "sc", name: "Seychelles",             answers: ["seychelles"] },
  { img: "sl", name: "Sierra Leone",           answers: ["sierra leone"] },
  { img: "sg", name: "Singapore",              answers: ["singapore"] },
  { img: "sk", name: "Slovakia",               answers: ["slovakia"] },
  { img: "si", name: "Slovenia",               answers: ["slovenia"] },
  { img: "sb", name: "Solomon Islands",        answers: ["solomon islands"] },
  { img: "so", name: "Somalia",                answers: ["somalia"] },
  { img: "za", name: "South Africa",           answers: ["south africa"] },
  { img: "kr", name: "South Korea",            answers: ["south korea", "korea"] },
  { img: "ss", name: "South Sudan",            answers: ["south sudan"] },
  { img: "es", name: "Spain",                  answers: ["spain"] },
  { img: "lk", name: "Sri Lanka",              answers: ["sri lanka"] },
  { img: "sd", name: "Sudan",                  answers: ["sudan"] },
  { img: "sr", name: "Suriname",               answers: ["suriname"] },
  { img: "se", name: "Sweden",                 answers: ["sweden"] },
  { img: "ch", name: "Switzerland",            answers: ["switzerland", "swiss"] },
  { img: "sy", name: "Syria",                  answers: ["syria"] },
  { img: "tw", name: "Taiwan",                 answers: ["taiwan"] },
  { img: "tj", name: "Tajikistan",             answers: ["tajikistan"] },
  { img: "tz", name: "Tanzania",               answers: ["tanzania"] },
  { img: "th", name: "Thailand",               answers: ["thailand"] },
  { img: "tl", name: "Timor-Leste",            answers: ["timor-leste", "timor leste", "east timor"] },
  { img: "tg", name: "Togo",                   answers: ["togo"] },
  { img: "to", name: "Tonga",                  answers: ["tonga"] },
  { img: "tt", name: "Trinidad and Tobago",    answers: ["trinidad", "tobago", "trinidad and tobago"] },
  { img: "tn", name: "Tunisia",                answers: ["tunisia"] },
  { img: "tr", name: "Turkey",                 answers: ["turkey", "turkiye"] },
  { img: "tm", name: "Turkmenistan",           answers: ["turkmenistan"] },
  { img: "tv", name: "Tuvalu",                 answers: ["tuvalu"] },
  { img: "ug", name: "Uganda",                 answers: ["uganda"] },
  { img: "ua", name: "Ukraine",                answers: ["ukraine"] },
  { img: "ae", name: "United Arab Emirates",   answers: ["uae", "united arab emirates"] },
  { img: "gb", name: "United Kingdom",         answers: ["uk", "united kingdom", "britain", "great britain"] },
  { img: "us", name: "United States",          answers: ["usa", "united states", "america", "us"] },
  { img: "uy", name: "Uruguay",                answers: ["uruguay"] },
  { img: "uz", name: "Uzbekistan",             answers: ["uzbekistan"] },
  { img: "vu", name: "Vanuatu",                answers: ["vanuatu"] },
  { img: "va", name: "Vatican City",           answers: ["vatican", "vatican city", "holy see"] },
  { img: "ve", name: "Venezuela",              answers: ["venezuela"] },
  { img: "vn", name: "Vietnam",                answers: ["vietnam", "viet nam"] },
  { img: "gb-wls", name: "Wales",              answers: ["wales"] },
  { img: "ye", name: "Yemen",                  answers: ["yemen"] },
  { img: "zm", name: "Zambia",                 answers: ["zambia"] },
  { img: "zw", name: "Zimbabwe",               answers: ["zimbabwe"] }
];

const activeGames = new Map();

function flagUrl(code) {
  return `https://flagcdn.com/w320/${code}.png`;
}

function buildHint(name) {
  const first = name[0];
  const last  = name[name.length - 1];
  const stars = "*".repeat(Math.max(0, name.length - 2));
  return `${first}${stars}${last} (${name.length} letters)`;
}

module.exports = {
  name: "flag",
  aliases: ["flagguess"],

  async execute(message) {
    const channelId = message.channel.id;

    if (activeGames.has(channelId)) {
      return message.channel.send(`❌ A flag game is already running in this channel!`);
    }

    const flag = FLAGS[Math.floor(Math.random() * FLAGS.length)];

    // ── Game embed — thumbnail top-right, exactly like the screenshot ──
    const gameEmbed = new EmbedBuilder()
      .setTitle("Guess the Flag")
      .setDescription("You have 10 seconds to guess! try `,flaghint`")
      .setThumbnail(flagUrl(flag.img))
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

    // Reply to the user who typed ,flag — exactly like the screenshot
    const gameMsg = await message.reply({ embeds: [gameEmbed], components: [row] });

    activeGames.set(channelId, { flag, gameMsg });

    // ── 10 second message collector ───────────────────────
    const msgCol = message.channel.createMessageCollector({
      filter: m => !m.author.bot,
      time:   10_000
    });

    msgCol.on("collect", async m => {
      const guess   = m.content.trim().toLowerCase();
      const correct = flag.answers.some(a => a === guess);
      if (!correct) return;

      msgCol.stop("correct");
      activeGames.delete(channelId);

      // Award point
      await FlagScore.findOneAndUpdate(
        { guildId: message.guild.id, userId: m.author.id },
        { $inc: { score: 1 }, $set: { username: m.author.username } },
        { upsert: true }
      ).catch(() => {});

      // Disable buttons on original embed
      const disabledRow = new ActionRowBuilder().addComponents(
        row.components.map(b => ButtonBuilder.from(b).setDisabled(true))
      );
      await gameMsg.edit({ components: [disabledRow] }).catch(() => {});

      // NEW message — plain text like the screenshot
      await message.channel.send(`✅ **${m.author.username}** got it! The correct answer was: **${flag.name}**`);
    });

    msgCol.on("end", async (_, reason) => {
      if (reason === "correct") return;
      activeGames.delete(channelId);

      // Disable buttons
      const disabledRow = new ActionRowBuilder().addComponents(
        row.components.map(b => ButtonBuilder.from(b).setDisabled(true))
      );
      await gameMsg.edit({ components: [disabledRow] }).catch(() => {});

      // NEW message — plain text exactly like the screenshot: ⏰ @user Time's up! The correct answer was: **X**
      await message.channel.send(`⏰ ${message.author} Time's up! The correct answer was: **${flag.name}**`);
    });

    // ── Button collector ──────────────────────────────────
    const btnCol = gameMsg.createMessageComponentCollector({ time: 12_000 });

    btnCol.on("collect", async interaction => {

      // ❓ Hint — NEW message in chat, not ephemeral
      if (interaction.customId === `flag_hint_${channelId}`) {
        const hint = buildHint(flag.name);
        await interaction.deferUpdate(); // don't show "thinking"
        await message.channel.send(`🔵 **${interaction.user}** requested a hint:\nHint: \`${hint}\``);
        return;
      }

      // 📊 Leaderboard — NEW message
      if (interaction.customId === `flag_lb_${channelId}`) {
        const top = await FlagScore.find({ guildId: message.guild.id })
          .sort({ score: -1 })
          .limit(10);

        await interaction.deferUpdate();

        if (!top.length) {
          await message.channel.send("No flag scores yet! Be the first to win a round.");
          return;
        }

        const total = await FlagScore.countDocuments({ guildId: message.guild.id });
        const list  = top.map((e, i) => `${i + 1}. ${e.username} — **${e.score}** points`).join("\n");

        await message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle(",flags leaderboard")
              .setDescription(`Top flag guessers in the server\n\n${list}`)
              .setColor(0x2b2d31)
              .setFooter({ text: `Page 1/${Math.ceil(total / 10)}` })
          ]
        });
      }
    });
  }
};