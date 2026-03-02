const { PermissionsBitField, EmbedBuilder } = require("discord.js");

// ─────────────────────────────────────────────────────
//  ,role @user <role name or @role>
//  Toggles a role on a member — adds if they don't have
//  it, removes if they do.
// ─────────────────────────────────────────────────────

module.exports = {
  name: "role",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(msg)] });
    const ok  = (msg) => message.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(msg)] });

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return err("❌ You need **Manage Roles** permission.");

    // First arg must be a user mention
    const target = message.mentions.members.first();
    if (!target) return err("❌ Usage: `,role @user <role name or @role>`");

    // Everything after the mention is the role name/mention
    // Strip the mention token and join the rest as role query
    const roleQuery = args.slice(1).join(" ").trim();
    if (!roleQuery) return err("❌ Please specify a role name or mention a role.\n**Usage:** `,role @user <role name>`");

    // Try mention first, then search by name (case-insensitive)
    let role = message.mentions.roles.first()
      ?? message.guild.roles.cache.find(r =>
          r.name.toLowerCase() === roleQuery.toLowerCase() ||
          r.name.toLowerCase().includes(roleQuery.toLowerCase().replace(/<@&\d+>/g, "").trim())
        );

    if (!role) return err(`❌ Role \`${roleQuery}\` not found. Check the name and try again.`);

    // Safety checks
    if (role.managed) return err("❌ That role is managed by an integration and cannot be assigned manually.");
    if (role.position >= message.guild.members.me.roles.highest.position)
      return err("❌ That role is higher than my highest role. Move my role above it first.");
    if (role.position >= message.member.roles.highest.position && message.guild.ownerId !== message.author.id)
      return err("❌ That role is equal to or higher than your own highest role.");

    // Toggle
    if (target.roles.cache.has(role.id)) {
      await target.roles.remove(role);
      return ok(`✅ Removed **${role.name}** from **${target.user.username}**.`);
    } else {
      await target.roles.add(role);
      return ok(`✅ Added **${role.name}** to **${target.user.username}**.`);
    }
  }
};