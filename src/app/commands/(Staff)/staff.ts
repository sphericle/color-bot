import { errorEmbed, successEmbed } from "@/util/embeds";
import { getGuild } from "@/util/guild";
import { getMemberCustomRoles } from "@/util/member";
import { resolveColor, getRoleColorsObj } from "@/util/colors";
import { type ChatInputCommand, type CommandData } from "commandkit";
import { addRoleNameVars, defaultRoleName } from "@/util/role";
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
      name: "deleterole",
      description: "Create a new custom role.",
      options: [
        {
          name: "role",
          type: ApplicationCommandOptionType.Role,
          description: "The role to delete",
          required: true,
        },
        {
          name: "delete_from_discord",
          type: ApplicationCommandOptionType.Boolean,
          description:
            "Whether to also delete the role itself from this server.",
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
          name: "role_names",
          type: ApplicationCommandOptionType.Boolean,
          description: "Whether to allow custom role names",
        },
        {
          name: "default_role_name",
          type: ApplicationCommandOptionType.String,
          description: "The default name for new roles",
        },
        // required role name
      ],
    },
  ],
};

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  if (!interaction.guild) {
    return await interaction.reply({
      components: [
        errorEmbed(":x: This command can only be used in a server."),
      ],
      flags: [MessageFlags.IsComponentsV2],
    });
  }
  const subcommand = interaction.options.getSubcommand();
  const { prisma } = await import("@/lib/prisma");
  if (!(interaction.member instanceof GuildMember)) {
    return await interaction.reply({
      flags: [MessageFlags.IsComponentsV2],
      components: [errorEmbed(":x: Invalid guild")],
    });
  }

  const dbGuild = await getGuild(interaction.guild.id, prisma);

  if (subcommand === "deleterole") {
    if (
      (
        await getMemberCustomRoles(
          interaction.guild as unknown as Guild,
          interaction.user.id,
          prisma,
        )
      ).length >= 1
    ) {
      return await interaction.reply({
        components: [errorEmbed(":x: You already have a custom role.")],
        flags: [MessageFlags.IsComponentsV2],
      });
    }

    const color1 = interaction.options.getString("color1", true);
    const color2 = interaction.options.getString("color2");
    const holographic = interaction.options.getBoolean("holographic") ?? false;

    if (
      (!!color2 || !!holographic) &&
      !interaction.guild.features.includes("ENHANCED_ROLE_COLORS")
    ) {
      return await interaction.reply({
        flags: [MessageFlags.IsComponentsV2],
        components: [
          errorEmbed(`:x: This server does not have gradient roles enabled.`),
        ],
      });
    }
    const colorResolved1 = resolveColor(color1);
    if (!colorResolved1 && !holographic) {
      return await interaction.reply({
        components: [errorEmbed(`Invalid color: ${color1}`)],
        flags: [MessageFlags.IsComponentsV2],
      });
    }

    let colorResolved2: number | null | undefined = undefined;
    if (color2) {
      colorResolved2 = resolveColor(color2);
      if (colorResolved2 === null) {
        return await interaction.reply({
          components: [errorEmbed(`Invalid color: ${color2}`)],
          flags: [MessageFlags.IsComponentsV2],
        });
      }
    }
    let roleName = defaultRoleName(
      dbGuild,
      interaction.member as unknown as GuildMember,
      color1,
      color2,
      holographic,
    );

    if (dbGuild.roleNamesEnabled) {
      await interaction.showModal(
        new ModalBuilder()
          .setCustomId("roleNameModal")
          .setTitle("Enter Role Name")
          .addLabelComponents(
            new LabelBuilder()
              .setLabel("Role Name (can be empty)")
              .setTextInputComponent(
                new TextInputBuilder()
                  .setCustomId("roleNameInput")
                  .setStyle(TextInputStyle.Paragraph)
                  .setRequired(false)
                  .setMaxLength(4000),
              ),
          ),
      );

      const submittedModalInteraction = await interaction
        .awaitModalSubmit({
          filter: (i) =>
            i.customId === "roleNameModal" && i.user.id === interaction.user.id,
          time: 300_000,
        })
        .catch(() => null);

      if (submittedModalInteraction) {
        const newName =
          submittedModalInteraction.fields.getTextInputValue("roleNameInput");
        if (newName)
          roleName = addRoleNameVars(
            newName,
            interaction.member,
            color1,
            color2,
            holographic,
          );
      }
    } // role name

    const position =
      (dbGuild.roleBelowColors
        ? interaction.guild.roles.cache.get(dbGuild.roleBelowColors)?.position
        : null) ?? 0;

    const role = await interaction.guild.roles.create({
      name: roleName,
      position,
      colors: getRoleColorsObj(colorResolved1, colorResolved2, holographic),
      reason: `Custom role created by ${interaction.user.username} (${interaction.user.id})`,
    }).catch((e) => {
      if (e instanceof DiscordAPIError && e.code === 50013) {
        console.error(e);
        return e;
      }
    });

    if (!role || role instanceof DiscordAPIError) {
      return await interaction.reply({
        flags: [MessageFlags.IsComponentsV2],
        components: [
          errorEmbed(
            ":x: I do not have permission to create roles or assign the role above the color roles.",
          ),
        ],
      });
    }

    await interaction.member.roles.add(role.id);

    await prisma.role.create({
      data: {
        id: role.id,
        guildId: role.guild.id,
      },
    });

    return await interaction.reply({
      flags: [MessageFlags.IsComponentsV2],
      components: [successEmbed(":white_check_mark: Role created!")],
    });
  } else if (subcommand === "edit") {
    await interaction.deferReply();
    const roles = await getMemberCustomRoles(
      interaction.guild as unknown as Guild,
      interaction.member.id,
      prisma,
    );
    if (roles.length === 0 || !roles[0]) {
      return await interaction.editReply({
        flags: [MessageFlags.IsComponentsV2],
        components: [errorEmbed(":x: You do not have any custom roles!")],
      });
    }
    const dbRole = roles[0];

    const role = interaction.guild.roles.cache.get(dbRole.id);
    if (!role) {
      return await interaction.editReply({
        flags: [MessageFlags.IsComponentsV2],
        components: [errorEmbed(":x: Could not find your custom role!")],
      });
    }

    const color1 = interaction.options.getString("color1");
    const color2 = interaction.options.getString("color2");
    const disableGradient =
      interaction.options.getBoolean("remove_gradient") ?? false;
    const holographic = interaction.options.getBoolean("holographic");

    if (
      (!!color2 || !!holographic) &&
      !interaction.guild.features.includes("ENHANCED_ROLE_COLORS")
    ) {
      return await interaction.reply({
        flags: [MessageFlags.IsComponentsV2],
        components: [
          errorEmbed(`:x: This server does not have gradient roles enabled.`),
        ],
      });
    }

    if (!role.editable) {
      return await interaction.editReply({
        flags: [MessageFlags.IsComponentsV2],
        components: [errorEmbed(":x: Role is not editable")],
      });
    }

    const resolvedColor1 = color1 ? resolveColor(color1) : null;
    const resolvedColor2 = color2 ? resolveColor(color2) : null;

    await role.edit({
      colors: disableGradient
        ? {
            primaryColor: resolvedColor1 ?? role.colors.primaryColor,
            secondaryColor: undefined,
            tertiaryColor: undefined,
          }
        : holographic
          ? {
              primaryColor: Constants.HolographicStyle.Primary,
              secondaryColor: Constants.HolographicStyle.Secondary,
              tertiaryColor: Constants.HolographicStyle.Tertiary,
            }
          : {
              primaryColor: resolvedColor1 ?? role.colors.primaryColor,
              secondaryColor:
                resolvedColor2 ?? role.colors.secondaryColor ?? undefined,
              tertiaryColor: undefined,
            },
    });

    return await interaction.reply({
      flags: [MessageFlags.IsComponentsV2],
      components: [successEmbed(":white_check_mark: Edited role!")],
    });
  } else if (subcommand === "config") {
    await interaction.deferReply();
    const colorsEnabled = interaction.options.getBoolean("colors_enabled");
    const roleBelowColors = interaction.options.getRole("role_below_colors");
    const roleNamesEnabled = interaction.options.getBoolean("role_names");
    const defaultRoleNameOption =
      interaction.options.getString("default_role_name");

    const updateData: Record<string, any> = {};

    if (colorsEnabled !== null) updateData.colorsEnabled = colorsEnabled;
    if (roleBelowColors) updateData.roleBelowColors = roleBelowColors.id;
    if (roleNamesEnabled !== null)
      updateData.roleNamesEnabled = roleNamesEnabled;
    if (defaultRoleNameOption)
      updateData.defaultRoleName = defaultRoleNameOption;

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
