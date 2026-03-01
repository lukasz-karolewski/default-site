import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/data/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
} satisfies Config;
