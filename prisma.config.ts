import { defineConfig } from "prisma/config";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://e73a7a7f4930bd80203d25fbbed14ab5d4665abb5f50158b1395395ee9170553:sk_2PzshNvOEDRRYTvwOg0_X@db.prisma.io:5432/postgres?sslmode=require";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: DATABASE_URL,
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
});
