const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { Family } = require("../../models/schemas");

module.exports = {
  name: "adopt",
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    const createEmbed = (title, desc, color) => new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color).setFooter({ text: "Family System" });

    if (!target) return message.reply({ embeds: [createEmbed("Error", "Mention a valid user.", 0xed4245)] });
    if (target.id === message.author.id) return message.reply({ embeds: [createEmbed("Error", "You can't adopt yourself.", 0xed4245)] });

    let authorData = await Family.findOne({ userId: message.author.id }) || await Family.create({ userId: message.author.id });
    if (!authorData.partnerId) return message.reply({ embeds: [createEmbed("Error", "You must be married to adopt.", 0xed4245)] });

    if (authorData.children.includes(target.id)) return message.reply({ embeds: [createEmbed("Error", "Already your child.", 0xed4245)] });

    // Send Request
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("accept").setLabel("Join Family").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("deny").setLabel("No thanks").setStyle(ButtonStyle.Danger)
    );

    const msg = await message.channel.send({
      content: `${target}`,
      embeds: [createEmbed("👶 Adoption Request", `${message.author} wants to adopt you!`, 0x2f3136)],
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    collector.on("collect", async i => {
      if (i.user.id !== target.id) return i.reply({ content: "Not for you!", ephemeral: true });

      if (i.customId === "accept") {
        let childData = await Family.findOne({ userId: target.id }) || await Family.create({ userId: target.id });

        // Add to author
        authorData.children.push(target.id);
        await authorData.save();

        // Add to partner
        let partnerData = await Family.findOne({ userId: authorData.partnerId });
        if (partnerData) {
          partnerData.children.push(target.id);
          await partnerData.save();
        }

        // Set parent
        childData.parent = message.author.id;
        await childData.save();

        i.update({ embeds: [createEmbed("👶 Adoption Complete", `${target} has joined your family!`, 0x57f287)], components: [] });
      } else {
        i.update({ embeds: [createEmbed("❌ Adoption Denied", "They declined.", 0xed4245)], components: [] });
      }
    });
  }
};