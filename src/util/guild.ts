import { Database } from "@/lib/prisma";

export const getGuild = async (guildId: string, prisma: Database) => {
    let dbGuild = await prisma.guild.upsert({
        where: { id: guildId },
        update: {},
        create: { id: guildId },
    });
    return dbGuild;
}
