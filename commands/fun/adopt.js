const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { Family } = require("../../models/schemas");

const ok   = (desc) => new EmbedBuilder().setColor(0x57F287).setDescription(desc);
const fail = (desc) => new EmbedBuilder().setColor(0xED4245).setDescription(desc);

module.exports = {
  name: "adopt",
  async execute(message, args, client) {
    const target = message.mentions.users.first();

    if (!target)                         return message.reply({ embeds: [fail("Mention someone to adopt.")] });
    if (target.id === message.author.id) return message.reply({ embeds: [fail("You can't adopt yourself.")] });

    let authorData = await Family.findOne({ userId: message.author.id }) || await Family.create({ userId: message.author.id });
    if (!authorData.partnerId)           return message.reply({ embeds: [fail("You must be married to adopt.")] });
    if (authorData.children.includes(target.id)) return message.reply({ embeds: [fail("They are already your child.")] });

    const childData = await Family.findOne({ userId: target.id }) || await Family.create({ userId: target.id });
    if (childData.parent)                return message.reply({ embeds: [fail("They already have a parent.")] });

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
        childData.parent = message.author.id;
        await authorData.save();
        await childData.save();

        const partnerData = await Family.findOne({ userId: authorData.partnerId });
        if (partnerData && !partnerData.children.includes(target.id)) {
          partnerData.children.push(target.id);
          await partnerData.save();
        }

        await i.update({ embeds: [ok(`👶 **${target.username}** joined your family!`)], components: [] });
      } else {
        await i.update({ embeds: [fail(`**${target.username}** declined.`)], components: [] });
      }
    });

    collector.on("end", (_, reason) => {
      if (reason === "time") msg.edit({ components: [] }).catch(() => {});
    });
  }
};