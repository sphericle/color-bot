import { errorEmbed, successEmbed } from "@/util/embeds";
import { getGuild } from "@/util/guild";
import { type ChatInputCommand, type CommandData } from "commandkit";
import {
  ApplicationCommandOptionType,
  GuildMember,
  MessageFlags,
} from "discord.js";

export const command: CommandData = {
  name: "register",
  description: "Register an existing role in the bot.",
  options: [
    {
      type: ApplicationCommandOptionType.Role,
      name: "role",
      description: "The role to edit",
      required: true,
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
  const { prisma } = await import("@/lib/prisma");
  if (!(interaction.member instanceof GuildMember)) {
    return await interaction.reply({
      flags: [MessageFlags.IsComponentsV2],
      components: [errorEmbed(":x: Invalid guild")],
    });
  }

  const dbGuild = await getGuild(interaction.guild.id, prisma);
  if (!dbGuild.colorsEnabled) {
    return await interaction.reply({
      flags: [MessageFlags.IsComponentsV2],
      components: [errorEmbed(":x: Role colors are disabled in this server")],
    });
  }

  const role = interaction.options.getRole("role", true);
  await prisma.role.create({
    data: {
        id: role.id,
        guildId: interaction.guild.id,
    }
  })

  await interaction.editReply({
    flags: [MessageFlags.IsComponentsV2],
    components: [successEmbed(`:white_check_mark: Registered <@&${role.id}>!`)],
    allowedMentions: { parse: [] }
  });
};
