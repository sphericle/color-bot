import { Database } from "@/lib/prisma";
import { Guild } from "discord.js";

export const getMemberCustomRoles = async (guild: Guild, memberId: string, db: Database) => {
    const member = guild.members.cache.get(memberId);
    if (!member) return [];
    return await db.role.findMany({
        where: {
            guildId: guild.id,
            id: { in: member?.roles.cache.keys().toArray() }
        },
        orderBy: {
            createdAt: "desc"
        }
    })

}