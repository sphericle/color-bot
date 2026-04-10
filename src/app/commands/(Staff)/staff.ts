import { errorEmbed, successEmbed } from "@/util/embeds";
import { getGuild } from "@/util/guild";
import { getMemberCustomRoles } from "@/util/member";
import { resolveColor, getRoleColorsObj } from "@/util/colors";
import { type ChatInputCommand, type CommandData } from "commandkit";
import {
  ApplicationCommandOptionType,
  Constants,
  DiscordAPIError,
  Guild,
  GuildMember,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

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

  // const dbGuild = await getGuild(interaction.guild.id, prisma);

  if (subcommand === "edit") {
    const role = interaction.options.getRole("role", true);
    const locked = interaction.options.getBoolean("locked");

    const dbRole = await prisma.role.findUnique({
      where: { id: role.id },
    })
    if (!dbRole) {
      return await interaction.editReply({
        flags: [MessageFlags.IsComponentsV2],
        components: [errorEmbed("This role is not managed by the bot.")],
      });
    }
    
    if (locked !== null) {
      await prisma.role.update({
        where: { id: role.id },
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

    const updateData: Record<string, any> = {};

    if (colorsEnabled !== null) updateData.colorsEnabled = colorsEnabled;
    if (roleBelowColors) updateData.roleBelowColors = roleBelowColors.id;

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
