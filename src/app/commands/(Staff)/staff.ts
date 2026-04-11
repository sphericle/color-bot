import { errorEmbed, successEmbed } from "@/util/embeds";
import { type ChatInputCommand, type CommandData } from "commandkit";
import {
  ApplicationCommandOptionType,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";

import { getGuild } from "@/util/guild";

export const command: CommandData = {
  name: "staff",
  description: "Manage your roles.",
  default_member_permissions: String(
    new PermissionsBitField([
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ManageGuild,
    ]).freeze().bitfield,
  ),
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "edit",
      description: "Edit a role as a staff member",
      options: [
        {
          name: "role",
          type: ApplicationCommandOptionType.Role,
          description: "The role to edit",
          required: true,
        },
        {
          name: "locked",
          type: ApplicationCommandOptionType.Boolean,
          description:
            "Whether this role should be unable to be edited by its members.",
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "config",
      description: "Change server settings",
      options: [
        {
          name: "colors_enabled",
          type: ApplicationCommandOptionType.Boolean,
          description: "Enable/disable editing role colors",
        },
        {
          name: "role_below_colors",
          type: ApplicationCommandOptionType.Role,
          description: "The role all color roles will be created above",
        },
        {
          name: "required_role",
          type: ApplicationCommandOptionType.Role,
          description:
            "The role required to use staff commands (defaults to none)",
        },
        {
          name: "remove_required_role",
          type: ApplicationCommandOptionType.Boolean,
          description: "Remove the role required to use staff commands",
        }
      ],
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  await interaction.deferReply();
  if (!interaction.guild) {
    return await interaction.reply({
      components: [errorEmbed("This command can only be used in a server.")],
      flags: [MessageFlags.IsComponentsV2],
    });
  }
  if (!(interaction.member instanceof GuildMember)) {
    return await interaction.reply({
      flags: [MessageFlags.IsComponentsV2],
      components: [errorEmbed("Invalid guild")],
    });
  }

  const subcommand = interaction.options.getSubcommand();

  const { prisma } = await import("@/lib/prisma");

  /* const dbGuild = */ await getGuild(interaction.guild.id, prisma);

  if (subcommand === "edit") {
    const role = interaction.options.getRole("role", true);
    const locked = interaction.options.getBoolean("locked");

    const dbRole = await prisma.role.findUnique({
      where: { id: role.id, guildId: interaction.guild.id },
    })
    if (!dbRole) {
      return await interaction.editReply({
        flags: [MessageFlags.IsComponentsV2],
        components: [errorEmbed("This role is not managed by the bot.")],
      });
    }
    
    if (locked !== null) {
      await prisma.role.update({
        where: { id: role.id, guildId: interaction.guild.id },
        data: { locked },
      });
    }

    return await interaction.editReply({
      flags: [MessageFlags.IsComponentsV2],
      components: [successEmbed("Updated role!")],
    });
  } else if (subcommand === "config") {
    const colorsEnabled = interaction.options.getBoolean("colors_enabled");
    const roleBelowColors = interaction.options.getRole("role_below_colors");
    const requiredRole = interaction.options.getRole("required_role");
    const removeRequiredRole = interaction.options.getBoolean("remove_required_role");

    const updateData: Record<string, any> = {};

    if (colorsEnabled !== null) updateData.colorsEnabled = colorsEnabled;
    if (roleBelowColors) updateData.roleBelowColors = roleBelowColors.id;
    if (removeRequiredRole) {
      updateData.requiredRoleToEdit = null;
    } else if (requiredRole) {
      updateData.requiredRoleToEdit = requiredRole.id;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.guild.update({
        where: { id: interaction.guild.id },
        data: updateData,
      });
    }

    return await interaction.editReply({
      flags: [MessageFlags.IsComponentsV2],
      components: [successEmbed("Updated config!")],
    });
  }
};
