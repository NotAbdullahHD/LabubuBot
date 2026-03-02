const { BoosterRole } = require("../../models/schemas");

module.exports = {
  name: "br",
  description: "Manage your custom booster role",
  async execute(message, args, client) {

    // 1. Check if user is a Booster
    if (!message.member.premiumSince) {
      return message.reply("❌ This command is only for **Server Boosters**!");
    }

    // 2. Load their data
    let data = await BoosterRole.findOne({ userId: message.author.id, guildId: message.guild.id });
    const sub = args[0]?.toLowerCase();

    if (!sub) {
      return message.reply({ content: "**Booster Role Commands:**\n`,br claim <name>` - Create your role\n`,br color <hex>` - Change color\n`,br name <name>` - Change name\n`,br delete` - Delete role" });
    }

    /* ================= CLAIM ================= */
    if (sub === "claim") {
      if (data) return message.reply("❌ You already have a role! Use `,br name` to change it.");

      const name = args.slice(1).join(" ");
      if (!name) return message.reply("❌ Please provide a name for your role.");

      if (!message.guild.members.me.permissions.has("ManageRoles")) {
        return message.reply("❌ I need **Manage Roles** permission!");
      }

      try {
        const botPosition = message.guild.members.me.roles.highest.position;

        const newRole = await message.guild.roles.create({
          name: name,
          color: "Random",
          position: botPosition - 1,
          reason: `Booster Role for ${message.author.tag}`
        });

        await message.member.roles.add(newRole);

        await BoosterRole.create({
          userId: message.author.id,
          guildId: message.guild.id,
          roleId: newRole.id
        });

        return message.reply(`✅ **Success!** Created your role: **${newRole.name}**`);
      } catch (err) {
        console.log(err);
        return message.reply("❌ Failed. Ensure my role is **higher** than the role I'm trying to assign!");
      }
    }

    /* ================= COLOR ================= */
    if (sub === "color") {
      if (!data) return message.reply("❌ You don't have a role yet! Use `,br claim`.");

      const color = args[1];
      const role = message.guild.roles.cache.get(data.roleId);

      if (!role) {
        // ✅ FIXED: guildId added to deleteOne filter
        await BoosterRole.deleteOne({ userId: message.author.id, guildId: message.guild.id });
        return message.reply("❌ Your role seems to have been deleted. Please claim again.");
      }

      try {
        await role.setColor(color);
        return message.reply(`✅ Role color updated to **${color}**`);
      } catch (e) {
        return message.reply("❌ Invalid Hex code (e.g. #FF0000) or Missing Permissions.");
      }
    }

    /* ================= NAME ================= */
    if (sub === "name") {
      if (!data) return message.reply("❌ You don't have a role yet!");

      const newName = args.slice(1).join(" ");
      const role = message.guild.roles.cache.get(data.roleId);

      if (!role) return message.reply("❌ Role not found.");

      await role.setName(newName);
      return message.reply(`✅ Role name updated to **${newName}**`);
    }

    /* ================= DELETE ================= */
    if (sub === "delete") {
      if (!data) return message.reply("❌ No role to delete.");

      const role = message.guild.roles.cache.get(data.roleId);
      if (role) await role.delete();

      // ✅ FIXED: guildId added to deleteOne filter
      await BoosterRole.deleteOne({ userId: message.author.id, guildId: message.guild.id });
      return message.reply("🗑️ Your custom role has been deleted.");
    }
  }
};