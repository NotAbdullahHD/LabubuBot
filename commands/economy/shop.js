const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { EcoUser, ShopItem } = require("../../models/schemas");

// ─────────────────────────────────────────────────────────────
//  SHOP ITEMS
// ─────────────────────────────────────────────────────────────
const SHOP_ITEMS = [
  {
    id:          "slave_farm",
    name:        "Slave Farm",
    emoji:       "🌾",
    price:       50_000,
    incomePerHr: 2_000,
    description: "Generates **2,000** coins every hour"
  },
  {
    id:          "miner",
    name:        "Miner",
    emoji:       "⛏️",
    price:       100_000,
    incomePerHr: 7_500,
    description: "Generates **7,500** coins every hour"
  },
  {
    id:          "epstein_island",
    name:        "Epstein Island",
    emoji:       "🏝️",
    price:       500_000,
    incomePerHr: 15_000,
    description: "Generates **15,000** coins every hour"
  }
];

module.exports = {
  name: "shop",
  aliases: ["store"],

  async execute(message, args) {
    const user   = message.author;
    const data   = await EcoUser.findOne({ userId: user.id }) || await EcoUser.create({ userId: user.id });

    // ── ,shop buy <item> ──────────────────────────────────
    if (args[0] === "buy") {
      const query = args.slice(1).join(" ").toLowerCase();
      const item  = SHOP_ITEMS.find(i =>
        i.id === query ||
        i.name.toLowerCase() === query ||
        i.name.toLowerCase().includes(query)
      );

      if (!item) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xED4245)
            .setDescription(`❌ Item not found. Use \`,shop\` to see available items.\nTry: \`slave farm\`, \`miner\`, or \`epstein island\``)
          ]
        });
      }

      if (data.wallet < item.price) {
        const need = item.price - data.wallet;
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xED4245)
            .setDescription(`❌ You need **${need.toLocaleString()}** more coins to buy **${item.name}**.`)
          ]
        });
      }

      // Check if already owned
      const existing = await ShopItem.findOne({ userId: user.id, itemId: item.id });
      if (existing) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xFEE75C)
            .setDescription(`⚠️ You already own a **${item.name}**! You can only have one of each.`)
          ]
        });
      }

      // Deduct and save
      data.wallet -= item.price;
      await data.save();

      await ShopItem.create({
        userId:      user.id,
        itemId:      item.id,
        name:        item.name,
        incomePerHr: item.incomePerHr,
        lastPaid:    Date.now()
      });

      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle(`✅ Purchase Successful!`)
          .setDescription(`You bought **${item.emoji} ${item.name}** for **${item.price.toLocaleString()}** coins!\nIt will generate **${item.incomePerHr.toLocaleString()}** coins every hour.`)
          .setFooter({ text: `Use ,collect to claim your earnings` })
        ]
      });
    }

    // ── ,shop items / ,shop inventory / ,shop inv ────────
    if (args[0] === "inv" || args[0] === "inventory" || args[0] === "items") {
      const owned = await ShopItem.find({ userId: user.id });

      if (!owned.length) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor(0x2b2d31)
            .setDescription("You don't own any items yet! Use `,shop` to browse the store.")
          ]
        });
      }

      const now   = Date.now();
      let totalPending = 0;

      const lines = owned.map(item => {
        const shopItem   = SHOP_ITEMS.find(s => s.id === item.itemId);
        const emoji      = shopItem?.emoji || "📦";
        const hoursElapsed = (now - item.lastPaid) / 3_600_000;
        const pending    = Math.floor(hoursElapsed * item.incomePerHr);
        totalPending    += pending;
        return `${emoji} **${item.name}** — +${item.incomePerHr.toLocaleString()}/hr\n> Pending: **${pending.toLocaleString()}** coins`;
      });

      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x2b2d31)
          .setAuthor({ name: `${user.username}'s Inventory`, iconURL: user.displayAvatarURL() })
          .setDescription(lines.join("\n\n"))
          .addFields({ name: "💰 Total Pending", value: `**${totalPending.toLocaleString()}** coins — use \`,collect\` to claim` })
        ]
      });
    }

    // ── ,shop (main page) ─────────────────────────────────
    const owned = await ShopItem.find({ userId: user.id });
    const ownedIds = owned.map(o => o.itemId);

    const itemLines = SHOP_ITEMS.map(item => {
      const own = ownedIds.includes(item.id) ? " ✅ **Owned**" : "";
      return (
        `${item.emoji} **${item.name}**${own}\n` +
        `> 💰 Price: **${item.price.toLocaleString()}** coins\n` +
        `> ⏰ ${item.description}\n` +
        `> Buy: \`\`,shop buy ${item.name.toLowerCase()}\`\``
      );
    });

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle("🏪 Shop")
      .setDescription(itemLines.join("\n\n"))
      .addFields(
        { name: "📦 Your Items",  value: `\`,shop inv\``,     inline: true },
        { name: "💸 Collect",     value: `\`,collect\``,      inline: true },
        { name: "💰 Balance",     value: `**${data.wallet.toLocaleString()}** coins`, inline: true }
      )
      .setFooter({ text: "Each item generates passive income every hour" });

    // Buttons for quick buy
    const rows = [];
    const btnChunks = [SHOP_ITEMS.slice(0, 3)]; // all 3 in one row

    for (const chunk of btnChunks) {
      const row = new ActionRowBuilder().addComponents(
        chunk.map(item =>
          new ButtonBuilder()
            .setCustomId(`shop_buy_${item.id}`)
            .setLabel(`Buy ${item.name}`)
            .setEmoji(item.emoji)
            .setStyle(ownedIds.includes(item.id) ? ButtonStyle.Secondary : ButtonStyle.Primary)
            .setDisabled(ownedIds.includes(item.id) || data.wallet < item.price)
        )
      );
      rows.push(row);
    }

    const msg = await message.reply({ embeds: [embed], components: rows });

    // Button collector
    const col = msg.createMessageComponentCollector({
      filter: i => i.user.id === user.id,
      time:   60_000
    });

    col.on("collect", async interaction => {
      const itemId = interaction.customId.replace("shop_buy_", "");
      const item   = SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) return interaction.deferUpdate();

      const fresh = await EcoUser.findOne({ userId: user.id });

      if (fresh.wallet < item.price) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ Not enough coins!`)],
          ephemeral: true
        });
      }

      const alreadyOwned = await ShopItem.findOne({ userId: user.id, itemId: item.id });
      if (alreadyOwned) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0xFEE75C).setDescription(`⚠️ You already own **${item.name}**!`)],
          ephemeral: true
        });
      }

      fresh.wallet -= item.price;
      await fresh.save();
      await ShopItem.create({ userId: user.id, itemId: item.id, name: item.name, incomePerHr: item.incomePerHr, lastPaid: Date.now() });

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setDescription(`✅ Bought **${item.emoji} ${item.name}**!\nGenerates **${item.incomePerHr.toLocaleString()}** coins/hr. Use \`,collect\` to claim.`)
        ],
        ephemeral: true
      });
    });

    col.on("end", () => msg.edit({ components: [] }).catch(() => {}));
  }
};