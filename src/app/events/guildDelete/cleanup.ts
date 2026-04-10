import type { EventHandler } from 'commandkit';


const handler: EventHandler<'guildDelete'> = async (guild) => {
  const { prisma } = await import("@/lib/prisma");
  await prisma.guild.deleteMany({
    where: { id: guild.id }
  });
};

export default handler;
