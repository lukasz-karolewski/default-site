import type { Config } from 'drizzle-kit';

export default {
  schema: './src/app/utils/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
} satisfies Config;
