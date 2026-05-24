import type { Config } from "drizzle-kit";

export default {
  dialect: "sqlite",
  out: "./drizzle",
  schema: "./src/lib/data/schema.ts",
} satisfies Config;
