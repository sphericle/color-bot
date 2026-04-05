import type { EventHandler } from 'commandkit';


const handler: EventHandler<'roleDelete'> = async (role) => {
  const { prisma } = await import("@/lib/prisma");
  await prisma.role.delete({
    where: { id: role.id }
  })
};

export default handler;
