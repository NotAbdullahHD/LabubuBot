const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { Family } = require("../../models/schemas");

const ok   = (desc) => new EmbedBuilder().setColor(0x57F287).setDescription(desc);
const fail = (desc) => new EmbedBuilder().setColor(0xED4245).setDescription(desc);
const info = (desc) => new EmbedBuilder().setColor(0xFFB6C1).setDescription(desc);

module.exports = {
  name: "family",
  async execute(message, args, client) {
    const sub      = args[0]?.toLowerCase();
    const target   = message.mentions.users.first();
    const authorId = message.author.id;

    const getFamily = async (id) => {
      let data = await Family.findOne({ userId: id });
      if (!data) data = await Family.create({ userId: id });
      return data;
    };

    // ── MARRY ─────────────────────────────────────────────
    if (sub === "marry") {
      if (!target)                  return message.reply({ embeds: [fail("Mention someone to marry.")] });
      if (target.id === authorId)   return message.reply({ embeds: [fail("You can't marry yourself.")] });
      if (target.bot)               return message.reply({ embeds: [fail("You can't marry a bot.")] });

      const authorData = await getFamily(authorId);
      const targetData = await getFamily(target.id);

      if (authorData.partnerId) return message.reply({ embeds: [fail("You are already married.")] });
      if (targetData.partnerId) return message.reply({ embeds: [fail("They are already married.")] });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("accept").setLabel("Accept").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("deny").setLabel("Decline").setStyle(ButtonStyle.Danger)
      );

      const msg = await message.channel.send({
        content: `${target}`,
        embeds: [new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setAuthor({ name: `${message.author.username} sent a proposal`, iconURL: message.author.displayAvatarURL() })
          .setDescription(`${target}, do you accept?`)
        ],
        components: [row]
      });

      const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30_000 });

      collector.on("collect", async i => {
        if (i.user.id !== target.id) return i.reply({ content: "This isn't for you.", ephemeral: true });

        if (i.customId === "accept") {
          authorData.partnerId = target.id;
          targetData.partnerId = authorId;
          await authorData.save();
          await targetData.save();

          await i.update({
            embeds: [new EmbedBuilder()
              .setColor(0x57F287)
              .setDescription(`💍 **${message.author.username}** and **${target.username}** are now married!`)
            ],
            components: []
          });
        } else {
          await i.update({ embeds: [fail(`**${target.username}** declined the proposal.`)], components: [] });
        }
      });

      collector.on("end", (_, reason) => {
        if (reason === "time") msg.edit({ components: [] }).catch(() => {});
      });
    }

    // ── DIVORCE ───────────────────────────────────────────
    else if (sub === "divorce") {
      const authorData = await getFamily(authorId);
      if (!authorData.partnerId) return message.reply({ embeds: [fail("You are not married.")] });

      const partnerId   = authorData.partnerId;
      const partnerData = await getFamily(partnerId);

      authorData.partnerId = null;
      partnerData.partnerId = null;
      await authorData.save();
      await partnerData.save();

      message.reply({ embeds: [new EmbedBuilder()
        .setColor(0xED4245)
        .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
        .setDescription(`💔 You divorced <@${partnerId}>.`)
      ]});
    }

    // ── ADOPT ─────────────────────────────────────────────
    else if (sub === "adopt") {
      if (!target)                return message.reply({ embeds: [fail("Mention someone to adopt.")] });
      if (target.id === authorId) return message.reply({ embeds: [fail("You can't adopt yourself.")] });

      const authorData = await getFamily(authorId);
      if (authorData.children.includes(target.id)) return message.reply({ embeds: [fail("They are already your child.")] });

      const childData = await getFamily(target.id);
      if (childData.parent) return message.reply({ embeds: [fail("They already have a parent.")] });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("accept").setLabel("Join Family").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("deny").setLabel("No thanks").setStyle(ButtonStyle.Danger)
      );

      const msg = await message.channel.send({
        content: `${target}`,
        embeds: [new EmbedBuilder()
          .setColor(0xFFB6C1)
          .setAuthor({ name: `${message.author.username} wants to adopt you`, iconURL: message.author.displayAvatarURL() })
          .setDescription(`${target}, do you accept?`)
        ],
        components: [row]
      });

      const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30_000 });

      collector.on("collect", async i => {
        if (i.user.id !== target.id) return i.reply({ content: "This isn't for you.", ephemeral: true });

        if (i.customId === "accept") {
          authorData.children.push(target.id);
          childData.parent = authorId;
          await authorData.save();
          await childData.save();

          if (authorData.partnerId) {
            const partnerData = await getFamily(authorData.partnerId);
            if (!partnerData.children.includes(target.id)) {
              partnerData.children.push(target.id);
              await partnerData.save();
            }
          }

          await i.update({
            embeds: [ok(`👶 **${target.username}** joined your family!`)],
            components: []
          });
        } else {
          await i.update({ embeds: [fail(`**${target.username}** declined.`)], components: [] });
        }
      });

      collector.on("end", (_, reason) => {
        if (reason === "time") msg.edit({ components: [] }).catch(() => {});
      });
    }

    // ── TREE ──────────────────────────────────────────────
    else if (sub === "tree" || sub === "stats") {
      const user = target || message.author;
      const data = await getFamily(user.id);

      const partner  = data.partnerId         ? `<@${data.partnerId}>` : "None";
      const parent   = data.parent            ? `<@${data.parent}>`    : "None";
      const children = data.children.length   ? data.children.map(id => `<@${id}>`).join(", ") : "None";

      message.reply({ embeds: [new EmbedBuilder()
        .setColor(0xFFB6C1)
        .setAuthor({ name: `${user.username}'s Family`, iconURL: user.displayAvatarURL() })
        .addFields(
          { name: "💍 Partner",  value: partner,  inline: true },
          { name: "👤 Parent",   value: parent,   inline: true },
          { name: "👶 Children", value: children, inline: false }
        )
      ]});
    }

    // ── DISOWN ────────────────────────────────────────────
    else if (sub === "disown") {
      if (!target) return message.reply({ embeds: [fail("Mention a child to disown.")] });

      const authorData = await getFamily(authorId);
      if (!authorData.children.includes(target.id)) return message.reply({ embeds: [fail("They are not your child.")] });

      authorData.children = authorData.children.filter(c => c !== target.id);
      await authorData.save();

      if (authorData.partnerId) {
        const partnerData = await getFamily(authorData.partnerId);
        partnerData.children = partnerData.children.filter(c => c !== target.id);
        await partnerData.save();
      }

      const childData = await getFamily(target.id);
      childData.parent = null;
      await childData.save();

      message.reply({ embeds: [new EmbedBuilder()
        .setColor(0xED4245)
        .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
        .setDescription(`🚪 **${target.username}** is no longer part of your family.`)
      ]});
    }

    else {
      message.reply({ embeds: [info(`**Family Commands**\n\`family marry @user\` — propose\n\`family divorce\` — end marriage\n\`family adopt @user\` — adopt\n\`family tree\` — view family\n\`family disown @user\` — remove child`)] });
    }
  }
};