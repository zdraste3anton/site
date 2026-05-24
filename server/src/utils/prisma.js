import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}



try {
  const direct = prisma?.character?.fields ? Object.keys(prisma.character.fields) : null;
  const dmmfFields =
    prisma?._dmmf?.datamodel?.models
      ?.find((m) => m.name === 'Character')
      ?.fields?.map((f) => f.name) || null;
  
  console.log('Prisma Fields:', direct || dmmfFields || '(unavailable)');
} catch (e) {
  
  console.log('Prisma Fields: (error reading fields)', e?.message || e);
}
