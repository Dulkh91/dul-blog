import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Test connection
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log("✅ Connected to Supabase:", result);

    // Test your models
    const count = await prisma.post.count();
    console.log(`📊 Posts count: ${count}`);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();