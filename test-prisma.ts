import { PrismaClient } from "@prisma/client";
import "dotenv/config";

console.log("DATABASE_URL:", process.env.DATABASE_URL);

async function main() {
  const prisma = new PrismaClient();
  console.log("PrismaClient created successfully");
  await prisma.$connect();
  console.log("Connected to database");
  await prisma.$disconnect();
}

main().catch(console.error);
