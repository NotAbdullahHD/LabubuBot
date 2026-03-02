const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { Family } = require("../../models/schemas");

module.exports = {
  name: "marry",
  description: "Propose to another user",
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    const author = message.author;

    if (!target) return message.reply("Please mention someone to marry.");
    if (target.id === author.id) return message.reply("You can't marry yourself.");
    if (target.bot) return message.reply("You can't marry a bot.");

    const authorData = await Family.findOne({ userId: author.id });
    const targetData = await Family.findOne({ userId: target.id });

    if (authorData && authorData.partnerId) return message.reply("You are already married!");
    if (targetData && targetData.partnerId) return message.reply(`${target.username} is already married!`);

    const embed = new EmbedBuilder()
      .setDescription(`💍 **${target.username}**, **${author.username}** has proposed to you!\nDo you accept?`)
      .setColor(0xff73fa);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("accept").setLabel("Yes").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("deny").setLabel("No").setStyle(ButtonStyle.Danger)
    );

    const msg = await message.reply({ content: `${target}`, embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== target.id) {
        return i.reply({ content: "This is not for you.", ephemeral: true });
      }

      if (i.customId === "deny") {
        await i.update({ content: "💔 Proposal denied.", components: [], embeds: [] });
        return collector.stop();
      }

      if (i.customId === "accept") {
        // ✅ FIXED: Only update partnerId — don't wipe children/parent data
        await Family.findOneAndUpdate(
          { userId: author.id },
          { $set: { partnerId: target.id } },
          { upsert: true }
        );

        await Family.findOneAndUpdate(
          { userId: target.id },
          { $set: { partnerId: author.id } },
          { upsert: true }
        );

        await i.update({
          content: null,
          embeds: [new EmbedBuilder()
            .setDescription(`❤️ **${author.username}** and **${target.username}** are now married!`)
            .setColor(0xff73fa)],
          components: []
        });
        collector.stop();
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        msg.edit({ content: "Proposal timed out.", components: [] }).catch(() => {});
      }
    });
  }
};