const { EmbedBuilder } = require("discord.js");
const { VcRole } = require("../../models/schemas");

module.exports = {
  name: "vcrole",
  description: "Give a role to users while they are in a voice channel",
  slashOnly: true,

  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageGuild")) {
      return interaction.reply({ content: "❌ You need **Manage Server** permission.", ephemeral: true });
    }

    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "set") {
      const role = interaction.options.getRole("role");

      // Check bot can assign this role
      const botMember = interaction.guild.members.me;
      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({ content: "❌ That role is higher than my highest role. Move my role above it first.", ephemeral: true });
      }

      await VcRole.findOneAndUpdate({ guildId }, { $set: { roleId: role.id } }, { upsert: true });

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle("✅ VC Role Set")
          .setDescription(`Users will receive ${role} when they join a voice channel and it will be removed when they leave.`)
        ],
        ephemeral: true
      });
    }

    if (sub === "remove") {
      await VcRole.deleteOne({ guildId });
      return interaction.reply({ content: "✅ VC Role removed.", ephemeral: true });
    }

    if (sub === "info") {
      const data = await VcRole.findOne({ guildId });
      if (!data) return interaction.reply({ content: "No VC Role configured. Use `/vcrole set`", ephemeral: true });
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x2b2d31)
          .setTitle("VC Role")
          .setDescription(`Current VC Role: <@&${data.roleId}>`)
        ],
        ephemeral: true
      });
    }
  }
};