import { PrismaClient } from "@prisma/client";

const databaseUrl = import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: databaseUrl });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
