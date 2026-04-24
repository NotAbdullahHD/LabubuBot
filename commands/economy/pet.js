const { EmbedBuilder } = require("discord.js");
const { Pet } = require("../../models/schemas");

const PETS = [
  {
    type:    "cat",
    emoji:   "<:cat:1497205750387445810>",
    name:    "Cat",
    ability: "Gives +30% bonus coins when you work",
    rarity:  "Common"
  },
  {
    type:    "dog",
    emoji:   "<:dog:1497205767110000690>",
    name:    "Dog",
    ability: "Protects you from being robbed",
    rarity:  "Uncommon"
  },
  {
    type:    "bunny",
    emoji:   "<:bunny:1497205798215090226>",
    name:    "Bunny",
    ability: "Reduces daily cooldown by 4 hours",
    rarity:  "Rare"
  }
];

module.exports = {
  name: "pet",
  aliases: ["mypet"],

  async execute(message, args) {
    const user = message.author;

    // ── ,pet view ────────────────────────────────────────
    if (!args[0] || args[0] === "view") {
      const existing = await Pet.findOne({ userId: user.id });

      if (!existing) {
        return message.reply({ embeds: [new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setAuthor({ name: `${user.username}'s Pet`, iconURL: user.displayAvatarURL() })
          .setDescription("You don't have a pet yet!\nUse `,pet get` to adopt one.")
        ]});
      }

      const petData = PETS.find(p => p.type === existing.type);
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setAuthor({ name: `${user.username}'s Pet`, iconURL: user.displayAvatarURL() })
        .setDescription(`${petData.emoji} **${petData.name}**`)
        .addFields(
          { name: "✨ Ability",  value: petData.ability,  inline: false },
          { name: "⭐ Rarity",   value: petData.rarity,   inline: true },
          { name: "📅 Adopted",  value: `<t:${Math.floor(existing.adoptedAt / 1000)}:R>`, inline: true }
        )
      ]});
    }

    // ── ,pet get ─────────────────────────────────────────
    if (args[0] === "get" || args[0] === "adopt") {
      const existing = await Pet.findOne({ userId: user.id });
      if (existing) {
        const petData = PETS.find(p => p.type === existing.type);
        return message.reply(`<:x_decline:1497240273116336332> You already have a **${petData.emoji} ${petData.name}**! You can only have one pet.`);
      }

      // Random weighted: cat 50%, dog 30%, bunny 20%
      const roll = Math.random();
      let pet;
      if      (roll < 0.50) pet = PETS[0]; // cat
      else if (roll < 0.80) pet = PETS[1]; // dog
      else                  pet = PETS[2]; // bunny

      await Pet.create({ userId: user.id, type: pet.type, adoptedAt: Date.now() });

      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(0x57F287)
        .setAuthor({ name: `${user.username} adopted a pet!`, iconURL: user.displayAvatarURL() })
        .setDescription(`${pet.emoji} **${pet.name}** has joined you!`)
        .addFields(
          { name: "✨ Ability", value: pet.ability,  inline: false },
          { name: "⭐ Rarity",  value: pet.rarity,   inline: true }
        )
        .setFooter({ text: "Use ,pet to view your pet anytime" })
      ]});
    }

    return message.reply('<:x_decline:1497240273116336332> Usage: `,pet` or `,pet get`');
  }
};