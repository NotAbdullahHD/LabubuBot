const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { Family } = require("../../models/schemas");

module.exports = {
  name: "family",
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();
    const target = message.mentions.users.first();
    const authorId = message.author.id;

    // Helper to get or create user data
    const getFamily = async (id) => {
      let data = await Family.findOne({ userId: id });
      if (!data) data = await Family.create({ userId: id });
      return data;
    };

    // 1. MARRY
    if (sub === "marry") {
      if (!target) return message.reply("❌ Mention someone to marry.");
      if (target.id === authorId) return message.reply("❌ You can't marry yourself.");
      if (target.bot) return message.reply("❌ You can't marry a bot.");

      const authorData = await getFamily(authorId);
      const targetData = await getFamily(target.id);

      if (authorData.partnerId) return message.reply("❌ You are already married.");
      if (targetData.partnerId) return message.reply("❌ They are already married.");

      // Proposal Buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("accept").setLabel("Accept").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("deny").setLabel("Deny").setStyle(ButtonStyle.Danger)
      );

      const embed = new EmbedBuilder()
        .setTitle("💍 Marriage Proposal")
        .setDescription(`${target}, do you accept ${message.author}'s proposal?`)
        .setColor(0x2f3136);

      const msg = await message.channel.send({ content: `${target}`, embeds: [embed], components: [row] });

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000
      });

      collector.on("collect", async i => {
        if (i.user.id !== target.id) return i.reply({ content: "Not for you!", ephemeral: true });

        if (i.customId === "accept") {
          authorData.partnerId = target.id;
          targetData.partnerId = authorId;
          await authorData.save();
          await targetData.save();

          const successEmbed = new EmbedBuilder()
            .setTitle("💍 Married!")
            .setDescription(`${message.author} and ${target} are now married! ❤️`)
            .setColor(0x57f287);

          await i.update({ embeds: [successEmbed], components: [] });
        } else {
          await i.update({ content: "💔 Proposal Denied.", embeds: [], components: [] });
        }
      });
    }

    // 2. DIVORCE
    else if (sub === "divorce") {
      const authorData = await getFamily(authorId);
      if (!authorData.partnerId) return message.reply("❌ You are single.");

      const partnerId = authorData.partnerId;
      const partnerData = await getFamily(partnerId);

      authorData.partnerId = null;
      partnerData.partnerId = null;
      await authorData.save();
      await partnerData.save();

      message.reply(`💔 You divorced <@${partnerId}>.`);
    }

    // 3. ADOPT
    else if (sub === "adopt") {
      if (!target) return message.reply("❌ Mention someone to adopt.");
      if (target.id === authorId) return message.reply("❌ You can't adopt yourself.");

      const authorData = await getFamily(authorId);
      // Optional: Require marriage to adopt?
      // if (!authorData.partnerId) return message.reply("❌ You must be married to adopt.");

      if (authorData.children.includes(target.id)) return message.reply("❌ Already your child.");

      const childData = await getFamily(target.id);
      if (childData.parent) return message.reply("❌ They already have a parent.");

      // Proposal to child (they must accept adoption)
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("accept").setLabel("Join Family").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("deny").setLabel("No thanks").setStyle(ButtonStyle.Danger)
      );

      const msg = await message.channel.send({ 
        content: `${target}`,
        embeds: [new EmbedBuilder().setDescription(`${message.author} wants to adopt you!`).setColor(0x2f3136)],
        components: [row] 
      });

      const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

      collector.on("collect", async i => {
        if (i.user.id !== target.id) return i.reply({ content: "Not for you!", ephemeral: true });

        if (i.customId === "accept") {
          authorData.children.push(target.id);
          childData.parent = authorId;
          await authorData.save();
          await childData.save();

          // If married, add child to partner too
          if (authorData.partnerId) {
            const partnerData = await getFamily(authorData.partnerId);
            if (!partnerData.children.includes(target.id)) {
              partnerData.children.push(target.id);
              await partnerData.save();
            }
          }

          await i.update({ embeds: [new EmbedBuilder().setDescription(`👶 ${target} is now your child!`).setColor(0x57f287)], components: [] });
        } else {
          await i.update({ content: "Adoption declined.", embeds: [], components: [] });
        }
      });
    }

    // 4. TREE (Status)
    else if (sub === "tree" || sub === "stats") {
      const user = target || message.author;
      const data = await getFamily(user.id);

      const partner = data.partnerId ? `<@${data.partnerId}>` : "None";
      const children = data.children.length > 0 ? data.children.map(id => `<@${id}>`).join(", ") : "None";
      const parent = data.parent ? `<@${data.parent}>` : "None";

      const embed = new EmbedBuilder()
        .setTitle(`🌳 ${user.username}'s Family Tree`)
        .setDescription(`**Partner:** ${partner}\n**Parent:** ${parent}\n**Children:**\n${children}`)
        .setColor(0x2f3136)
        .setThumbnail(user.displayAvatarURL());

      message.reply({ embeds: [embed] });
    }

    // 5. DISOWN
    else if (sub === "disown") {
        if (!target) return message.reply("❌ Mention a child to disown.");
        const authorData = await getFamily(authorId);

        if (!authorData.children.includes(target.id)) return message.reply("❌ They are not your child.");

        // Remove from author
        authorData.children = authorData.children.filter(c => c !== target.id);
        await authorData.save();

        // Remove parent link from child
        const childData = await getFamily(target.id);
        childData.parent = null;
        await childData.save();

        message.reply(`🚪 You have disowned **${target.username}**.`);
    }

    else {
      message.reply("Usage: `>family marry @user`, `>family divorce`, `>family adopt @user`, `>family tree`, `>family disown @user`");
    }
  }
};