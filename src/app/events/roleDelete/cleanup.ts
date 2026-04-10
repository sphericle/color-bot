import type { EventHandler } from "commandkit";

const handler: EventHandler<"roleDelete"> = async (role) => {
  const { prisma } = await import("@/lib/prisma");
  await prisma.role.deleteMany({
    where: { id: role.id, guildId: role.guild.id },
  });
};

export default handler;
