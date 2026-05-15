import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
  adapter: PrismaPg | undefined;
};

const connectionString = process.env.DATABASE_URL;

// Singleton pool - only created once
const pool = globalForPrisma.pool ?? new Pool({ connectionString });
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool = pool;
}

// Singleton adapter - only created once with the pool
const adapter = globalForPrisma.adapter ?? new PrismaPg(pool);
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.adapter = adapter;
}

// Singleton Prisma Client - only created once with the adapter
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;