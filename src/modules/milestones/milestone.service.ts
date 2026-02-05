import { prisma } from '../../config/prismaClient.js';

export async function getUserMilestones(userId: string) {
  const milestones = await prisma.milestone.findMany({
    where: {
      created_by: userId,
    },
  });
  return milestones;
}
