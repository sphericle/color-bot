import { Guild } from "../../generated/prisma/client";
import { GuildMember, Constants } from "discord.js";

export const defaultRoleName = (
  dbGuild: Guild,
  member: GuildMember,
  color1: string,
  color2: string | null,
  holographic: boolean,
) => {
  const roleNameTemplate = dbGuild.defaultRoleName || "{username}";
  return addRoleNameVars(roleNameTemplate, member, color1, color2, holographic);
};

export const addRoleNameVars = (
  name: string,
  member: GuildMember,
  color1: string,
  color2: string | null,
  holographic: boolean,
) => {
  return name
    .replace("{username}", member.user.username)
    .replace("{displayname}", member.displayName)
    .replace("{color1}", holographic ? `holographic` : color1)
    .replace(
      "{colors}",
      holographic ? "holographic" : color2 ? `${color1} - ${color2}` : color1,
    )
    .replace("{servername}", member.guild.name);
};